-- Add Missing Avatar Detail Columns
-- Run this script in your Supabase SQL Editor

-- =============================================
-- ADD MISSING COLUMNS TO AVATARS TABLE
-- =============================================
DO $$
BEGIN
    -- Add personality_traits column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'personality_traits') THEN
        ALTER TABLE avatars ADD COLUMN personality_traits TEXT[] DEFAULT '{}';
    END IF;

    -- Add mbti_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'mbti_type') THEN
        ALTER TABLE avatars ADD COLUMN mbti_type TEXT;
    END IF;

    -- Add description column if it doesn't exist (sometimes needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'description') THEN
        ALTER TABLE avatars ADD COLUMN description TEXT;
    END IF;

    -- Make sure all the other required columns exist
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
-- VERIFY COLUMNS WERE ADDED
-- =============================================
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'avatars'
    AND column_name IN (
        'origin_country', 'age', 'gender', 'primary_language',
        'secondary_languages', 'avatar_images', 'backstory',
        'hidden_rules', 'personality_traits', 'mbti_type', 'description'
    );

    RAISE NOTICE 'Avatar detail columns added: % out of 11 expected columns found', col_count;
END $$;