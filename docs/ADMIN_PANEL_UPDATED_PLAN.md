# Admin Panel Implementation Plan (Updated for Current Schema)

## 📋 Based on Your Existing Database Schema

After reviewing your complete database structure, here's the updated admin panel implementation plan that integrates with your existing tables.

---

## Current Database Assessment

### ✅ What You Already Have

**User Management:**
- ✅ `profiles` table with status field
- ✅ `user_sessions` for session tracking
- ✅ `user_activities` for activity logging
- ✅ `system_logs` for system-level logs
- ✅ `user_preferences` for user settings

**Avatar System:**
- ✅ `avatars` table with marketplace support
- ✅ `avatar_versions` for versioning
- ✅ `avatar_reviews` for ratings
- ✅ `avatar_memories` for memory system
- ✅ `avatar_knowledge_files` for RAG
- ✅ `avatar_fine_tune_jobs` for fine-tuning

**API & Usage:**
- ✅ `platform_api_keys` for API key management
- ✅ `api_request_logs` for API usage tracking
- ✅ `avatar_fine_tune_usage` for fine-tuning costs
- ✅ `n8n_integrations` for workflow integration

**Content:**
- ✅ `generated_images` for AI images
- ✅ `conversations` for chat history
- ✅ `purchases` for marketplace transactions

### ❌ What's Missing for Admin Panel

**Subscription System:**
- ❌ No subscription tiers table
- ❌ No user subscriptions table
- ❌ No usage limits enforcement
- ❌ No monthly usage tracking

**Admin System:**
- ❌ No admin users table
- ❌ No admin roles/permissions
- ❌ No admin audit logs
- ❌ No platform-wide statistics

**Financial:**
- ❌ No cost tracking per user
- ❌ No revenue metrics
- ❌ No billing history

---

## Required New Tables

### 1. Subscription Tiers System

```sql
-- ============================================================================
-- SUBSCRIPTION & TIER MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'starter', 'pro', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  trial_days INTEGER DEFAULT 0,

  -- Avatar Limits
  max_avatars INTEGER NOT NULL DEFAULT 1,
  max_memories_per_avatar INTEGER NOT NULL DEFAULT 50,
  max_knowledge_files INTEGER NOT NULL DEFAULT 5,
  max_knowledge_size_mb INTEGER NOT NULL DEFAULT 10,
  max_images_per_avatar INTEGER NOT NULL DEFAULT 10,

  -- Usage Limits
  max_conversations_per_month INTEGER NOT NULL DEFAULT 100,
  max_api_requests_per_month INTEGER NOT NULL DEFAULT 0,
  max_training_jobs_per_month INTEGER NOT NULL DEFAULT 0,

  -- Features
  allowed_models JSONB DEFAULT '["gpt-3.5-turbo"]'::jsonb,
  fine_tuning_enabled BOOLEAN DEFAULT false,
  api_access_enabled BOOLEAN DEFAULT false,
  marketplace_access BOOLEAN DEFAULT true,
  voice_cloning_enabled BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  custom_branding BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),

  -- Subscription details
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  -- active, cancelled, expired, suspended, trial

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Payment
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly, lifetime
  payment_method VARCHAR(50), -- 'stripe', 'paypal', etc.
  external_subscription_id VARCHAR(255), -- Stripe subscription ID
  next_billing_date DATE,

  -- Trial
  is_trial BOOLEAN DEFAULT false,
  trial_ends_at TIMESTAMPTZ,

  -- Custom limits (overrides tier limits)
  custom_limits JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tier_id)
);

-- Monthly usage tracking (aggregated from existing logs)
CREATE TABLE IF NOT EXISTS monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period (YYYY-MM-01)
  usage_month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),

  -- Counts (from existing tables)
  avatars_created INTEGER DEFAULT 0,
  conversations_count INTEGER DEFAULT 0,
  api_requests_count INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  memories_added INTEGER DEFAULT 0,
  knowledge_files_uploaded INTEGER DEFAULT 0,
  training_jobs_created INTEGER DEFAULT 0,

  -- Costs (calculated)
  openai_api_cost DECIMAL(10, 4) DEFAULT 0,
  fine_tuning_cost DECIMAL(10, 4) DEFAULT 0,
  storage_cost DECIMAL(10, 4) DEFAULT 0,
  total_cost DECIMAL(10, 4) DEFAULT 0,

  -- Computed fields
  is_over_limit BOOLEAN DEFAULT false,
  exceeded_limits JSONB, -- Which limits were exceeded

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, usage_month)
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_tier_id ON user_subscriptions(tier_id);
CREATE INDEX idx_monthly_usage_user_month ON monthly_usage(user_id, usage_month);
CREATE INDEX idx_monthly_usage_month ON monthly_usage(usage_month);
```

