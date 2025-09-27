-- Debug Training System Tables
-- Run this script in your Supabase SQL Editor to check what's wrong

-- =============================================
-- 1. CHECK IF TABLES EXIST
-- =============================================
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'avatar_training_data',
    'avatar_training_files',
    'avatar_prompt_versions',
    'avatar_training_logs'
)
ORDER BY table_name;

-- =============================================
-- 2. CHECK TABLE STRUCTURE FOR avatar_prompt_versions
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'avatar_prompt_versions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 3. CHECK RLS POLICIES
-- =============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'avatar_prompt_versions';

-- =============================================
-- 4. CHECK TABLE PERMISSIONS
-- =============================================
SELECT
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges
WHERE table_name = 'avatar_prompt_versions'
AND table_schema = 'public';

-- =============================================
-- 5. TEST BASIC SELECT (should work for superuser)
-- =============================================
SELECT COUNT(*) as row_count
FROM avatar_prompt_versions;

-- =============================================
-- 6. CHECK IF RLS IS ENABLED
-- =============================================
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'avatar_prompt_versions';

-- =============================================
-- 7. CHECK AUTH CONTEXT
-- =============================================
SELECT
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- =============================================
-- 8. SHOW CURRENT USER PERMISSIONS
-- =============================================
SELECT current_user, session_user;