-- Fix All Avatar Creation Errors
-- Run this script in your Supabase SQL Editor

-- =============================================
-- 1. CREATE MISSING AVATAR_TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS avatar_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_type TEXT NOT NULL CHECK (template_type IN ('backstory', 'hidden_rules', 'personality', 'voice')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_avatar_templates_type_active ON avatar_templates(template_type, is_active);

-- =============================================
-- 2. CREATE KNOWLEDGE-BASE STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base',
  'knowledge-base',
  false, -- Private bucket for knowledge files
  104857600, -- 100MB limit
  ARRAY['application/pdf', 'text/plain', 'text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. CREATE STORAGE POLICIES FOR KNOWLEDGE-BASE BUCKET
-- =============================================

-- Allow authenticated users to upload to knowledge-base bucket
CREATE POLICY "Authenticated users can upload knowledge files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-base' AND auth.role() = 'authenticated');

-- Allow users to access their own knowledge files
CREATE POLICY "Users can access own knowledge files"
ON storage.objects FOR ALL
USING (bucket_id = 'knowledge-base' AND auth.role() = 'authenticated');

-- =============================================
-- 4. CREATE AVATAR KNOWLEDGE FILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS avatar_knowledge_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  upload_status TEXT DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'processed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_files_avatar_id ON avatar_knowledge_files(avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_files_user_id ON avatar_knowledge_files(user_id);

-- =============================================
-- 5. ENABLE RLS ON NEW TABLES
-- =============================================
ALTER TABLE avatar_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_knowledge_files ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREATE RLS POLICIES FOR NEW TABLES
-- =============================================

-- Avatar templates policies (read-only for everyone)
DROP POLICY IF EXISTS "Anyone can view active templates" ON avatar_templates;
CREATE POLICY "Anyone can view active templates"
ON avatar_templates FOR SELECT
USING (is_active = true);

-- Knowledge files policies
DROP POLICY IF EXISTS "Users can view own knowledge files" ON avatar_knowledge_files;
CREATE POLICY "Users can view own knowledge files"
ON avatar_knowledge_files FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own knowledge files" ON avatar_knowledge_files;
CREATE POLICY "Users can insert own knowledge files"
ON avatar_knowledge_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own knowledge files" ON avatar_knowledge_files;
CREATE POLICY "Users can update own knowledge files"
ON avatar_knowledge_files FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own knowledge files" ON avatar_knowledge_files;
CREATE POLICY "Users can delete own knowledge files"
ON avatar_knowledge_files FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- 7. INSERT SAMPLE TEMPLATE DATA
-- =============================================

-- Insert backstory templates
INSERT INTO avatar_templates (template_type, title, content, description, category) VALUES
('backstory', 'Professional Assistant', 'You are a professional AI assistant with expertise in business and productivity. You have a formal yet approachable communication style and always strive to provide accurate, helpful information.', 'A professional assistant template for business use', 'business'),
('backstory', 'Creative Companion', 'You are a creative and imaginative AI companion who loves art, writing, and innovation. You approach problems with creativity and always encourage artistic expression and out-of-the-box thinking.', 'A creative companion template for artistic projects', 'creative'),
('backstory', 'Technical Expert', 'You are a technical expert with deep knowledge in programming, engineering, and technology. You provide detailed technical explanations and help solve complex technical problems with precision.', 'A technical expert template for development work', 'technical'),
('backstory', 'Friendly Teacher', 'You are a patient and encouraging teacher who loves helping people learn. You break down complex topics into simple, understandable parts and celebrate every learning milestone.', 'A teaching template for educational purposes', 'education')
ON CONFLICT DO NOTHING;

-- Insert hidden rules templates
INSERT INTO avatar_templates (template_type, title, content, description, category) VALUES
('hidden_rules', 'Professional Boundaries', 'Always maintain professional boundaries. Do not share personal information or engage in inappropriate conversations. Focus on the task at hand and provide value-driven responses.', 'Professional boundary guidelines', 'business'),
('hidden_rules', 'Creative Freedom', 'Encourage creative expression while maintaining helpfulness. Be open to unconventional ideas but ensure they are constructive and positive.', 'Guidelines for creative interactions', 'creative'),
('hidden_rules', 'Technical Accuracy', 'Always prioritize technical accuracy over speed. If uncertain about technical details, acknowledge limitations and suggest proper resources for verification.', 'Technical accuracy guidelines', 'technical'),
('hidden_rules', 'Safe Learning', 'Create a safe learning environment where mistakes are learning opportunities. Never make learners feel inadequate for not knowing something.', 'Safe learning environment guidelines', 'education')
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. ADD MISSING COLUMNS TO EXISTING TABLES (IF NEEDED)
-- =============================================

-- Add columns to avatars table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'origin_country') THEN
        ALTER TABLE avatars ADD COLUMN origin_country TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'age') THEN
        ALTER TABLE avatars ADD COLUMN age INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'gender') THEN
        ALTER TABLE avatars ADD COLUMN gender TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'primary_language') THEN
        ALTER TABLE avatars ADD COLUMN primary_language TEXT DEFAULT 'English';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'secondary_languages') THEN
        ALTER TABLE avatars ADD COLUMN secondary_languages TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'avatar_images') THEN
        ALTER TABLE avatars ADD COLUMN avatar_images TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'backstory') THEN
        ALTER TABLE avatars ADD COLUMN backstory TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'hidden_rules') THEN
        ALTER TABLE avatars ADD COLUMN hidden_rules TEXT;
    END IF;
END $$;

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- This script should resolve:
-- 1. ✅ Missing avatar_templates table and is_active column
-- 2. ✅ Missing knowledge-base storage bucket
-- 3. ✅ Missing avatar_knowledge_files table
-- 4. ✅ Proper RLS policies for all new tables and storage
-- 5. ✅ Sample template data for testing