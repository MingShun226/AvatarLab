-- Allow admins to update their own settings in admin_users table
-- This enables the default_dashboard preference to be saved

-- Add UPDATE policy for admins to update their own record
CREATE POLICY "Update own admin settings"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant UPDATE permission to authenticated users
GRANT UPDATE ON public.admin_users TO authenticated;

COMMENT ON POLICY "Update own admin settings" ON public.admin_users IS
  'Allows admins to update their own settings like default_dashboard preference';
