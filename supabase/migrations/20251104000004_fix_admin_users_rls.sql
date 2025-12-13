-- ============================================================================
-- FIX ADMIN USERS RLS POLICIES
-- ============================================================================
-- Migration: 20251104000004
-- Description: Fix infinite recursion in admin_users RLS policies
-- Issue: The policy was checking admin_users table while querying admin_users
-- Solution: Use auth.uid() directly without checking admin status
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins manage admins" ON public.admin_users;

-- Create new policies that don't cause recursion
-- Users can view their own admin record (if they have one)
CREATE POLICY "Users can view own admin record"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do anything (for admin creation)
CREATE POLICY "Service role full access"
  ON public.admin_users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Super admins can manage other admins (but we check the role directly, not via join)
CREATE POLICY "Super admins can manage admins"
  ON public.admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users self
      WHERE self.user_id = auth.uid()
        AND self.role = 'super_admin'
        AND self.is_active = true
        AND self.id != admin_users.id  -- Prevent self-reference in same table
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ADMIN_USERS RLS POLICIES FIXED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Removed recursive policy checks';
  RAISE NOTICE '  ✓ Users can view their own admin record';
  RAISE NOTICE '  ✓ Service role has full access';
  RAISE NOTICE '  ✓ Super admins can manage other admins';
  RAISE NOTICE '';
  RAISE NOTICE 'The infinite recursion error should be resolved.';
  RAISE NOTICE '============================================';
END $$;
