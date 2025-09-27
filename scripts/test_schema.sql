-- Quick test script to verify the updated schema works
-- Run this after running the main supabase_schema.sql

-- Test inserting a sample avatar
INSERT INTO public.avatars (
  name, description, image_url, price, rating, total_sales, creator, mbti,
  personality, favorites, grow_up_story, voice_description, languages,
  lifestyle, gallery_images, category, is_public
) VALUES (
  'Test Avatar',
  'A test avatar to verify schema',
  '/test-image.png',
  99.99,
  4.5,
  10,
  'TestStudio',
  'ENFP',
  ARRAY['Friendly', 'Creative'],
  ARRAY['Testing', 'Databases'],
  'A test avatar created to verify database schema functionality.',
  'Clear test voice',
  ARRAY['English'],
  ARRAY['Technology', 'Testing'],
  ARRAY['/test-image.png'],
  'Technology',
  true
);

-- Test querying public avatars (this should work without authentication)
SELECT id, name, description, price, rating, category, is_public
FROM public.avatars
WHERE is_public = true
LIMIT 5;

-- Test TTS voices
SELECT id, name, description, accent, voice_type, language
FROM public.tts_voices
WHERE is_active = true
LIMIT 5;

-- Verify the increment function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'increment_avatar_sales';

COMMENT ON SCHEMA public IS 'Schema test completed successfully';