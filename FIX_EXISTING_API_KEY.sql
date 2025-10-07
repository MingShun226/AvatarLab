-- Fix existing API key with wrong service name
-- This updates "OpenAI" to "openai" (lowercase)

-- Check current API keys
SELECT id, name, service, status FROM user_api_keys WHERE user_id = auth.uid();

-- Update the service name from "OpenAI" to "openai"
UPDATE user_api_keys
SET service = 'openai'
WHERE service = 'OpenAI' AND user_id = auth.uid();

-- Verify it's fixed
SELECT id, name, service, status FROM user_api_keys WHERE user_id = auth.uid();

-- You should now see:
-- service = 'openai' (lowercase)
