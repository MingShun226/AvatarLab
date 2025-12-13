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

// Start video translation
async function startTranslation(
  apiKey: string,
  videoUrl: string,
  targetLanguages: string[],
  options: {
    speakerNum?: number;
    audioOnly?: boolean;
    dynamicDuration?: boolean;
  }
) {
  console.log('Starting video translation:', {
    videoUrl,
    targetLanguages,
    options
  });

  const requestBody: any = {
    video_url: videoUrl,
  };

  // Use output_languages for multiple languages
  if (targetLanguages.length > 1) {
    requestBody.output_languages = targetLanguages;
  } else {
    requestBody.output_language = targetLanguages[0];
  }

  // Add optional parameters
  if (options.audioOnly) {
    requestBody.translate_audio_only = true;
  }

  if (options.speakerNum && options.speakerNum > 1) {
    requestBody.speaker_num = options.speakerNum;
  }

  if (options.dynamicDuration !== undefined) {
    requestBody.enable_dynamic_duration = options.dynamicDuration;
  }

  const response = await fetch(`${HEYGEN_BASE_URL}/v2/video_translate`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HeyGen translation error:', response.status, errorText);
    throw new Error(`HeyGen translation error: ${errorText}`);
  }

  const result = await response.json();
  console.log('HeyGen translation response:', result);

  if (!result.data?.video_translate_id) {
    throw new Error('Invalid response from HeyGen API - no video_translate_id');
  }

  return {
    translateId: result.data.video_translate_id,
    status: 'processing',
  };
}

// Check translation status
async function checkTranslationStatus(
  apiKey: string,
  translateId: string
) {
  console.log('Checking translation status:', translateId);

  const response = await fetch(
    `${HEYGEN_BASE_URL}/v1/video_translate/${translateId}`,
    {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HeyGen status check error:', response.status, errorText);

    // If 404, translation might not be found yet
    if (response.status === 404) {
      return {
        status: 'processing',
        progress: 10,
      };
    }

    throw new Error(`Failed to check translation status: ${errorText}`);
  }

  const result = await response.json();
  console.log('Translation status:', result);

  const status = result.data?.status || 'processing';

  if (status === 'completed') {
    return {
      status: 'completed',
      progress: 100,
      videoUrl: result.data?.video_url,
      duration: result.data?.duration,
    };
  } else if (status === 'failed' || status === 'error') {
    return {
      status: 'failed',
      error: result.data?.error || 'Translation failed',
    };
  }

  // Calculate progress based on status
  let progress = 30;
  if (status === 'processing') {
    progress = 50;
  } else if (status === 'pending') {
    progress = 20;
  }

  return {
    status: 'processing',
    progress,
  };
}

serve(async (req) => {
  console.log('heygen-video-translate function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', {
      hasVideoUrl: !!requestBody.videoUrl,
      targetLanguages: requestBody.targetLanguages,
      checkStatus: requestBody.checkStatus,
      translateId: requestBody.translateId
    });

    const {
      videoUrl,
      targetLanguages,
      speakerNum = 1,
      audioOnly = false,
      dynamicDuration = true,
      checkStatus = false,
      translateId
    } = requestBody;

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

    // Handle status check
    if (checkStatus && translateId) {
      console.log('Checking translation status for:', translateId);
      const status = await checkTranslationStatus(heygenApiKey, translateId);

      return new Response(
        JSON.stringify(status),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input for new translation
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: 'Video URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!targetLanguages || targetLanguages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one target language is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start translation
    const result = await startTranslation(
      heygenApiKey,
      videoUrl,
      targetLanguages,
      {
        speakerNum,
        audioOnly,
        dynamicDuration,
      }
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in heygen-video-translate:', error);

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
