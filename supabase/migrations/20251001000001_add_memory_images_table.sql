-- Add support for multiple images per memory
-- This allows users to upload multiple photos for a single memory event

CREATE TABLE public.memory_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.avatar_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Image storage
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Image metadata
  image_order INTEGER NOT NULL DEFAULT 0, -- Order in the gallery
  is_primary BOOLEAN NOT NULL DEFAULT false, -- Primary/cover image for the memory
  caption TEXT, -- Optional caption for this specific image

  -- Image analysis (each image can have its own analysis)
  image_description TEXT, -- What's in this specific image
  extracted_details JSONB, -- Additional details extracted from this image

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_memory_images_memory_id ON public.memory_images(memory_id);
CREATE INDEX idx_memory_images_user_id ON public.memory_images(user_id);
CREATE INDEX idx_memory_images_is_primary ON public.memory_images(memory_id, is_primary);

-- Enable Row Level Security
ALTER TABLE public.memory_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own memory images"
ON public.memory_images
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory images"
ON public.memory_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory images"
ON public.memory_images
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory images"
ON public.memory_images
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_memory_images_updated_at
BEFORE UPDATE ON public.memory_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one primary image per memory
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary images for this memory
    UPDATE public.memory_images
    SET is_primary = false
    WHERE memory_id = NEW.memory_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_image_trigger
BEFORE INSERT OR UPDATE ON public.memory_images
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION ensure_single_primary_image();

-- Migrate existing images from avatar_memories to memory_images
-- This preserves existing data
INSERT INTO public.memory_images (memory_id, user_id, image_url, image_path, is_primary, image_description, image_order)
SELECT
  id as memory_id,
  user_id,
  image_url,
  image_path,
  true as is_primary, -- Existing image becomes primary
  memory_description as image_description,
  0 as image_order
FROM public.avatar_memories
WHERE image_url IS NOT NULL AND image_url != '';

-- Optional: Keep the image_url in avatar_memories for backward compatibility
-- Or you can remove these columns after migration:
-- ALTER TABLE public.avatar_memories DROP COLUMN image_url;
-- ALTER TABLE public.avatar_memories DROP COLUMN image_path;
-- ALTER TABLE public.avatar_memories DROP COLUMN thumbnail_url;

-- Add helper view for easy querying
CREATE OR REPLACE VIEW memory_with_images AS
SELECT
  m.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', mi.id,
        'image_url', mi.image_url,
        'image_path', mi.image_path,
        'thumbnail_url', mi.thumbnail_url,
        'is_primary', mi.is_primary,
        'caption', mi.caption,
        'image_order', mi.image_order
      ) ORDER BY mi.image_order, mi.created_at
    ) FILTER (WHERE mi.id IS NOT NULL),
    '[]'::json
  ) as images,
  (SELECT image_url FROM public.memory_images WHERE memory_id = m.id AND is_primary = true LIMIT 1) as primary_image_url
FROM public.avatar_memories m
LEFT JOIN public.memory_images mi ON mi.memory_id = m.id
GROUP BY m.id;

COMMENT ON VIEW memory_with_images IS 'Convenient view that includes all images for each memory';
