import { supabase } from '@/integrations/supabase/client';

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  gender?: string;
  is_talking_photo?: boolean;
}

export interface HeyGenVoice {
  voice_id: string;
  voice_name: string;
  gender?: string;
  language?: string;
  language_code?: string;
  preview_audio_url?: string;
}

export interface TranslateVideoParams {
  videoUrl: string;
  targetLanguages: string[];
  speakerNum?: number;
  audioOnly?: boolean;
  dynamicDuration?: boolean;
}

export interface GenerateAvatarVideoParams {
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

export interface TranslationProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  duration?: number;
  error?: string;
}

export interface VideoProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  thumbnail?: string;
  duration?: number;
  error?: string;
}

/**
 * Start video translation
 */
export async function translateVideo(params: TranslateVideoParams): Promise<{ translateId: string }> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('heygen-video-translate', {
    body: {
      videoUrl: params.videoUrl,
      targetLanguages: params.targetLanguages,
      speakerNum: params.speakerNum || 1,
      audioOnly: params.audioOnly || false,
      dynamicDuration: params.dynamicDuration !== undefined ? params.dynamicDuration : true,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to start video translation');
  }

  if (data?.error) {
    throw new Error(`${data.error}${data.details ? ': ' + data.details : ''}`);
  }

  return {
    translateId: data.translateId,
  };
}

/**
 * Check translation progress
 */
export async function checkTranslationProgress(translateId: string): Promise<TranslationProgress> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('heygen-video-translate', {
    body: {
      checkStatus: true,
      translateId,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to check translation progress');
  }

  return {
    status: data.status,
    progress: data.progress || 0,
    videoUrl: data.videoUrl,
    duration: data.duration,
    error: data.error,
  };
}

/**
 * Poll for translation completion
 */
export async function pollForTranslationCompletion(
  translateId: string,
  onProgress?: (progress: number) => void,
  maxAttempts: number = 120, // 4 minutes max (2s intervals)
  interval: number = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const progress = await checkTranslationProgress(translateId);

    if (onProgress) {
      onProgress(progress.progress);
    }

    if (progress.status === 'completed' && progress.videoUrl) {
      return progress.videoUrl;
    }

    if (progress.status === 'failed') {
      throw new Error(progress.error || 'Translation failed');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Translation timeout - please check back later');
}

/**
 * Generate avatar video
 */
export async function generateAvatarVideo(params: GenerateAvatarVideoParams): Promise<{ videoId: string }> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('heygen-avatar-video', {
    body: params,
  });

  if (error) {
    throw new Error(error.message || 'Failed to start avatar video generation');
  }

  if (data?.error) {
    throw new Error(`${data.error}${data.details ? ': ' + data.details : ''}`);
  }

  return {
    videoId: data.videoId,
  };
}

/**
 * Check avatar video generation progress
 */
export async function checkVideoProgress(videoId: string): Promise<VideoProgress> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('heygen-avatar-video', {
    body: {
      checkStatus: true,
      videoId,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to check video progress');
  }

  return {
    status: data.status,
    progress: data.progress || 0,
    videoUrl: data.videoUrl,
    thumbnail: data.thumbnail,
    duration: data.duration,
    error: data.error,
  };
}

/**
 * Poll for video generation completion
 */
export async function pollForVideoCompletion(
  videoId: string,
  onProgress?: (progress: number) => void,
  maxAttempts: number = 180, // 6 minutes max (2s intervals)
  interval: number = 2000
): Promise<{ videoUrl: string; thumbnail?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const progress = await checkVideoProgress(videoId);

    if (onProgress) {
      onProgress(progress.progress);
    }

    if (progress.status === 'completed' && progress.videoUrl) {
      return {
        videoUrl: progress.videoUrl,
        thumbnail: progress.thumbnail,
      };
    }

    if (progress.status === 'failed') {
      throw new Error(progress.error || 'Video generation failed');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Video generation timeout - please check back later');
}

/**
 * List available avatars
 */
export async function listAvatars(): Promise<HeyGenAvatar[]> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  // Use URL with query parameter
  const response = await fetch(
    `${supabase.supabaseUrl}/functions/v1/heygen-list-resources?type=avatars`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch avatars');
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  const avatars = result.data || [];

  // Debug logging
  console.log('[HeyGen Avatars] Total received from API:', avatars.length);
  if (avatars.length > 0) {
    console.log('[HeyGen Avatars] First avatar sample:', avatars[0]);
    console.log('[HeyGen Avatars] Available fields:', Object.keys(avatars[0]));
  }

  return avatars;
}

/**
 * List available voices
 */
export async function listVoices(): Promise<HeyGenVoice[]> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  // Use URL with query parameter
  const response = await fetch(
    `${supabase.supabaseUrl}/functions/v1/heygen-list-resources?type=voices`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch voices');
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data || [];
}
