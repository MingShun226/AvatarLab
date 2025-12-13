-- ============================================================================
-- CREATE ADMIN USER ON PRODUCTION
-- ============================================================================
-- This script adds your user account as a super admin in the admin_users table
-- Run this in your Supabase SQL Editor on PRODUCTION
-- ============================================================================

-- STEP 1: Find your user ID
-- Run this to find your user ID from your email:
SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com'; -- REPLACE WITH YOUR EMAIL

-- STEP 2: Create admin user record
-- Copy your user ID from step 1 and paste it below
INSERT INTO public.admin_users (
  user_id,
  role,
  is_active,
  permissions,
  created_at
) VALUES (
  'YOUR_USER_ID_HERE', -- REPLACE WITH YOUR USER ID FROM STEP 1
  'super_admin',
  true,
  '{
    "users": {"read": true, "write": true, "delete": true},
    "avatars": {"read": true, "write": true, "delete": true},
    "tiers": {"read": true, "write": true, "delete": true},
    "financial": {"read": true, "write": true, "delete": false},
    "settings": {"read": true, "write": true, "delete": false},
    "moderation": {"read": true, "write": true, "delete": true}
  }'::jsonb,
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- STEP 3: Verify the admin user was created
SELECT
  au.id,
  au.user_id,
  au.role,
  au.is_active,
  u.email,
  au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE au.is_active = true;

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this, refresh your application and the Admin Panel button
-- should appear in your sidebar.
-- ============================================================================
