-- Create Supabase Storage bucket for generated images
-- Each user has their own folder: generated-images/{user_id}/image.png
-- Run this in Supabase SQL Editor

-- Create the storage bucket (ONE bucket for all users)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true, -- Public bucket so images can be accessed via URL
  10485760, -- 10MB max file size per image
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies - Users can ONLY access their own folder

-- Policy 1: Users can upload to their own folder ONLY
-- Path structure: {user_id}/filename.png
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view their own folder ONLY
CREATE POLICY "Users can view own folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow public access to images (for sharing via direct URL)
-- This allows anyone with the URL to view, but they can't browse folders
CREATE POLICY "Public can view with URL"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'generated-images');

-- Policy 4: Users can delete from their own folder ONLY
CREATE POLICY "Users can delete from own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'generated-images';

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
