-- Quick Fix: Add missing increment_api_key_usage function
-- Run this in Supabase SQL Editor

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

-- Verify it was created
SELECT 'Function created successfully!' as status;
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'increment_api_key_usage';
