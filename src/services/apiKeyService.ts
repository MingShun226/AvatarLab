import { supabase } from '@/integrations/supabase/client';

export interface ApiKey {
  id: string;
  name: string;
  service: string;
  api_key_encrypted: string;
  status: 'active' | 'inactive';
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyDisplay {
  id: string;
  name: string;
  service: string;
  key: string; // masked version for display
  lastUsed: string;
  status: 'active' | 'inactive';
}

// Simple encryption/decryption (in production, use proper encryption)
const ENCRYPTION_KEY = 'your-encryption-key-here'; // In production, use environment variable

function simpleEncrypt(text: string): string {
  // Simple base64 encoding - replace with proper encryption in production
  return btoa(text);
}

function simpleDecrypt(encrypted: string): string {
  // Simple base64 decoding - replace with proper decryption in production
  try {
    return atob(encrypted);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return '';
  }
}

function maskApiKey(key: string): string {
  if (key.length <= 10) return '••••••••••';
  const prefix = key.substring(0, 6);
  const suffix = key.substring(key.length - 4);
  return `${prefix}••••••••••••••••••••••••••••••••••••••••••••••••${suffix}`;
}

export const apiKeyService = {
  // Get all API keys for a user
  async getUserApiKeys(userId: string): Promise<ApiKeyDisplay[]> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }

    return (data || []).map(key => ({
      id: key.id,
      name: key.name,
      service: key.service,
      key: maskApiKey(simpleDecrypt(key.api_key_encrypted)),
      lastUsed: key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never',
      status: key.status
    }));
  },

  // Add a new API key
  async addApiKey(userId: string, name: string, service: string, apiKey: string): Promise<void> {
    const encrypted = simpleEncrypt(apiKey);

    const { error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: userId,
        name,
        service,
        api_key_encrypted: encrypted,
        status: 'active'
      });

    if (error) {
      console.error('Error adding API key:', error);
      throw error;
    }
  },

  // Delete an API key
  async deleteApiKey(keyId: string): Promise<void> {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId);

    if (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  },

  // Get decrypted API key for use (only for current user)
  async getDecryptedApiKey(userId: string, service: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('api_key_encrypted')
      .eq('user_id', userId)
      .eq('service', service)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    // Update last_used_at
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('service', service)
      .eq('status', 'active');

    return simpleDecrypt(data.api_key_encrypted);
  },

  // Toggle API key status
  async toggleApiKeyStatus(keyId: string, status: 'active' | 'inactive'): Promise<void> {
    const { error } = await supabase
      .from('user_api_keys')
      .update({ status })
      .eq('id', keyId);

    if (error) {
      console.error('Error updating API key status:', error);
      throw error;
    }
  }
};