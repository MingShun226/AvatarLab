-- ============================================================================
-- AVATARLAB PLATFORM API - COMPLETE DATABASE SETUP
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Login to your Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this ENTIRE file
-- 4. Click "Run" to execute all migrations at once
--
-- This will create:
-- - platform_api_keys table (for n8n API keys)
-- - api_request_logs table (for monitoring)
-- - n8n_integrations table (for webhook settings)
-- - Helper functions for API key verification and RAG search
-- - Row Level Security (RLS) policies
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Platform API Keys Infrastructure
-- ============================================================================

-- Create platform API keys table for external integrations (n8n, etc.)
CREATE TABLE IF NOT EXISTS platform_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- API Key Info
    key_name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE, -- Store hashed version
    api_key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "pk_live_")

    -- Permissions & Scope
    scopes TEXT[] DEFAULT ARRAY['chat', 'config', 'knowledge']::TEXT[],
    avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE, -- Optional: restrict to specific avatar

    -- Usage Tracking
    last_used_at TIMESTAMPTZ,
    request_count INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional expiration

    -- Notes
    description TEXT
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_api_keys_user_id ON platform_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_api_keys_hash ON platform_api_keys(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_platform_api_keys_status ON platform_api_keys(status);

-- RLS Policies
ALTER TABLE platform_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own API keys" ON platform_api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON platform_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON platform_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON platform_api_keys;

-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
    ON platform_api_keys FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys"
    ON platform_api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys"
    ON platform_api_keys FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
    ON platform_api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS platform_api_keys_updated_at ON platform_api_keys;

-- Create trigger for updated_at
CREATE TRIGGER platform_api_keys_updated_at
    BEFORE UPDATE ON platform_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_api_keys_updated_at();

-- Create API request logs table for monitoring
CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES platform_api_keys(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Request Info
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,

    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    request_duration_ms INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for logs
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);

-- RLS for logs
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own API logs" ON api_request_logs;

CREATE POLICY "Users can view own API logs"
    ON api_request_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Create n8n integration settings table (optional for storing n8n webhook URLs, etc.)
CREATE TABLE IF NOT EXISTS n8n_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_id UUID REFERENCES avatars(id) ON DELETE CASCADE,

    -- n8n Configuration
    webhook_url TEXT,
    n8n_api_key TEXT, -- Encrypted n8n API key if needed

    -- Settings
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for n8n integrations
ALTER TABLE n8n_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own n8n integrations" ON n8n_integrations;

CREATE POLICY "Users can manage own n8n integrations"
    ON n8n_integrations FOR ALL
    USING (auth.uid() = user_id);

-- Create helper function to verify API key (used by Edge Functions)
CREATE OR REPLACE FUNCTION verify_platform_api_key(p_api_key TEXT)
RETURNS TABLE (
    key_id UUID,
    user_id UUID,
    avatar_id UUID,
    scopes TEXT[],
    is_valid BOOLEAN
) AS $$
DECLARE
    v_key_hash TEXT;
BEGIN
    -- Hash the provided API key (you'll use the same hash in Edge Function)
    v_key_hash := encode(digest(p_api_key, 'sha256'), 'hex');

    RETURN QUERY
    SELECT
        pk.id,
        pk.user_id,
        pk.avatar_id,
        pk.scopes,
        (pk.status = 'active' AND (pk.expires_at IS NULL OR pk.expires_at > NOW())) as is_valid
    FROM platform_api_keys pk
    WHERE pk.api_key_hash = v_key_hash
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE platform_api_keys IS 'Platform API keys for external integrations like n8n';
COMMENT ON TABLE api_request_logs IS 'Logs all API requests made with platform API keys';
COMMENT ON TABLE n8n_integrations IS 'n8n webhook and integration settings per avatar';

-- Create helper function to increment API key usage counter
CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE platform_api_keys
    SET
        request_count = request_count + 1,
        last_used_at = NOW()
    WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_api_key_usage IS 'Increments request count and updates last_used_at for API key';

-- ============================================================================
-- MIGRATION 2: RAG Search Helper Function
-- ============================================================================

-- Create a function to search knowledge chunks with embedding similarity
-- This will be used by the Edge Functions for RAG

CREATE OR REPLACE FUNCTION search_knowledge_chunks(
    p_user_id UUID,
    p_avatar_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 5,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    chunk_text TEXT,
    chunk_index INTEGER,
    page_number INTEGER,
    section_title TEXT,
    similarity FLOAT,
    file_name TEXT
) AS $$
BEGIN
    -- Note: This is a placeholder that returns empty results
    -- In production, you would:
    -- 1. Generate embedding for p_query using OpenAI API
    -- 2. Use pgvector extension to calculate cosine similarity
    -- 3. Return top chunks sorted by similarity

    -- For now, return empty set (the Edge Function will handle RAG internally)
    RETURN QUERY
    SELECT
        dc.id,
        dc.chunk_text,
        dc.chunk_index,
        dc.page_number,
        dc.section_title,
        0.0::FLOAT as similarity,
        kf.file_name
    FROM document_chunks dc
    JOIN avatar_knowledge_files kf ON kf.id = dc.knowledge_file_id
    WHERE dc.user_id = p_user_id
        AND dc.avatar_id = p_avatar_id
        AND kf.is_linked = true
        AND kf.processing_status = 'processed'
    LIMIT 0; -- Return no rows for now
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_knowledge_chunks IS 'Searches for relevant knowledge chunks using semantic similarity (placeholder for now)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify everything was created successfully:

-- Check tables exist
SELECT 'Tables created:' as status;
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('platform_api_keys', 'api_request_logs', 'n8n_integrations')
ORDER BY table_name;

-- Check functions exist
SELECT 'Functions created:' as status;
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('verify_platform_api_key', 'search_knowledge_chunks')
ORDER BY routine_name;

-- Check RLS is enabled
SELECT 'RLS enabled on:' as status;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('platform_api_keys', 'api_request_logs', 'n8n_integrations')
ORDER BY tablename;

-- Check policies exist
SELECT 'Policies created:' as status;
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('platform_api_keys', 'api_request_logs', 'n8n_integrations')
ORDER BY tablename, policyname;

-- ============================================================================
-- SETUP COMPLETE! ✅
-- ============================================================================
--
-- Next steps:
-- 1. Deploy Supabase Edge Functions (see DEPLOYMENT_CHECKLIST.md)
-- 2. Navigate to /api-keys page in your AvatarLab app
-- 3. Create your first API key
-- 4. Test with curl or n8n
--
-- For full instructions, see:
-- - DEPLOYMENT_CHECKLIST.md
-- - docs/API_INTEGRATION_GUIDE.md
-- ============================================================================
