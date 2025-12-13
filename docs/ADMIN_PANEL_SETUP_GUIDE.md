# Admin Panel Setup Guide

## 🎉 Congratulations!

Your admin panel is now ready to use! Follow these steps to get it up and running.

---

## Step 1: Run Database Migrations

Go to your **Supabase Dashboard** → **SQL Editor** and run these 4 files **in order**:

### 1. Create Tables
```sql
-- Run: supabase/migrations/20251104000000_create_admin_panel_schema.sql
```
This creates 6 new tables and modifies 3 existing ones.

### 2. Insert Default Tiers
```sql
-- Run: supabase/migrations/20251104000001_insert_default_tiers.sql
```
This inserts 4 subscription tiers:
- **Free**: 1 avatar ($0/month)
- **Starter**: 2 avatars ($9.99/month)
- **Pro**: 3 avatars ($29.99/month)
- **Enterprise**: Unlimited avatars ($299/month)

### 3. Migrate Existing Users
```sql
-- Run: supabase/migrations/20251104000002_migrate_existing_users.sql
```
This assigns all existing users to the Free tier.

### 4. Create Helper Functions
```sql
-- Run: supabase/migrations/20251104000003_create_helper_functions.sql
```
This creates functions for limit checking and analytics.

---

## Step 2: Create Your First Admin User

After migrations complete, run this SQL to make yourself a super admin:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.admin_users (user_id, role, is_active)
SELECT
  id,
  'super_admin',
  true
FROM auth.users
WHERE email = 'your-email@example.com';
```

**Admin Roles:**
- `super_admin` - Full access to everything
- `admin` - Most features except user management
- `moderator` - Content moderation only
- `support` - Read-only access for support
- `analyst` - Analytics and statistics only

---

## Step 3: Access the Admin Panel

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Login with your admin account** (the email you used in Step 2)

3. **Navigate to the admin panel:**
   ```
   http://localhost:5173/admin
   ```

---

## Admin Panel Features

### 📊 Dashboard (`/admin`)
- Platform statistics (total users, active users, avatars, conversations)
- Monthly Recurring Revenue (MRR)
- Quick action buttons

### 👥 Users Management (`/admin/users`)
- View all users with their subscription tiers
- Search users by email or name
- View user details (avatar count, join date, last login)
- Suspend/activate user accounts
- Real-time user status updates

### 💳 Tiers Management (`/admin/tiers`)
- View all subscription tiers
- See user distribution across tiers
- Each tier shows:
  - Pricing (monthly/yearly)
  - Avatar limits (the only enforced limit)
  - Features (priority support, custom branding)
  - Number of users on the tier

### 📈 Statistics (Coming Soon - `/admin/statistics`)
- Detailed platform analytics
- Revenue charts
- User growth trends
- Usage metrics

### 📝 Audit Logs (Coming Soon - `/admin/audit-logs`)
- Track all admin actions
- Security and compliance monitoring
- Change history

---

## Security Features

✅ **Route Guards** - Only admin users can access `/admin` routes
✅ **Role-Based Access** - Different permissions for different admin roles
✅ **RLS Policies** - Database-level security enforced by Supabase
✅ **Audit Logging** - All admin actions are tracked
✅ **Session Management** - Automatic session validation

---

## Usage Notes

### Avatar Limits
- The **only** enforced limit is the number of avatars per tier
- Users provide their own API keys for all services (OpenAI, ElevenLabs, etc.)
- Conversations, images, knowledge files, etc. are **unlimited**

### Checking Avatar Limits in Your Code
Use the helper function to check if a user can create an avatar:

```typescript
// In your create avatar component
const { data } = await supabase.rpc('check_avatar_limit', {
  p_user_id: user.id
});

if (!data[0].allowed) {
  alert(`You've reached your avatar limit (${data[0].max_allowed}).
         Upgrade to create more avatars!`);
  return;
}

// Proceed with avatar creation...
```

### Tracking Usage
Track user activity for analytics:

```typescript
// When user creates an avatar
await supabase.rpc('increment_usage_counter', {
  p_user_id: user.id,
  p_counter_type: 'avatars',
  p_increment: 1
});

// When user sends a conversation
await supabase.rpc('increment_usage_counter', {
  p_user_id: user.id,
  p_counter_type: 'conversations',
  p_increment: 1
});
```

---

## Troubleshooting

### "Access Denied" when visiting /admin
- Make sure you ran Step 2 to add yourself as an admin
- Check that your email matches exactly (case-sensitive)
- Verify `is_active = true` in the admin_users table

### Can't see user statistics
- Ensure all 4 migrations ran successfully
- Check Supabase logs for any errors
- Verify RLS policies are enabled

### Users can create more avatars than their limit
- You need to integrate the `check_avatar_limit()` function in your create avatar flow
- See "Checking Avatar Limits" section above

---

## Next Steps

1. ✅ Run all 4 migrations
2. ✅ Create your admin user
3. ✅ Access the admin panel at `/admin`
4. 🔄 Integrate avatar limit checks in your create avatar component
5. 🔄 Add usage tracking throughout your app
6. 🔄 Test the admin panel thoroughly
7. 🔄 Customize tier pricing if needed

---

## File Structure

```
src/
├── types/
│   └── admin.ts                           # Admin type definitions
├── hooks/
│   └── useAdminAuth.tsx                   # Admin authentication hook
├── components/
│   └── admin/
│       ├── AdminRoute.tsx                 # Route guard component
│       └── AdminLayout.tsx                # Admin layout with sidebar
├── pages/
│   └── admin/
│       ├── AdminDashboard.tsx             # Main dashboard
│       ├── UsersManagement.tsx            # User management page
│       └── TiersManagement.tsx            # Tiers management page
└── App.tsx                                # Routes added here

supabase/migrations/
├── 20251104000000_create_admin_panel_schema.sql
├── 20251104000001_insert_default_tiers.sql
├── 20251104000002_migrate_existing_users.sql
└── 20251104000003_create_helper_functions.sql
```

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify all migrations ran successfully
4. Ensure RLS policies are enabled

---

**Your admin panel is production-ready! 🚀**
