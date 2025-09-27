-- Create avatar_knowledge_files table with correct structure
-- Run this script in your Supabase SQL Editor

-- =============================================
-- CREATE avatar_knowledge_files TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS avatar_knowledge_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  upload_status TEXT DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'processed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_files_avatar_id ON avatar_knowledge_files(avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_files_user_id ON avatar_knowledge_files(user_id);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE avatar_knowledge_files ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own knowledge files" ON avatar_knowledge_files;
DROP POLICY IF EXISTS "Users can insert own knowledge files" ON avatar_knowledge_files;
DROP POLICY IF EXISTS "Users can update own knowledge files" ON avatar_knowledge_files;
DROP POLICY IF EXISTS "Users can delete own knowledge files" ON avatar_knowledge_files;

-- Knowledge files policies
CREATE POLICY "Users can view own knowledge files"
ON avatar_knowledge_files FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge files"
ON avatar_knowledge_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge files"
ON avatar_knowledge_files FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge files"
ON avatar_knowledge_files FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- VERIFY TABLE STRUCTURE
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'avatar_knowledge_files'
ORDER BY ordinal_position;