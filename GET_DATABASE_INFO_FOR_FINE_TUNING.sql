-- Run this in Supabase SQL Editor to get all table information needed for fine-tuning
-- Copy the results and send them back

-- =============================================
-- 1. CHECK ALL AVATAR-RELATED TABLES
-- =============================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
  table_name LIKE '%avatar%'
  OR table_name LIKE '%training%'
  OR table_name LIKE '%chatbot%'
)
ORDER BY table_name;

-- =============================================
-- 2. GET AVATARS TABLE STRUCTURE
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'avatars'
ORDER BY ordinal_position;

-- =============================================
-- 3. CHECK IF TRAINING TABLES EXIST
-- =============================================
SELECT
    'avatar_training_data' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_training_data')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
UNION ALL
SELECT
    'avatar_training_files' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_training_files')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
UNION ALL
SELECT
    'avatar_training_logs' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_training_logs')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
UNION ALL
SELECT
    'avatar_prompt_versions' as table_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_prompt_versions')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status;

-- =============================================
-- 4. IF avatar_training_data EXISTS, GET ITS COLUMNS
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'avatar_training_data'
ORDER BY ordinal_position;

-- =============================================
-- 5. GET AVATARS TABLE COLUMNS (TO ADD FINE-TUNING SUPPORT)
-- =============================================
-- Just checking what columns exist so we know what to add
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'avatars'
AND column_name IN ('active_fine_tuned_model', 'base_model', 'use_fine_tuned_model')
ORDER BY column_name;
