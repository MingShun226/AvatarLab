-- Check if images exist with your actual user_id
SELECT COUNT(*) as total_images
FROM generated_images
WHERE user_id = '9248b32f-2015-4afb-a0a3-25aa8755dc35';

-- See the actual images
SELECT id, prompt, created_at, user_id
FROM generated_images
WHERE user_id = '9248b32f-2015-4afb-a0a3-25aa8755dc35'
ORDER BY created_at DESC;

-- Check what auth.uid() returns in SQL editor (will be null)
SELECT auth.uid() as current_auth_uid;

-- Check ALL images regardless of user (to see if any exist)
SELECT COUNT(*) as all_images_count
FROM generated_images;
