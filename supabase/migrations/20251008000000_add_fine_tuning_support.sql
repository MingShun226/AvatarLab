-- ============================================================================
-- FINE-TUNING SUPPORT FOR AVATARS
-- ============================================================================
-- This migration adds real ML fine-tuning capabilities to the chatbot system
-- Uses OpenAI's Fine-Tuning API to create custom models

-- ============================================================================
-- 1. ADD FINE-TUNING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add fine-tuning support to avatars table
ALTER TABLE avatars
ADD COLUMN IF NOT EXISTS active_fine_tuned_model VARCHAR,
ADD COLUMN IF NOT EXISTS base_model VARCHAR DEFAULT 'gpt-4o-mini-2024-07-18',
ADD COLUMN IF NOT EXISTS use_fine_tuned_model BOOLEAN DEFAULT false;

-- Add fine-tuning columns to avatar_training_data table
ALTER TABLE avatar_training_data
ADD COLUMN IF NOT EXISTS fine_tune_job_id VARCHAR,
ADD COLUMN IF NOT EXISTS fine_tuned_model_id VARCHAR,
ADD COLUMN IF NOT EXISTS fine_tune_status VARCHAR CHECK (fine_tune_status IN ('not_started', 'preparing', 'uploading', 'validating', 'queued', 'running', 'succeeded', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS fine_tune_error TEXT;

-- ============================================================================
-- 2. CREATE FINE-TUNING JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS avatar_fine_tune_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  training_data_id UUID REFERENCES avatar_training_data(id) ON DELETE SET NULL,

  -- OpenAI API details
  openai_job_id VARCHAR NOT NULL UNIQUE,
  openai_training_file_id VARCHAR,
  openai_validation_file_id VARCHAR,

  -- Model configuration
  base_model VARCHAR NOT NULL DEFAULT 'gpt-4o-mini-2024-07-18',
  fine_tuned_model VARCHAR,
  model_suffix VARCHAR,

  -- Training configuration
  hyperparameters JSONB DEFAULT '{"n_epochs": "auto", "learning_rate_multiplier": "auto", "batch_size": "auto"}'::jsonb,

  -- Training data stats
  training_examples_count INTEGER,
  validation_examples_count INTEGER,
  total_tokens_trained INTEGER,

  -- Status tracking
  status VARCHAR NOT NULL DEFAULT 'queued' CHECK (status IN ('validating_files', 'queued', 'running', 'succeeded', 'failed', 'cancelled')),
  error_message TEXT,

  -- OpenAI result files
  result_files JSONB,
  trained_tokens INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  estimated_finish_at TIMESTAMPTZ,

  -- Performance metrics
  final_loss DECIMAL(10, 6),
  final_accuracy DECIMAL(10, 6),

  -- Cost tracking
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2)
);

-- ============================================================================
-- 3. CREATE TRAINING EXAMPLES CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS avatar_training_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  training_data_id UUID REFERENCES avatar_training_data(id) ON DELETE CASCADE,

  -- Example content
  system_prompt TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,

  -- Metadata
  source_type VARCHAR CHECK (source_type IN ('uploaded_file', 'chat_history', 'manual_entry')),
  source_file_name VARCHAR,
  quality_score DECIMAL(3, 2) DEFAULT 1.0 CHECK (quality_score >= 0 AND quality_score <= 1),

  -- Categorization
  pattern_type VARCHAR,
  tags TEXT[],

  -- Usage tracking
  used_in_training BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE FINE-TUNE USAGE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS avatar_fine_tune_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  fine_tune_job_id UUID REFERENCES avatar_fine_tune_jobs(id) ON DELETE SET NULL,
  fine_tuned_model VARCHAR NOT NULL,

  -- Usage stats
  messages_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  -- Cost
  estimated_cost DECIMAL(10, 4) DEFAULT 0,

  -- Time period
  usage_date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, avatar_id, fine_tuned_model, usage_date)
);

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_user_avatar
  ON avatar_fine_tune_jobs(user_id, avatar_id);

CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_status
  ON avatar_fine_tune_jobs(status)
  WHERE status IN ('queued', 'running');

CREATE INDEX IF NOT EXISTS idx_fine_tune_jobs_openai_id
  ON avatar_fine_tune_jobs(openai_job_id);

CREATE INDEX IF NOT EXISTS idx_training_examples_avatar
  ON avatar_training_examples(avatar_id, user_id);

CREATE INDEX IF NOT EXISTS idx_training_examples_quality
  ON avatar_training_examples(quality_score DESC)
  WHERE quality_score >= 0.7;

CREATE INDEX IF NOT EXISTS idx_training_examples_pattern
  ON avatar_training_examples(pattern_type);

CREATE INDEX IF NOT EXISTS idx_fine_tune_usage_model
  ON avatar_fine_tune_usage(fine_tuned_model, usage_date);

CREATE INDEX IF NOT EXISTS idx_fine_tune_usage_user
  ON avatar_fine_tune_usage(user_id, usage_date);

CREATE INDEX IF NOT EXISTS idx_avatars_fine_tuned_model
  ON avatars(active_fine_tuned_model)
  WHERE active_fine_tuned_model IS NOT NULL;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Fine-tune jobs policies
