-- Create API Keys Management Table
-- Run this script in your Supabase SQL Editor

-- =============================================
-- CREATE user_api_keys TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  service TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_service ON user_api_keys(service);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_status ON user_api_keys(status);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can insert own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON user_api_keys;

-- API keys policies
CREATE POLICY "Users can view own api keys"
ON user_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
ON user_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
ON user_api_keys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
ON user_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- CREATE UPDATE TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_user_api_keys_updated_at();

-- =============================================
-- VERIFY TABLE STRUCTURE
-- =============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_api_keys'
ORDER BY ordinal_position;