-- Fix the refresh_deleted_avatars_view function to avoid DELETE without WHERE clause
CREATE OR REPLACE FUNCTION public.refresh_deleted_avatars_view()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Clear the table using TRUNCATE instead of DELETE without WHERE
  TRUNCATE TABLE public.deleted_avatars;
  
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
$function$