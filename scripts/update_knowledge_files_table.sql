-- Update avatar_knowledge_files table to support RAG processing status
-- Run this script in your Supabase SQL Editor AFTER the main RAG setup

-- Add processing_status column if it doesn't exist
ALTER TABLE avatar_knowledge_files
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Add original_name column if it doesn't exist (for display purposes)
ALTER TABLE avatar_knowledge_files
ADD COLUMN IF NOT EXISTS original_name TEXT;

-- Update existing records to have original_name same as file_name if null
UPDATE avatar_knowledge_files
SET original_name = file_name
WHERE original_name IS NULL;

-- Add index for processing_status for better query performance
CREATE INDEX IF NOT EXISTS idx_avatar_knowledge_files_processing_status
ON avatar_knowledge_files(processing_status);

-- Add constraint to ensure valid processing status values (drop if exists first)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_processing_status') THEN
        ALTER TABLE avatar_knowledge_files DROP CONSTRAINT check_processing_status;
    END IF;
END $$;

ALTER TABLE avatar_knowledge_files
ADD CONSTRAINT check_processing_status
CHECK (processing_status IN ('pending', 'processed', 'error'));

-- Update any existing files to 'pending' status if they don't have a status
UPDATE avatar_knowledge_files
SET processing_status = 'pending'
WHERE processing_status IS NULL;

SELECT 'avatar_knowledge_files table updated successfully' as status;