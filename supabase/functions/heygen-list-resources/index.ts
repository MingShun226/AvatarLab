import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const HEYGEN_BASE_URL = 'https://api.heygen.com';

// Helper function to get API key (user's key or platform key)
async function getApiKey(
  supabase: any,
  userId: string,
  platformKey: string | undefined
): Promise<string> {
  console.log(`Getting HeyGen API key for user: ${userId}`);

  // Try to get user's personal API key first
  const { data: userKey, error } = await supabase
    .from('user_api_keys')
    .select('api_key_encrypted')
    .eq('user_id', userId)
    .eq('service', 'heygen')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!error && userKey?.api_key_encrypted) {
    console.log(`Using user's personal HeyGen API key`);

    // Update last_used_at
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('service', 'heygen')
      .eq('status', 'active');

    // Decrypt user's key (simple base64 for now)
    try {
      return atob(userKey.api_key_encrypted);
    } catch (e) {
      console.error('Failed to decrypt user API key:', e);
    }
  }

  // Fallback to platform key
  if (platformKey) {
    console.log(`Using platform HeyGen API key`);
    return platformKey;
  }

  throw new Error(`No HeyGen API key configured. Please add your API key in Settings > API Management.`);
}

// List all avatars (filtered to user's private avatars only)
async function listAvatars(apiKey: string) {
  console.log('Fetching avatars from HeyGen');

  const response = await fetch(`${HEYGEN_BASE_URL}/v2/avatars`, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HeyGen avatars list error:', response.status, errorText);
    throw new Error(`Failed to fetch avatars: ${errorText}`);
  }

  const result = await response.json();
  const allAvatars = result.data?.avatars || [];

  console.log('Total avatars from HeyGen:', allAvatars.length);

  // Filter to only user's personal avatars (exclude public HeyGen avatars)
  const userAvatars = allAvatars.filter((avatar: any) => {
    // HeyGen marks public avatars with is_public_avatar: true
    // User's custom avatars have is_public_avatar: false or undefined
    if (avatar.is_public_avatar !== undefined) {
      return avatar.is_public_avatar === false;
    }

    // Also check for custom/talking photo avatars (user-created)
    if (avatar.is_custom === true || avatar.is_talking_photo === true) {
      return true;
    }

    // If uncertain, exclude (assume public)
    return false;
  });

  console.log('User personal avatars after filtering:', userAvatars.length);
  console.log('(Filtered out', allAvatars.length - userAvatars.length, 'public avatars)');

  return userAvatars;
}

// List all voices
async function listVoices(apiKey: string) {
  console.log('Fetching voices from HeyGen');

  const response = await fetch(`${HEYGEN_BASE_URL}/v2/voices`, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HeyGen voices list error:', response.status, errorText);
    throw new Error(`Failed to fetch voices: ${errorText}`);
  }

  const result = await response.json();
  console.log('Voices fetched:', result.data?.voices?.length || 0);

  return result.data?.voices || [];
}

serve(async (req) => {
  console.log('heygen-list-resources function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const resourceType = url.searchParams.get('type'); // 'avatars' or 'voices'

    if (!resourceType || !['avatars', 'voices'].includes(resourceType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid resource type. Use "avatars" or "voices"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get HeyGen API key
    const heygenApiKey = await getApiKey(
      supabase,
      user.id,
      Deno.env.get('HEYGEN_API_KEY')
    );

    // Fetch requested resource
    let data;
    if (resourceType === 'avatars') {
      data = await listAvatars(heygenApiKey);
    } else if (resourceType === 'voices') {
      data = await listVoices(heygenApiKey);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in heygen-list-resources:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
