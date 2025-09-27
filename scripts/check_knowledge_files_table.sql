-- Check avatar_knowledge_files table structure
-- Run this script in your Supabase SQL Editor

-- =============================================
-- 1. CHECK IF TABLE EXISTS
-- =============================================
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_knowledge_files')
        THEN 'avatar_knowledge_files table EXISTS'
        ELSE 'avatar_knowledge_files table DOES NOT EXIST'
    END as table_status;

-- =============================================
-- 2. CHECK TABLE COLUMNS (if table exists)
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'avatar_knowledge_files'
ORDER BY ordinal_position;

-- =============================================
-- 3. CHECK SPECIFIC COLUMNS NEEDED BY UPLOAD
-- =============================================
SELECT
    'filename' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'filename')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'file_type' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'file_type')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'file_path' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'file_path')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'file_size' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'file_size')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;