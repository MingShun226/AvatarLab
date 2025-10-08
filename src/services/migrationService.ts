import { supabase } from '@/integrations/supabase/client';

/**
 * Migrate existing base64 images to Supabase Storage
 * This is a one-time operation to move old images
 */
export async function migrateImagesToStorage(): Promise<{
  success: boolean;
  message: string;
  results?: any[];
}> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  console.log('Starting image migration to storage...');

  const { data, error } = await supabase.functions.invoke('migrate-images-to-storage', {
    body: {}
  });

  if (error) {
    console.error('Migration error:', error);
    throw new Error(error.message || 'Migration failed');
  }

  console.log('Migration complete:', data);
  return data;
}
