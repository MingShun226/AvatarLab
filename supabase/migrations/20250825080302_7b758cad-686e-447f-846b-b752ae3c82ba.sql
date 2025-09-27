-- Fix security vulnerability: Add RLS policies to deleted_avatars view
-- Enable RLS on the deleted_avatars view
ALTER VIEW public.deleted_avatars SET (security_barrier = true);

-- Revoke the overly permissive grant
REVOKE SELECT ON public.deleted_avatars FROM authenticated;

-- Drop the existing view and recreate it as a table with proper RLS
DROP VIEW IF EXISTS public.deleted_avatars;

-- Create deleted_avatars as a proper table with RLS
CREATE TABLE IF NOT EXISTS public.deleted_avatars (
  id UUID,
  user_id UUID,
  name TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID,
  deletion_reason TEXT,
  scheduled_hard_delete_at TIMESTAMP WITH TIME ZONE,
  days_until_hard_delete NUMERIC
);

-- Enable RLS on the table
ALTER TABLE public.deleted_avatars ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only view their own deleted avatars
CREATE POLICY "Users can view their own deleted avatars" 
  ON public.deleted_avatars 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create function to populate deleted_avatars table (security definer for admin access)
CREATE OR REPLACE FUNCTION public.refresh_deleted_avatars_view()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear the table
  DELETE FROM public.deleted_avatars;
  
  -- Populate with current deleted avatars
  INSERT INTO public.deleted_avatars (
    id, user_id, name, deleted_at, deleted_by, 
    deletion_reason, scheduled_hard_delete_at, days_until_hard_delete
  )
  SELECT 
    id,
    user_id,
    name,
    deleted_at,
    deleted_by,
    deletion_reason,
    scheduled_hard_delete_at,
    EXTRACT(DAYS FROM (scheduled_hard_delete_at - NOW())) AS days_until_hard_delete
  FROM public.avatars 
  WHERE status = 'deleted'
  ORDER BY deleted_at DESC;
END;
$$;

-- Update the soft_delete_avatar function to maintain the deleted_avatars table
CREATE OR REPLACE FUNCTION public.soft_delete_avatar(
  avatar_id_param UUID,
  deletion_reason_param TEXT DEFAULT 'User requested deletion'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hard_delete_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate hard delete date (90 days from now)
  hard_delete_date := NOW() + INTERVAL '90 days';
  
  -- Soft delete the avatar
  UPDATE public.avatars 
  SET 
    status = 'deleted',
    deleted_at = NOW(),
    deleted_by = auth.uid(),
    deletion_reason = deletion_reason_param,
    scheduled_hard_delete_at = hard_delete_date,
    updated_at = NOW()
  WHERE id = avatar_id_param AND user_id = auth.uid() AND status = 'active';
  
  -- Soft delete all related knowledge files
  UPDATE public.avatar_knowledge_files 
  SET 
    status = 'deleted',
    deleted_at = NOW(),
    deleted_by = auth.uid(),
    deletion_reason = 'Parent avatar deleted',
    scheduled_hard_delete_at = hard_delete_date,
    updated_at = NOW()
  WHERE avatar_id = avatar_id_param AND user_id = auth.uid() AND status = 'active';
  
  -- Refresh the deleted avatars view
  PERFORM public.refresh_deleted_avatars_view();
END;
$$;

-- Update the restore_avatar function to maintain the deleted_avatars table
CREATE OR REPLACE FUNCTION public.restore_avatar(
  avatar_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Restore the avatar
  UPDATE public.avatars 
  SET 
    status = 'active',
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    scheduled_hard_delete_at = NULL,
    updated_at = NOW()
  WHERE id = avatar_id_param AND user_id = auth.uid() AND status = 'deleted';
  
  -- Restore all related knowledge files
  UPDATE public.avatar_knowledge_files 
  SET 
    status = 'active',
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    scheduled_hard_delete_at = NULL,
    updated_at = NOW()
  WHERE avatar_id = avatar_id_param AND user_id = auth.uid() AND status = 'deleted';
  
  -- Refresh the deleted avatars view
  PERFORM public.refresh_deleted_avatars_view();
END;
$$;

-- Initial population of the deleted_avatars table
SELECT public.refresh_deleted_avatars_view();

-- Grant appropriate permissions
GRANT SELECT ON public.deleted_avatars TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_deleted_avatars_view() TO service_role;