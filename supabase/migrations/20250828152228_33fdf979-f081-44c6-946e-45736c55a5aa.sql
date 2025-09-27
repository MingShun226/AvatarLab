-- Create generated_images table
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  original_image_url TEXT NULL, -- For image editing (stores the input image)
  generation_type TEXT NOT NULL DEFAULT 'text-to-image', -- 'text-to-image' or 'image-to-image'
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create image_collections table
CREATE TABLE public.image_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create image_collection_items table (junction table)
CREATE TABLE public.image_collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.image_collections(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.generated_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, image_id)
);

-- Enable Row Level Security
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_images
CREATE POLICY "Users can view their own generated images" 
ON public.generated_images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated images" 
ON public.generated_images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated images" 
ON public.generated_images 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated images" 
ON public.generated_images 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for image_collections
CREATE POLICY "Users can view their own image collections" 
ON public.image_collections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image collections" 
ON public.image_collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image collections" 
ON public.image_collections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own image collections" 
ON public.image_collections 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for image_collection_items
CREATE POLICY "Users can view their own collection items" 
ON public.image_collection_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collection items" 
ON public.image_collection_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collection items" 
ON public.image_collection_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_generated_images_user_id_created_at ON public.generated_images(user_id, created_at DESC);
CREATE INDEX idx_image_collections_user_id ON public.image_collections(user_id);
CREATE INDEX idx_image_collection_items_collection_id ON public.image_collection_items(collection_id);
CREATE INDEX idx_image_collection_items_user_id ON public.image_collection_items(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_generated_images_updated_at
BEFORE UPDATE ON public.generated_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_image_collections_updated_at
BEFORE UPDATE ON public.image_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();