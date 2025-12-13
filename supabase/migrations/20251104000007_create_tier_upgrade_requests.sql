-- ============================================================================
-- CREATE TIER UPGRADE REQUESTS TABLE
-- ============================================================================
-- Migration: 20251104000007
-- Description: Table to store user tier upgrade requests for admin approval
-- ============================================================================

-- Create tier_upgrade_requests table
CREATE TABLE IF NOT EXISTS public.tier_upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  current_tier_id UUID REFERENCES public.subscription_tiers(id),

  -- Request details
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason TEXT,

  -- Admin review
  reviewed_by UUID REFERENCES public.admin_users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tier_upgrade_requests_user
  ON public.tier_upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_upgrade_requests_status
  ON public.tier_upgrade_requests(status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tier_upgrade_requests_created
  ON public.tier_upgrade_requests(created_at DESC);

-- Comments
COMMENT ON TABLE public.tier_upgrade_requests IS 'User requests to upgrade their subscription tier';
COMMENT ON COLUMN public.tier_upgrade_requests.status IS 'pending, approved, rejected, cancelled';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_tier_upgrade_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tier_upgrade_requests_updated_at
  BEFORE UPDATE ON public.tier_upgrade_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_upgrade_requests_updated_at();

-- Enable RLS
ALTER TABLE public.tier_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own upgrade requests"
  ON public.tier_upgrade_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own upgrade requests
CREATE POLICY "Users can create upgrade requests"
  ON public.tier_upgrade_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can cancel their own pending requests
CREATE POLICY "Users can cancel own requests"
  ON public.tier_upgrade_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON public.tier_upgrade_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Admins can manage all requests
CREATE POLICY "Admins can manage all requests"
  ON public.tier_upgrade_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.tier_upgrade_requests TO authenticated;
GRANT ALL ON public.tier_upgrade_requests TO service_role;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TIER UPGRADE REQUESTS TABLE CREATED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  ✓ Request tier upgrades';
  RAISE NOTICE '  ✓ View their own requests';
  RAISE NOTICE '  ✓ Cancel pending requests';
  RAISE NOTICE '';
  RAISE NOTICE 'Admins can now:';
  RAISE NOTICE '  ✓ View all upgrade requests';
  RAISE NOTICE '  ✓ Approve or reject requests';
  RAISE NOTICE '  ✓ Add admin notes';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
