import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Helper function to get API key
async function getApiKey(
  supabase: any,
  userId: string
): Promise<string> {
  const { data: userKey } = await supabase
    .from('user_api_keys')
    .select('api_key_encrypted')
    .eq('user_id', userId)
    .eq('service', 'kie-ai')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (userKey?.api_key_encrypted) {
    try {
      return atob(userKey.api_key_encrypted);
    } catch (e) {
      console.error('Failed to decrypt user API key:', e);
    }
  }

  const platformKey = Deno.env.get('KIE_AI_API_KEY');
  if (!platformKey) {
    throw new Error('No KIE.AI API key available');
  }

  return platformKey;
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
      throw new Error(`Failed to download video: ${response.status}`);
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
      throw new Error(`Failed to upload video: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generated-videos')
      .getPublicUrl(filename);

    console.log('Video uploaded to storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in downloadAndUploadVideo:', error);
    // If download/upload fails, return original URL as fallback
    return videoUrl;
  }
}

// Check Veo video progress - Try multiple endpoints
async function checkVeoVideoStatus(taskId: string, apiKey: string) {
  // Try multiple possible endpoints
  const endpoints = [
    `https://api.kie.ai/api/v1/veo/record-info?task_id=${taskId}`,
    `https://api.kie.ai/api/v1/veo/tasks/${taskId}`,
    `https://api.kie.ai/api/v1/veo/result/${taskId}`,
    `https://api.kie.ai/api/v1/tasks/${taskId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log('Trying Veo endpoint:', endpoint);

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        console.log(`Endpoint ${endpoint} returned status ${response.status}`);
        continue;
      }

      const result = await response.json();
      console.log('Veo API response for task', taskId, ':', JSON.stringify(result, null, 2));

      // Check if response indicates success
      if (result.code === 200 && result.data) {
        const status = result.data.status || result.data.state;

        if (status === 'completed' || status === 'success' || status === 'SUCCESS') {
          // Try multiple possible field names
          let videoUrl = result.data.video_url ||
                        result.data.videoUrl ||
                        result.data.output_video_url ||
                        result.data.resultUrls?.[0] ||
                        result.data.result_urls?.[0] ||
                        result.data.url ||
                        result.data.output_url;

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
              console.error('Could not parse video URL as JSON');
            }
          }

          console.log('Extracted video URL:', videoUrl);

          if (videoUrl) {
            return { status: 'completed', videoUrl };
          }
        } else if (status === 'failed' || status === 'error' || status === 'FAILED') {
          return {
            status: 'failed',
            error: result.data.error_message || result.data.errorMessage || result.data.failMsg || 'Generation failed'
          };
        }
      }
    } catch (error) {
      console.error(`Error checking endpoint ${endpoint}:`, error);
      continue;
    }
  }

  return null; // Still processing or no endpoint worked
}

// Check KIE (Sora/Hailuo) video progress
async function checkKieVideoStatus(taskId: string, apiKey: string) {
  const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!response.ok) return null;

  const result = await response.json();
  if (result.code === 200 && result.data) {
    const state = result.data.state;

    if (state === 'success' && result.data.resultJson) {
      try {
        const resultData = typeof result.data.resultJson === 'string'
          ? JSON.parse(result.data.resultJson)
          : result.data.resultJson;

        const videoUrl = resultData.resultUrls?.[0] || resultData.videoUrl;
        if (videoUrl) {
          return { status: 'completed', videoUrl };
        }
      } catch (e) {
        console.error('Failed to parse resultJson:', e);
      }
    } else if (state === 'fail') {
      return {
        status: 'failed',
        error: result.data.failMsg || result.data.failCode || 'Generation failed'
      };
    }
  }

  return null; // Still processing
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all processing videos
    const { data: processingVideos, error: queryError } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('status', 'processing')
      .order('created_at', { ascending: true })
      .limit(50); // Process up to 50 videos at a time

    if (queryError) {
      console.error('Error querying processing videos:', queryError);
      throw queryError;
    }

    console.log(`Found ${processingVideos?.length || 0} processing videos`);

    const updates = [];

    for (const video of processingVideos || []) {
      try {
        console.log(`Checking status for video ${video.id}, task ${video.task_id}`);

        // Get user's API key
        const apiKey = await getApiKey(supabase, video.user_id);

        let statusUpdate = null;

        // Check status based on provider
        if (video.provider === 'kie-veo3-fast' || video.provider === 'kie-veo3-quality') {
          statusUpdate = await checkVeoVideoStatus(video.task_id, apiKey);
        } else {
          statusUpdate = await checkKieVideoStatus(video.task_id, apiKey);
        }

        if (statusUpdate) {
          console.log(`Video ${video.id} status update:`, statusUpdate);

          const updateData: any = {
            status: statusUpdate.status,
            progress: statusUpdate.status === 'completed' ? 100 : 0,
          };

          if (statusUpdate.status === 'completed' && statusUpdate.videoUrl) {
            // Download video from KIE.AI and upload to Supabase Storage
            console.log(`Downloading and uploading video ${video.id} to storage...`);
            const storedVideoUrl = await downloadAndUploadVideo(
              supabase,
              video.user_id,
              statusUpdate.videoUrl,
              video.id
            );

            updateData.video_url = storedVideoUrl;
            updateData.completed_at = new Date().toISOString();
            console.log(`Video ${video.id} stored at:`, storedVideoUrl);
          } else if (statusUpdate.status === 'failed') {
            updateData.error_message = statusUpdate.error;
          }

          const { error: updateError } = await supabase
            .from('generated_videos')
            .update(updateData)
            .eq('id', video.id);

          if (updateError) {
            console.error(`Failed to update video ${video.id}:`, updateError);
          } else {
            updates.push({ videoId: video.id, status: statusUpdate.status });
          }
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processingVideos?.length || 0,
        updated: updates.length,
        updates,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Poll video status error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