### 2. Admin Management System

```sql
-- ============================================================================
-- ADMIN MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Admin role
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  -- super_admin, admin, moderator, support, analyst

  -- Permissions (granular control)
  permissions JSONB DEFAULT '{
    "users": {"read": true, "write": true, "delete": false},
    "avatars": {"read": true, "write": true, "delete": false},
    "tiers": {"read": true, "write": false, "delete": false},
    "financial": {"read": false, "write": false, "delete": false},
    "settings": {"read": true, "write": false, "delete": false},
    "moderation": {"read": true, "write": true, "delete": false}
  }'::jsonb,

  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  backup_codes TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),

  -- Action details
  action VARCHAR(100) NOT NULL,
  -- 'user.ban', 'user.upgrade', 'avatar.delete', 'tier.update', etc.

  resource_type VARCHAR(50) NOT NULL, -- 'user', 'avatar', 'tier', 'setting'
  resource_id UUID,

  -- Details
  description TEXT,
  changes JSONB, -- Before/after values

  -- Request info
  ip_address INET,
  user_agent TEXT,

  -- Justification (for sensitive actions)
  justification TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);
```

### 3. Platform Statistics

```sql
-- ============================================================================
-- PLATFORM STATISTICS (Daily Aggregates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,

  -- User metrics (from profiles table)
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  deleted_users INTEGER DEFAULT 0,

  -- Avatar metrics (from avatars table)
  total_avatars INTEGER DEFAULT 0,
  active_avatars INTEGER DEFAULT 0,
  avatars_created_today INTEGER DEFAULT 0,

  -- Usage metrics (from existing tables)
  conversations_today INTEGER DEFAULT 0,
  api_requests_today INTEGER DEFAULT 0,
  images_generated_today INTEGER DEFAULT 0,
  memories_added_today INTEGER DEFAULT 0,

  -- Financial (from subscriptions)
  revenue_today DECIMAL(10, 2) DEFAULT 0,
  mrr DECIMAL(10, 2) DEFAULT 0, -- Monthly Recurring Revenue
  arr DECIMAL(10, 2) DEFAULT 0, -- Annual Recurring Revenue

  -- Costs (calculated)
  openai_cost_today DECIMAL(10, 2) DEFAULT 0,
  storage_cost_today DECIMAL(10, 2) DEFAULT 0,
  total_cost_today DECIMAL(10, 2) DEFAULT 0,

  -- Storage metrics
  total_storage_gb DECIMAL(10, 2) DEFAULT 0,
  images_storage_gb DECIMAL(10, 2) DEFAULT 0,
  knowledge_storage_gb DECIMAL(10, 2) DEFAULT 0,
  memories_storage_gb DECIMAL(10, 2) DEFAULT 0,

  -- Tier distribution
  users_by_tier JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_statistics_date ON platform_statistics(stat_date DESC);
```

### 4. Update Existing Tables

```sql
-- ============================================================================
-- UPDATES TO EXISTING TABLES
-- ============================================================================

-- Add subscription tier to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES subscription_tiers(id),
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active',
-- active, suspended, banned, deleted
ADD COLUMN IF NOT EXISTS banned_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES admin_users(id);

-- Add moderation fields to avatars
ALTER TABLE avatars
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved',
-- pending, approved, rejected, flagged
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Add moderation to generated_images
ALTER TABLE generated_images
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';

-- Add moderation to avatar_memories
ALTER TABLE avatar_memories
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_avatars_flagged ON avatars(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_avatars_moderation ON avatars(moderation_status);
```

---

## Database Functions for Admin Panel

### Usage Limit Checking

