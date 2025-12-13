import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { AdminUser } from '@/types/admin';

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useState(() => ({ current: false }))[0];

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;

      if (!user) {
        setAdminUser(null);
        setIsAdmin(false);
        setLoading(false);
        hasCheckedRef.current = false;
        return;
      }

      // Prevent duplicate checks for the same user
      if (hasCheckedRef.current) {
        return;
      }

      hasCheckedRef.current = true;

      try {
        // Query admin_users table to check if user is an admin
        console.log('[AdminAuth] Checking admin status for user:', user.id);

        const { data, error: queryError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (queryError) {
          // Handle various error codes silently for non-admin users
          if (queryError.code === 'PGRST116' || queryError.code === '406' || queryError.message?.includes('406')) {
            // No rows returned or not acceptable - user is not an admin (silently ignore)
            console.log('[AdminAuth] User is not an admin (no record found)');
            setAdminUser(null);
            setIsAdmin(false);
          } else {
            // Only log unexpected errors as warnings
            console.warn('[AdminAuth] Admin status check error:', queryError.code || queryError.message);
            setAdminUser(null);
            setIsAdmin(false);
          }
        } else {
          console.log('[AdminAuth] Admin user found:', data.role);
          setAdminUser(data as AdminUser);
          setIsAdmin(true);

          // Update last_login_at (fire and forget, don't await)
          supabase
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.id)
            .then(() => {})
            .catch(() => {});
        }
      } catch (err) {
        // Silently handle errors - admin check is not critical
        console.warn('[AdminAuth] Exception during admin check:', err);
        setAdminUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, hasCheckedRef]);

  const hasPermission = (resource: string, action: 'read' | 'write' | 'delete'): boolean => {
    if (!adminUser || !adminUser.permissions) return false;

    const resourcePermissions = adminUser.permissions[resource as keyof typeof adminUser.permissions];
    if (!resourcePermissions) return false;

    return resourcePermissions[action] === true;
  };

  const isSuperAdmin = (): boolean => {
    return adminUser?.role === 'super_admin';
  };

  return {
    adminUser,
    isAdmin,
    loading,
    error,
    hasPermission,
    isSuperAdmin,
  };
};
