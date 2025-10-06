-- Fix Row Level Security for avatar_prompt_versions table
-- This will allow users to properly delete their own prompt versions

-- =============================================
-- 1. CHECK AND ENABLE RLS
-- =============================================

-- Enable RLS on avatar_prompt_versions table
ALTER TABLE avatar_prompt_versions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. DROP EXISTING POLICIES (clean slate)
-- =============================================

DROP POLICY IF EXISTS "Users can view their own prompt versions" ON avatar_prompt_versions;
DROP POLICY IF EXISTS "Users can insert their own prompt versions" ON avatar_prompt_versions;
DROP POLICY IF EXISTS "Users can update their own prompt versions" ON avatar_prompt_versions;
DROP POLICY IF EXISTS "Users can delete their own prompt versions" ON avatar_prompt_versions;

-- =============================================
-- 3. CREATE COMPREHENSIVE RLS POLICIES
-- =============================================

-- Allow users to view their own prompt versions
CREATE POLICY "Users can view their own prompt versions"
ON avatar_prompt_versions FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert prompt versions for their own avatars
CREATE POLICY "Users can insert their own prompt versions"
ON avatar_prompt_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own prompt versions
CREATE POLICY "Users can update their own prompt versions"
ON avatar_prompt_versions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own prompt versions
CREATE POLICY "Users can delete their own prompt versions"
ON avatar_prompt_versions FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- 4. VERIFY POLICIES ARE WORKING
-- =============================================

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'avatar_prompt_versions';

-- =============================================
-- 5. TROUBLESHOOTING QUERIES
-- =============================================

-- To check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'avatar_prompt_versions';

-- To check current user context:
-- SELECT auth.uid() as current_user_id;

-- To test if a specific version can be deleted (replace with actual IDs):
-- SELECT id, user_id, version_number, is_active
-- FROM avatar_prompt_versions
-- WHERE id = 'your-version-id-here' AND user_id = auth.uid();