-- Fix RLS policies for user_api_keys table
-- Run this in your Supabase SQL Editor

-- First, check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_api_keys') THEN
        RAISE NOTICE 'Table user_api_keys does not exist. Creating it now...';

        -- Create the table
        CREATE TABLE user_api_keys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            service TEXT NOT NULL,
            api_key_encrypted TEXT NOT NULL,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            last_used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
        CREATE INDEX idx_user_api_keys_service ON user_api_keys(user_id, service);
        CREATE INDEX idx_user_api_keys_status ON user_api_keys(status);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON user_api_keys;

-- Recreate RLS Policies with proper permissions
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

-- Verify the policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_api_keys'
ORDER BY policyname;

-- Test query (should return your API keys if you have any)
-- SELECT id, name, service, status, created_at FROM user_api_keys WHERE user_id = auth.uid();
