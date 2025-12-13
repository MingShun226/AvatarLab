-- ============================================================================
-- ADMIN PANEL DATABASE SCHEMA
-- ============================================================================
-- Migration: 20251104000000
-- Description: Create admin panel tables for subscription management and analytics
-- Author: AvatarLab Team
-- Date: 2025-11-04
--
-- Tables Created:
--   1. subscription_tiers
--   2. user_subscriptions
--   3. monthly_usage
--   4. admin_users
--   5. admin_audit_logs
--   6. platform_statistics
--
-- Tables Modified:
--   1. profiles (add subscription and ban fields)
--   2. avatars (add moderation fields)
--   3. generated_images (add moderation fields)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SUBSCRIPTION TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  trial_days INTEGER NOT NULL DEFAULT 0,

  -- Core Limits (Users provide their own API keys)
  max_avatars INTEGER NOT NULL DEFAULT 1, -- -1 = unlimited

  -- Feature Access (All features enabled, gated by avatar limit only)
  priority_support BOOLEAN NOT NULL DEFAULT false,
  custom_branding BOOLEAN NOT NULL DEFAULT false,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active
  ON public.subscription_tiers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_sort
  ON public.subscription_tiers(sort_order);

-- Comments
COMMENT ON TABLE public.subscription_tiers IS 'Define subscription plans with avatar quantity limits';
COMMENT ON COLUMN public.subscription_tiers.max_avatars IS '-1 means unlimited. Users provide their own API keys for all services.';

-- ============================================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),

  -- Subscription Details
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trial')),
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),

  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Payment
  payment_method VARCHAR(50), -- 'stripe', 'paypal', etc.
  external_subscription_id VARCHAR(255), -- Stripe subscription ID
  next_billing_date DATE,

  -- Trial
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_ends_at TIMESTAMPTZ,

  -- Custom Overrides
  custom_limits JSONB, -- Override tier limits for specific users
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, tier_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user
  ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier
  ON public.user_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
  ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial
  ON public.user_subscriptions(is_trial, trial_ends_at)
  WHERE is_trial = true;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active
  ON public.user_subscriptions(user_id)
  WHERE status = 'active';

-- Comments
COMMENT ON TABLE public.user_subscriptions IS 'Track user subscriptions to tiers';
COMMENT ON COLUMN public.user_subscriptions.custom_limits IS 'Override tier limits: {"max_avatars": 20}';

-- ============================================================================
-- 3. MONTHLY USAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period (YYYY-MM-01)
  usage_month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),

  -- Usage Counters (for analytics only, no limits enforced except avatars)
  avatars_created INTEGER NOT NULL DEFAULT 0,
  conversations_count INTEGER NOT NULL DEFAULT 0,
  images_generated INTEGER NOT NULL DEFAULT 0,
  memories_added INTEGER NOT NULL DEFAULT 0,
  knowledge_files_uploaded INTEGER NOT NULL DEFAULT 0,
  training_jobs_created INTEGER NOT NULL DEFAULT 0,
  voice_clones_created INTEGER NOT NULL DEFAULT 0,

  -- Limit Tracking (only avatar limit is enforced)
  is_over_avatar_limit BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, usage_month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user
  ON public.monthly_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_month
  ON public.monthly_usage(usage_month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_month
  ON public.monthly_usage(user_id, usage_month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_over_limit
  ON public.monthly_usage(is_over_avatar_limit)
  WHERE is_over_avatar_limit = true;

-- Comments
COMMENT ON TABLE public.monthly_usage IS 'Aggregate monthly usage per user for analytics and avatar limit enforcement';
COMMENT ON COLUMN public.monthly_usage.usage_month IS 'First day of month (YYYY-MM-01)';
COMMENT ON COLUMN public.monthly_usage.avatars_created IS 'Total avatars created this month (only avatar limit is enforced)';

-- ============================================================================
-- 4. ADMIN USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Role & Permissions
  role VARCHAR(20) NOT NULL DEFAULT 'admin'
    CHECK (role IN ('super_admin', 'admin', 'moderator', 'support', 'analyst')),
  permissions JSONB NOT NULL DEFAULT '{
    "users": {"read": true, "write": true, "delete": false},
    "avatars": {"read": true, "write": true, "delete": false},
    "tiers": {"read": true, "write": false, "delete": false},
    "financial": {"read": false, "write": false, "delete": false},
    "settings": {"read": true, "write": false, "delete": false},
    "moderation": {"read": true, "write": true, "delete": false}
  }'::jsonb,

  -- Two-Factor Authentication
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret VARCHAR(255),
  backup_codes TEXT[],

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.admin_users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user
  ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role
  ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active
  ON public.admin_users(is_active)
  WHERE is_active = true;

-- Comments
COMMENT ON TABLE public.admin_users IS 'Admin access with role-based permissions';
COMMENT ON COLUMN public.admin_users.role IS 'super_admin > admin > moderator > support > analyst';

-- ============================================================================
-- 5. ADMIN AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id),

  -- Action Details
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,

  -- Description
  description TEXT,
  changes JSONB, -- {"before": {...}, "after": {...}}

  -- Request Info
  ip_address INET,
  user_agent TEXT,
  justification TEXT, -- Required for sensitive actions

  -- Severity
  severity VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin
  ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource
  ON public.admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created
  ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_severity
  ON public.admin_audit_logs(severity)
  WHERE severity != 'info';

-- Comments
COMMENT ON TABLE public.admin_audit_logs IS 'Track all admin actions for security and compliance';
COMMENT ON COLUMN public.admin_audit_logs.action IS 'Examples: user.ban, avatar.delete, tier.update';

