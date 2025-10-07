-- Migration: Create user_api_keys table and add provider support to generated_images
-- Purpose: Allow users to add their own API keys for external services (OpenAI, Stability, etc.)
--          and track which AI provider was used for image generation

-- ===================================================================
-- PART 1: Create user_api_keys table for external service API keys
-- ===================================================================

CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Key Information
    name TEXT NOT NULL,
    service TEXT NOT NULL, -- 'openai', 'stability', 'kie-ai', 'elevenlabs', etc.
    api_key_encrypted TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

    -- Usage Tracking
    last_used_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_service ON user_api_keys(user_id, service);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_status ON user_api_keys(status);

-- Enable Row Level Security
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own API keys
CREATE POLICY "Users can view own API keys"
    ON user_api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
    ON user_api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
    ON user_api_keys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
    ON user_api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE user_api_keys IS 'External service API keys (OpenAI, Stability AI, etc.) added by users in Settings > API Management';
COMMENT ON COLUMN user_api_keys.service IS 'Service identifier: openai, stability, kie-ai, elevenlabs, etc.';
COMMENT ON COLUMN user_api_keys.api_key_encrypted IS 'Base64 encoded API key (replace with proper encryption in production)';

-- ===================================================================
-- PART 2: Add provider support to generated_images table
-- ===================================================================

-- Add provider tracking columns
ALTER TABLE generated_images
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'kie-ai',
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

-- Create index for provider queries
CREATE INDEX IF NOT EXISTS idx_generated_images_provider ON generated_images(provider);

-- Add helpful comments
COMMENT ON COLUMN generated_images.provider IS 'AI provider used: openai, stability, kie-ai';
COMMENT ON COLUMN generated_images.model IS 'Specific model used: dall-e-3, stable-diffusion-core, flux-kontext-pro, etc.';
COMMENT ON COLUMN generated_images.parameters IS 'Generation parameters used (negative_prompt, size, quality, etc.)';

-- ===================================================================
-- Verification Queries (Run after migration to verify)
-- ===================================================================

-- Check user_api_keys table exists and has correct structure
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'user_api_keys' ORDER BY ordinal_position;

-- Check generated_images has new columns
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'generated_images' AND column_name IN ('provider', 'model', 'parameters');

-- Check RLS policies
-- SELECT tablename, policyname FROM pg_policies WHERE tablename = 'user_api_keys';
