
-- First, let's migrate existing knowledge files from avatars.knowledge_files to avatar_knowledge_files table
-- and then remove the knowledge_files column from avatars table

-- Add a migration function to move existing data
CREATE OR REPLACE FUNCTION migrate_avatar_knowledge_files()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    avatar_record RECORD;
    file_record JSONB;
BEGIN
    -- Loop through all avatars that have knowledge_files
    FOR avatar_record IN 
        SELECT id, user_id, knowledge_files 
        FROM avatars 
        WHERE knowledge_files IS NOT NULL 
        AND jsonb_array_length(knowledge_files) > 0
    LOOP
        -- Loop through each knowledge file in the JSONB array
        FOR file_record IN 
            SELECT * FROM jsonb_array_elements(avatar_record.knowledge_files)
        LOOP
            -- Insert into avatar_knowledge_files table if not already exists
            INSERT INTO avatar_knowledge_files (
                avatar_id,
                user_id,
                file_name,
                file_path,
                file_size,
                content_type,
                is_linked,
                uploaded_at
            )
            SELECT 
                avatar_record.id,
                avatar_record.user_id,
                COALESCE(file_record->>'name', file_record->>'filename', 'Unknown File'),
                COALESCE(file_record->>'path', file_record->>'file_path', ''),
                COALESCE((file_record->>'size')::bigint, 0),
                COALESCE(file_record->>'type', file_record->>'content_type', 'application/pdf'),
                COALESCE((file_record->>'linked')::boolean, true),
                COALESCE((file_record->>'uploadedAt')::timestamp with time zone, now())
            WHERE NOT EXISTS (
                SELECT 1 FROM avatar_knowledge_files akf 
                WHERE akf.avatar_id = avatar_record.id 
                AND akf.file_name = COALESCE(file_record->>'name', file_record->>'filename', 'Unknown File')
            );
        END LOOP;
    END LOOP;
END;
$$;

-- Execute the migration
SELECT migrate_avatar_knowledge_files();

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_avatar_knowledge_files();

-- Remove the knowledge_files column from avatars table
ALTER TABLE avatars DROP COLUMN IF EXISTS knowledge_files;

-- Enable realtime for avatars table
ALTER PUBLICATION supabase_realtime ADD TABLE avatars;
ALTER TABLE avatars REPLICA IDENTITY FULL;

-- Enable realtime for avatar_knowledge_files table  
ALTER PUBLICATION supabase_realtime ADD TABLE avatar_knowledge_files;
ALTER TABLE avatar_knowledge_files REPLICA IDENTITY FULL;
