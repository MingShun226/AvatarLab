# Admin Panel Implementation Plan

## 📋 Table of Contents
1. [Overview](#overview)
2. [Admin Panel Features](#admin-panel-features)
3. [Database Schema Changes](#database-schema-changes)
4. [User Tier System](#user-tier-system)
5. [Implementation Phases](#implementation-phases)
6. [Security Considerations](#security-considerations)
7. [UI/UX Design](#uiux-design)
8. [API Endpoints](#api-endpoints)
9. [Cost Implications](#cost-implications)
10. [Timeline Estimate](#timeline-estimate)

---

## Overview

### Purpose
Create a comprehensive admin panel to manage the AvatarLab platform, including user management, usage analytics, subscription tiers, and platform-wide statistics.

### Key Objectives
- ✅ Full user management capabilities
- ✅ Real-time usage tracking and analytics
- ✅ Subscription tier management with limitations
- ✅ Platform health monitoring
- ✅ Revenue and billing oversight
- ✅ Security and access control

### Admin Panel Access
- **URL:** `/admin` (protected route)
- **Authentication:** Super admin role with 2FA
- **Authorization:** Role-based access control (RBAC)

---

## Admin Panel Features

### 1. Dashboard Overview
**Priority:** HIGH

**Metrics Displayed:**
- Total users (active, inactive, banned)
- Total avatars created
- Daily/Weekly/Monthly active users (DAU/WAU/MAU)
- API usage statistics
- Revenue metrics (MRR, ARR)
- Storage usage (images, voice files, documents)
- Fine-tuning jobs count and costs
- System health indicators

**Visualizations:**
- User growth chart (line graph)
- Revenue trends (bar chart)
- Usage by tier (pie chart)
- Geographic distribution (map)
- Peak usage times (heatmap)

### 2. User Management
**Priority:** HIGH

**Features:**
- **User List View**
  - Search by email, name, or user ID
  - Filter by tier, status, signup date
  - Sort by various metrics
  - Bulk actions (export, email, upgrade tier)

- **User Detail View**
  - Profile information
  - Subscription tier and limits
  - Usage statistics
  - Avatar list
  - Conversation history count
  - API keys issued
  - Payment history
  - Activity log

- **User Actions**
  - View/Edit user details
  - Upgrade/Downgrade tier
  - Reset password
  - Ban/Suspend/Activate account
  - Impersonate user (for support)
  - Adjust limits temporarily
  - Send notification/email
  - Refund transactions

### 3. Avatar Management
**Priority:** MEDIUM

**Features:**
- View all avatars across all users
- Search and filter by user, name, status
- View avatar details:
  - Training data statistics
  - Usage metrics
  - Fine-tuned models
  - Memory count
  - Knowledge base size
- Moderate content (flag inappropriate)
- Delete avatars (with user notification)
- View avatar conversations (for moderation)

### 4. Subscription Tier Management
**Priority:** HIGH

**Tier Configuration:**
```
FREE TIER
├── Max Avatars: 1
├── Max Conversations: 100/month
├── Max Memories: 50 per avatar
├── Max Knowledge Files: 5 (10MB total)
├── Max Images: 10 per avatar
├── AI Model: gpt-3.5-turbo only
├── Fine-tuning: ❌ Not available
└── API Access: ❌ Not available

STARTER TIER ($9.99/month)
├── Max Avatars: 3
├── Max Conversations: 1,000/month
├── Max Memories: 200 per avatar
├── Max Knowledge Files: 20 (50MB total)
├── Max Images: 50 per avatar
├── AI Model: gpt-4o-mini, gpt-3.5-turbo
├── Fine-tuning: ✅ Available
└── API Access: ✅ 10,000 requests/month

PRO TIER ($29.99/month)
├── Max Avatars: 10
├── Max Conversations: 10,000/month
├── Max Memories: 1,000 per avatar
├── Max Knowledge Files: 100 (500MB total)
├── Max Images: 200 per avatar
├── AI Model: All models (including gpt-4o)
├── Fine-tuning: ✅ Unlimited
├── API Access: ✅ 100,000 requests/month
└── Priority Support: ✅

ENTERPRISE TIER (Custom pricing)
├── Max Avatars: Unlimited
├── Max Conversations: Unlimited
├── Max Memories: Unlimited per avatar
├── Max Knowledge Files: Unlimited
├── Max Images: Unlimited per avatar
├── AI Model: All models + custom fine-tuning
├── Fine-tuning: ✅ Unlimited + dedicated support
├── API Access: ✅ Unlimited requests
├── White-label: ✅ Available
├── Dedicated Support: ✅ 24/7
└── SLA: ✅ 99.9% uptime guarantee
```

**Admin Controls:**
- Create/Edit/Delete tiers
- Set limits per tier
- Configure pricing
- Enable/Disable features per tier
- Set trial periods
- Create promotional tiers
- A/B test different tier structures

### 5. Usage Analytics
**Priority:** HIGH

**Metrics:**
- **API Usage**
  - Total requests per tier
  - Requests by endpoint
  - Error rates
  - Response times
  - Most used features

- **AI Model Usage**
  - Token consumption by model
  - Cost per user/tier
  - Fine-tuning job statistics
  - Model performance metrics

- **Storage Usage**
  - Images stored (total size)
  - Voice files (total size)
  - Knowledge base documents
  - Database size
  - Backup size

- **User Engagement**
  - Average avatars per user
  - Average conversations per avatar
  - Retention rates (D1, D7, D30)
  - Churn rate by tier
  - Feature adoption rates

### 6. Financial Management
**Priority:** MEDIUM

**Features:**
- Revenue dashboard
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)
  - Revenue by tier
  - Revenue growth rate
  - Churn impact

- Payment history
  - All transactions
  - Failed payments
  - Refunds issued
  - Payment method breakdown

- Cost tracking
  - OpenAI API costs
  - Supabase costs
  - Storage costs
  - Total operational costs
  - Profit margins

- Invoicing
  - Generate invoices
  - Send invoice reminders
  - Export for accounting

### 7. Content Moderation
**Priority:** MEDIUM

**Features:**
- Flagged content review
- Conversation monitoring (with privacy controls)
- Image moderation queue
- User reports
- Automated content filtering
- Ban/Warn users for violations
- Content policy enforcement

### 8. System Monitoring
**Priority:** MEDIUM

**Features:**
- Server health
  - Supabase database status
  - Edge function performance
  - Storage usage and limits
  - API response times

- Error tracking
  - Error logs by type
  - Error frequency
  - User-reported bugs
  - System alerts

- Performance metrics
  - Page load times
  - Database query performance
  - API latency
  - Cache hit rates

### 9. Configuration Management
**Priority:** LOW

**Features:**
- Platform settings
  - Feature flags
  - Maintenance mode
  - System announcements
  - Email templates
  - Notification settings

- Integration settings
  - OpenAI API keys
  - n8n webhooks
  - Payment gateway config
  - Email service config

### 10. Audit Logs
**Priority:** HIGH

**Features:**
- Track all admin actions
- User activity logs
- Security events
- Data access logs
- Compliance reporting
- Export logs for auditing

---

## Database Schema Changes

### New Tables

#### 1. `subscription_tiers`
```sql
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'starter', 'pro', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Limits
  max_avatars INTEGER NOT NULL DEFAULT 1,
  max_conversations_per_month INTEGER NOT NULL DEFAULT 100,
  max_memories_per_avatar INTEGER NOT NULL DEFAULT 50,
  max_knowledge_files INTEGER NOT NULL DEFAULT 5,
  max_knowledge_files_size_mb INTEGER NOT NULL DEFAULT 10,
  max_images_per_avatar INTEGER NOT NULL DEFAULT 10,
  max_api_requests_per_month INTEGER NOT NULL DEFAULT 0,

  -- Features
  allowed_models JSONB DEFAULT '["gpt-3.5-turbo"]'::jsonb,
  fine_tuning_enabled BOOLEAN DEFAULT false,
  api_access_enabled BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  white_label_enabled BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `user_subscriptions`
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),

  -- Subscription details
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired, suspended
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Payment
  payment_method VARCHAR(50), -- 'stripe', 'paypal', etc.
  external_subscription_id VARCHAR(255), -- Stripe subscription ID

  -- Trial
  is_trial BOOLEAN DEFAULT false,
  trial_ends_at TIMESTAMPTZ,

  -- Custom limits (overrides)
  custom_limits JSONB, -- Override tier limits for specific users

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

#### 3. `usage_tracking`
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period tracking (reset monthly)
  tracking_period DATE NOT NULL DEFAULT CURRENT_DATE, -- YYYY-MM-01

  -- Usage counts
  conversations_count INTEGER DEFAULT 0,
  api_requests_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  fine_tuning_jobs INTEGER DEFAULT 0,

  -- Costs
  api_cost_usd DECIMAL(10, 4) DEFAULT 0,
  storage_cost_usd DECIMAL(10, 4) DEFAULT 0,
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tracking_period)
);

CREATE INDEX idx_usage_tracking_user_period ON usage_tracking(user_id, tracking_period);
```

#### 4. `admin_users`
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Admin role
  role VARCHAR(20) NOT NULL DEFAULT 'admin', -- super_admin, admin, moderator, support

  -- Permissions
  permissions JSONB DEFAULT '{
    "users": {"read": true, "write": true, "delete": false},
    "avatars": {"read": true, "write": true, "delete": false},
    "tiers": {"read": true, "write": false, "delete": false},
    "financial": {"read": false, "write": false, "delete": false},
    "settings": {"read": true, "write": false, "delete": false}
  }'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `admin_audit_logs`
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),

  -- Action details
  action VARCHAR(100) NOT NULL, -- 'user.ban', 'tier.update', 'avatar.delete'
  resource_type VARCHAR(50) NOT NULL, -- 'user', 'avatar', 'tier'
  resource_id UUID,

  -- Details
  description TEXT,
  changes JSONB, -- Before/after values
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at);
```

#### 6. `platform_statistics`
```sql
CREATE TABLE platform_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,

  -- User metrics
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,

  -- Avatar metrics
  total_avatars INTEGER DEFAULT 0,
  avatars_created_today INTEGER DEFAULT 0,

  -- Usage metrics
  total_conversations INTEGER DEFAULT 0,
  total_api_requests INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,

  -- Financial metrics
  revenue_today_usd DECIMAL(10, 2) DEFAULT 0,
  cost_today_usd DECIMAL(10, 2) DEFAULT 0,

  -- Storage metrics
  storage_used_gb DECIMAL(10, 2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_statistics_date ON platform_statistics(stat_date);
```

### Modified Tables

#### Update `profiles` table
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES subscription_tiers(id),
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active', -- active, suspended, banned
ADD COLUMN IF NOT EXISTS banned_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signup_source VARCHAR(50); -- 'organic', 'referral', 'paid_ad'
```

#### Update `avatars` table
```sql
ALTER TABLE avatars
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'; -- pending, approved, rejected
```

---

## User Tier System

### Tier Enforcement Strategy

#### 1. Middleware/Guards
Create reusable functions to check limits before actions:

```typescript
// src/lib/tierLimits.ts

export async function checkAvatarLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  tier: string;
}> {
  // Get user's tier and current avatar count
  // Return whether they can create more
}

export async function checkConversationLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetDate: Date;
}> {
  // Check monthly conversation limit
}

export async function checkFeatureAccess(
  userId: string,
  feature: 'fine_tuning' | 'api_access' | 'priority_support'
): Promise<boolean> {
  // Check if user's tier includes this feature
}
```

#### 2. Database Triggers
Automatically update usage tracking:

```sql
-- Trigger to increment conversation count
CREATE OR REPLACE FUNCTION increment_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, tracking_period, conversations_count)
  VALUES (NEW.user_id, DATE_TRUNC('month', NOW()), 1)
  ON CONFLICT (user_id, tracking_period)
  DO UPDATE SET
    conversations_count = usage_tracking.conversations_count + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. API Rate Limiting
Implement rate limiting based on tier:

```typescript
// Rate limit middleware
export async function rateLimitByTier(userId: string, endpoint: string) {
  const tier = await getUserTier(userId);
  const limit = tier.max_api_requests_per_month;
  const usage = await getMonthlyAPIUsage(userId);

  if (usage >= limit) {
    throw new Error('API rate limit exceeded for your tier');
  }
}
```

### Upgrade/Downgrade Flow

#### Upgrade Process
1. User selects new tier
2. Payment processed
3. Subscription updated immediately
4. Limits increased immediately
5. Email confirmation sent
6. Old data retained

#### Downgrade Process
1. User requests downgrade
2. System checks if current usage exceeds new tier limits
3. If exceeds:
   - Show warning to user
   - Allow grace period (30 days)
   - Disable creation of new content
   - Prompt user to delete excess content
4. If within limits:
   - Schedule downgrade for end of billing period
   - Confirm via email

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Priority:** HIGH

- [ ] Create database schema (all new tables)
- [ ] Set up admin authentication and RBAC
- [ ] Create basic admin layout and routing
- [ ] Implement audit logging system
- [ ] Create default subscription tiers

**Deliverables:**
- Working admin login
- Database migrations complete
- Admin panel skeleton

### Phase 2: User Management (Week 3-4)
**Priority:** HIGH

- [ ] User list view with search/filter
- [ ] User detail page
- [ ] User actions (ban, suspend, edit)
- [ ] Subscription tier management UI
- [ ] Usage tracking implementation
- [ ] Tier limit enforcement

**Deliverables:**
- Full user management interface
- Tier system fully functional
- Usage limits enforced

### Phase 3: Analytics Dashboard (Week 5-6)
**Priority:** HIGH

- [ ] Dashboard overview with key metrics
- [ ] Charts and visualizations
- [ ] Real-time statistics
- [ ] Usage analytics pages
- [ ] Financial dashboard
- [ ] Export reports functionality

**Deliverables:**
- Complete analytics dashboard
- Data visualization working
- Export functionality

### Phase 4: Avatar & Content Management (Week 7-8)
**Priority:** MEDIUM

- [ ] Avatar management interface
- [ ] Content moderation queue
- [ ] Flagging system
- [ ] Conversation history viewer
- [ ] Bulk actions for avatars

**Deliverables:**
- Avatar management complete
- Moderation tools working

### Phase 5: System Monitoring (Week 9-10)
**Priority:** MEDIUM

- [ ] System health dashboard
- [ ] Error tracking interface
- [ ] Performance monitoring
- [ ] Alert system
- [ ] Configuration management UI

**Deliverables:**
- System monitoring complete
- Alert system active

### Phase 6: Advanced Features (Week 11-12)
**Priority:** LOW

- [ ] Impersonation mode (for support)
- [ ] Advanced reporting
- [ ] Automated moderation
- [ ] A/B testing framework
- [ ] Custom tier creation

**Deliverables:**
- All advanced features complete
- Full admin panel ready for production

---

## Security Considerations

### Authentication & Authorization

#### 1. Super Admin Protection
```typescript
// Only allow super admins for critical actions
const SUPER_ADMIN_ACTIONS = [
  'tier.create',
  'tier.delete',
  'user.permanent_delete',
  'admin.create',
  'settings.payment'
];

async function requireSuperAdmin(userId: string, action: string) {
  if (SUPER_ADMIN_ACTIONS.includes(action)) {
    const admin = await getAdminUser(userId);
    if (admin.role !== 'super_admin') {
      throw new Error('Super admin access required');
    }
  }
}
```

#### 2. Two-Factor Authentication (2FA)
- Mandatory for all admin users
- TOTP-based (Time-based One-Time Password)
- Backup codes generated
- Regular re-authentication for sensitive actions

#### 3. IP Whitelisting
- Restrict admin panel access to specific IPs
- VPN requirement for remote access
- Automatic lockout after failed attempts

#### 4. Session Management
- Short session timeout (30 minutes)
- Automatic logout on inactivity
- Single session per admin user
- Session invalidation on password change

### Data Protection

#### 1. Sensitive Data Access
```typescript
// Log all sensitive data access
async function viewUserConversations(adminId: string, userId: string) {
  await logAuditEvent({
    adminId,
    action: 'conversations.view',
    resourceId: userId,
    justification: 'Support ticket #12345'
  });

  // Require justification for viewing private data
  return await getConversations(userId);
}
```

#### 2. PII Protection
- Mask sensitive data by default
- Require explicit permission to unmask
- Log all unmask actions
- Automatic data retention policies

#### 3. Encryption
- All admin communications over HTTPS
- Database encryption at rest
- Encrypted audit logs
- Secure storage of API keys

### Compliance

#### 1. GDPR Compliance
- Right to access (user data export)
- Right to deletion (complete data removal)
- Right to rectification (data correction)
- Data portability
- Consent management

#### 2. Audit Trail
- All admin actions logged
- 7-year retention for audit logs
- Immutable log storage
- Regular compliance reports

---

## UI/UX Design

### Admin Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│  AvatarLab Admin                            👤 John Doe  │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ 📊 Dashboard  ┌─────────────────────────────────┐      │
│ 👥 Users      │   Platform Overview             │      │
│ 🤖 Avatars    │   ┌──────┐  ┌──────┐  ┌──────┐ │      │
│ 💳 Tiers      │   │ 1,234│  │  543 │  │ $12K │ │      │
│ 📈 Analytics  │   │ Users│  │Avatars│  │  MRR │ │      │
│ 💰 Financial  │   └──────┘  └──────┘  └──────┘ │      │
│ 🛡️ Moderation │                                 │      │
│ ⚙️ Settings   │   📈 Growth Chart               │      │
│ 📋 Audit Logs │   [Line graph showing growth]   │      │
│ 🚨 Alerts     │                                 │      │
│              │   🌍 User Distribution          │      │
│              │   [World map with user pins]    │      │
│              └─────────────────────────────────┘      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Key Pages

#### 1. Dashboard (`/admin`)
- High-level metrics with cards
- Charts showing trends
- Recent activity feed
- Quick actions

#### 2. Users (`/admin/users`)
- Data table with search/filter
- Inline actions (view, edit, ban)
- Bulk selection and actions
- Export to CSV

#### 3. User Detail (`/admin/users/:id`)
- Tabs: Overview, Avatars, Usage, Payments, Activity
- Action buttons: Edit, Ban, Upgrade, Contact
- Timeline of user activity

#### 4. Subscription Tiers (`/admin/tiers`)
- Card view of all tiers
- Comparison table
- Edit tier modal
- Usage statistics per tier

#### 5. Analytics (`/admin/analytics`)
- Multiple dashboards:
  - User analytics
  - Usage analytics
  - Financial analytics
  - Performance analytics
- Date range selector
- Export reports

---

## API Endpoints

### Admin Authentication
```typescript
POST   /api/admin/login
POST   /api/admin/logout
POST   /api/admin/verify-2fa
GET    /api/admin/me
```

### User Management
```typescript
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
POST   /api/admin/users/:id/ban
POST   /api/admin/users/:id/unban
POST   /api/admin/users/:id/upgrade
POST   /api/admin/users/:id/impersonate
GET    /api/admin/users/:id/usage
GET    /api/admin/users/:id/avatars
GET    /api/admin/users/:id/activity
```

### Subscription Tiers
```typescript
GET    /api/admin/tiers
POST   /api/admin/tiers
PUT    /api/admin/tiers/:id
DELETE /api/admin/tiers/:id
GET    /api/admin/tiers/:id/users
GET    /api/admin/tiers/:id/analytics
```

### Analytics
```typescript
GET    /api/admin/analytics/overview
GET    /api/admin/analytics/users
GET    /api/admin/analytics/usage
GET    /api/admin/analytics/revenue
GET    /api/admin/analytics/export
```

### Avatar Management
```typescript
GET    /api/admin/avatars
GET    /api/admin/avatars/:id
DELETE /api/admin/avatars/:id
POST   /api/admin/avatars/:id/flag
GET    /api/admin/avatars/flagged
```

### Audit Logs
```typescript
GET    /api/admin/audit-logs
GET    /api/admin/audit-logs/:id
POST   /api/admin/audit-logs/export
```

---

## Cost Implications

### Development Costs
- **Development Time:** 10-12 weeks (1 full-time developer)
- **Hourly Rate:** ~$50-100/hour
- **Total Dev Cost:** $20,000 - $48,000

### Additional Costs
- **UI Components:** $0 (using existing shadcn-ui)
- **Analytics Libraries:** $0 (Recharts, free)
- **Payment Gateway:** Stripe (2.9% + $0.30 per transaction)
- **Email Service:** SendGrid/Mailgun ($10-50/month)

### Operational Costs (Monthly)
- **Supabase Pro:** $25/month (current, might need upgrade)
- **OpenAI API:** Variable (based on usage)
- **Monitoring Tools:** $0-50/month (optional)
- **CDN/Hosting:** Included in Supabase

### Revenue Potential
Assuming 1000 users across tiers:
- Free: 600 users × $0 = $0
- Starter: 300 users × $9.99 = $2,997
- Pro: 90 users × $29.99 = $2,699
- Enterprise: 10 users × $299 = $2,990

**Monthly Revenue:** ~$8,686
**Annual Revenue:** ~$104,232

---

## Timeline Estimate

### Aggressive Timeline (10 weeks)
- Phase 1: 2 weeks
- Phase 2: 2 weeks
- Phase 3: 2 weeks
- Phase 4: 2 weeks
- Phase 5: 1 week
- Phase 6: 1 week

### Conservative Timeline (16 weeks)
- Phase 1: 3 weeks
- Phase 2: 3 weeks
- Phase 3: 3 weeks
- Phase 4: 3 weeks
- Phase 5: 2 weeks
- Phase 6: 2 weeks

### Recommended Approach
**Start with MVP (6 weeks):**
- Phase 1: Foundation (2 weeks)
- Phase 2: User Management (2 weeks)
- Phase 3: Basic Analytics (2 weeks)

**Then iterate:**
- Gather feedback
- Add features based on priority
- Scale as user base grows

---

## Next Steps

### Before Implementation
1. **Review this document** - Provide feedback on features
2. **Prioritize features** - What's most important?
3. **Budget approval** - Confirm development budget
4. **Timeline confirmation** - When do you need this?

### After Approval
1. Create database migrations
2. Set up admin authentication
3. Build admin UI skeleton
4. Implement features phase by phase
5. Test thoroughly
6. Deploy to production

### Questions to Answer
1. Who will have super admin access initially?
2. What tier limits make sense for your business model?
3. Do you want payment integration now or later?
4. Should we add referral system for user growth?
5. Do you want custom branding for enterprise tier?

---

## Conclusion

This admin panel will give you **complete control** over your AvatarLab platform, allowing you to:
- ✅ Manage users and subscriptions effectively
- ✅ Monitor usage and enforce limits
- ✅ Track revenue and costs
- ✅ Scale the business with different tiers
- ✅ Ensure platform health and security

The implementation is modular, allowing you to start with core features and expand over time as your user base grows.

**Ready to proceed?** Let's review this plan and I'll start implementation!
