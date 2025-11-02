-- Remove the duplicate/conflicting policy
DROP POLICY IF EXISTS "Users can manage their images" ON generated_images;

-- Verify only the correct policies remain
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'generated_images'
ORDER BY policyname;

-- Test query to see if you can now access your images
SELECT COUNT(*) as total_images
FROM generated_images
WHERE user_id = auth.uid();

-- If count shows 12, try fetching them
SELECT id, prompt, created_at, image_url
FROM generated_images
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 12;
