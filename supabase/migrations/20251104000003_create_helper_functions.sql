-- ============================================================================
-- CREATE HELPER FUNCTIONS FOR ADMIN PANEL
-- ============================================================================
-- Migration: 20251104000003
-- Description: Utility functions for avatar limits, usage tracking, and analytics
-- Depends on: 20251104000002_migrate_existing_users.sql
-- ============================================================================
-- NOTE: Only avatar quantity is limited. Users provide their own API keys.
-- ============================================================================

-- ============================================================================
-- TIER LIMIT CHECKING FUNCTIONS
-- ============================================================================

-- Check if user can create avatar
CREATE OR REPLACE FUNCTION public.check_avatar_limit(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  max_allowed INTEGER,
  tier_name TEXT
) AS $$
DECLARE
  v_tier_id UUID;
  v_max_avatars INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get user's active tier
  SELECT us.tier_id INTO v_tier_id
  FROM public.user_subscriptions us
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;

  IF v_tier_id IS NULL THEN
    -- No subscription, use free tier
    SELECT id, max_avatars INTO v_tier_id, v_max_avatars
    FROM public.subscription_tiers
    WHERE name = 'free';
  ELSE
    -- Get tier limits
    SELECT max_avatars INTO v_max_avatars
    FROM public.subscription_tiers
    WHERE id = v_tier_id;
  END IF;

  -- Count user's active avatars
  SELECT COUNT(*) INTO v_current_count
  FROM public.avatars
  WHERE user_id = p_user_id
    AND status = 'active';

  -- Return result
  RETURN QUERY
  SELECT
    (v_max_avatars = -1 OR v_current_count < v_max_avatars) as allowed,
    v_current_count::INTEGER as current_count,
    v_max_avatars as max_allowed,
    st.display_name as tier_name
  FROM public.subscription_tiers st
  WHERE st.id = v_tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_avatar_limit IS 'Check if user can create another avatar based on their tier limit';

-- ============================================================================
-- USAGE INCREMENT FUNCTIONS
-- ============================================================================

-- Increment usage counter
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_user_id UUID,
  p_counter_type VARCHAR,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_current_month DATE;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Ensure record exists
  INSERT INTO public.monthly_usage (user_id, usage_month)
  VALUES (p_user_id, v_current_month)
  ON CONFLICT (user_id, usage_month) DO NOTHING;

  -- Update specific counter
  CASE p_counter_type
    WHEN 'conversations' THEN
      UPDATE public.monthly_usage
      SET conversations_count = conversations_count + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'avatars' THEN
      UPDATE public.monthly_usage
      SET avatars_created = avatars_created + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'images' THEN
      UPDATE public.monthly_usage
      SET images_generated = images_generated + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'memories' THEN
      UPDATE public.monthly_usage
      SET memories_added = memories_added + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'knowledge_files' THEN
      UPDATE public.monthly_usage
      SET knowledge_files_uploaded = knowledge_files_uploaded + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'training_jobs' THEN
      UPDATE public.monthly_usage
      SET training_jobs_created = training_jobs_created + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'voice_clones' THEN
      UPDATE public.monthly_usage
      SET voice_clones_created = voice_clones_created + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'tts' THEN
      UPDATE public.monthly_usage
      SET tts_generations = tts_generations + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    ELSE
      RAISE EXCEPTION 'Unknown counter type: %', p_counter_type;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_usage_counter IS 'Increment a specific usage counter for analytics tracking';

-- ============================================================================
-- ADMIN ANALYTICS FUNCTIONS
-- ============================================================================

-- Get platform overview statistics
CREATE OR REPLACE FUNCTION public.get_platform_overview()
RETURNS TABLE (
  total_users BIGINT,
  active_users_7d BIGINT,
  active_users_30d BIGINT,
  total_avatars BIGINT,
  total_conversations BIGINT,
  mrr DECIMAL,
  churn_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id)::BIGINT as total_users,
    COUNT(DISTINCT CASE
      WHEN p.last_login > NOW() - INTERVAL '7 days' THEN p.id
    END)::BIGINT as active_users_7d,
    COUNT(DISTINCT CASE
      WHEN p.last_login > NOW() - INTERVAL '30 days' THEN p.id
    END)::BIGINT as active_users_30d,
    COUNT(DISTINCT a.id)::BIGINT as total_avatars,
    (SELECT COUNT(*) FROM public.conversations)::BIGINT as total_conversations,
    COALESCE(SUM(st.price_monthly), 0) as mrr,
    0.0 as churn_rate -- Calculate based on cancellations
  FROM public.profiles p
  LEFT JOIN public.avatars a ON a.user_id = p.id AND a.status = 'active'
  LEFT JOIN public.user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN public.subscription_tiers st ON st.id = us.tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_platform_overview IS 'Get high-level platform statistics for admin dashboard';

-- Get user details for admin
CREATE OR REPLACE FUNCTION public.get_user_admin_details(p_user_id UUID)
RETURNS TABLE (
  user_email TEXT,
  user_name TEXT,
  account_status TEXT,
  tier_name TEXT,
  subscription_status TEXT,
  avatars_count BIGINT,
  conversations_count BIGINT,
  api_keys_count BIGINT,
  total_spent DECIMAL,
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.email,
    p.name,
    p.account_status,
    st.display_name,
    us.status,
    COUNT(DISTINCT a.id)::BIGINT,
    (SELECT COUNT(*) FROM public.conversations c
     JOIN public.avatars av ON av.id = c.avatar_id
     WHERE av.user_id = p.id)::BIGINT,
    COUNT(DISTINCT pk.id)::BIGINT,
    COALESCE(SUM(pur.price_paid), 0),
    p.created_at,
    p.last_login
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN public.subscription_tiers st ON st.id = us.tier_id
  LEFT JOIN public.avatars a ON a.user_id = p.id
  LEFT JOIN public.platform_api_keys pk ON pk.user_id = p.id
  LEFT JOIN public.purchases pur ON pur.user_id = p.id
  WHERE p.id = p_user_id
  GROUP BY p.email, p.name, p.account_status, st.display_name,
           us.status, p.created_at, p.last_login;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_admin_details IS 'Get comprehensive user details for admin panel';

-- ============================================================================
-- ADMIN LOGGING FUNCTION
-- ============================================================================

-- Log admin action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_description TEXT,
  p_changes JSONB DEFAULT NULL,
  p_severity VARCHAR DEFAULT 'info',
  p_justification TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    description,
    changes,
    severity,
    justification
  ) VALUES (
    p_admin_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_description,
    p_changes,
    p_severity,
    p_justification
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_admin_action IS 'Log an admin action to audit logs';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'HELPER FUNCTIONS CREATED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Avatar Limit Function:';
  RAISE NOTICE '  ✓ check_avatar_limit(user_id) - Only limit enforced';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage Tracking Functions (Analytics Only):';
  RAISE NOTICE '  ✓ increment_usage_counter(user_id, type, count)';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin Functions:';
  RAISE NOTICE '  ✓ get_platform_overview()';
  RAISE NOTICE '  ✓ get_user_admin_details(user_id)';
  RAISE NOTICE '  ✓ log_admin_action(...)';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage Example:';
  RAISE NOTICE '  SELECT * FROM check_avatar_limit(''user-id-here'');';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
