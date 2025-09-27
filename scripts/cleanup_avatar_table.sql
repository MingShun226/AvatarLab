-- Cleanup Avatar Table - Remove Duplicate and Unnecessary Columns
-- Run this script in your Supabase SQL Editor

-- =============================================
-- REMOVE DUPLICATE COLUMNS
-- =============================================
DO $$
BEGIN
    -- Remove duplicate personality column (keep personality_traits)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'personality') THEN
        ALTER TABLE avatars DROP COLUMN personality;
        RAISE NOTICE 'Dropped duplicate personality column (keeping personality_traits)';
    END IF;

    -- Remove duplicate mbti column (keep mbti_type)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'mbti') THEN
        ALTER TABLE avatars DROP COLUMN mbti;
        RAISE NOTICE 'Dropped duplicate mbti column (keeping mbti_type)';
    END IF;

    -- Remove duplicate grow_up_story column (keep backstory)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'grow_up_story') THEN
        ALTER TABLE avatars DROP COLUMN grow_up_story;
        RAISE NOTICE 'Dropped duplicate grow_up_story column (keeping backstory)';
    END IF;

    -- Remove duplicate languages column (keep secondary_languages)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'languages') THEN
        ALTER TABLE avatars DROP COLUMN languages;
        RAISE NOTICE 'Dropped duplicate languages column (keeping secondary_languages)';
    END IF;

    -- Remove unnecessary image_url column (we have avatar_images array)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'image_url') THEN
        ALTER TABLE avatars DROP COLUMN image_url;
        RAISE NOTICE 'Dropped unnecessary image_url column (using avatar_images array)';
    END IF;

    -- Remove unnecessary creator column (we have user_id foreign key)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'creator') THEN
        ALTER TABLE avatars DROP COLUMN creator;
        RAISE NOTICE 'Dropped unnecessary creator column (using user_id foreign key)';
    END IF;
END $$;

-- =============================================
-- VERIFY FINAL COLUMN STRUCTURE
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'avatars'
ORDER BY ordinal_position;

-- =============================================
-- SUMMARY OF REMAINING COLUMNS
-- =============================================
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'avatars';

    RAISE NOTICE 'Avatar table cleanup complete. Total columns: %', col_count;
    RAISE NOTICE 'Removed duplicate columns: personality, mbti, grow_up_story, languages';
    RAISE NOTICE 'Removed unnecessary columns: image_url, creator';
END $$;