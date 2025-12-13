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

// Helper function to download video and upload to Supabase Storage
async function downloadAndUploadVideo(
  supabase: any,
  userId: string,
  videoUrl: string,
  videoId: string
): Promise<string> {
  console.log('Downloading video from:', videoUrl);

  try {
    // Download video from KIE.AI
    const response = await fetch(videoUrl);

    if (!response.ok) {
      console.error(`Failed to download video: ${response.status}`);
      return videoUrl;
    }

    const videoBlob = await response.arrayBuffer();
    const videoBuffer = new Uint8Array(videoBlob);

    console.log('Video downloaded, size:', videoBuffer.length, 'bytes');

    // Generate filename
    const timestamp = Date.now();
    const filename = `${userId}/${videoId}_${timestamp}.mp4`;

    console.log('Uploading to storage:', filename);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('generated-videos')
      .upload(filename, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return videoUrl;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generated-videos')
      .getPublicUrl(filename);

    console.log('Video uploaded to storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in downloadAndUploadVideo:', error);
    return videoUrl;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, taskId, provider } = await req.json();

    console.log('=== MANUAL VIDEO STATUS UPDATE ===');
    console.log('Video ID:', videoId);
    console.log('Task ID:', taskId);
    console.log('Provider:', provider);

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

    // Determine which endpoint to use
    const isVeo = provider === 'kie-veo3-fast' || provider === 'kie-veo3-quality';
    const endpoint = isVeo
      ? `https://api.kie.ai/api/v1/veo/record-info?task_id=${taskId}`
      : `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`;

    console.log('Checking status at:', endpoint);

    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${kieApiKey}` },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    let statusUpdate = null;

    if (isVeo) {
      // Veo response format
      console.log('Parsing Veo response...');
      console.log('result.code:', result.code);
      console.log('result.data:', result.data);

      if (result.code === 200 && result.data) {
        const status = result.data.status || result.data.state;
        console.log('Veo status field:', status);

        if (status === 'completed' || status === 'success' || status === 'SUCCESS') {
          // Try multiple possible field names
          let videoUrl = result.data.video_url ||
                        result.data.videoUrl ||
                        result.data.output_video_url ||
                        result.data.resultUrls?.[0] ||
                        result.data.result_urls?.[0];

          // Handle array format
          if (Array.isArray(videoUrl)) {
            videoUrl = videoUrl[0];
          }

          // Parse if it's a JSON string
          if (typeof videoUrl === 'string' && videoUrl.startsWith('[')) {
            try {
              const parsed = JSON.parse(videoUrl);
              videoUrl = Array.isArray(parsed) ? parsed[0] : videoUrl;
            } catch (e) {
              console.log('Could not parse video URL as JSON');
            }
          }

          console.log('Extracted video URL:', videoUrl);

          if (videoUrl) {
            // Download and upload to Supabase Storage
            console.log('Downloading and storing video in Supabase Storage...');
            const storedVideoUrl = await downloadAndUploadVideo(supabase, user.id, videoUrl, videoId);

            statusUpdate = {
              status: 'completed',
              video_url: storedVideoUrl,
              progress: 100,
              completed_at: new Date().toISOString(),
            };
          } else {
            console.error('Status is success but no video URL found in:', result.data);
          }
        } else if (status === 'failed' || status === 'error' || status === 'FAILED') {
          statusUpdate = {
            status: 'failed',
            error_message: result.data.error_message || result.data.errorMessage || result.data.failMsg || 'Generation failed',
            progress: 0,
          };
        } else {
          console.log('Video still processing, status:', status);
        }
      } else {
        console.error('Unexpected response structure:', result);
      }
    } else {
      // Sora/Hailuo response format
      if (result.code === 200 && result.data) {
        const state = result.data.state;
        console.log('KIE state:', state);

        if (state === 'success' && result.data.resultJson) {
          const resultData = typeof result.data.resultJson === 'string'
            ? JSON.parse(result.data.resultJson)
            : result.data.resultJson;

          const videoUrl = resultData.resultUrls?.[0] || resultData.videoUrl;
          console.log('Video URL:', videoUrl);

          if (videoUrl) {
            // Download and upload to Supabase Storage
            console.log('Downloading and storing video in Supabase Storage...');
            const storedVideoUrl = await downloadAndUploadVideo(supabase, user.id, videoUrl, videoId);

            statusUpdate = {
              status: 'completed',
              video_url: storedVideoUrl,
              progress: 100,
              completed_at: new Date().toISOString(),
            };
          }
        } else if (state === 'fail') {
          statusUpdate = {
            status: 'failed',
            error_message: result.data.failMsg || result.data.failCode || 'Generation failed',
            progress: 0,
          };
        }
      }
    }

    if (!statusUpdate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Video is still processing',
          rawResponse: result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update database
    console.log('Updating database with:', statusUpdate);

    const { data: updatedVideo, error: updateError } = await supabase
      .from('generated_videos')
      .update(statusUpdate)
      .eq('id', videoId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Database updated successfully:', updatedVideo);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video status updated successfully',
        video: updatedVideo,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('=== ERROR ===');
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
