-- Migration script for existing AvatarLab database
-- This safely updates your existing schema without dropping existing tables

-- Enable necessary extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- SAFE AVATAR TABLE MIGRATION
-- ================================================

-- Add missing columns to existing avatars table
DO $$
BEGIN
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'image_url') THEN
        ALTER TABLE public.avatars ADD COLUMN image_url TEXT;
    END IF;

    -- Add mbti column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'mbti') THEN
        ALTER TABLE public.avatars ADD COLUMN mbti TEXT;
    END IF;

    -- Add personality column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'personality') THEN
        ALTER TABLE public.avatars ADD COLUMN personality TEXT[];
    END IF;

    -- Add grow_up_story column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'grow_up_story') THEN
        ALTER TABLE public.avatars ADD COLUMN grow_up_story TEXT;
    END IF;

    -- Add languages column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'languages') THEN
        ALTER TABLE public.avatars ADD COLUMN languages TEXT[];
    END IF;

    -- Add rating column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'rating') THEN
        ALTER TABLE public.avatars ADD COLUMN rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
    END IF;

    -- Add is_public column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'is_public') THEN
        ALTER TABLE public.avatars ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add creator column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'creator') THEN
        ALTER TABLE public.avatars ADD COLUMN creator TEXT;
    END IF;

    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'category') THEN
        ALTER TABLE public.avatars ADD COLUMN category TEXT;
    END IF;

    -- Add total_sales column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'total_sales') THEN
        ALTER TABLE public.avatars ADD COLUMN total_sales INTEGER DEFAULT 0 CHECK (total_sales >= 0);
    END IF;

    -- Update user_id column to allow NULL for marketplace avatars
    ALTER TABLE public.avatars ALTER COLUMN user_id DROP NOT NULL;

END $$;

-- ================================================
-- CREATE TTS VOICES TABLE
-- ================================================

-- Create TTS voices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tts_voices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    accent TEXT,
    sample_url TEXT,
    voice_type TEXT CHECK (voice_type IN ('male', 'female', 'neutral')),
    language TEXT NOT NULL DEFAULT 'en-US',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert default TTS voices (only if table is empty)
INSERT INTO public.tts_voices (id, name, description, accent, voice_type, language, sample_url)
SELECT * FROM (VALUES
    ('aria', 'Aria', 'Natural, professional female voice', 'American', 'female', 'en-US', '/audio/aria_sample.mp3'),
    ('roger', 'Roger', 'Clear, confident male voice', 'British', 'male', 'en-GB', '/audio/roger_sample.mp3'),
    ('sarah', 'Sarah', 'Warm, friendly female voice', 'Australian', 'female', 'en-AU', '/audio/sarah_sample.mp3'),
    ('liam', 'Liam', 'Casual, energetic male voice', 'Irish', 'male', 'en-IE', '/audio/liam_sample.mp3'),
    ('maya', 'Maya', 'Soft, calming female voice', 'Indian', 'female', 'en-IN', '/audio/maya_sample.mp3'),
    ('alex', 'Alex', 'Versatile, neutral voice', 'Canadian', 'neutral', 'en-CA', '/audio/alex_sample.mp3')
) AS v(id, name, description, accent, voice_type, language, sample_url)
WHERE NOT EXISTS (SELECT 1 FROM public.tts_voices);

-- ================================================
-- CREATE PURCHASES TABLE
-- ================================================

-- Create purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    avatar_id UUID REFERENCES public.avatars(id) NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL CHECK (price_paid >= 0),
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, avatar_id)
);

-- ================================================
-- CREATE FUNCTIONS
-- ================================================

-- Function to increment avatar sales count
CREATE OR REPLACE FUNCTION public.increment_avatar_sales(avatar_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.avatars
    SET total_sales = COALESCE(total_sales, 0) + 1,
        updated_at = NOW()
    WHERE id = avatar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- CREATE INDEXES (SAFE)
-- ================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_avatars_marketplace ON public.avatars(is_public, status);
CREATE INDEX IF NOT EXISTS idx_avatars_category ON public.avatars(category);
CREATE INDEX IF NOT EXISTS idx_avatars_rating ON public.avatars(rating);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_avatar_id ON public.purchases(avatar_id);
CREATE INDEX IF NOT EXISTS idx_tts_voices_active ON public.tts_voices(is_active);

-- ================================================
-- ENABLE RLS AND CREATE POLICIES
-- ================================================

-- Enable RLS on new tables
ALTER TABLE public.tts_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- TTS voices policies
DROP POLICY IF EXISTS "Anyone can view active TTS voices" ON public.tts_voices;
CREATE POLICY "Anyone can view active TTS voices" ON public.tts_voices
    FOR SELECT USING (is_active = true);

-- Purchases policies
DROP POLICY IF EXISTS "Users can view their purchases" ON public.purchases;
CREATE POLICY "Users can view their purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
CREATE POLICY "Users can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update avatars policies for marketplace support
DROP POLICY IF EXISTS "Users can view marketplace avatars" ON public.avatars;
CREATE POLICY "Users can view marketplace avatars" ON public.avatars
    FOR SELECT USING ((is_public = true OR is_marketplace_item = true) AND status = 'active');

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Add a comment to indicate migration completion
COMMENT ON SCHEMA public IS 'AvatarLab database schema - Migrated on ' || NOW();

-- Show tables that were modified
SELECT 'Migration completed successfully. Modified tables: avatars, added: tts_voices, purchases' as migration_status;