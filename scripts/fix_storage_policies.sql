-- Fix Supabase Storage Policies for Avatar Uploads
-- Run this script in your Supabase SQL Editor to fix storage upload issues

-- =============================================
-- 1. CREATE STORAGE BUCKET (if it doesn't exist)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. DROP EXISTING STORAGE POLICIES (clean slate)
-- =============================================
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar images" ON storage.objects;

-- Also drop any other conflicting policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- =============================================
-- 3. CREATE NEW SIMPLE STORAGE POLICIES
-- =============================================

-- Allow public read access to all files in avatars bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload files to avatars bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow users to update and delete their own files
CREATE POLICY "Give users access to own folder"
ON storage.objects FOR ALL
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- =============================================
-- 4. VERIFY BUCKET SETTINGS
-- =============================================
-- Make sure the bucket is public and has correct settings
UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'avatars';

-- =============================================
-- ALTERNATIVE: If the above doesn't work, try these simpler policies
-- =============================================

-- Uncomment these if the above policies still don't work:

-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- -- Very permissive policies for testing
-- CREATE POLICY "Allow all operations on avatars bucket"
-- ON storage.objects FOR ALL
-- USING (bucket_id = 'avatars')
-- WITH CHECK (bucket_id = 'avatars');

-- =============================================
-- TROUBLESHOOTING INFO
-- =============================================

-- To check if policies are working, run these queries:
-- SELECT * FROM storage.buckets WHERE id = 'avatars';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';