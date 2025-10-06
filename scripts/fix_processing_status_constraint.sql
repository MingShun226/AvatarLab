-- Fix processing status constraint to include 'processing' status
-- This allows the UI to show processing state properly

-- Drop the existing constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avatar_knowledge_files_processing_status_check') THEN
        ALTER TABLE avatar_knowledge_files DROP CONSTRAINT avatar_knowledge_files_processing_status_check;
    END IF;
END $$;

-- Add updated constraint with 'processing' status
ALTER TABLE avatar_knowledge_files
ADD CONSTRAINT avatar_knowledge_files_processing_status_check
CHECK (processing_status IN ('pending', 'processing', 'processed', 'error'));

-- Update any existing files with null status to pending
UPDATE avatar_knowledge_files
SET processing_status = 'pending'
WHERE processing_status IS NULL;