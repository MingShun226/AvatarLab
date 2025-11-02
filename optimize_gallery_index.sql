-- Optimize gallery loading with composite index
-- This combines user_id and created_at for faster pagination queries
-- Run this in your Supabase SQL Editor

-- Drop old separate indexes if they exist (we're replacing with composite)
-- Note: Don't drop idx_generated_images_user_id if other queries depend on it

-- Create optimized composite index for pagination
CREATE INDEX IF NOT EXISTS idx_generated_images_user_created
ON public.generated_images (user_id, created_at DESC);

-- This index will speed up queries like:
-- SELECT * FROM generated_images
-- WHERE user_id = 'xxx'
-- ORDER BY created_at DESC
-- LIMIT 12;

-- Verify indexes exist
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'generated_images'
ORDER BY indexname;

-- Check query performance (optional - see if index is being used)
EXPLAIN ANALYZE
SELECT *
FROM generated_images
WHERE user_id = '9248b32f-2015-4afb-a0a3-25aa8755dc35'
ORDER BY created_at DESC
LIMIT 12;
