-- Complete Supabase Setup Script
-- This script sets up all database tables, storage buckets, and policies

-- =============================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 2. CREATE STORAGE BUCKET
-- =============================================
-- Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. CREATE DATABASE TABLES
-- =============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  referral_code TEXT UNIQUE,
  referrer_id UUID REFERENCES profiles(id),
  credits INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise'))
);

-- Avatars table
CREATE TABLE IF NOT EXISTS avatars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  avatar_image_url TEXT,
  voice_settings JSONB DEFAULT '{}',
  knowledge_base TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Marketplace fields
  price DECIMAL(10,2) DEFAULT 0,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  demo_url TEXT,
  preview_images TEXT[] DEFAULT '{}'
);

-- Avatar generations/training jobs
CREATE TABLE IF NOT EXISTS avatar_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  training_data JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Generated images
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  original_image_url TEXT,
  generation_type TEXT DEFAULT 'text-to-image' CHECK (generation_type IN ('text-to-image', 'image-to-image')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Image collections
CREATE TABLE IF NOT EXISTS image_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Image collection items (many-to-many)
CREATE TABLE IF NOT EXISTS image_collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES image_collections(id) ON DELETE CASCADE NOT NULL,
  image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(collection_id, image_id)
);

-- TTS voices
CREATE TABLE IF NOT EXISTS tts_voices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  voice_id TEXT NOT NULL,
  provider TEXT DEFAULT 'elevenlabs',
  settings JSONB DEFAULT '{}',
  sample_url TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Generated audio
CREATE TABLE IF NOT EXISTS generated_audio (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  voice_id UUID REFERENCES tts_voices(id) ON DELETE SET NULL,
  text_content TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Chatbot conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Chatbot messages
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Learning paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Learning path steps
CREATE TABLE IF NOT EXISTS learning_path_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Avatar purchases (marketplace)
CREATE TABLE IF NOT EXISTS avatar_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(buyer_id, avatar_id)
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================
-- 4. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_avatars_is_public ON avatars(is_public);
CREATE INDEX IF NOT EXISTS idx_avatars_category ON avatars(category);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_is_favorite ON generated_images(is_favorite);
CREATE INDEX IF NOT EXISTS idx_tts_voices_user_id ON tts_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_purchases_buyer_id ON avatar_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_avatar_purchases_avatar_id ON avatar_purchases(avatar_id);

-- =============================================
-- 5. CREATE FUNCTIONS
-- =============================================

-- Function to increment avatar sales
CREATE OR REPLACE FUNCTION increment_avatar_sales(avatar_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE avatars
  SET sales_count = sales_count + 1
  WHERE id = avatar_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. CREATE TRIGGERS
-- =============================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =============================================
-- 7. SETUP ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tts_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Avatars policies
DROP POLICY IF EXISTS "Users can view own avatars" ON avatars;
CREATE POLICY "Users can view own avatars" ON avatars FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public avatars" ON avatars;
CREATE POLICY "Users can view public avatars" ON avatars FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert own avatars" ON avatars;
CREATE POLICY "Users can insert own avatars" ON avatars FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own avatars" ON avatars;
CREATE POLICY "Users can update own avatars" ON avatars FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own avatars" ON avatars;
CREATE POLICY "Users can delete own avatars" ON avatars FOR DELETE USING (auth.uid() = user_id);

-- Generated images policies
DROP POLICY IF EXISTS "Users can view own images" ON generated_images;
CREATE POLICY "Users can view own images" ON generated_images FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own images" ON generated_images;
CREATE POLICY "Users can insert own images" ON generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own images" ON generated_images;
CREATE POLICY "Users can update own images" ON generated_images FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own images" ON generated_images;
CREATE POLICY "Users can delete own images" ON generated_images FOR DELETE USING (auth.uid() = user_id);

-- Image collections policies
DROP POLICY IF EXISTS "Users can view own collections" ON image_collections;
CREATE POLICY "Users can view own collections" ON image_collections FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own collections" ON image_collections;
CREATE POLICY "Users can insert own collections" ON image_collections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON image_collections;
CREATE POLICY "Users can update own collections" ON image_collections FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON image_collections;
CREATE POLICY "Users can delete own collections" ON image_collections FOR DELETE USING (auth.uid() = user_id);

-- TTS voices policies
DROP POLICY IF EXISTS "Users can view own voices" ON tts_voices;
CREATE POLICY "Users can view own voices" ON tts_voices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own voices" ON tts_voices;
CREATE POLICY "Users can insert own voices" ON tts_voices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own voices" ON tts_voices;
CREATE POLICY "Users can update own voices" ON tts_voices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own voices" ON tts_voices;
CREATE POLICY "Users can delete own voices" ON tts_voices FOR DELETE USING (auth.uid() = user_id);

-- Avatar purchases policies
DROP POLICY IF EXISTS "Users can view own purchases" ON avatar_purchases;
CREATE POLICY "Users can view own purchases" ON avatar_purchases FOR SELECT USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can insert own purchases" ON avatar_purchases;
CREATE POLICY "Users can insert own purchases" ON avatar_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- =============================================
-- 8. SETUP STORAGE POLICIES
-- =============================================

-- Storage policy for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload avatar images" ON storage.objects;
CREATE POLICY "Users can upload avatar images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own avatar images" ON storage.objects;
CREATE POLICY "Users can update own avatar images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own avatar images" ON storage.objects;
CREATE POLICY "Users can delete own avatar images"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Insert sample data for testing (optional)
DO $$
BEGIN
  -- Only insert if no public avatars exist
  IF NOT EXISTS (SELECT 1 FROM avatars WHERE is_public = true) THEN
    -- This will only work if you have a user already created
    -- You can remove this section if you prefer to start with clean data
    NULL;
  END IF;
END $$;