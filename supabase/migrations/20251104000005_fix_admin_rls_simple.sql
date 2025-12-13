-- ============================================================================
-- SIMPLE FIX FOR ADMIN USERS RLS
-- ============================================================================
-- Migration: 20251104000005
-- Description: Remove ALL policies causing recursion and use simple auth check
-- Solution: Let authenticated users read their own admin record, that's it!
-- ============================================================================

-- Drop ALL existing policies on admin_users
DROP POLICY IF EXISTS "Admins view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins manage admins" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Service role full access" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admin_users;

-- Create ONE simple policy: users can only view their own admin record
CREATE POLICY "View own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role to do everything (for admin creation via SQL)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ADMIN RLS SIMPLIFIED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New Policy:';
  RAISE NOTICE '  ✓ Users can view ONLY their own admin record';
  RAISE NOTICE '  ✓ No recursion possible';
  RAISE NOTICE '  ✓ Service role can manage all admin records';
  RAISE NOTICE '';
  RAISE NOTICE 'All recursive policies removed!';
  RAISE NOTICE '============================================';
END $$;
