-- Add Version Lineage Support to Training System
-- Run this script in your Supabase SQL Editor

-- =============================================
-- 1. ADD PARENT VERSION TRACKING
-- =============================================

-- Add parent_version_id column to track version lineage
ALTER TABLE avatar_prompt_versions
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES avatar_prompt_versions(id) ON DELETE SET NULL;

-- Add index for parent version queries
CREATE INDEX IF NOT EXISTS idx_avatar_prompt_versions_parent_version_id
ON avatar_prompt_versions(parent_version_id);

-- =============================================
-- 2. ADD VERSION LINEAGE METADATA
-- =============================================

-- Add columns to track what changed in this version
ALTER TABLE avatar_prompt_versions
ADD COLUMN IF NOT EXISTS changes_from_parent JSONB,
ADD COLUMN IF NOT EXISTS inheritance_type TEXT DEFAULT 'full', -- 'full', 'incremental', 'override'
ADD COLUMN IF NOT EXISTS base_version_id UUID REFERENCES avatar_prompt_versions(id) ON DELETE SET NULL;

-- Add index for base version queries
CREATE INDEX IF NOT EXISTS idx_avatar_prompt_versions_base_version_id
ON avatar_prompt_versions(base_version_id);

-- =============================================
-- 3. CREATE VERSION LINEAGE FUNCTIONS
-- =============================================

-- Function to get version ancestry (lineage)
CREATE OR REPLACE FUNCTION get_version_lineage(version_uuid UUID)
RETURNS TABLE (
  version_id UUID,
  version_number TEXT,
  level INTEGER,
  parent_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE version_tree AS (
    -- Base case: start with the given version
    SELECT
      apv.id as version_id,
      apv.version_number,
      0 as level,
      apv.parent_version_id as parent_id
    FROM avatar_prompt_versions apv
    WHERE apv.id = version_uuid

    UNION ALL

    -- Recursive case: get parent versions
    SELECT
      apv.id as version_id,
      apv.version_number,
      vt.level + 1 as level,
      apv.parent_version_id as parent_id
    FROM avatar_prompt_versions apv
    INNER JOIN version_tree vt ON apv.id = vt.parent_id
    WHERE vt.level < 10 -- Prevent infinite recursion
  )
  SELECT * FROM version_tree ORDER BY level DESC;
END;
$$;

-- Function to get version children (descendants)
CREATE OR REPLACE FUNCTION get_version_descendants(version_uuid UUID)
RETURNS TABLE (
  version_id UUID,
  version_number TEXT,
  level INTEGER,
  parent_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE version_tree AS (
    -- Base case: start with the given version
    SELECT
      apv.id as version_id,
      apv.version_number,
      0 as level,
      apv.parent_version_id as parent_id
    FROM avatar_prompt_versions apv
    WHERE apv.id = version_uuid

    UNION ALL

    -- Recursive case: get child versions
    SELECT
      apv.id as version_id,
      apv.version_number,
      vt.level + 1 as level,
      apv.parent_version_id as parent_id
    FROM avatar_prompt_versions apv
    INNER JOIN version_tree vt ON apv.parent_version_id = vt.version_id
    WHERE vt.level < 10 -- Prevent infinite recursion
  )
  SELECT * FROM version_tree WHERE level > 0 ORDER BY level;
END;
$$;

-- =============================================
-- 4. UPDATE TRAINING SERVICE TO SUPPORT LINEAGE
-- =============================================

-- Function to create a new version based on a parent version
CREATE OR REPLACE FUNCTION create_incremental_version(
  p_avatar_id UUID,
  p_user_id UUID,
  p_training_data_id UUID,
  p_parent_version_id UUID,
  p_version_number TEXT,
  p_version_name TEXT,
  p_description TEXT,
  p_system_prompt TEXT,
  p_personality_traits TEXT[],
  p_behavior_rules TEXT[],
  p_response_style JSONB,
  p_changes_from_parent JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_version_id UUID;
BEGIN
  -- Insert new version with parent reference
  INSERT INTO avatar_prompt_versions (
    avatar_id,
    user_id,
    training_data_id,
    parent_version_id,
    version_number,
    version_name,
    description,
    system_prompt,
    personality_traits,
    behavior_rules,
    response_style,
    changes_from_parent,
    inheritance_type,
    is_active,
    is_published
  ) VALUES (
    p_avatar_id,
    p_user_id,
    p_training_data_id,
    p_parent_version_id,
    p_version_number,
    p_version_name,
    p_description,
    p_system_prompt,
    p_personality_traits,
    p_behavior_rules,
    p_response_style,
    p_changes_from_parent,
    CASE WHEN p_parent_version_id IS NULL THEN 'full' ELSE 'incremental' END,
    false,
    false
  ) RETURNING id INTO new_version_id;

  RETURN new_version_id;
END;
$$;

-- =============================================
-- 5. ADD CONSTRAINT CHECKING
-- =============================================

-- Ensure version numbers are unique per avatar
CREATE UNIQUE INDEX IF NOT EXISTS idx_avatar_prompt_versions_unique_number
ON avatar_prompt_versions(avatar_id, version_number)
WHERE user_id IS NOT NULL;

-- =============================================
-- 6. SAMPLE QUERIES FOR VERSION LINEAGE
-- =============================================

-- Example: Get full lineage for a version (uncomment to test)
-- SELECT * FROM get_version_lineage('your-version-uuid-here');

-- Example: Get all descendants of a version
-- SELECT * FROM get_version_descendants('your-version-uuid-here');

-- Example: Get version tree for an avatar
-- SELECT
--   apv.version_number,
--   apv.version_name,
--   parent.version_number as parent_version,
--   apv.inheritance_type,
--   apv.created_at
-- FROM avatar_prompt_versions apv
-- LEFT JOIN avatar_prompt_versions parent ON apv.parent_version_id = parent.id
-- WHERE apv.avatar_id = 'your-avatar-id'
-- ORDER BY apv.created_at;

SELECT 'Version lineage support added successfully' as status;