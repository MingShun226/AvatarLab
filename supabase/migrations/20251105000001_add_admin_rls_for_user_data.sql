-- Add RLS policies to allow admin users to view all user data

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generated Images: Allow admins to view all images
CREATE POLICY "Admins can view all generated images"
ON public.generated_images
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Avatar Memories: Allow admins to view all memories
CREATE POLICY "Admins can view all avatar memories"
ON public.avatar_memories
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Knowledge Files: Allow admins to view all knowledge files
CREATE POLICY "Admins can view all knowledge files"
ON public.avatar_knowledge_files
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Fine-tune Jobs: Allow admins to view all training jobs
CREATE POLICY "Admins can view all fine tune jobs"
ON public.avatar_fine_tune_jobs
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Conversations: Allow admins to view all conversations
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Image Collections: Allow admins to view all image collections
CREATE POLICY "Admins can view all image collections"
ON public.image_collections
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Image Collection Items: Allow admins to view all collection items
CREATE POLICY "Admins can view all image collection items"
ON public.image_collection_items
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Memory Categories: Allow admins to view all memory categories
CREATE POLICY "Admins can view all memory categories"
ON public.memory_categories
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Memory Category Mappings: Allow admins to view all memory category mappings
CREATE POLICY "Admins can view all memory category mappings"
ON public.memory_category_mappings
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Avatar Training Files: Allow admins to view all training files
CREATE POLICY "Admins can view all avatar training files"
ON public.avatar_training_files
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Avatar Training Data: Allow admins to view all training data
CREATE POLICY "Admins can view all avatar training data"
ON public.avatar_training_data
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Storage: Allow admins to view all knowledge files in storage
CREATE POLICY "Admins can view all knowledge files in storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge-base'
  AND public.is_admin()
);
