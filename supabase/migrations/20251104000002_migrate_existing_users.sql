-- ============================================================================
-- MIGRATE EXISTING USERS TO FREE TIER
-- ============================================================================
-- Migration: 20251104000002
-- Description: Assign all existing users to free tier and create initial usage records
-- Depends on: 20251104000001_insert_default_tiers.sql
-- ============================================================================

-- Get the free tier ID
DO $$
DECLARE
  free_tier_id UUID;
  user_count INTEGER;
BEGIN
  -- Get free tier ID
  SELECT id INTO free_tier_id
  FROM public.subscription_tiers
  WHERE name = 'free';

  IF free_tier_id IS NULL THEN
    RAISE EXCEPTION 'Free tier not found. Please run 20251104000001_insert_default_tiers.sql first.';
  END IF;

  -- Update all existing profiles with free tier
  UPDATE public.profiles
  SET
    subscription_tier_id = free_tier_id,
    account_status = COALESCE(account_status, 'active')
  WHERE subscription_tier_id IS NULL;

  GET DIAGNOSTICS user_count = ROW_COUNT;

  -- Create user subscriptions for all users without one
  INSERT INTO public.user_subscriptions (
    user_id,
    tier_id,
    status,
    billing_cycle,
    started_at,
    is_trial
  )
  SELECT
    p.id,
    free_tier_id,
    'active',
    'lifetime', -- Free tier is lifetime
    p.created_at,
    false
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    WHERE us.user_id = p.id
  );

  -- Create initial monthly usage records for all users
  INSERT INTO public.monthly_usage (
    user_id,
    usage_month,
    avatars_created,
    conversations_count
  )
  SELECT
    p.id,
    DATE_TRUNC('month', CURRENT_DATE),
    COALESCE(
      (SELECT COUNT(*)
       FROM public.avatars a
       WHERE a.user_id = p.id
         AND a.status = 'active'
      ), 0
    ),
    0 -- Will be updated by triggers going forward
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.monthly_usage mu
    WHERE mu.user_id = p.id
      AND mu.usage_month = DATE_TRUNC('month', CURRENT_DATE)
  );

  -- Output summary
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'USER MIGRATION COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Users Migrated: %', user_count;
  RAISE NOTICE 'Free Tier ID: %', free_tier_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Actions Completed:';
  RAISE NOTICE '  ✓ All users assigned to Free tier';
  RAISE NOTICE '  ✓ User subscriptions created';
  RAISE NOTICE '  ✓ Monthly usage records initialized';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create your first admin user';
  RAISE NOTICE '  2. Test subscription limits';
  RAISE NOTICE '  3. Build admin panel UI';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
