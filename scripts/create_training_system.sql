-- Create Training System for Avatar Prompts and Behavior
-- Run this script in your Supabase SQL Editor

-- =============================================
-- 1. CREATE TRAINING DATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS avatar_training_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,

  -- Training content
  system_prompt TEXT,
  user_prompt_template TEXT,
  training_instructions TEXT,

  -- Training metadata
  training_type TEXT DEFAULT 'prompt_update', -- 'prompt_update', 'conversation_analysis', 'file_upload'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

  -- Results
  generated_prompts JSONB, -- Store generated system prompts
  analysis_results JSONB, -- Store conversation analysis results
  improvement_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 2. CREATE TRAINING FILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS avatar_training_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  training_data_id UUID REFERENCES avatar_training_data(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- File information
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,

  -- Processing status
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  extracted_text TEXT, -- For images with OCR, conversation text
  analysis_data JSONB, -- Structured conversation analysis

  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 3. CREATE AVATAR PROMPT VERSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS avatar_prompt_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  training_data_id UUID REFERENCES avatar_training_data(id) ON DELETE SET NULL,

  -- Version information
  version_number TEXT NOT NULL,
  version_name TEXT,
  description TEXT,

  -- Prompt content
  system_prompt TEXT NOT NULL,
  personality_traits TEXT[],
  behavior_rules TEXT[],
  response_style JSONB, -- Style preferences like formality, emoji usage, etc.

  -- Version status
  is_active BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,

  -- Performance tracking
  usage_count INTEGER DEFAULT 0,
  rating FLOAT,
  feedback_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 4. CREATE TRAINING LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS avatar_training_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  training_data_id UUID REFERENCES avatar_training_data(id) ON DELETE CASCADE NOT NULL,

  -- Log details
  log_type TEXT NOT NULL, -- 'training_start', 'processing_step', 'completion', 'error'
  message TEXT NOT NULL,
  details JSONB,

  -- Context
  processing_step TEXT, -- 'file_upload', 'text_extraction', 'analysis', 'prompt_generation'
  progress_percentage INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_avatar_training_data_avatar_id ON avatar_training_data(avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_training_data_user_id ON avatar_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_training_data_status ON avatar_training_data(status);
CREATE INDEX IF NOT EXISTS idx_avatar_training_data_created_at ON avatar_training_data(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_avatar_training_files_training_data_id ON avatar_training_files(training_data_id);
CREATE INDEX IF NOT EXISTS idx_avatar_training_files_processing_status ON avatar_training_files(processing_status);

CREATE INDEX IF NOT EXISTS idx_avatar_prompt_versions_avatar_id ON avatar_prompt_versions(avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_prompt_versions_is_active ON avatar_prompt_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_avatar_prompt_versions_created_at ON avatar_prompt_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_avatar_training_logs_training_data_id ON avatar_training_logs(training_data_id);
CREATE INDEX IF NOT EXISTS idx_avatar_training_logs_created_at ON avatar_training_logs(created_at DESC);

-- =============================================
-- 6. ENABLE RLS (Row Level Security)
-- =============================================
ALTER TABLE avatar_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_training_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_training_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. CREATE RLS POLICIES
-- =============================================

-- Avatar Training Data Policies
DROP POLICY IF EXISTS "Users can view own training data" ON avatar_training_data;
CREATE POLICY "Users can view own training data"
ON avatar_training_data FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own training data" ON avatar_training_data;
CREATE POLICY "Users can insert own training data"
ON avatar_training_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own training data" ON avatar_training_data;
CREATE POLICY "Users can update own training data"
ON avatar_training_data FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own training data" ON avatar_training_data;
CREATE POLICY "Users can delete own training data"
ON avatar_training_data FOR DELETE
USING (auth.uid() = user_id);

-- Avatar Training Files Policies
DROP POLICY IF EXISTS "Users can view own training files" ON avatar_training_files;
CREATE POLICY "Users can view own training files"
ON avatar_training_files FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own training files" ON avatar_training_files;
CREATE POLICY "Users can insert own training files"
ON avatar_training_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own training files" ON avatar_training_files;
CREATE POLICY "Users can update own training files"
ON avatar_training_files FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own training files" ON avatar_training_files;
CREATE POLICY "Users can delete own training files"
ON avatar_training_files FOR DELETE
USING (auth.uid() = user_id);

-- Avatar Prompt Versions Policies
DROP POLICY IF EXISTS "Users can view own prompt versions" ON avatar_prompt_versions;
CREATE POLICY "Users can view own prompt versions"
ON avatar_prompt_versions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prompt versions" ON avatar_prompt_versions;
CREATE POLICY "Users can insert own prompt versions"
ON avatar_prompt_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prompt versions" ON avatar_prompt_versions;
CREATE POLICY "Users can update own prompt versions"
ON avatar_prompt_versions FOR UPDATE
USING (auth.uid() = user_id);

-- Avatar Training Logs Policies
DROP POLICY IF EXISTS "Users can view own training logs" ON avatar_training_logs;
CREATE POLICY "Users can view own training logs"
ON avatar_training_logs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own training logs" ON avatar_training_logs;
CREATE POLICY "Users can insert own training logs"
ON avatar_training_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 8. CREATE UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_avatar_training_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_avatar_training_data_updated_at ON avatar_training_data;
CREATE TRIGGER update_avatar_training_data_updated_at
    BEFORE UPDATE ON avatar_training_data
    FOR EACH ROW
    EXECUTE FUNCTION update_avatar_training_data_updated_at();

-- =============================================
-- 9. CREATE HELPER FUNCTIONS
-- =============================================

-- Function to get active prompt version for an avatar
CREATE OR REPLACE FUNCTION get_active_prompt_version(avatar_uuid UUID)
RETURNS TABLE (
  id UUID,
  system_prompt TEXT,
  personality_traits TEXT[],
  behavior_rules TEXT[],
  response_style JSONB,
  version_number TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    apv.id,
    apv.system_prompt,
    apv.personality_traits,
    apv.behavior_rules,
    apv.response_style,
    apv.version_number
  FROM avatar_prompt_versions apv
  WHERE apv.avatar_id = avatar_uuid
    AND apv.is_active = true
  ORDER BY apv.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to activate a prompt version
CREATE OR REPLACE FUNCTION activate_prompt_version(version_uuid UUID, avatar_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Deactivate all existing versions for this avatar
  UPDATE avatar_prompt_versions
  SET is_active = false, activated_at = NULL
  WHERE avatar_id = avatar_uuid;

  -- Activate the specified version
  UPDATE avatar_prompt_versions
  SET is_active = true, activated_at = NOW()
  WHERE id = version_uuid AND avatar_id = avatar_uuid;

  RETURN FOUND;
END;
$$;

-- =============================================
-- 10. VERIFY SETUP
-- =============================================
SELECT 'Training system tables created successfully' as status;

-- Show table counts
SELECT
  'avatar_training_data' as table_name,
  COUNT(*) as row_count
FROM avatar_training_data
UNION ALL
SELECT
  'avatar_training_files' as table_name,
  COUNT(*) as row_count
FROM avatar_training_files
UNION ALL
SELECT
  'avatar_prompt_versions' as table_name,
  COUNT(*) as row_count
FROM avatar_prompt_versions
UNION ALL
SELECT
  'avatar_training_logs' as table_name,
  COUNT(*) as row_count
FROM avatar_training_logs;