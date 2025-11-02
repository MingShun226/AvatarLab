-- Fix RLS policies for generated_images table
-- The timeout is likely caused by expensive or recursive RLS checks

-- First, let's see current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'generated_images';

-- Drop existing policies (we'll recreate them properly)
DROP POLICY IF EXISTS "Users can view own images" ON generated_images;
DROP POLICY IF EXISTS "Users can insert own images" ON generated_images;
DROP POLICY IF EXISTS "Users can update own images" ON generated_images;
DROP POLICY IF EXISTS "Users can delete own images" ON generated_images;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON generated_images;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON generated_images;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON generated_images;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON generated_images;

-- Create simple, efficient RLS policies
-- SELECT policy
CREATE POLICY "Users can view own images"
ON generated_images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert own images"
ON generated_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update own images"
ON generated_images
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete own images"
ON generated_images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'generated_images'
ORDER BY policyname;