```sql
-- ============================================================================
-- TIER LIMIT ENFORCEMENT FUNCTIONS
-- ============================================================================

-- Check if user can create avatar
CREATE OR REPLACE FUNCTION check_avatar_limit(p_user_id UUID)
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
  -- Get user's tier
  SELECT subscription_tier_id INTO v_tier_id
  FROM profiles
  WHERE id = p_user_id;

  -- Get tier limits
  SELECT max_avatars INTO v_max_avatars
  FROM subscription_tiers
  WHERE id = v_tier_id;

  -- Count user's active avatars
  SELECT COUNT(*) INTO v_current_count
  FROM avatars
  WHERE user_id = p_user_id AND status = 'active';

  RETURN QUERY
  SELECT
    (v_current_count < v_max_avatars) as allowed,
    v_current_count::INTEGER as current_count,
    v_max_avatars as max_allowed,
    st.display_name as tier_name
  FROM subscription_tiers st
  WHERE st.id = v_tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check conversation limit
CREATE OR REPLACE FUNCTION check_conversation_limit(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  max_allowed INTEGER,
  reset_date DATE
) AS $$
DECLARE
  v_tier_id UUID;
  v_max_conversations INTEGER;
  v_current_count INTEGER;
  v_current_month DATE;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Get user's tier
  SELECT subscription_tier_id INTO v_tier_id
  FROM profiles
  WHERE id = p_user_id;

  -- Get tier limits
  SELECT max_conversations_per_month INTO v_max_conversations
  FROM subscription_tiers
  WHERE id = v_tier_id;

  -- Get current month usage
  SELECT COALESCE(conversations_count, 0) INTO v_current_count
  FROM monthly_usage
  WHERE user_id = p_user_id AND usage_month = v_current_month;

  RETURN QUERY
  SELECT
    (v_current_count < v_max_conversations) as allowed,
    v_current_count::INTEGER as current_count,
    v_max_conversations as max_allowed,
    (v_current_month + INTERVAL '1 month')::DATE as reset_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment usage count
CREATE OR REPLACE FUNCTION increment_usage_counter(
  p_user_id UUID,
  p_counter_type VARCHAR, -- 'conversations', 'api_requests', 'images', etc.
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_current_month DATE;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);

  INSERT INTO monthly_usage (user_id, usage_month)
  VALUES (p_user_id, v_current_month)
  ON CONFLICT (user_id, usage_month) DO NOTHING;

  -- Update specific counter
  CASE p_counter_type
    WHEN 'conversations' THEN
      UPDATE monthly_usage
      SET conversations_count = conversations_count + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'api_requests' THEN
      UPDATE monthly_usage
      SET api_requests_count = api_requests_count + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'images' THEN
      UPDATE monthly_usage
      SET images_generated = images_generated + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;

    WHEN 'memories' THEN
      UPDATE monthly_usage
      SET memories_added = memories_added + p_increment,
          updated_at = NOW()
      WHERE user_id = p_user_id AND usage_month = v_current_month;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Admin Analytics Functions

```sql
-- ============================================================================
-- ADMIN ANALYTICS FUNCTIONS
-- ============================================================================

