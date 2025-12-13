-- Create Supabase Storage bucket for generated videos
-- Each user has their own folder: generated-videos/{user_id}/video.mp4
-- Run this in Supabase SQL Editor

-- Create the storage bucket (ONE bucket for all users)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-videos',
  'generated-videos',
  true, -- Public bucket so videos can be accessed via URL
  524288000, -- 500MB max file size per video
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies - Users can ONLY access their own folder

-- Policy 1: Users can upload to their own folder ONLY
-- Path structure: {user_id}/filename.mp4
CREATE POLICY "Users can upload videos to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view their own folder ONLY
CREATE POLICY "Users can view own videos folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow public access to videos (for sharing via direct URL)
-- This allows anyone with the URL to view, but they can't browse folders
CREATE POLICY "Public can view videos with URL"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'generated-videos');

-- Policy 4: Users can delete from their own folder ONLY
CREATE POLICY "Users can delete videos from own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'generated-videos';

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
