
-- Add status and deletion tracking columns to avatars table
ALTER TABLE public.avatars 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS scheduled_hard_delete_at TIMESTAMP WITH TIME ZONE;

-- Add status and deletion tracking columns to avatar_knowledge_files table
ALTER TABLE public.avatar_knowledge_files 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS scheduled_hard_delete_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies for avatars to only show active records by default
DROP POLICY IF EXISTS "Users can view their own avatars" ON public.avatars;
CREATE POLICY "Users can view their own active avatars" 
  ON public.avatars 
  FOR SELECT 
  USING (auth.uid() = user_id AND status = 'active');

-- Create policy for viewing deleted avatars (for recovery purposes)
CREATE POLICY "Users can view their own deleted avatars for recovery" 
  ON public.avatars 
  FOR SELECT 
  USING (auth.uid() = user_id AND status = 'deleted');

-- Update RLS policies for avatar_knowledge_files to only show active records
DROP POLICY IF EXISTS "Users can view their own avatar knowledge files" ON public.avatar_knowledge_files;
CREATE POLICY "Users can view their own active avatar knowledge files" 
  ON public.avatar_knowledge_files 
  FOR SELECT 
  USING (auth.uid() = user_id AND status = 'active');

-- Create policy for viewing deleted knowledge files (for recovery purposes)
CREATE POLICY "Users can view their own deleted avatar knowledge files for recovery" 
  ON public.avatar_knowledge_files 
  FOR SELECT 
  USING (auth.uid() = user_id AND status = 'deleted');

-- Create function to handle soft delete of avatars and related data
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
END;
$$;

-- Create function to restore soft deleted avatars and related data
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
END;
$$;

-- Create function for hard delete cleanup (to be run by cron job)
CREATE OR REPLACE FUNCTION public.cleanup_hard_delete_avatars()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hard delete knowledge files that are past their scheduled deletion date
  DELETE FROM public.avatar_knowledge_files 
  WHERE status = 'deleted' AND scheduled_hard_delete_at <= NOW();
  
  -- Hard delete avatars that are past their scheduled deletion date
  DELETE FROM public.avatars 
  WHERE status = 'deleted' AND scheduled_hard_delete_at <= NOW();
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_avatars_status ON public.avatars(status);
CREATE INDEX IF NOT EXISTS idx_avatars_user_status ON public.avatars(user_id, status);
CREATE INDEX IF NOT EXISTS idx_avatars_scheduled_delete ON public.avatars(scheduled_hard_delete_at) WHERE status = 'deleted';
CREATE INDEX IF NOT EXISTS idx_knowledge_files_status ON public.avatar_knowledge_files(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_user_status ON public.avatar_knowledge_files(user_id, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_scheduled_delete ON public.avatar_knowledge_files(scheduled_hard_delete_at) WHERE status = 'deleted';

-- Create a view for deleted avatars (for admin recovery purposes)
CREATE OR REPLACE VIEW public.deleted_avatars AS
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.soft_delete_avatar(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_avatar(UUID) TO authenticated;
GRANT SELECT ON public.deleted_avatars TO authenticated;
