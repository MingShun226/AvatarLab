-- Check how images are currently stored
SELECT
  id,
  LENGTH(image_url) as url_length,
  CASE
    WHEN image_url LIKE 'data:image%' THEN 'Base64 (SLOW)'
    WHEN image_url LIKE 'http%' THEN 'URL (FAST)'
    ELSE 'Unknown'
  END as storage_type,
  created_at
FROM generated_images
WHERE user_id = '9248b32f-2015-4afb-a0a3-25aa8755dc35'
ORDER BY created_at DESC
LIMIT 5;

-- Check total size of image data
SELECT
  COUNT(*) as total_images,
  AVG(LENGTH(image_url)) as avg_size_bytes,
  AVG(LENGTH(image_url))/1024 as avg_size_kb,
  SUM(LENGTH(image_url))/1024/1024 as total_size_mb
FROM generated_images
WHERE user_id = '9248b32f-2015-4afb-a0a3-25aa8755dc35';
