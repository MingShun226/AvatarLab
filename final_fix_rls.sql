-- FINAL FIX: Remove ALL policies and recreate from scratch

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own images" ON generated_images;
DROP POLICY IF EXISTS "Users can insert own images" ON generated_images;
DROP POLICY IF EXISTS "Users can update own images" ON generated_images;
DROP POLICY IF EXISTS "Users can delete own images" ON generated_images;
DROP POLICY IF EXISTS "Users can manage their images" ON generated_images;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON generated_images;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON generated_images;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON generated_images;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON generated_images;

-- Step 2: Verify no policies exist
SELECT COUNT(*) as remaining_policies
FROM pg_policies
WHERE tablename = 'generated_images';
-- Should show 0

-- Step 3: Create ONE simple policy for each operation
CREATE POLICY "select_own_images"
ON public.generated_images
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_images"
ON public.generated_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_images"
ON public.generated_images
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_images"
ON public.generated_images
FOR DELETE
USING (auth.uid() = user_id);

-- Step 4: Verify policies are correct
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'generated_images'
ORDER BY policyname;
-- Should show exactly 4 policies, all for authenticated role

-- Step 5: Test if you can see images now
-- Run this in SQL editor (will show 0 because you're not authenticated in SQL editor)
-- But your APP should now work
SELECT COUNT(*) as test_count
FROM generated_images
WHERE user_id = '9248b32f-2015-4afb-a0a3-25aa8755dc35';
-- Should show 12
