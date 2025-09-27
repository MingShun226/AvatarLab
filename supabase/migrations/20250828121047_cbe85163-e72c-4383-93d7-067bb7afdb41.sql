-- Check if avatars bucket exists and update its configuration
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Update the avatars bucket to allow larger file sizes (50MB)
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB in bytes
WHERE id = 'avatars';

-- If bucket doesn't exist, create it with proper size limit
INSERT INTO storage.buckets (id, name, public, file_size_limit)
SELECT 'avatars', 'avatars', true, 52428800
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

-- Create storage policies if they don't exist
INSERT INTO storage.objects (bucket_id, name, owner)
SELECT 'avatars', '.emptyFolderPlaceholder', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'avatars');

-- Ensure proper RLS policies exist for the avatars bucket
DO $$
BEGIN
  -- Policy for viewing avatar images (public access)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Avatar images are publicly accessible'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;

  -- Policy for uploading avatar images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own avatar images'
  ) THEN
    CREATE POLICY "Users can upload their own avatar images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Policy for updating avatar images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own avatar images'
  ) THEN
    CREATE POLICY "Users can update their own avatar images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Policy for deleting avatar images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own avatar images'
  ) THEN
    CREATE POLICY "Users can delete their own avatar images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;