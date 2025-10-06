-- Avatar Memory System
-- Stores visual memories (photos) that avatars can reference in conversations

CREATE TABLE public.avatar_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Memory metadata
  title TEXT NOT NULL, -- e.g., "Dinner at Italian Restaurant"
  memory_date DATE NOT NULL, -- When the memory occurred

  -- Image storage
  image_url TEXT NOT NULL, -- URL to stored image in Supabase Storage
  image_path TEXT NOT NULL, -- Storage path for deletion
  thumbnail_url TEXT, -- Optional thumbnail for performance

  -- AI-extracted memory details (from GPT-4 Vision)
  memory_description TEXT NOT NULL, -- Detailed description of what's in the photo
  location TEXT, -- e.g., "Mama's Italian Restaurant, Downtown"
  people_present TEXT[], -- Array of people mentioned/visible
  activities TEXT[], -- e.g., ["eating", "celebrating birthday"]
  food_items TEXT[], -- e.g., ["spaghetti carbonara", "tiramisu"]
  objects_visible TEXT[], -- e.g., ["wine glass", "candles"]
  mood TEXT, -- e.g., "happy", "relaxed", "excited"
  tags TEXT[], -- User or AI-generated tags for searching

  -- Memory context (how to reference it)
  memory_summary TEXT NOT NULL, -- Short summary for quick reference
  conversational_hooks TEXT[], -- Phrases avatar can use to bring it up

  -- Metadata
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false, -- Private memories won't be shared
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Memory categories (optional tagging system)
CREATE TABLE public.memory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name or emoji
  color TEXT, -- Hex color for UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Junction table for memory-category relationships
CREATE TABLE public.memory_category_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.avatar_memories(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.memory_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(memory_id, category_id)
);

-- Enable Row Level Security
ALTER TABLE public.avatar_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_category_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for avatar_memories
CREATE POLICY "Users can view their own avatar memories"
ON public.avatar_memories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own avatar memories"
ON public.avatar_memories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar memories"
ON public.avatar_memories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avatar memories"
ON public.avatar_memories
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for memory_categories
CREATE POLICY "Users can view their own memory categories"
ON public.memory_categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory categories"
ON public.memory_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory categories"
ON public.memory_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory categories"
ON public.memory_categories
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for memory_category_mappings
CREATE POLICY "Users can view their own memory category mappings"
ON public.memory_category_mappings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory category mappings"
ON public.memory_category_mappings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory category mappings"
ON public.memory_category_mappings
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_avatar_memories_avatar_id ON public.avatar_memories(avatar_id);
CREATE INDEX idx_avatar_memories_user_id ON public.avatar_memories(user_id);
CREATE INDEX idx_avatar_memories_memory_date ON public.avatar_memories(memory_date DESC);
CREATE INDEX idx_avatar_memories_tags ON public.avatar_memories USING GIN(tags);
CREATE INDEX idx_memory_categories_user_id ON public.memory_categories(user_id);
CREATE INDEX idx_memory_category_mappings_memory_id ON public.memory_category_mappings(memory_id);
CREATE INDEX idx_memory_category_mappings_category_id ON public.memory_category_mappings(category_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_avatar_memories_updated_at
BEFORE UPDATE ON public.avatar_memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for memory photos (public so GPT-4 Vision can access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-memories', 'avatar-memories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatar-memories bucket
CREATE POLICY "Users can upload their own memory photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatar-memories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view memory photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatar-memories');

CREATE POLICY "Users can view their own memory photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatar-memories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own memory photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatar-memories'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Insert default memory categories
INSERT INTO public.memory_categories (user_id, name, description, icon, color)
SELECT
  auth.uid(),
  category.name,
  category.description,
  category.icon,
  category.color
FROM (
  VALUES
    ('Food & Dining', 'Meals, restaurants, and culinary experiences', '🍽️', '#FF6B6B'),
    ('Travel', 'Places visited and travel experiences', '✈️', '#4ECDC4'),
    ('Friends & Family', 'Time spent with loved ones', '👥', '#95E1D3'),
    ('Celebrations', 'Birthdays, parties, and special events', '🎉', '#FFE66D'),
    ('Hobbies', 'Activities and interests', '🎨', '#A8E6CF'),
    ('Work & Learning', 'Professional and educational moments', '💼', '#6C5CE7'),
    ('Daily Life', 'Everyday moments and routines', '📅', '#74B9FF')
) AS category(name, description, icon, color)
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- Function to get recent memories for avatar context injection
CREATE OR REPLACE FUNCTION public.get_recent_avatar_memories(
  p_avatar_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  memory_summary TEXT,
  memory_date DATE,
  conversational_hooks TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.memory_summary,
    am.memory_date,
    am.conversational_hooks
  FROM public.avatar_memories am
  WHERE am.avatar_id = p_avatar_id
    AND am.user_id = p_user_id
    AND am.is_private = false
  ORDER BY am.memory_date DESC, am.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
