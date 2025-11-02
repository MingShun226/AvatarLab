import { supabase } from '@/integrations/supabase/client';

export interface VoiceClone {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  elevenlabs_voice_id: string;
  preview_url?: string;
  status: 'active' | 'training' | 'failed';
  sample_count: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceSample {
  id: string;
  voice_clone_id?: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  status: string;
  created_at: string;
}

export interface TTSGeneration {
  id: string;
  user_id: string;
  voice_clone_id?: string;
  text: string;
  audio_url?: string;
  model?: string;
  settings?: any;
  status: string;
  created_at: string;
}

export interface TTSSettings {
  voice_id?: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// Supported audio formats by ElevenLabs
const SUPPORTED_FORMATS = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/flac': ['.flac'],
  'audio/ogg': ['.ogg'],
};

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg'];

export const voiceCloneService = {
  /**
   * Upload a voice sample to Supabase storage
   */
  async uploadVoiceSample(file: File): Promise<VoiceSample> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate file format
    const fileExt = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    const isValidExtension = SUPPORTED_EXTENSIONS.includes(fileExt);
    const isValidMimeType = Object.keys(SUPPORTED_FORMATS).includes(file.type);

    if (!isValidExtension && !isValidMimeType) {
      throw new Error(
        `Unsupported audio format. Please use MP3, WAV, FLAC, or OGG files. Your file: ${fileExt || file.type}`
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user.id}/${timestamp}_${file.name}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('voice-samples')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload voice sample: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('voice-samples').getPublicUrl(filename);

    // Get audio duration (if possible)
    let duration: number | undefined;
    try {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          duration = audio.duration;
          resolve(null);
        });
      });
    } catch (e) {
      console.warn('Could not get audio duration:', e);
    }

    // Save to database
    const { data: sample, error: dbError } = await supabase
      .from('voice_samples')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_url: publicUrl,
        file_size_bytes: file.size,
        duration_seconds: duration,
        status: 'uploaded',
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to save voice sample: ${dbError.message}`);
    }

    return sample;
  },

  /**
   * Create a voice clone using uploaded samples
   */
  async createVoiceClone(
    name: string,
    description: string,
    samples: Array<{ url: string; filename: string; size?: number; duration?: number }>,
    options?: {
      language?: string;
      remove_background_noise?: boolean;
    }
  ): Promise<VoiceClone> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/clone-voice`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          samples,
          language: options?.language || 'en',
          remove_background_noise: options?.remove_background_noise ?? true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create voice clone');
    }

    const result = await response.json();
    return result.voiceClone;
  },

  /**
   * Get all voice clones for the current user
   */
  async getVoiceClones(): Promise<VoiceClone[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/clone-voice`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch voice clones');
    }

    const result = await response.json();
    return result.voiceClones || [];
  },

  /**
   * Delete a voice clone
   */
  async deleteVoiceClone(voiceCloneId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/clone-voice?id=${voiceCloneId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete voice clone');
    }
  },

  /**
   * Generate TTS audio using a voice clone
   */
  async generateTTS(
    text: string,
    voiceCloneId?: string,
    settings?: TTSSettings
  ): Promise<TTSGeneration> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/generate-tts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceCloneId,
          settings,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate TTS');
    }

    const result = await response.json();
    return result.generation;
  },

  /**
   * Get TTS generation history
   */
  async getTTSGenerations(): Promise<TTSGeneration[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/generate-tts`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch TTS generations');
    }

    const result = await response.json();
    return result.generations || [];
  },

  /**
   * Delete a voice sample from storage
   */
  async deleteVoiceSample(sampleId: string, fileUrl: string): Promise<void> {
    // Extract filename from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const filename = pathParts.slice(-2).join('/'); // user_id/filename

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('voice-samples')
      .remove([filename]);

    if (storageError) {
      console.error('Failed to delete from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('voice_samples')
      .delete()
      .eq('id', sampleId);

    if (dbError) {
      throw new Error(`Failed to delete voice sample: ${dbError.message}`);
    }
  },
};
