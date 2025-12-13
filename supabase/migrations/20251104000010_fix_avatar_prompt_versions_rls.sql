-- Fix RLS policies for avatar_prompt_versions to allow admins to view prompt data

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their avatar prompts" ON public.avatar_prompt_versions;
DROP POLICY IF EXISTS "Admins can view all avatar prompts" ON public.avatar_prompt_versions;

-- Enable RLS on the table
ALTER TABLE public.avatar_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own avatar prompts
CREATE POLICY "Users can view their avatar prompts"
  ON public.avatar_prompt_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.avatars
      WHERE avatars.id = avatar_prompt_versions.avatar_id
        AND avatars.user_id = auth.uid()
    )
  );

-- Policy: Admins can view all avatar prompts
CREATE POLICY "Admins can view all avatar prompts"
  ON public.avatar_prompt_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
  );

-- Grant SELECT permission
GRANT SELECT ON public.avatar_prompt_versions TO authenticated;

COMMENT ON POLICY "Users can view their avatar prompts" ON public.avatar_prompt_versions IS
  'Users can view prompt versions for their own avatars';

COMMENT ON POLICY "Admins can view all avatar prompts" ON public.avatar_prompt_versions IS
  'Admins can view all avatar prompt versions for management purposes';
