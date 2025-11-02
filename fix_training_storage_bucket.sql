-- Remove MIME type restrictions from training-files bucket
-- Since it's a private bucket, we can allow all file types

-- Update the bucket to allow all MIME types (set to NULL)
UPDATE storage.buckets
SET allowed_mime_types = NULL,
    file_size_limit = 104857600  -- 100MB limit
WHERE id = 'training-files';

-- If bucket doesn't exist, create it without MIME restrictions
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'training-files',
  'training-files',
  false,
  NULL,  -- Allow all file types
  104857600  -- 100MB
)
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = NULL,
    file_size_limit = 104857600;

-- Verify the bucket settings
SELECT
  id,
  name,
  public,
  allowed_mime_types,
  file_size_limit,
  file_size_limit / 1048576 as size_limit_mb
FROM storage.buckets
WHERE id = 'training-files';

-- Also check/create RLS policies for the bucket
-- Allow authenticated users to upload their own files
CREATE POLICY IF NOT EXISTS "Users can upload training files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own files
CREATE POLICY IF NOT EXISTS "Users can read their own training files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own training files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own training files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);
