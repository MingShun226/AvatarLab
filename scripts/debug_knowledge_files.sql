-- Debug Knowledge Files - Check what data exists
-- Run this script in your Supabase SQL Editor

-- =============================================
-- 1. CHECK TABLE STRUCTURE
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
-- 2. CHECK ACTUAL DATA IN TABLE
-- =============================================
SELECT
    id,
    file_name,
    original_name,
    file_path,
    file_size,
    content_type,
    extracted_text,
    processing_status,
    status,
    is_linked,
    uploaded_at
FROM avatar_knowledge_files
ORDER BY uploaded_at DESC
LIMIT 5;

-- =============================================
-- 3. CHECK FOR MISSING extracted_text
-- =============================================
SELECT
    COUNT(*) as total_files,
    COUNT(CASE WHEN extracted_text IS NOT NULL AND extracted_text != '' THEN 1 END) as files_with_text,
    COUNT(CASE WHEN extracted_text IS NULL OR extracted_text = '' THEN 1 END) as files_without_text
FROM avatar_knowledge_files;

-- =============================================
-- 4. SHOW FILES WITHOUT EXTRACTED TEXT
-- =============================================
SELECT
    file_name,
    file_size,
    content_type,
    processing_status,
    status,
    uploaded_at
FROM avatar_knowledge_files
WHERE extracted_text IS NULL OR extracted_text = ''
ORDER BY uploaded_at DESC;