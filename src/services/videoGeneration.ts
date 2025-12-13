import { supabase } from '@/integrations/supabase/client';

export type VideoProvider =
  | 'kie-sora-2-pro-text2vid'
  | 'kie-sora-2-pro-img2vid'
  | 'kie-veo3-fast'
  | 'kie-veo3-quality'
  | 'kie-hailuo-img2vid';

export interface GenerateVideoParams {
  prompt: string;
  provider?: VideoProvider;
  inputImage?: string; // Base64 image for single img2vid
  inputImages?: string[]; // Multiple base64 images for Sora img2vid
  aspectRatio?: string; // '16:9', '9:16', '1:1'
  duration?: number; // in seconds
}

export interface VideoProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}

export interface GeneratedVideo {
  id: string;
  user_id?: string;
  prompt: string;
  video_url: string;
  thumbnail_url?: string;
  provider: string;
  model?: string;
  parameters?: any;
  generation_type?: 'text2vid' | 'img2vid';
  duration?: number;
  aspect_ratio?: string;
  is_favorite?: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Generate a video using AI - Starts generation and saves to database immediately
 */
export async function generateVideo(params: GenerateVideoParams): Promise<{ videoId: string; taskId: string; provider: string }> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  console.log('=== GENERATING VIDEO ===');
  console.log('Provider:', params.provider);
  console.log('Prompt:', params.prompt);
  console.log('Has input image:', !!params.inputImage);
  console.log('========================');

  const requestBody = {
    prompt: params.prompt,
    provider: params.provider || 'kie-veo3-fast',
    inputImage: params.inputImage,
    inputImages: params.inputImages,
    parameters: {
      aspect_ratio: params.aspectRatio || '16:9',
      duration: params.duration || 5,
    },
  };

  // Use direct fetch to get better error messages
  try {
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/generate-video-unified`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      // Try to get error details from response body
      let errorMessage = `Edge function error (${response.status})`;
      try {
        const errorData = await response.json();
        console.error('Edge function error response:', errorData);
        if (errorData.error) {
          errorMessage = errorData.error;
          if (errorData.details) {
            errorMessage += ': ' + errorData.details;
          }
        }
      } catch (e) {
        const errorText = await response.text();
        console.error('Edge function error text:', errorText);
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Edge function response:', data);

    if (data?.error) {
      console.error('Edge function returned error in data:', data);
      throw new Error(`${data.error}${data.details ? ': ' + data.details : ''}`);
    }

    // Save to database immediately with processing status
    const generationType = params.inputImage || params.inputImages ? 'img2vid' : 'text2vid';

    const { data: videoRecord, error: dbError } = await supabase
      .from('generated_videos')
      .insert({
        user_id: session.data.session.user.id,
        task_id: data.taskId,
        prompt: params.prompt,
        provider: params.provider || 'kie-veo3-fast',
        model: data.model,
        generation_type: generationType,
        status: 'processing',
        progress: 0,
        parameters: requestBody.parameters,
        aspect_ratio: params.aspectRatio || '16:9',
        duration: params.duration || 5,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save video to database:', dbError);
      throw new Error('Failed to save video record');
    }

    return {
      videoId: videoRecord.id,
      taskId: data.taskId,
      provider: data.provider,
    };
  } catch (error: any) {
    console.error('Edge function error:', error);
    throw error;
  }
}

/**
 * Check video generation progress
 */
export async function checkVideoProgress(taskId: string, provider: string): Promise<VideoProgress> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('generate-video-unified', {
    body: {
      checkProgress: true,
      taskId,
      provider,
    },
  });

  if (error) {
    console.error('Progress check error:', error);
    throw new Error(error.message || 'Failed to check progress');
  }

  return {
    status: data.status,
    progress: data.progress || 0,
    videoUrl: data.videoUrl,
    error: data.error,
  };
}

/**
 * Poll for video generation completion
 */
export async function pollForVideoCompletion(
  taskId: string,
  provider: string,
  onProgress?: (progress: number) => void,
  maxAttempts: number = 90, // Videos take longer than images
  interval: number = 3000 // Check every 3 seconds
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const progress = await checkVideoProgress(taskId, provider);

    if (onProgress) {
      onProgress(progress.progress);
    }

    if (progress.status === 'completed' && progress.videoUrl) {
      return progress.videoUrl;
    }

    if (progress.status === 'failed') {
      throw new Error(progress.error || 'Video generation failed');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Video generation timeout - please try again');
}

/**
 * Save generated video to database
 */
export async function saveGeneratedVideo(
  videoUrl: string,
  prompt: string,
  provider: string,
  model?: string,
  parameters?: any,
  thumbnailUrl?: string,
  generationType?: 'text2vid' | 'img2vid'
): Promise<GeneratedVideo> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('generated_videos')
    .insert({
      user_id: session.data.session.user.id,
      prompt,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl || null,
      provider,
      model: model || parameters?.model || null,
      parameters,
      generation_type: generationType || 'text2vid',
      duration: parameters?.duration || null,
      aspect_ratio: parameters?.aspect_ratio || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to save video');
  }

  return data;
}

/**
 * Get user's generated videos
 */
export async function getUserVideos(): Promise<GeneratedVideo[]> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('generated_videos')
    .select('*')
    .eq('user_id', session.data.session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to load videos');
  }

  return data || [];
}

/**
 * Delete a video
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('generated_videos')
    .delete()
    .eq('id', videoId)
    .eq('user_id', session.data.session.user.id);

  if (error) {
    throw new Error(error.message || 'Failed to delete video');
  }
}

/**
 * Toggle favorite status
 */
export async function toggleVideoFavorite(videoId: string, isFavorite: boolean): Promise<void> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('generated_videos')
    .update({ is_favorite: isFavorite })
    .eq('id', videoId)
    .eq('user_id', session.data.session.user.id);

  if (error) {
    throw new Error(error.message || 'Failed to update favorite');
  }
}
