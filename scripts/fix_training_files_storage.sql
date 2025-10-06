-- Fix Supabase Storage Policies for Training Files Upload
-- Run this script in your Supabase SQL Editor to fix training files upload issues

-- =============================================
-- 1. CREATE TRAINING-FILES STORAGE BUCKET (if it doesn't exist)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-files',
  'training-files',
  false, -- Private bucket for training files
  104857600, -- 100MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf', 'text/csv', 'application/json']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. DROP EXISTING STORAGE POLICIES (clean slate)
-- =============================================
DROP POLICY IF EXISTS "Training files are accessible to owners" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload training files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own training files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own training files" ON storage.objects;

-- Also drop any other conflicting policies for training-files bucket
DROP POLICY IF EXISTS "Training files access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload training files" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to training folder" ON storage.objects;

-- =============================================
-- 3. CREATE NEW STORAGE POLICIES FOR TRAINING FILES
-- =============================================

-- Allow authenticated users to upload files to training-files bucket
CREATE POLICY "Users can upload training files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'training-files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own training files
CREATE POLICY "Users can read own training files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'training-files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own training files
CREATE POLICY "Users can update own training files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'training-files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'training-files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own training files
CREATE POLICY "Users can delete own training files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'training-files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- 4. VERIFY BUCKET SETTINGS
-- =============================================
-- Make sure the bucket has correct settings
UPDATE storage.buckets
SET public = false,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf', 'text/csv', 'application/json']
WHERE id = 'training-files';

-- =============================================
-- ALTERNATIVE: If the above doesn't work, try simpler policies
-- =============================================

-- Uncomment these if the above policies still don't work:

-- DROP POLICY IF EXISTS "Users can upload training files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can read own training files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own training files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own training files" ON storage.objects;

-- -- Very permissive policy for testing (use only for debugging)
-- CREATE POLICY "Allow all operations on training-files bucket"
-- ON storage.objects FOR ALL
-- USING (bucket_id = 'training-files' AND auth.role() = 'authenticated')
-- WITH CHECK (bucket_id = 'training-files' AND auth.role() = 'authenticated');

-- =============================================
-- TROUBLESHOOTING INFO
-- =============================================

-- To check if policies are working, run these queries:
-- SELECT * FROM storage.buckets WHERE id = 'training-files';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%training%';