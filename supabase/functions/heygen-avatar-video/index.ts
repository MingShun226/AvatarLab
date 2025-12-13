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

// Generate avatar video
async function generateAvatarVideo(
  apiKey: string,
  params: {
    avatarType: 'preset' | 'photo';
    script: string;
    avatarId?: string;
    photoAvatar?: string;
    voiceId: string;
    avatarStyle?: string;
    emotion?: string;
    talkingStyle?: string;
    photoExpression?: string;
    speechSpeed?: number;
    pitch?: number;
    dimension?: string;
    addCaptions?: boolean;
  }
) {
  console.log('Generating avatar video:', {
    avatarType: params.avatarType,
    hasScript: !!params.script,
    avatarId: params.avatarId,
    voiceId: params.voiceId
  });

  const [width, height] = params.dimension?.split('x').map(Number) || [1920, 1080];

  // Build video input
  const videoInput: any = {
    character: {},
    voice: {
      type: 'text',
      input_text: params.script,
      voice_id: params.voiceId,
    }
  };

  // Add voice parameters
  if (params.speechSpeed && params.speechSpeed !== 1.0) {
    videoInput.voice.speed = params.speechSpeed;
  }

  if (params.pitch && params.pitch !== 0) {
    videoInput.voice.pitch = params.pitch;
  }

  if (params.emotion) {
    videoInput.voice.emotion = params.emotion;
  }

  // Configure character based on type
  if (params.avatarType === 'preset' && params.avatarId) {
    videoInput.character.type = 'avatar';
    videoInput.character.avatar_id = params.avatarId;

    if (params.avatarStyle) {
      videoInput.character.avatar_style = params.avatarStyle;
    }
  } else if (params.avatarType === 'photo' && params.photoAvatar) {
    videoInput.character.type = 'talking_photo';

    // If it's a base64 image, we need to upload it first or pass it
    // For now, we'll assume it's already uploaded and we have a talking_photo_id
    // In production, you'd need to handle the photo upload
    throw new Error('Photo avatar upload not yet implemented. Please use preset avatars for now.');
  }

  const requestBody = {
    video_inputs: [videoInput],
    dimension: {
      width,
      height
    },
    test: false, // Set to true for testing without credits
  };

  if (params.addCaptions) {
    requestBody.caption = true;
  }

  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${HEYGEN_BASE_URL}/v2/video/generate`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HeyGen avatar video error:', response.status, errorText);
    throw new Error(`HeyGen avatar video error: ${errorText}`);
  }

  const result = await response.json();
  console.log('HeyGen avatar video response:', result);

  if (!result.data?.video_id) {
    throw new Error('Invalid response from HeyGen API - no video_id');
  }

  return {
    videoId: result.data.video_id,
    status: 'processing',
  };
}

// Check video generation status
async function checkVideoStatus(
  apiKey: string,
  videoId: string
) {
  console.log('Checking video status:', videoId);

  const response = await fetch(
    `${HEYGEN_BASE_URL}/v1/video_status.get?video_id=${videoId}`,
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

    // If 404, video might not be found yet
    if (response.status === 404) {
      return {
        status: 'processing',
        progress: 10,
      };
    }

    throw new Error(`Failed to check video status: ${errorText}`);
  }

  const result = await response.json();
  console.log('Video status:', result);

  const status = result.data?.status || 'processing';

  if (status === 'completed') {
    return {
      status: 'completed',
      progress: 100,
      videoUrl: result.data?.video_url,
      thumbnail: result.data?.thumbnail_url,
      duration: result.data?.duration,
    };
  } else if (status === 'failed' || status === 'error') {
    return {
      status: 'failed',
      error: result.data?.error || 'Video generation failed',
    };
  }

  // Calculate progress based on status
  let progress = 30;
  if (status === 'processing') {
    progress = 60;
  } else if (status === 'pending') {
    progress = 20;
  }

  return {
    status: 'processing',
    progress,
  };
}

serve(async (req) => {
  console.log('heygen-avatar-video function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', {
      avatarType: requestBody.avatarType,
      hasScript: !!requestBody.script,
      checkStatus: requestBody.checkStatus,
      videoId: requestBody.videoId
    });

    const {
      avatarType,
      script,
      avatarId,
      photoAvatar,
      voiceId,
      avatarStyle = 'normal',
      emotion = 'Friendly',
      talkingStyle = 'stable',
      photoExpression = 'default',
      speechSpeed = 1.0,
      pitch = 0,
      dimension = '1920x1080',
      addCaptions = false,
      checkStatus = false,
      videoId
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
    if (checkStatus && videoId) {
      console.log('Checking video status for:', videoId);
      const status = await checkVideoStatus(heygenApiKey, videoId);

      return new Response(
        JSON.stringify(status),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input for new video
    if (!script) {
      return new Response(
        JSON.stringify({ error: 'Script is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!voiceId) {
      return new Response(
        JSON.stringify({ error: 'Voice ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (avatarType === 'preset' && !avatarId) {
      return new Response(
        JSON.stringify({ error: 'Avatar ID is required for preset avatars' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (avatarType === 'photo' && !photoAvatar) {
      return new Response(
        JSON.stringify({ error: 'Photo is required for photo avatars' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate avatar video
    const result = await generateAvatarVideo(
      heygenApiKey,
      {
        avatarType,
        script,
        avatarId,
        photoAvatar,
        voiceId,
        avatarStyle,
        emotion,
        talkingStyle,
        photoExpression,
        speechSpeed,
        pitch,
        dimension,
        addCaptions,
      }
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in heygen-avatar-video:', error);

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
