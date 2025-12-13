# Admin Panel Setup for Production

## Problem
The Admin Panel button appears on localhost but not on production (Vercel).

## Cause
Your production Supabase database doesn't have your user account in the `admin_users` table.

## Solution

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Find Your User ID**
   ```sql
   SELECT id, email, created_at
   FROM auth.users
   WHERE email = 'your-email@example.com';
   ```
   - Copy your `id` (user UUID)

4. **Create Admin User Record**
   ```sql
   INSERT INTO public.admin_users (
     user_id,
     role,
     is_active,
     permissions
   ) VALUES (
     'YOUR_USER_ID_HERE',  -- Paste your user ID from step 3
     'super_admin',
     true,
     '{
       "users": {"read": true, "write": true, "delete": true},
       "avatars": {"read": true, "write": true, "delete": true},
       "tiers": {"read": true, "write": true, "delete": true},
       "financial": {"read": true, "write": true, "delete": false},
       "settings": {"read": true, "write": true, "delete": false},
       "moderation": {"read": true, "write": true, "delete": true}
     }'::jsonb
   )
   ON CONFLICT (user_id) DO UPDATE SET
     role = 'super_admin',
     is_active = true;
   ```

5. **Verify**
   ```sql
   SELECT
     au.id,
     au.user_id,
     au.role,
     au.is_active,
     u.email
   FROM public.admin_users au
   JOIN auth.users u ON u.id = au.user_id
   WHERE au.is_active = true;
   ```

6. **Refresh Your App**
   - Log out and log back in on production
   - The Admin Panel button should now appear

### Option 2: Using SQL Script

1. Open [create_admin_user.sql](../scripts/create_admin_user.sql)
2. Replace `YOUR_EMAIL@example.com` with your email
3. Run STEP 1 to find your user ID
4. Replace `YOUR_USER_ID_HERE` with your actual user ID
5. Run STEP 2 to create the admin user
6. Run STEP 3 to verify

## Troubleshooting

### Admin Panel Still Not Showing

1. **Check Database**
   ```sql
   SELECT * FROM public.admin_users WHERE user_id = auth.uid();
   ```
   - Should return 1 row with `is_active = true`

2. **Check RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'admin_users';
   ```
   - Policy "Admins view admin_users" should exist

3. **Check Migrations**
   - Verify all migrations have been applied on production
   - Check Supabase Dashboard → Database → Migrations

4. **Clear Cache**
   - Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear application data
   - Log out and log back in

### Check Browser Console

Open browser console (F12) and check for errors:
- Look for 404, 406, or other errors when loading
- Check Network tab for failed requests to `/admin_users`

## Security Notes

- Never commit admin user IDs to git
- Use strong passwords for admin accounts
- Enable 2FA for admin accounts (future feature)
- Regularly review admin audit logs

## Next Steps

After setting up admin access:
1. Create default subscription tiers
2. Migrate existing users to tiers
3. Set up billing integration
4. Configure platform settings
