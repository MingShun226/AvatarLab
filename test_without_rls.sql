-- Test if RLS is causing the issue
-- Run these queries to diagnose

-- 1. Test query WITHOUT RLS (as postgres/service role)
-- This should work instantly
SELECT id, prompt, created_at
FROM generated_images
WHERE user_id = '9248b32f-2015-4afb-a0a3-25aa8755dc35'
ORDER BY created_at DESC
LIMIT 12;

-- 2. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'generated_images';

-- 3. Temporarily disable RLS to test (TESTING ONLY - DON'T LEAVE THIS WAY)
ALTER TABLE generated_images DISABLE ROW LEVEL SECURITY;

-- Now try your app - does it work?
-- If YES, the problem is RLS policies
-- If NO, the problem is something else

-- 4. Re-enable RLS after testing
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
