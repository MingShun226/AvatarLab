import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Helper function to download video and upload to Supabase Storage
async function downloadAndUploadVideo(
  supabase: any,
  userId: string,
  videoUrl: string,
  videoId: string
): Promise<string> {
  console.log('Downloading video from:', videoUrl);

  try {
    // Download video from URL
    const response = await fetch(videoUrl);

    if (!response.ok) {
      console.error(`Failed to download video: ${response.status}`);
      // Return original URL if download fails
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
      // Return original URL if upload fails
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
    // If download/upload fails, return original URL as fallback
    return videoUrl;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, videoUrl } = await req.json();

    console.log('=== MANUAL SET VIDEO URL ===');
    console.log('Video ID:', videoId);
    console.log('Video URL:', videoUrl);

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

    // Download video and upload to Supabase Storage
    console.log('Downloading and storing video in Supabase Storage...');
    const storedVideoUrl = await downloadAndUploadVideo(supabase, user.id, videoUrl, videoId);

    // Update video with stored URL
    const { data: updatedVideo, error: updateError } = await supabase
      .from('generated_videos')
      .update({
        status: 'completed',
        video_url: storedVideoUrl,
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .eq('user_id', user.id) // Ensure user owns this video
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Video updated successfully with stored URL:', updatedVideo);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video URL set successfully',
        video: updatedVideo,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('=== ERROR ===');
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