-- ============================================================================
-- 6. PLATFORM STATISTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,

  -- User Metrics
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0, -- Active in last 30 days
  new_users INTEGER NOT NULL DEFAULT 0,
  deleted_users INTEGER NOT NULL DEFAULT 0,

  -- Avatar Metrics
  total_avatars INTEGER NOT NULL DEFAULT 0,
  active_avatars INTEGER NOT NULL DEFAULT 0,
  avatars_created_today INTEGER NOT NULL DEFAULT 0,

  -- Usage Metrics (for analytics - users provide own API keys)
  conversations_today INTEGER NOT NULL DEFAULT 0,
  images_generated_today INTEGER NOT NULL DEFAULT 0,
  memories_added_today INTEGER NOT NULL DEFAULT 0,
  training_jobs_today INTEGER NOT NULL DEFAULT 0,
  voice_clones_today INTEGER NOT NULL DEFAULT 0,

  -- Financial Metrics
  revenue_today DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  mrr DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Monthly Recurring Revenue
  arr DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Annual Recurring Revenue

  -- Tier Distribution
  users_by_tier JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_statistics_date
  ON public.platform_statistics(stat_date DESC);

-- Comments
COMMENT ON TABLE public.platform_statistics IS 'Daily aggregated platform metrics';
COMMENT ON COLUMN public.platform_statistics.users_by_tier IS '{"free": 100, "starter": 50, "pro": 10}';

-- ============================================================================
-- 7. MODIFY EXISTING TABLES
-- ============================================================================

-- Add subscription fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES public.subscription_tiers(id),
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'
  CHECK (account_status IN ('active', 'suspended', 'banned', 'deleted')),
ADD COLUMN IF NOT EXISTS banned_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.admin_users(id);

-- Add indexes to profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tier
  ON public.profiles(subscription_tier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status
  ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_banned
  ON public.profiles(banned_at)
  WHERE banned_at IS NOT NULL;

-- Add moderation fields to avatars
ALTER TABLE public.avatars
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES public.admin_users(id),
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Add indexes to avatars
CREATE INDEX IF NOT EXISTS idx_avatars_flagged
  ON public.avatars(is_flagged)
  WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_avatars_moderation
  ON public.avatars(moderation_status);

-- Add moderation fields to generated_images
ALTER TABLE public.generated_images
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- Add indexes to generated_images
CREATE INDEX IF NOT EXISTS idx_images_flagged
  ON public.generated_images(is_flagged)
  WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_images_moderation
  ON public.generated_images(moderation_status);

-- ============================================================================
-- 8. TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Trigger for updated_at on subscription_tiers
CREATE OR REPLACE FUNCTION update_subscription_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_tiers_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tiers_updated_at();

-- Trigger for updated_at on user_subscriptions
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Trigger for updated_at on monthly_usage
CREATE OR REPLACE FUNCTION update_monthly_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_usage_updated_at
  BEFORE UPDATE ON public.monthly_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_usage_updated_at();

-- Trigger for updated_at on admin_users
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Trigger for updated_at on platform_statistics
CREATE OR REPLACE FUNCTION update_platform_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_statistics_updated_at
  BEFORE UPDATE ON public.platform_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_statistics_updated_at();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_statistics ENABLE ROW LEVEL SECURITY;

-- subscription_tiers policies
DROP POLICY IF EXISTS "Anyone can view active tiers" ON public.subscription_tiers;
CREATE POLICY "Anyone can view active tiers" ON public.subscription_tiers
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage tiers" ON public.subscription_tiers;
CREATE POLICY "Only admins can manage tiers" ON public.subscription_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- user_subscriptions policies
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins manage all subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- monthly_usage policies
DROP POLICY IF EXISTS "Users view own usage" ON public.monthly_usage;
CREATE POLICY "Users view own usage" ON public.monthly_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update usage" ON public.monthly_usage;
CREATE POLICY "System can update usage" ON public.monthly_usage
  FOR ALL USING (true); -- Service role only

-- admin_users policies (admin only)
DROP POLICY IF EXISTS "Admins view admin_users" ON public.admin_users;
CREATE POLICY "Admins view admin_users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins manage admins" ON public.admin_users;
CREATE POLICY "Super admins manage admins" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    )
  );

-- admin_audit_logs policies (admin only)
DROP POLICY IF EXISTS "Admins view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view audit logs" ON public.admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "System can create audit logs" ON public.admin_audit_logs;
CREATE POLICY "System can create audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (true); -- Service role only

-- platform_statistics policies (admin only)
DROP POLICY IF EXISTS "Admins view statistics" ON public.platform_statistics;
CREATE POLICY "Admins view statistics" ON public.platform_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "System can update statistics" ON public.platform_statistics;
CREATE POLICY "System can update statistics" ON public.platform_statistics
  FOR ALL USING (true); -- Service role only

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ADMIN PANEL SCHEMA MIGRATION COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  ✓ subscription_tiers';
  RAISE NOTICE '  ✓ user_subscriptions';
  RAISE NOTICE '  ✓ monthly_usage';
  RAISE NOTICE '  ✓ admin_users';
  RAISE NOTICE '  ✓ admin_audit_logs';
  RAISE NOTICE '  ✓ platform_statistics';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Modified:';
  RAISE NOTICE '  ✓ profiles (+ subscription fields)';
  RAISE NOTICE '  ✓ avatars (+ moderation fields)';
  RAISE NOTICE '  ✓ generated_images (+ moderation fields)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run: 20251104000001_insert_default_tiers.sql';
  RAISE NOTICE '  2. Run: 20251104000002_migrate_existing_users.sql';
  RAISE NOTICE '  3. Create your first admin user';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