-- Get platform overview stats
CREATE OR REPLACE FUNCTION get_platform_overview()
RETURNS TABLE (
  total_users BIGINT,
  active_users_7d BIGINT,
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
    COUNT(DISTINCT a.id)::BIGINT as total_avatars,
    COUNT(DISTINCT c.id)::BIGINT as total_conversations,
    COALESCE(SUM(st.price_monthly), 0) as mrr,
    0.0 as churn_rate -- Calculate based on cancellations
  FROM profiles p
  LEFT JOIN avatars a ON a.user_id = p.id AND a.status = 'active'
  LEFT JOIN conversations c ON c.avatar_id = a.id
  LEFT JOIN user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN subscription_tiers st ON st.id = us.tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user details for admin
CREATE OR REPLACE FUNCTION get_user_admin_details(p_user_id UUID)
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
    COUNT(DISTINCT c.id)::BIGINT,
    COUNT(DISTINCT pk.id)::BIGINT,
    COALESCE(SUM(pur.price_paid), 0),
    p.created_at,
    p.last_login
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.id
  LEFT JOIN subscription_tiers st ON st.id = us.tier_id
  LEFT JOIN avatars a ON a.user_id = p.id
  LEFT JOIN conversations c ON c.avatar_id = a.id
  LEFT JOIN platform_api_keys pk ON pk.user_id = p.id
  LEFT JOIN purchases pur ON pur.user_id = p.id
  WHERE p.id = p_user_id
  GROUP BY p.email, p.name, p.account_status, st.display_name,
           us.status, p.created_at, p.last_login;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Implementation Summary

### Phase 1: Database Setup (Week 1)
1. ✅ Create new tables (tiers, subscriptions, usage, admin)
2. ✅ Update existing tables (add moderation fields)
3. ✅ Create functions for limit checking
4. ✅ Create analytics functions
5. ✅ Insert default subscription tiers

### Phase 2: Admin Authentication (Week 1-2)
1. Create admin user management
2. Implement RBAC (Role-Based Access Control)
3. Set up 2FA
4. Create audit logging system

### Phase 3: User Management UI (Week 2-3)
1. User list with search/filter
2. User detail page
3. Subscription management
4. Ban/suspend functionality

### Phase 4: Analytics Dashboard (Week 3-4)
1. Platform overview dashboard
2. Usage analytics
3. Revenue tracking
4. User behavior analytics

### Phase 5: Content Moderation (Week 4-5)
1. Flagged content review
2. Avatar moderation
3. Image moderation
4. Memory moderation

### Phase 6: Advanced Features (Week 5-6)
1. Tier management UI
2. Custom limits per user
3. Bulk actions
4. Export reports

---

## Integration with Existing Code

### Where to Add Limit Checks

**Avatar Creation** (`src/services/avatarService.ts`):
```typescript
async function createAvatar(userId: string, avatarData: any) {
  // Check limit first
  const { data: limit } = await supabase
    .rpc('check_avatar_limit', { p_user_id: userId });

  if (!limit.allowed) {
    throw new Error(`Avatar limit reached (${limit.current_count}/${limit.max_allowed})`);
  }

  // Proceed with creation
  const { data, error } = await supabase
    .from('avatars')
    .insert(avatarData);

  return data;
}
```

**API Requests** (Edge Functions):
```typescript
// In avatar-chat/index.ts
async function handleChat(req: Request) {
  const userId = await getUserFromApiKey(req);

  // Check conversation limit
  const { data: limit } = await supabase
    .rpc('check_conversation_limit', { p_user_id: userId });

  if (!limit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Monthly conversation limit reached',
        limit: limit.max_allowed,
        reset_date: limit.reset_date
      }),
      { status: 429 }
    );
  }

  // Process chat...

  // Increment counter
  await supabase.rpc('increment_usage_counter', {
    p_user_id: userId,
    p_counter_type: 'conversations'
  });
}
```

---

## Default Subscription Tiers

```sql
-- Insert default tiers
INSERT INTO subscription_tiers (
  name, display_name, description,
  price_monthly, price_yearly,
  max_avatars, max_conversations_per_month,
  max_memories_per_avatar, max_knowledge_files,
  max_images_per_avatar, max_api_requests_per_month,
  allowed_models, fine_tuning_enabled, api_access_enabled
) VALUES
-- FREE TIER
(
  'free', 'Free', 'Perfect for trying out AvatarLab',
  0.00, 0.00,
  1, 100, 50, 5, 10, 0,
  '["gpt-3.5-turbo"]'::jsonb, false, false
),
-- STARTER TIER
(
  'starter', 'Starter', 'Great for personal use',
  9.99, 99.99,
  3, 1000, 200, 20, 50, 10000,
  '["gpt-3.5-turbo", "gpt-4o-mini"]'::jsonb, true, true
),
-- PRO TIER
(
  'pro', 'Pro', 'For power users and small teams',
  29.99, 299.99,
  10, 10000, 1000, 100, 200, 100000,
  '["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o"]'::jsonb, true, true
),
-- ENTERPRISE TIER
(
  'enterprise', 'Enterprise', 'Custom solution for organizations',
  299.00, 2999.00,
  -1, -1, -1, -1, -1, -1, -- -1 means unlimited
  '["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o"]'::jsonb, true, true
);

-- Set all existing users to free tier
UPDATE profiles
SET subscription_tier_id = (
  SELECT id FROM subscription_tiers WHERE name = 'free'
)
WHERE subscription_tier_id IS NULL;
```

---

## Next Steps

1. **Review this updated plan** - Does it fit with your existing schema?
2. **Confirm tier pricing** - Are the prices ($9.99, $29.99, $299) right for your market?
3. **Decide on implementation timeline** - 6 weeks MVP or 12 weeks full?
4. **Set up admin access** - Who should be the first super admin?

**Ready to proceed?** I can start creating the migration SQL files and then build the admin panel UI!
