
-- Add avatar_url column to profiles table if it doesn't exist (it should already exist based on schema)
-- This is just to ensure the column exists for user profile pictures

-- Create a table to store avatar knowledge files with proper relationships
CREATE TABLE IF NOT EXISTS public.avatar_knowledge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/pdf',
  is_linked BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) 
ALTER TABLE public.avatar_knowledge_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for avatar_knowledge_files
CREATE POLICY "Users can view their own avatar knowledge files" 
  ON public.avatar_knowledge_files 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own avatar knowledge files" 
  ON public.avatar_knowledge_files 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar knowledge files" 
  ON public.avatar_knowledge_files 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avatar knowledge files" 
  ON public.avatar_knowledge_files 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_files_avatar_id ON public.avatar_knowledge_files(avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_files_user_id ON public.avatar_knowledge_files(user_id);
