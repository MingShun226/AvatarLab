import { supabase } from '@/integrations/supabase/client';

export interface TTSVoice {
  id: string;
  name: string;
  description: string;
  accent: string;
  sample_url?: string;
  voice_type: 'male' | 'female' | 'neutral';
  language: string;
  is_active: boolean;
}

export const ttsService = {
  // Get all available TTS voices
  async getTTSVoices(): Promise<TTSVoice[]> {
    const { data, error } = await supabase
      .from('tts_voices')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      // If table doesn't exist, return default voices
      if (error.code === '42P01') {
        return getDefaultVoices();
      }
      throw new Error(`Failed to fetch TTS voices: ${error.message}`);
    }

    return data || getDefaultVoices();
  },

  // Add a new TTS voice (admin function)
  async addTTSVoice(voice: Omit<TTSVoice, 'id'>): Promise<TTSVoice> {
    const { data, error } = await supabase
      .from('tts_voices')
      .insert(voice)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add TTS voice: ${error.message}`);
    }

    return data;
  },

  // Update TTS voice
  async updateTTSVoice(id: string, updates: Partial<TTSVoice>): Promise<TTSVoice> {
    const { data, error } = await supabase
      .from('tts_voices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update TTS voice: ${error.message}`);
    }

    return data;
  },

  // Delete TTS voice
  async deleteTTSVoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('tts_voices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete TTS voice: ${error.message}`);
    }
  }
};

// Default voices fallback
function getDefaultVoices(): TTSVoice[] {
  return [
    {
      id: 'aria',
      name: 'Aria',
      description: 'Natural, professional female voice',
      accent: 'American',
      sample_url: '/audio/aria_sample.mp3',
      voice_type: 'female',
      language: 'en-US',
      is_active: true
    },
    {
      id: 'roger',
      name: 'Roger',
      description: 'Clear, confident male voice',
      accent: 'British',
      sample_url: '/audio/roger_sample.mp3',
      voice_type: 'male',
      language: 'en-GB',
      is_active: true
    },
    {
      id: 'sarah',
      name: 'Sarah',
      description: 'Warm, friendly female voice',
      accent: 'Australian',
      sample_url: '/audio/sarah_sample.mp3',
      voice_type: 'female',
      language: 'en-AU',
      is_active: true
    },
    {
      id: 'liam',
      name: 'Liam',
      description: 'Casual, energetic male voice',
      accent: 'Irish',
      sample_url: '/audio/liam_sample.mp3',
      voice_type: 'male',
      language: 'en-IE',
      is_active: true
    },
    {
      id: 'maya',
      name: 'Maya',
      description: 'Soft, calming female voice',
      accent: 'Indian',
      sample_url: '/audio/maya_sample.mp3',
      voice_type: 'female',
      language: 'en-IN',
      is_active: true
    },
    {
      id: 'alex',
      name: 'Alex',
      description: 'Versatile, neutral voice',
      accent: 'Canadian',
      sample_url: '/audio/alex_sample.mp3',
      voice_type: 'neutral',
      language: 'en-CA',
      is_active: true
    }
  ];
}