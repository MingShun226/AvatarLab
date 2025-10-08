import { supabase } from '@/integrations/supabase/client';

export type AIProvider = 'openai' | 'stability' | 'replicate' | 'kie-ai' | 'google';

export interface GenerateImageParams {
  prompt: string;
  provider?: AIProvider;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  style?: string;
  inputImage?: string; // Base64 image for img2img (deprecated, use inputImages)
  inputImages?: string[]; // Multiple Base64 images for img2img combination
  strength?: number; // 0-1, how much to transform the input image
}

export interface GenerationProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  imageUrl?: string;
  error?: string;
}

export interface GeneratedImage {
  id: string;
  user_id?: string;
  prompt: string;
  negative_prompt?: string;
  image_url: string;
  original_image_url?: string;
  provider: string;
  model?: string;
  parameters?: any;
  generation_type?: string;
  width?: number;
  height?: number;
  is_favorite?: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Generate an image using AI
 */
export async function generateImage(params: GenerateImageParams): Promise<{ taskId: string; provider: string }> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  // Removed verbose logging

  const { data, error } = await supabase.functions.invoke('generate-image-unified', {
    body: {
      prompt: params.prompt,
      provider: params.provider || 'openai',
      inputImage: params.inputImage, // Base64 image for img2img (deprecated)
      inputImages: params.inputImages, // Multiple Base64 images for img2img combination
      parameters: {
        negative_prompt: params.negativePrompt,
        width: params.width || 1024,
        height: params.height || 1024,
        num_images: params.numImages || 1,
        guidance_scale: params.guidanceScale || 7,
        style: params.style,
        strength: params.strength || 0.8,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate image');
  }

  if (data?.error) {
    throw new Error(`${data.error}${data.details ? ': ' + data.details : ''}`);
  }

  return {
    taskId: data.taskId,
    provider: data.provider,
  };
}

/**
 * Check generation progress for async providers
 */
export async function checkGenerationProgress(taskId: string): Promise<GenerationProgress> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('generate-image-unified', {
    body: {
      checkProgress: true,
      taskId,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to check progress');
  }

  return {
    status: data.status,
    progress: data.progress || 0,
    imageUrl: data.imageUrl,
    error: data.error,
  };
}

/**
 * Poll for generation completion
 */
export async function pollForCompletion(
  taskId: string,
  onProgress?: (progress: number) => void,
  maxAttempts: number = 60,
  interval: number = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const progress = await checkGenerationProgress(taskId);

    if (onProgress) {
      onProgress(progress.progress);
    }

    if (progress.status === 'completed' && progress.imageUrl) {
      return progress.imageUrl;
    }

    if (progress.status === 'failed') {
      throw new Error(progress.error || 'Generation failed');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Generation timeout - please try again');
}

/**
 * Save generated image to database
 */
export async function saveGeneratedImage(
  imageUrl: string,
  prompt: string,
  provider: string,
  model?: string,
  parameters?: any,
  originalImageUrls?: string[]
): Promise<GeneratedImage> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  // Determine generation type based on whether there are original images
  const generationType = originalImageUrls && originalImageUrls.length > 0 ? 'img2img' : 'text2img';

  const { data, error } = await supabase
    .from('generated_images')
    .insert({
      user_id: session.data.session.user.id,
      prompt,
      negative_prompt: parameters?.negative_prompt || null,
      image_url: imageUrl,
      original_image_url: originalImageUrls && originalImageUrls.length > 0 ? originalImageUrls[0] : null,
      provider,
      model,
      parameters,
      generation_type: generationType,
      width: parameters?.width || 1024,
      height: parameters?.height || 1024,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to save image');
  }

  return data;
}

/**
 * Get user's generated images
 */
export async function getUserImages(): Promise<GeneratedImage[]> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('user_id', session.data.session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to load images');
  }

  return data || [];
}

/**
 * Delete an image
 */
export async function deleteImage(imageId: string): Promise<void> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  // Delete from collections first
  await supabase
    .from('image_collection_items')
    .delete()
    .eq('image_id', imageId)
    .eq('user_id', session.data.session.user.id);

  // Delete the image
  const { error } = await supabase
    .from('generated_images')
    .delete()
    .eq('id', imageId)
    .eq('user_id', session.data.session.user.id);

  if (error) {
    throw new Error(error.message || 'Failed to delete image');
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(imageId: string, isFavorite: boolean): Promise<void> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('generated_images')
    .update({ is_favorite: isFavorite })
    .eq('id', imageId)
    .eq('user_id', session.data.session.user.id);

  if (error) {
    throw new Error(error.message || 'Failed to update favorite');
  }
}

/**
 * Download image as file (via proxy to avoid CORS)
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    // For Supabase storage URLs, download directly
    if (imageUrl.includes('supabase.co/storage')) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    // For external URLs, use proxy
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('Not authenticated');
    }

    // Get Supabase project URL
    const supabaseUrl = supabase.supabaseUrl;
    const proxyUrl = `${supabaseUrl}/functions/v1/download-image`;

    // Call proxy function to download image
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, filename })
    });

    if (!response.ok) {
      throw new Error('Failed to download image from proxy');
    }

    // Get the blob from response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download image. The image URL may have expired.');
  }
}
