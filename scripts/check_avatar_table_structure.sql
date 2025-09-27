-- Check Avatar Table Structure
-- Run this script in your Supabase SQL Editor to see current table structure

-- =============================================
-- 1. CHECK AVATARS TABLE COLUMNS
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
-- 2. CHECK IF AVATARS TABLE EXISTS
-- =============================================
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatars')
        THEN 'avatars table EXISTS'
        ELSE 'avatars table DOES NOT EXIST'
    END as table_status;

-- =============================================
-- 3. CHECK SPECIFIC COLUMNS NEEDED BY AVATAR CREATION FORM
-- =============================================
SELECT
    'origin_country' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'origin_country')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'age' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'age')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'gender' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'gender')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'primary_language' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'primary_language')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'secondary_languages' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'secondary_languages')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'avatar_images' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'avatar_images')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'personality_traits' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'personality_traits')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'mbti_type' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'mbti_type')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'backstory' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'backstory')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT
    'hidden_rules' as column_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'hidden_rules')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- =============================================
-- 4. CHECK EXISTING AVATAR RECORDS
-- =============================================
SELECT
    COUNT(*) as total_avatars,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as avatars_with_names,
    COUNT(CASE WHEN origin_country IS NOT NULL THEN 1 END) as avatars_with_countries
FROM avatars;