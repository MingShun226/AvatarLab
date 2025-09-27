-- Fix avatar_knowledge_files table structure
-- Run this script in your Supabase SQL Editor

-- =============================================
-- ADD MISSING COLUMNS TO avatar_knowledge_files TABLE
-- =============================================
DO $$
BEGIN
    -- Add original_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'original_name') THEN
        ALTER TABLE avatar_knowledge_files ADD COLUMN original_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added original_name column to avatar_knowledge_files table';
    END IF;

    -- Add file_name column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'file_name') THEN
        ALTER TABLE avatar_knowledge_files ADD COLUMN file_name TEXT;
        RAISE NOTICE 'Added file_name column to avatar_knowledge_files table';

        -- file_name column added for new records
    END IF;

    -- Add uploaded_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'uploaded_at') THEN
        ALTER TABLE avatar_knowledge_files ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added uploaded_at column to avatar_knowledge_files table';

        -- Copy created_at values to uploaded_at for existing records
        UPDATE avatar_knowledge_files SET uploaded_at = created_at WHERE uploaded_at IS NULL;
    END IF;

    -- Add is_linked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_knowledge_files' AND column_name = 'is_linked') THEN
        ALTER TABLE avatar_knowledge_files ADD COLUMN is_linked BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_linked column to avatar_knowledge_files table';
    END IF;
END $$;

-- =============================================
-- VERIFY TABLE STRUCTURE
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'avatar_knowledge_files'
ORDER BY ordinal_position;

-- =============================================
-- UPDATE EXISTING DATA
-- =============================================
DO $$
BEGIN
    -- Set original_name to file_name for existing records where it's empty
    UPDATE avatar_knowledge_files
    SET original_name = file_name
    WHERE original_name = '' OR original_name IS NULL;

    RAISE NOTICE 'Updated existing records with original_name values';
END $$;