ALTER TABLE avatar_fine_tune_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own fine-tune jobs" ON avatar_fine_tune_jobs;
CREATE POLICY "Users can view their own fine-tune jobs"
  ON avatar_fine_tune_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own fine-tune jobs" ON avatar_fine_tune_jobs;
CREATE POLICY "Users can create their own fine-tune jobs"
  ON avatar_fine_tune_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own fine-tune jobs" ON avatar_fine_tune_jobs;
CREATE POLICY "Users can update their own fine-tune jobs"
  ON avatar_fine_tune_jobs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fine-tune jobs" ON avatar_fine_tune_jobs;
CREATE POLICY "Users can delete their own fine-tune jobs"
  ON avatar_fine_tune_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Training examples policies
ALTER TABLE avatar_training_examples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own training examples" ON avatar_training_examples;
CREATE POLICY "Users can view their own training examples"
  ON avatar_training_examples FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own training examples" ON avatar_training_examples;
CREATE POLICY "Users can create their own training examples"
  ON avatar_training_examples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own training examples" ON avatar_training_examples;
CREATE POLICY "Users can update their own training examples"
  ON avatar_training_examples FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own training examples" ON avatar_training_examples;
CREATE POLICY "Users can delete their own training examples"
  ON avatar_training_examples FOR DELETE
  USING (auth.uid() = user_id);

-- Usage tracking policies
ALTER TABLE avatar_fine_tune_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage stats" ON avatar_fine_tune_usage;
CREATE POLICY "Users can view their own usage stats"
  ON avatar_fine_tune_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage stats" ON avatar_fine_tune_usage;
CREATE POLICY "Users can insert their own usage stats"
  ON avatar_fine_tune_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage stats" ON avatar_fine_tune_usage;
CREATE POLICY "Users can update their own usage stats"
  ON avatar_fine_tune_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Function to update training example timestamp
CREATE OR REPLACE FUNCTION update_training_example_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for training examples
DROP TRIGGER IF EXISTS update_training_example_timestamp ON avatar_training_examples;
CREATE TRIGGER update_training_example_timestamp
  BEFORE UPDATE ON avatar_training_examples
  FOR EACH ROW
  EXECUTE FUNCTION update_training_example_timestamp();

-- Function to aggregate usage stats
CREATE OR REPLACE FUNCTION update_fine_tune_usage(
  p_user_id UUID,
  p_avatar_id UUID,
  p_fine_tuned_model VARCHAR,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO avatar_fine_tune_usage (
    user_id,
    avatar_id,
    fine_tuned_model,
    messages_count,
    input_tokens,
    output_tokens,
    usage_date
  ) VALUES (
    p_user_id,
    p_avatar_id,
    p_fine_tuned_model,
    1,
    p_input_tokens,
    p_output_tokens,
    CURRENT_DATE
  )
  ON CONFLICT (user_id, avatar_id, fine_tuned_model, usage_date)
  DO UPDATE SET
    messages_count = avatar_fine_tune_usage.messages_count + 1,
    input_tokens = avatar_fine_tune_usage.input_tokens + p_input_tokens,
    output_tokens = avatar_fine_tune_usage.output_tokens + p_output_tokens,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE avatar_fine_tune_jobs IS 'Tracks OpenAI fine-tuning jobs for avatar models';
COMMENT ON TABLE avatar_training_examples IS 'Cached conversation examples used for fine-tuning';
COMMENT ON TABLE avatar_fine_tune_usage IS 'Daily usage tracking for fine-tuned models (cost analysis)';

COMMENT ON COLUMN avatar_fine_tune_jobs.hyperparameters IS 'Training hyperparameters (epochs, learning rate, batch size)';
COMMENT ON COLUMN avatar_fine_tune_jobs.result_files IS 'OpenAI result file IDs containing training metrics';
COMMENT ON COLUMN avatar_training_examples.quality_score IS 'AI-calculated quality score (0-1) based on example usefulness';
COMMENT ON COLUMN avatar_training_examples.pattern_type IS 'Conversation pattern category for balanced training';

COMMENT ON COLUMN avatars.active_fine_tuned_model IS 'OpenAI fine-tuned model ID currently in use (e.g., ft:gpt-4o-mini-xxxx)';
COMMENT ON COLUMN avatars.base_model IS 'Base model to use when fine-tuned model is not active';
COMMENT ON COLUMN avatars.use_fine_tuned_model IS 'Whether to use fine-tuned model or fall back to base model';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Fine-tuning migration completed successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - avatar_fine_tune_jobs';
  RAISE NOTICE '  - avatar_training_examples';
  RAISE NOTICE '  - avatar_fine_tune_usage';
  RAISE NOTICE 'Columns added to avatars table:';
  RAISE NOTICE '  - active_fine_tuned_model';
  RAISE NOTICE '  - base_model';
  RAISE NOTICE '  - use_fine_tuned_model';
  RAISE NOTICE 'Columns added to avatar_training_data table:';
  RAISE NOTICE '  - fine_tune_job_id';
  RAISE NOTICE '  - fine_tuned_model_id';
  RAISE NOTICE '  - fine_tune_status';
  RAISE NOTICE '  - fine_tune_error';
END $$;
