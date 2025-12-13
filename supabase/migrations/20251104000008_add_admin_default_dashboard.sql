-- Add default_dashboard preference to admin_users table
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS default_dashboard VARCHAR(20) DEFAULT 'user'
  CHECK (default_dashboard IN ('user', 'admin'));

COMMENT ON COLUMN public.admin_users.default_dashboard IS 'Default dashboard to show on login: user or admin';
