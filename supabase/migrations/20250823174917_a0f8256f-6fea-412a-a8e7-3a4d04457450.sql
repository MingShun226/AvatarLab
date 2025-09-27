
-- Create avatars table to store user avatars
CREATE TABLE public.avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar_images TEXT[] DEFAULT '{}',
  origin_country TEXT NOT NULL DEFAULT 'Malaysia',
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  primary_language TEXT NOT NULL DEFAULT 'English',
  secondary_languages TEXT[] DEFAULT '{}',
  backstory TEXT,
  personality_traits TEXT[] DEFAULT '{}',
  knowledge_files JSONB DEFAULT '[]',
  hidden_rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on avatars table
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for avatars
CREATE POLICY "Users can view their own avatars" 
  ON public.avatars 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own avatars" 
  ON public.avatars 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars" 
  ON public.avatars 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avatars" 
  ON public.avatars 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Update the handle_new_user function to properly save phone data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, referral_code, referrer_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    generate_referral_code(),
    NEW.raw_user_meta_data->>'referrer_code'
  );
  RETURN NEW;
END;
$$;
