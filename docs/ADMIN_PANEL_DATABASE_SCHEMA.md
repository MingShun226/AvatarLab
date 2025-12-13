# Admin Panel Database Schema - Complete Documentation

**Project:** AvatarLab Admin Panel
**Version:** 1.0.0
**Created:** November 4, 2025
**Purpose:** Complete database schema for multi-tier subscription and admin management system

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Schema Architecture](#schema-architecture)
3. [Table Definitions](#table-definitions)
4. [Relationships Diagram](#relationships-diagram)
5. [Usage Examples](#usage-examples)
6. [Migration Order](#migration-order)
7. [Security Considerations](#security-considerations)

---

## Overview

### Purpose

This schema adds comprehensive admin panel functionality to AvatarLab, including:

- ✅ **Subscription Tier Management** - Define and manage pricing tiers (Free, Starter, Pro, Enterprise)
- ✅ **Usage Tracking** - Monitor user consumption against tier limits
- ✅ **Admin Access Control** - Role-based admin permissions
- ✅ **Audit Logging** - Track all admin actions
- ✅ **Platform Analytics** - Daily aggregated statistics

### New Tables (6 tables)

1. `subscription_tiers` - Define subscription plans with limits
2. `user_subscriptions` - Track user subscriptions
3. `monthly_usage` - Aggregate monthly usage per user
4. `admin_users` - Admin roles and permissions
5. `admin_audit_logs` - Admin action history
6. `platform_statistics` - Daily platform metrics

### Modified Tables (3 tables)

1. `profiles` - Add subscription tier and ban status
2. `avatars` - Add moderation fields
3. `generated_images` - Add content moderation

---

## Schema Architecture

### Dependency Tree

```
subscription_tiers (independent)
    ↓
user_subscriptions → profiles
    ↓
monthly_usage → profiles

admin_users (independent) → profiles
    ↓
admin_audit_logs → admin_users

platform_statistics (independent)

profiles ← avatars, generated_images (moderation)
```

### Integration with Existing Tables

```
NEW TABLES                    EXISTING TABLES
=============                 ===============
subscription_tiers    ←───→   profiles
user_subscriptions    ←───→   profiles
monthly_usage         ←───→   profiles, avatars, conversations, etc.
admin_users           ←───→   profiles (auth.users)
admin_audit_logs      ←───→   admin_users
platform_statistics   ←───→   (aggregates from all tables)
```

---

## Table Definitions

### 1. subscription_tiers

**Purpose:** Define subscription plans with features and limits.

**Schema:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | uuid_generate_v4() | Primary key |
| name | VARCHAR(50) | NOT NULL | - | Internal name (free, starter, pro, enterprise) |
| display_name | VARCHAR(100) | NOT NULL | - | User-facing name |
| description | TEXT | NULL | - | Tier description |
| price_monthly | DECIMAL(10,2) | NOT NULL | 0.00 | Monthly price in USD |
| price_yearly | DECIMAL(10,2) | NOT NULL | 0.00 | Yearly price in USD |
| trial_days | INTEGER | NOT NULL | 0 | Free trial days |
| max_avatars | INTEGER | NOT NULL | 1 | Avatar limit (-1 = unlimited) |
| max_conversations_per_month | INTEGER | NOT NULL | 100 | Monthly conversation limit |
| max_memories_per_avatar | INTEGER | NOT NULL | 50 | Memory limit per avatar |
| max_knowledge_files | INTEGER | NOT NULL | 5 | Knowledge file limit |
| max_knowledge_size_mb | INTEGER | NOT NULL | 10 | Total knowledge storage (MB) |
| max_images_per_avatar | INTEGER | NOT NULL | 10 | Image limit per avatar |
| max_api_requests_per_month | INTEGER | NOT NULL | 0 | API request limit |
| max_training_jobs_per_month | INTEGER | NOT NULL | 0 | Fine-tuning job limit |
| max_voice_clones | INTEGER | NOT NULL | 0 | Voice clone limit |
| allowed_models | JSONB | NOT NULL | ["gpt-3.5-turbo"] | Allowed AI models |
| fine_tuning_enabled | BOOLEAN | NOT NULL | false | Fine-tuning access |
| api_access_enabled | BOOLEAN | NOT NULL | false | API access |
| voice_cloning_enabled | BOOLEAN | NOT NULL | false | Voice cloning access |
| rag_enabled | BOOLEAN | NOT NULL | true | RAG knowledge base access |
| marketplace_access | BOOLEAN | NOT NULL | true | Marketplace access |
| priority_support | BOOLEAN | NOT NULL | false | Priority support |
| custom_branding | BOOLEAN | NOT NULL | false | White-label branding |
| is_active | BOOLEAN | NOT NULL | true | Tier is available |
| is_featured | BOOLEAN | NOT NULL | false | Featured tier |
| sort_order | INTEGER | NOT NULL | 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Updated timestamp |

**Indexes:**
```sql
PRIMARY KEY (id)
UNIQUE (name)
INDEX idx_subscription_tiers_active (is_active)
INDEX idx_subscription_tiers_sort (sort_order)
```

**Default Data:**
```sql
-- Free Tier
name: 'free', price: $0/month, 1 avatar, 100 conversations/month

-- Starter Tier
name: 'starter', price: $9.99/month, 3 avatars, 1,000 conversations/month

-- Pro Tier
name: 'pro', price: $29.99/month, 10 avatars, 10,000 conversations/month

-- Enterprise Tier
name: 'enterprise', price: $299/month, unlimited everything
```

---

### 2. user_subscriptions

**Purpose:** Track user subscriptions to tiers.

**Schema:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | uuid_generate_v4() | Primary key |
| user_id | UUID | NOT NULL | - | References auth.users(id) |
| tier_id | UUID | NOT NULL | - | References subscription_tiers(id) |
| status | VARCHAR(20) | NOT NULL | 'active' | Subscription status |
| billing_cycle | VARCHAR(20) | NOT NULL | 'monthly' | Billing frequency |
| started_at | TIMESTAMPTZ | NOT NULL | NOW() | Subscription start date |
| expires_at | TIMESTAMPTZ | NULL | - | Expiration date |
| cancelled_at | TIMESTAMPTZ | NULL | - | Cancellation date |
| cancellation_reason | TEXT | NULL | - | Why cancelled |
| payment_method | VARCHAR(50) | NULL | - | Payment provider (stripe, paypal) |
| external_subscription_id | VARCHAR(255) | NULL | - | Stripe/PayPal subscription ID |
| next_billing_date | DATE | NULL | - | Next charge date |
| is_trial | BOOLEAN | NOT NULL | false | Is trial subscription |
| trial_ends_at | TIMESTAMPTZ | NULL | - | Trial end date |
| custom_limits | JSONB | NULL | - | Override tier limits |
| metadata | JSONB | NULL | - | Additional data |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Updated timestamp |

**Constraints:**
```sql
CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trial'))
CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime'))
```

**Indexes:**
```sql
PRIMARY KEY (id)
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id)
UNIQUE (user_id, tier_id)
INDEX idx_user_subscriptions_user (user_id)
INDEX idx_user_subscriptions_tier (tier_id)
INDEX idx_user_subscriptions_status (status)
INDEX idx_user_subscriptions_trial (is_trial, trial_ends_at)
```

**Status Enum:**
- `active` - Subscription is active
- `trial` - In trial period
- `cancelled` - User cancelled (active until expiry)
- `expired` - Subscription expired
- `suspended` - Admin suspended

---

### 3. monthly_usage

**Purpose:** Aggregate monthly usage per user for limit enforcement.

**Schema:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | uuid_generate_v4() | Primary key |
| user_id | UUID | NOT NULL | - | References auth.users(id) |
| usage_month | DATE | NOT NULL | DATE_TRUNC('month', NOW()) | Usage period (YYYY-MM-01) |
| avatars_created | INTEGER | NOT NULL | 0 | Avatars created this month |
| conversations_count | INTEGER | NOT NULL | 0 | Conversations this month |
| api_requests_count | INTEGER | NOT NULL | 0 | API requests this month |
| images_generated | INTEGER | NOT NULL | 0 | Images generated this month |
| memories_added | INTEGER | NOT NULL | 0 | Memories added this month |
| knowledge_files_uploaded | INTEGER | NOT NULL | 0 | Files uploaded this month |
| training_jobs_created | INTEGER | NOT NULL | 0 | Training jobs this month |
| voice_clones_created | INTEGER | NOT NULL | 0 | Voice clones this month |
| tts_generations | INTEGER | NOT NULL | 0 | TTS generations this month |
| tokens_used | BIGINT | NOT NULL | 0 | Total tokens consumed |
| openai_api_cost | DECIMAL(10,4) | NOT NULL | 0 | OpenAI costs (USD) |
| fine_tuning_cost | DECIMAL(10,4) | NOT NULL | 0 | Fine-tuning costs (USD) |
| storage_cost | DECIMAL(10,4) | NOT NULL | 0 | Storage costs (USD) |
| voice_cost | DECIMAL(10,4) | NOT NULL | 0 | Voice cloning costs (USD) |
| total_cost | DECIMAL(10,4) | NOT NULL | 0 | Total costs (USD) |
| is_over_limit | BOOLEAN | NOT NULL | false | Exceeded any limits |
| exceeded_limits | JSONB | NULL | - | Which limits exceeded |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Updated timestamp |

**Indexes:**
```sql
PRIMARY KEY (id)
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
UNIQUE (user_id, usage_month)
INDEX idx_monthly_usage_user (user_id)
INDEX idx_monthly_usage_month (usage_month DESC)
INDEX idx_monthly_usage_user_month (user_id, usage_month DESC)
INDEX idx_monthly_usage_over_limit (is_over_limit) WHERE is_over_limit = true
```

**Notes:**
- Resets monthly (first day of each month)
- Auto-aggregates from existing tables
- Used for limit enforcement

---

### 4. admin_users

**Purpose:** Manage admin access with role-based permissions.

**Schema:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | uuid_generate_v4() | Primary key |
| user_id | UUID | NOT NULL | - | References auth.users(id) |
| role | VARCHAR(20) | NOT NULL | 'admin' | Admin role |
| permissions | JSONB | NOT NULL | (default JSON) | Granular permissions |
| two_factor_enabled | BOOLEAN | NOT NULL | false | 2FA enabled |
| two_factor_secret | VARCHAR(255) | NULL | - | TOTP secret (encrypted) |
| backup_codes | TEXT[] | NULL | - | 2FA backup codes |
| is_active | BOOLEAN | NOT NULL | true | Admin access enabled |
| last_login_at | TIMESTAMPTZ | NULL | - | Last login timestamp |
| failed_login_attempts | INTEGER | NOT NULL | 0 | Failed login counter |
| locked_until | TIMESTAMPTZ | NULL | - | Account lock expiry |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Updated timestamp |
| created_by | UUID | NULL | - | References admin_users(id) |

**Constraints:**
```sql
CHECK (role IN ('super_admin', 'admin', 'moderator', 'support', 'analyst'))
```

**Indexes:**
```sql
PRIMARY KEY (id)
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
FOREIGN KEY (created_by) REFERENCES admin_users(id)
UNIQUE (user_id)
INDEX idx_admin_users_role (role)
INDEX idx_admin_users_active (is_active)
```

**Role Hierarchy:**
1. `super_admin` - Full access (create admins, change tiers, billing)
2. `admin` - Manage users, avatars, content
3. `moderator` - Content moderation only
4. `support` - View-only, respond to tickets
5. `analyst` - View analytics only

**Default Permissions JSON:**
```json
{
  "users": {"read": true, "write": true, "delete": false},
  "avatars": {"read": true, "write": true, "delete": false},
  "tiers": {"read": true, "write": false, "delete": false},
  "financial": {"read": false, "write": false, "delete": false},
  "settings": {"read": true, "write": false, "delete": false},
  "moderation": {"read": true, "write": true, "delete": false}
}
```

---

### 5. admin_audit_logs

**Purpose:** Track all admin actions for security and compliance.

**Schema:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | uuid_generate_v4() | Primary key |
| admin_user_id | UUID | NOT NULL | - | References admin_users(id) |
| action | VARCHAR(100) | NOT NULL | - | Action performed |
| resource_type | VARCHAR(50) | NOT NULL | - | Resource type |
| resource_id | UUID | NULL | - | Resource ID |
| description | TEXT | NULL | - | Human-readable description |
| changes | JSONB | NULL | - | Before/after values |
| ip_address | INET | NULL | - | Admin's IP address |
| user_agent | TEXT | NULL | - | Browser/client info |
| justification | TEXT | NULL | - | Reason for sensitive actions |
| severity | VARCHAR(20) | NOT NULL | 'info' | Log severity |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Action timestamp |

**Constraints:**
```sql
CHECK (severity IN ('info', 'warning', 'critical'))
```

**Indexes:**
```sql
PRIMARY KEY (id)
FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
INDEX idx_admin_audit_logs_admin (admin_user_id)
INDEX idx_admin_audit_logs_action (action)
INDEX idx_admin_audit_logs_resource (resource_type, resource_id)
INDEX idx_admin_audit_logs_created (created_at DESC)
INDEX idx_admin_audit_logs_severity (severity) WHERE severity != 'info'
```

**Action Examples:**
- `user.ban` - Banned user
- `user.upgrade` - Upgraded subscription
- `avatar.delete` - Deleted avatar
- `tier.update` - Modified tier
- `admin.create` - Created admin

**Retention:** 7 years for compliance

---

### 6. platform_statistics

**Purpose:** Daily aggregated platform metrics.

**Schema:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NOT NULL | uuid_generate_v4() | Primary key |
| stat_date | DATE | NOT NULL | CURRENT_DATE | Statistics date |
| total_users | INTEGER | NOT NULL | 0 | Total users |
| active_users | INTEGER | NOT NULL | 0 | Active users (30d) |
| new_users | INTEGER | NOT NULL | 0 | New signups today |
| deleted_users | INTEGER | NOT NULL | 0 | Deleted accounts today |
| total_avatars | INTEGER | NOT NULL | 0 | Total avatars |
| active_avatars | INTEGER | NOT NULL | 0 | Active avatars |
| avatars_created_today | INTEGER | NOT NULL | 0 | Avatars created today |
| conversations_today | INTEGER | NOT NULL | 0 | Conversations today |
| api_requests_today | INTEGER | NOT NULL | 0 | API requests today |
| images_generated_today | INTEGER | NOT NULL | 0 | Images generated today |
| memories_added_today | INTEGER | NOT NULL | 0 | Memories added today |
| training_jobs_today | INTEGER | NOT NULL | 0 | Training jobs today |
| voice_clones_today | INTEGER | NOT NULL | 0 | Voice clones today |
| revenue_today | DECIMAL(10,2) | NOT NULL | 0 | Revenue today (USD) |
| mrr | DECIMAL(10,2) | NOT NULL | 0 | Monthly Recurring Revenue |
| arr | DECIMAL(10,2) | NOT NULL | 0 | Annual Recurring Revenue |
| openai_cost_today | DECIMAL(10,2) | NOT NULL | 0 | OpenAI costs today |
| storage_cost_today | DECIMAL(10,2) | NOT NULL | 0 | Storage costs today |
| total_cost_today | DECIMAL(10,2) | NOT NULL | 0 | Total costs today |
| total_storage_gb | DECIMAL(10,2) | NOT NULL | 0 | Total storage used |
| images_storage_gb | DECIMAL(10,2) | NOT NULL | 0 | Images storage |
| knowledge_storage_gb | DECIMAL(10,2) | NOT NULL | 0 | Knowledge storage |
| voice_storage_gb | DECIMAL(10,2) | NOT NULL | 0 | Voice storage |
| users_by_tier | JSONB | NOT NULL | {} | User count per tier |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Updated timestamp |

**Indexes:**
```sql
PRIMARY KEY (id)
UNIQUE (stat_date)
INDEX idx_platform_statistics_date (stat_date DESC)
```

**Population:** Cron job runs daily at midnight

---

## Modified Tables

### profiles (modifications)

**New Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| subscription_tier_id | UUID | NULL | - | Current tier FK |
| account_status | VARCHAR(20) | NOT NULL | 'active' | Account status |
| banned_reason | TEXT | NULL | - | Ban reason |
| banned_at | TIMESTAMPTZ | NULL | - | Ban timestamp |
| banned_by | UUID | NULL | - | Admin who banned |

**New Indexes:**
```sql
INDEX idx_profiles_tier (subscription_tier_id)
INDEX idx_profiles_status (account_status)
INDEX idx_profiles_banned (banned_at) WHERE banned_at IS NOT NULL
```

---

### avatars (modifications)

**New Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| is_flagged | BOOLEAN | NOT NULL | false | Flagged for review |
| flagged_reason | TEXT | NULL | - | Why flagged |
| flagged_by | UUID | NULL | - | Admin who flagged |
| flagged_at | TIMESTAMPTZ | NULL | - | Flag timestamp |
| moderation_status | VARCHAR(20) | NOT NULL | 'approved' | Moderation state |
| moderation_notes | TEXT | NULL | - | Moderator notes |

**Constraints:**
```sql
CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'))
```

**New Indexes:**
```sql
INDEX idx_avatars_flagged (is_flagged) WHERE is_flagged = true
INDEX idx_avatars_moderation (moderation_status)
```

---

### generated_images (modifications)

**New Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| is_flagged | BOOLEAN | NOT NULL | false | Flagged for review |
| flagged_reason | TEXT | NULL | - | Why flagged |
| moderation_status | VARCHAR(20) | NOT NULL | 'approved' | Moderation state |

**New Indexes:**
```sql
INDEX idx_images_flagged (is_flagged) WHERE is_flagged = true
INDEX idx_images_moderation (moderation_status)
```

---

## Relationships Diagram

```
┌─────────────────────┐
│ subscription_tiers  │
│ - id (PK)          │
│ - name             │
│ - price_monthly    │
│ - max_avatars      │
└──────────┬──────────┘
           │
           │ 1:N
           ↓
┌─────────────────────┐       ┌──────────────────┐
│ user_subscriptions  │───────│  profiles        │
│ - id (PK)          │  N:1  │  - id (PK)       │
│ - user_id (FK)     │←──────│  - subscription  │
│ - tier_id (FK)     │       │    _tier_id (FK) │
│ - status           │       │  - account       │
│ - started_at       │       │    _status       │
└─────────────────────┘       └──────────────────┘
           │                           │
           │ 1:N                       │ 1:N
           ↓                           ↓
┌─────────────────────┐       ┌──────────────────┐
│  monthly_usage      │       │  avatars         │
│  - id (PK)         │       │  - id (PK)       │
│  - user_id (FK)    │       │  - user_id (FK)  │
│  - usage_month     │       │  - is_flagged    │
│  - avatars_created │       │  - moderation    │
│  - conversations   │       │    _status       │
└─────────────────────┘       └──────────────────┘


┌─────────────────────┐       ┌──────────────────┐
│   admin_users       │       │ admin_audit_logs │
│   - id (PK)        │───────│ - id (PK)        │
│   - user_id (FK)   │  1:N  │ - admin_user_id  │
│   - role           │       │   (FK)           │
│   - permissions    │       │ - action         │
└─────────────────────┘       │ - resource_type  │
                              │ - changes        │
                              └──────────────────┘


┌─────────────────────┐
│ platform_statistics │
│ - id (PK)          │
│ - stat_date        │
│ - total_users      │
│ - mrr, arr         │
│ - users_by_tier    │
└─────────────────────┘
```

---

## Usage Examples

### Check if User Can Create Avatar

```sql
-- Get user's tier and current avatar count
SELECT
  st.max_avatars,
  COUNT(a.id) as current_count,
  (COUNT(a.id) < st.max_avatars) as can_create
FROM profiles p
JOIN user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
JOIN subscription_tiers st ON st.id = us.tier_id
LEFT JOIN avatars a ON a.user_id = p.id AND a.status = 'active'
WHERE p.id = 'USER_ID'
GROUP BY st.max_avatars;
```

### Increment Usage Counter

```sql
-- Increment conversation count
INSERT INTO monthly_usage (user_id, usage_month, conversations_count)
VALUES ('USER_ID', DATE_TRUNC('month', NOW()), 1)
ON CONFLICT (user_id, usage_month)
DO UPDATE SET
  conversations_count = monthly_usage.conversations_count + 1,
  updated_at = NOW();
```

### Log Admin Action

```sql
-- Log user ban
INSERT INTO admin_audit_logs (
  admin_user_id,
  action,
  resource_type,
  resource_id,
  description,
  changes,
  severity,
  justification
) VALUES (
  'ADMIN_ID',
  'user.ban',
  'user',
  'USER_ID',
  'Banned user for violating ToS',
  '{"before": {"account_status": "active"}, "after": {"account_status": "banned"}}'::jsonb,
  'critical',
  'Multiple reports of abuse'
);
```

### Get Platform Overview

```sql
-- Get today's platform statistics
SELECT
  total_users,
  active_users,
  new_users,
  mrr,
  users_by_tier
FROM platform_statistics
WHERE stat_date = CURRENT_DATE;
```

---

## Migration Order

Execute migrations in this order to respect dependencies:

```
1. CREATE subscription_tiers
2. CREATE user_subscriptions
3. CREATE monthly_usage
4. CREATE admin_users
5. CREATE admin_audit_logs
6. CREATE platform_statistics
7. ALTER profiles (add subscription fields)
8. ALTER avatars (add moderation fields)
9. ALTER generated_images (add moderation fields)
10. INSERT default subscription tiers
11. MIGRATE existing users to free tier
```

---

## Security Considerations

### Row Level Security (RLS)

All tables must have RLS enabled:

```sql
-- subscription_tiers: Public read
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active tiers" ON subscription_tiers
  FOR SELECT USING (is_active = true);

-- user_subscriptions: Users see own only
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- monthly_usage: Users see own only
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage" ON monthly_usage
  FOR SELECT USING (auth.uid() = user_id);

-- admin_users: Admins only
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins view admin_users" ON admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- admin_audit_logs: Admins only
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins view logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- platform_statistics: Admins only
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins view statistics" ON platform_statistics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
  );
```

### Sensitive Data

- **Passwords:** Never stored (Supabase Auth handles)
- **2FA Secrets:** Encrypted at rest
- **Payment Info:** Not stored (Stripe handles)
- **API Keys:** Encrypted in user_api_keys table

---

## Performance Considerations

### Indexes Priority

**High Priority:**
- monthly_usage(user_id, usage_month) - Checked on every action
- user_subscriptions(user_id, status) - Authentication flow
- profiles(subscription_tier_id) - Frequent joins

**Medium Priority:**
- admin_audit_logs(created_at) - Admin dashboard
- platform_statistics(stat_date) - Analytics

**Low Priority:**
- admin_users(role) - Small table
- subscription_tiers - Very small table

### Query Optimization

```sql
-- Bad: N+1 query
SELECT * FROM users;
for each user:
  SELECT * FROM user_subscriptions WHERE user_id = ?;

-- Good: Single query with join
SELECT u.*, us.*, st.*
FROM users u
LEFT JOIN user_subscriptions us ON us.user_id = u.id
LEFT JOIN subscription_tiers st ON st.id = us.tier_id;
```

---

## Maintenance

### Daily Tasks
- Aggregate platform_statistics
- Check expired subscriptions
- Reset monthly_usage (monthly)
- Clean old audit_logs (retention policy)

### Weekly Tasks
- Review flagged content
- Monitor storage usage
- Check failed payments

### Monthly Tasks
- Generate billing reports
- Analyze churn rate
- Review tier pricing

---

## Future Enhancements

### Phase 2 (Optional)
- `subscription_addons` - Extra features (more avatars, storage, etc.)
- `invoices` - Invoice generation and history
- `payment_methods` - Saved payment methods
- `usage_alerts` - Notify users approaching limits
- `referral_program` - Referral codes and rewards

---

## Summary

**6 New Tables:**
1. subscription_tiers
2. user_subscriptions
3. monthly_usage
4. admin_users
5. admin_audit_logs
6. platform_statistics

**3 Modified Tables:**
1. profiles (+ subscription_tier_id, account_status, banned fields)
2. avatars (+ moderation fields)
3. generated_images (+ moderation fields)

**Total Database Size:** 41 tables (after cleanup: 35 + 6 new)

**Ready for Implementation:** ✅

---

**Next Steps:**
1. Review this schema
2. Confirm tier pricing
3. Create SQL migration files
4. Execute migrations
5. Build admin UI

