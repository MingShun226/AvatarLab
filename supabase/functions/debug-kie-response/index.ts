import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Helper function to get API key
async function getApiKey(supabase: any, userId: string): Promise<string> {
  console.log(`Getting API key for user: ${userId}`);

  const { data: userKey, error } = await supabase
    .from('user_api_keys')
    .select('api_key_encrypted')
    .eq('user_id', userId)
    .eq('service', 'kie-ai')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!error && userKey?.api_key_encrypted) {
    console.log(`Using user's personal KIE.AI API key`);
    try {
      return atob(userKey.api_key_encrypted);
    } catch (e) {
      console.error('Failed to decrypt user API key:', e);
    }
  }

  const platformKey = Deno.env.get('KIE_AI_API_KEY');
  if (platformKey) {
    console.log('Using platform KIE.AI API key');
    return platformKey;
  }

  throw new Error('No KIE.AI API key available. Please add your API key in Settings > API Management.');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, provider } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get API key (checks user's key first, then platform key)
    const kieApiKey = await getApiKey(supabase, user.id);

    console.log('=== DEBUGGING KIE.AI RESPONSE ===');
    console.log('Task ID:', taskId);
    console.log('Provider:', provider);

    const isVeo = provider === 'kie-veo3-fast' || provider === 'kie-veo3-quality';

    // Try both endpoints
    const endpoints = [
      { name: 'Veo endpoint', url: `https://api.kie.ai/api/v1/veo/record-info?task_id=${taskId}` },
      { name: 'Jobs endpoint', url: `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}` },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`\n--- Testing ${endpoint.name} ---`);
      console.log('URL:', endpoint.url);

      try {
        const response = await fetch(endpoint.url, {
          headers: { 'Authorization': `Bearer ${kieApiKey}` },
        });

        console.log('Status:', response.status);

        const responseText = await response.text();
        console.log('Raw Response:', responseText);

        let jsonData = null;
        try {
          jsonData = JSON.parse(responseText);
          console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('Response is not valid JSON');
        }

        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: response.status,
          rawResponse: responseText,
          parsedJson: jsonData,
        });

      } catch (error) {
        console.error(`Error with ${endpoint.name}:`, error);
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          error: error.message,
        });
      }
    }

    // Return all results
    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        provider,
        message: 'Check the logs above for detailed response information',
        results,
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('=== DEBUG ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
