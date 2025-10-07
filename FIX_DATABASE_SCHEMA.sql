-- Fix Database Schema Issues for AI Images

-- ================================================
-- Issue 1: Check Foreign Key Constraint
-- ================================================
-- Your table has: FOREIGN KEY (user_id) REFERENCES profiles(id)
-- But edge function uses: auth.users.id
-- Need to verify if profiles.id = auth.users.id

-- Check if profiles table exists and has matching IDs
SELECT
    u.id as user_id,
    p.id as profile_id,
    CASE
        WHEN u.id = p.id THEN 'MATCH ✓'
        ELSE 'MISMATCH ✗'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = auth.uid()
LIMIT 1;

-- ================================================
-- Issue 2: If profiles don't exist, create them
-- ================================================
-- If the above shows NULL for profile_id, create profile:

INSERT INTO profiles (id)
SELECT id FROM auth.users
WHERE id = auth.uid()
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid());

-- ================================================
-- Issue 3: Alternative - Change Foreign Key to auth.users
-- ================================================
-- If you want to use auth.users directly instead of profiles:

-- Drop existing foreign key
ALTER TABLE generated_images
DROP CONSTRAINT IF EXISTS generated_images_user_id_fkey;

-- Add new foreign key to auth.users
ALTER TABLE generated_images
ADD CONSTRAINT generated_images_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ================================================
-- Verification Queries
-- ================================================

-- 1. Check current foreign key
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'generated_images'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Test insert (will fail if foreign key issue)
-- Replace 'test-image-url' with actual URL
/*
INSERT INTO generated_images (
    user_id,
    prompt,
    image_url,
    generation_type,
    provider,
    width,
    height
) VALUES (
    auth.uid(),
    'Test prompt',
    'https://example.com/test.png',
    'text2img',
    'openai',
    1024,
    1024
);
*/

-- 3. Check if insert worked
SELECT * FROM generated_images WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1;

-- ================================================
-- Cleanup (if test insert worked)
-- ================================================
-- DELETE FROM generated_images WHERE prompt = 'Test prompt' AND user_id = auth.uid();
