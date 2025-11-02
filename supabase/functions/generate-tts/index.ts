import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Helper function to get API key (user's key or platform key)
async function getApiKey(
  supabase: any,
  userId: string
): Promise<string> {
  console.log(`Getting ElevenLabs API key for user: ${userId}`);

  // Try to get user's personal API key first
  const { data: userKey, error } = await supabase
    .from('user_api_keys')
    .select('api_key_encrypted')
    .eq('user_id', userId)
    .eq('service', 'elevenlabs')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!error && userKey?.api_key_encrypted) {
    console.log(`Using user's personal ElevenLabs API key`);

    // Update last_used_at
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('service', 'elevenlabs')
      .eq('status', 'active');

    // Decrypt user's key (simple base64 for now)
    try {
      return atob(userKey.api_key_encrypted);
    } catch (e) {
      console.error('Failed to decrypt user API key:', e);
    }
  }

  // Fallback to platform key
  const platformKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (platformKey) {
    console.log(`Using platform ElevenLabs API key`);
    return platformKey;
  }

  throw new Error(`No ElevenLabs API key configured. Please add your API key in Settings > API Management.`);
}

// Helper: Upload audio to Supabase Storage
async function uploadToStorage(
  supabase: any,
  userId: string,
  audioBlob: Blob,
  generationId: string
): Promise<string> {
  // Convert blob to array buffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  const binaryData = new Uint8Array(arrayBuffer);

  // Generate filename with timestamp
  const timestamp = Date.now();
  const filename = `${userId}/${generationId}_${timestamp}.mp3`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('voice-samples')
    .upload(filename, binaryData, {
      contentType: 'audio/mpeg',
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('voice-samples')
    .getPublicUrl(filename);

  console.log('Audio uploaded to storage:', publicUrl);
  return publicUrl;
}

serve(async (req) => {
  console.log('generate-tts function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const url = new URL(req.url);
    const pathname = url.pathname;

    // GET /generate-tts - List TTS generation history
    if (req.method === 'GET' && pathname.includes('/generate-tts')) {
      console.log('Fetching TTS generations for user:', user.id);

      const { data: generations, error } = await supabase
        .from('tts_generations')
        .select(`
          *,
          voice_clone:voice_clones(id, name, elevenlabs_voice_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Failed to fetch TTS generations: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, generations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /generate-tts - Generate TTS audio
    if (req.method === 'POST') {
      const requestBody = await req.json();
      console.log('Request body received:', {
        hasText: !!requestBody.text,
        hasVoiceId: !!requestBody.voiceCloneId,
        textLength: requestBody.text?.length || 0,
      });

      const { text, voiceCloneId, settings = {} } = requestBody;

      if (!text) {
        return new Response(
          JSON.stringify({ error: 'Text is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Generating TTS for text: "${text.substring(0, 50)}..."`);

      // Get ElevenLabs API key
      const apiKey = await getApiKey(supabase, user.id);

      // Determine voice ID
      let elevenlabsVoiceId = settings.voice_id || 'EXAVITQu4vr4xnSDxMaL'; // Default: Bella voice
      let usingCustomVoice = false;

      if (voiceCloneId) {
        // Get voice clone from database
        console.log('Looking up voice clone ID:', voiceCloneId);
        const { data: voiceClone, error: voiceError } = await supabase
          .from('voice_clones')
          .select('elevenlabs_voice_id, name')
          .eq('id', voiceCloneId)
          .eq('user_id', user.id)
          .single();

        if (voiceError || !voiceClone) {
          console.error('Voice clone not found:', voiceError);
          return new Response(
            JSON.stringify({ error: 'Voice clone not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        elevenlabsVoiceId = voiceClone.elevenlabs_voice_id;
        usingCustomVoice = true;
        console.log(`Using custom voice clone: "${voiceClone.name}" (ElevenLabs ID: ${elevenlabsVoiceId})`);
      } else {
        console.log('No voice clone ID provided, using default voice:', elevenlabsVoiceId);
      }

      // Prepare TTS request
      const ttsPayload = {
        text,
        model_id: settings.model_id || 'eleven_monolingual_v1',
        voice_settings: {
          stability: settings.stability ?? 0.5,
          similarity_boost: settings.similarity_boost ?? 0.75,
          style: settings.style ?? 0,
          use_speaker_boost: settings.use_speaker_boost ?? true,
        }
      };

      console.log('Sending request to ElevenLabs TTS API...');
      console.log('TTS Payload:', JSON.stringify(ttsPayload, null, 2));
      console.log('Using voice ID:', elevenlabsVoiceId);
      console.log('Is custom voice:', usingCustomVoice);

      // Generate TTS with ElevenLabs
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenlabsVoiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ttsPayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs TTS API error:', response.status, errorText);
        throw new Error(`ElevenLabs TTS API error: ${errorText}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      console.log('TTS audio generated, size:', audioBlob.size);

      // Generate unique ID for this generation
      const generationId = crypto.randomUUID();

      // Upload to storage
      const audioUrl = await uploadToStorage(supabase, user.id, audioBlob, generationId);

      // Save generation to database
      const { data: generation, error: dbError } = await supabase
        .from('tts_generations')
        .insert({
          id: generationId,
          user_id: user.id,
          voice_clone_id: voiceCloneId || null,
          text,
          audio_url: audioUrl,
          model: ttsPayload.model_id,
          settings: ttsPayload.voice_settings,
          status: 'completed',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save TTS generation: ${dbError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          generation: {
            ...generation,
            audioUrl,
          },
          message: 'TTS audio generated successfully!',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
