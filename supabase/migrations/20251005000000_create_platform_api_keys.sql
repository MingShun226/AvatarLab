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
CREATE INDEX idx_platform_api_keys_user_id ON platform_api_keys(user_id);
CREATE INDEX idx_platform_api_keys_hash ON platform_api_keys(api_key_hash);
CREATE INDEX idx_platform_api_keys_status ON platform_api_keys(status);

-- RLS Policies
ALTER TABLE platform_api_keys ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_created_at ON api_request_logs(created_at);

-- RLS for logs
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

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
