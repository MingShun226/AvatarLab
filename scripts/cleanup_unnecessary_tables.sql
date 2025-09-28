-- Clean up unnecessary expensive fine-tuning tables
-- Keep only the smart pattern learning tables

-- Drop expensive OpenAI fine-tuning table (if it exists)
DROP TABLE IF EXISTS fine_tuning_jobs CASCADE;

-- Drop LoRA adapters table (too complex for now)
DROP TABLE IF EXISTS lora_adapters CASCADE;

-- Drop local fine-tuning jobs table (too complex for now)
DROP TABLE IF EXISTS local_finetuning_jobs CASCADE;

-- Create only the smart pattern learning tables (simple and effective)
CREATE TABLE IF NOT EXISTS conversation_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_words TEXT[] NOT NULL DEFAULT '{}',
    response_pattern TEXT NOT NULL,
    examples TEXT[] NOT NULL DEFAULT '{}',
    usage_count INTEGER DEFAULT 1,
    success_rate DECIMAL(3,2) DEFAULT 0.80,
    pattern_type TEXT DEFAULT 'general' CHECK (pattern_type IN ('greeting', 'question', 'casual', 'formal', 'general')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    avatar_response TEXT NOT NULL,
    feedback TEXT CHECK (feedback IN ('good', 'bad', 'neutral')),
    session_id TEXT, -- To group conversations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage their own conversation patterns" ON conversation_patterns;
DROP POLICY IF EXISTS "Users can manage their own conversation feedback" ON conversation_feedback;

CREATE POLICY "Users can manage their own conversation patterns"
    ON conversation_patterns FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own conversation feedback"
    ON conversation_feedback FOR ALL USING (user_id = auth.uid());

-- Indexes for performance (create only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_patterns_avatar_user ON conversation_patterns(avatar_id, user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_trigger_words ON conversation_patterns USING GIN(trigger_words);
CREATE INDEX IF NOT EXISTS idx_patterns_success_rate ON conversation_patterns(success_rate DESC, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON conversation_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_feedback_avatar_user ON conversation_feedback(avatar_id, user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON conversation_feedback(created_at DESC);

-- Function to update pattern timestamps
CREATE OR REPLACE FUNCTION update_pattern_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS update_conversation_patterns_timestamp ON conversation_patterns;

CREATE TRIGGER update_conversation_patterns_timestamp
    BEFORE UPDATE ON conversation_patterns
    FOR EACH ROW EXECUTE FUNCTION update_pattern_timestamp();

-- Comments
COMMENT ON TABLE conversation_patterns IS 'Smart pattern learning from user conversations (free and effective)';
COMMENT ON TABLE conversation_feedback IS 'User feedback for improving conversation patterns';

-- Sample patterns will be created automatically when users start chatting
-- No need to insert sample data here since auth.uid() is null during script execution