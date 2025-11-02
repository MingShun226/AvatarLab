import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
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

serve(async (req) => {
  console.log('clone-voice function called:', req.method, req.url);

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

    // GET /clone-voice - List all voice clones with status updates
    if (req.method === 'GET' && pathname.includes('/clone-voice')) {
      console.log('Fetching voice clones for user:', user.id);

      const { data: voiceClones, error } = await supabase
        .from('voice_clones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch voice clones: ${error.message}`);
      }

      // Get API key to check voice status from ElevenLabs
      const apiKey = await getApiKey(supabase, user.id);

      // Check status of training voices from ElevenLabs API
      const voiceClonesWithStatus = await Promise.all(
        voiceClones.map(async (clone) => {
          // Only check status for training voices
          if (clone.status === 'training' && clone.elevenlabs_voice_id) {
            try {
              const voiceResponse = await fetch(
                `https://api.elevenlabs.io/v1/voices/${clone.elevenlabs_voice_id}`,
                {
                  headers: {
                    'xi-api-key': apiKey,
                  },
                }
              );

              if (voiceResponse.ok) {
                const voiceData = await voiceResponse.json();
                console.log(`Voice ${clone.id} status from ElevenLabs:`, voiceData);

                // Check if voice has fine_tuning data indicating it's ready
                const isReady = voiceData.fine_tuning?.is_allowed_to_fine_tune === false ||
                               voiceData.samples?.length > 0;

                if (isReady && clone.status === 'training') {
                  // Update status to active in database
                  await supabase
                    .from('voice_clones')
                    .update({ status: 'active' })
                    .eq('id', clone.id);

                  return { ...clone, status: 'active' };
                }
              }
            } catch (err) {
              console.error(`Error checking voice status for ${clone.id}:`, err);
            }
          }
          return clone;
        })
      );

      return new Response(
        JSON.stringify({ success: true, voiceClones: voiceClonesWithStatus }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /clone-voice?id=xxx - Delete a voice clone
    if (req.method === 'DELETE' && pathname.includes('/clone-voice')) {
      const voiceId = url.searchParams.get('id');

      if (!voiceId) {
        return new Response(
          JSON.stringify({ error: 'Voice clone ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Deleting voice clone:', voiceId);

      // Get voice clone info
      const { data: voiceClone, error: fetchError } = await supabase
        .from('voice_clones')
        .select('elevenlabs_voice_id')
        .eq('id', voiceId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !voiceClone) {
        return new Response(
          JSON.stringify({ error: 'Voice clone not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get ElevenLabs API key
      const apiKey = await getApiKey(supabase, user.id);

      // Delete from ElevenLabs
      try {
        const deleteResponse = await fetch(
          `https://api.elevenlabs.io/v1/voices/${voiceClone.elevenlabs_voice_id}`,
          {
            method: 'DELETE',
            headers: {
              'xi-api-key': apiKey,
            },
          }
        );

        if (!deleteResponse.ok) {
          console.error('Failed to delete voice from ElevenLabs:', await deleteResponse.text());
        }
      } catch (e) {
        console.error('Error deleting voice from ElevenLabs:', e);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('voice_clones')
        .delete()
        .eq('id', voiceId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error(`Failed to delete voice clone: ${deleteError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Voice clone deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /clone-voice - Create a new voice clone
    if (req.method === 'POST') {
      const requestBody = await req.json();
      console.log('Request body received:', {
        hasName: !!requestBody.name,
        hasSamples: !!requestBody.samples,
        sampleCount: requestBody.samples?.length || 0,
      });

      const { name, description, samples, language, remove_background_noise } = requestBody;

      if (!name || !samples || samples.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Name and at least one voice sample are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Creating voice clone: ${name} with ${samples.length} sample(s)`);
      console.log('Voice cloning settings:', {
        name,
        language: language || 'en',
        remove_background_noise: remove_background_noise ?? true,
        sampleCount: samples.length,
      });

      // Get ElevenLabs API key
      const apiKey = await getApiKey(supabase, user.id);

      // Prepare samples for Professional Voice Cloning
      console.log('Preparing samples for Professional Voice Cloning...');
      console.log('Total samples to upload:', samples.length);
      console.log('Language:', language || 'en');
      console.log('Remove background noise:', remove_background_noise ?? true);

      console.log('\n=== Starting Professional Voice Cloning (PVC) Flow ===');
      console.log('Step 1: Creating PVC voice with metadata');

      // Language is REQUIRED for PVC
      const voiceLanguage = language || 'en';
      console.log('Using language:', voiceLanguage);

      // Step 1: Create PVC voice with metadata (no samples yet)
      const createVoiceResponse = await fetch('https://api.elevenlabs.io/v1/voices/pvc', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          language: voiceLanguage, // REQUIRED field
          description: description || null,
        }),
      });

      if (!createVoiceResponse.ok) {
        const errorText = await createVoiceResponse.text();
        console.error('Failed to create PVC voice:', errorText);
        throw new Error(`Failed to create PVC voice: ${errorText}`);
      }

      const voiceData = await createVoiceResponse.json();
      const voiceId = voiceData.voice_id;

      console.log('PVC voice created:', voiceId);
      console.log('Voice response:', JSON.stringify(voiceData, null, 2));

      if (!voiceId) {
        throw new Error('No voice_id returned from PVC voice creation');
      }

      // Step 2: Upload samples to the PVC voice
      console.log('\nStep 2: Uploading voice samples to PVC voice');

      // Create FormData with all samples and remove_background_noise parameter
      const samplesFormData = new FormData();

      // Add remove_background_noise parameter
      if (remove_background_noise !== undefined) {
        samplesFormData.append('remove_background_noise', remove_background_noise.toString());
        console.log('Remove background noise:', remove_background_noise);
      }

      // Fetch and add all audio samples
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        console.log(`Preparing sample ${i + 1}/${samples.length}: ${sample.filename}`);

        // Fetch the audio file from storage
        const audioResponse = await fetch(sample.url);
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch sample from storage: ${sample.url}`);
        }

        const audioBlob = await audioResponse.blob();

        // Append with 'files' key (can have multiple files)
        samplesFormData.append('files', audioBlob, sample.filename);
        console.log(`Sample ${i + 1} added to FormData: ${sample.filename}`);
      }

      // Upload all samples in one request
      console.log(`Uploading ${samples.length} samples to PVC voice...`);
      const uploadSamplesResponse = await fetch(
        `https://api.elevenlabs.io/v1/voices/pvc/${voiceId}/samples`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            // Note: Don't set Content-Type, let FormData set it with boundary
          },
          body: samplesFormData,
        }
      );

      if (!uploadSamplesResponse.ok) {
        const errorText = await uploadSamplesResponse.text();
        console.error('Failed to upload samples to PVC voice:', errorText);
        throw new Error(`Failed to upload samples: ${errorText}`);
      }

      const uploadResult = await uploadSamplesResponse.json();
      console.log('Samples uploaded successfully:', JSON.stringify(uploadResult, null, 2));

      console.log('\n=== Professional Voice Cloning (PVC) Initiated Successfully ===');
      console.log('Voice ID:', voiceId);
      console.log('PVC will now undergo verification and training (2-4 hours)');
      console.log('The voice will be ready once training completes');

      // Note: Verification and training are handled automatically by ElevenLabs
      // after samples are uploaded. The voice will appear in the user's account
      // and go through the PVC training pipeline.

      // Save voice clone to database with 'training' status
      // Status will need to be updated to 'active' once training completes
      const { data: voiceClone, error: dbError } = await supabase
        .from('voice_clones')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          elevenlabs_voice_id: voiceId,
          status: 'training', // PVC starts in training status
          sample_count: samples.length,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save voice clone: ${dbError.message}`);
      }

      // Save voice samples to database
      for (const sample of samples) {
        await supabase
          .from('voice_samples')
          .insert({
            voice_clone_id: voiceClone.id,
            user_id: user.id,
            filename: sample.filename,
            file_url: sample.url,
            file_size_bytes: sample.size,
            duration_seconds: sample.duration,
            status: 'completed',
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          voiceClone: {
            ...voiceClone,
            elevenlabsVoiceId: voiceId,
          },
          message: 'Professional Voice Clone created! Samples uploaded. Training will complete in 2-4 hours. Check your ElevenLabs account for status.',
          isProfessional: true,
          isTraining: true,
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
