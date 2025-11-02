-- Fix storage bucket to allow all training file types
-- Run this in Supabase SQL Editor

-- Update training-files bucket to allow text files, images, and PDFs
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
]
WHERE id = 'training-files';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'training-files',
  'training-files',
  false,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ],
  52428800  -- 50MB limit
)
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = EXCLUDED.allowed_mime_types,
    file_size_limit = EXCLUDED.file_size_limit;

-- Verify the update
SELECT id, name, allowed_mime_types, file_size_limit
FROM storage.buckets
WHERE id = 'training-files';
