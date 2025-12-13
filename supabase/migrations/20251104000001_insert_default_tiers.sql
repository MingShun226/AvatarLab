-- ============================================================================
-- INSERT DEFAULT SUBSCRIPTION TIERS
-- ============================================================================
-- Migration: 20251104000001
-- Description: Insert default subscription tiers (Free, Starter, Pro, Enterprise)
-- Depends on: 20251104000000_create_admin_panel_schema.sql
-- ============================================================================
-- NOTE: Users provide their own API keys for all services (OpenAI, ElevenLabs, etc.)
--       Tiers only limit the NUMBER OF AVATARS users can create
-- ============================================================================

-- Insert default tiers
INSERT INTO public.subscription_tiers (
  name,
  display_name,
  description,
  price_monthly,
  price_yearly,
  trial_days,
  max_avatars,
  priority_support,
  custom_branding,
  is_active,
  is_featured,
  sort_order
) VALUES

-- ============================================================================
-- FREE TIER - 1 Avatar
-- ============================================================================
(
  'free',
  'Free',
  'Perfect for trying out AvatarLab with 1 avatar',
  0.00,
  0.00,
  0,
  1,       -- 1 avatar limit
  false,   -- No priority support
  false,   -- No custom branding
  true,
  false,
  0
),

-- ============================================================================
-- STARTER TIER - 2 Avatars ($9.99/month)
-- ============================================================================
(
  'starter',
  'Starter',
  'Great for personal use with 2 avatars',
  9.99,
  99.99,   -- $99.99/year (2 months free)
  7,       -- 7-day free trial
  2,       -- 2 avatars limit
  false,   -- No priority support
  false,   -- No custom branding
  true,
  true,    -- Featured
  1
),

-- ============================================================================
-- PRO TIER - 3 Avatars ($29.99/month)
-- ============================================================================
(
  'pro',
  'Pro',
  'For power users with 3 avatars',
  29.99,
  299.99,  -- $299.99/year (2 months free)
  14,      -- 14-day free trial
  3,       -- 3 avatars limit
  true,    -- Priority support
  false,   -- No custom branding
  true,
  true,    -- Featured
  2
),

-- ============================================================================
-- ENTERPRISE TIER - Unlimited Avatars (Custom Pricing)
-- ============================================================================
(
  'enterprise',
  'Enterprise',
  'Custom solution for organizations with unlimited avatars',
  299.00,
  2999.00,
  30,      -- 30-day free trial
  -1,      -- Unlimited avatars (-1 = unlimited)
  true,    -- Priority support
  true,    -- Custom branding
  true,
  true,    -- Featured
  3
)

ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  trial_days = EXCLUDED.trial_days,
  max_avatars = EXCLUDED.max_avatars,
  priority_support = EXCLUDED.priority_support,
  custom_branding = EXCLUDED.custom_branding,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Verification
DO $$
DECLARE
  tier_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tier_count FROM public.subscription_tiers;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DEFAULT TIERS INSERTED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tiers Created: %', tier_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Tier Summary (Avatar Limits Only):';
  RAISE NOTICE '  • Free:       $0/month    - 1 avatar';
  RAISE NOTICE '  • Starter:    $9.99/month - 2 avatars';
  RAISE NOTICE '  • Pro:        $29.99/month - 3 avatars';
  RAISE NOTICE '  • Enterprise: $299/month  - Unlimited avatars';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: All users provide their own API keys for services';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Step: Run 20251104000002_migrate_existing_users.sql';
  RAISE NOTICE '============================================';
END $$;
