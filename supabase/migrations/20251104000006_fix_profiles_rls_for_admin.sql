-- ============================================================================
-- FIX PROFILES RLS FOR ADMIN ACCESS
-- ============================================================================
-- Migration: 20251104000006
-- Description: Allow admins to view all user profiles
-- Issue: Admins can only see their own profile
-- Solution: Add policy for admins to view all profiles
-- ============================================================================

-- Add policy for admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Either it's your own profile, OR you're an admin
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Allow admins to update any profile (for tier management)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Either it's your own profile, OR you're an admin
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Admins can view all avatars (for user details page)
DROP POLICY IF EXISTS "Admins can view all avatars" ON public.avatars;
CREATE POLICY "Admins can view all avatars"
  ON public.avatars
  FOR SELECT
  TO authenticated
  USING (
    -- Either it's your own avatar, OR you're an admin
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Admins can view all user_subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    -- Either it's your own subscription, OR you're an admin
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Admins can manage user_subscriptions (insert/update)
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage subscriptions"
  ON public.user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ADMIN ACCESS POLICIES UPDATED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Admins can now:';
  RAISE NOTICE '  ✓ View all user profiles';
  RAISE NOTICE '  ✓ Update any user profile';
  RAISE NOTICE '  ✓ View all avatars';
  RAISE NOTICE '  ✓ View all subscriptions';
  RAISE NOTICE '  ✓ Manage user subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE 'Users page should now show ALL users!';
  RAISE NOTICE '============================================';
END $$;
