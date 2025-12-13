import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LayoutDashboard, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

export const AdminSettings = () => {
  const { adminUser } = useAdminAuth();
  const [defaultDashboard, setDefaultDashboard] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [adminUser]);

  const fetchSettings = async () => {
    if (!adminUser) return;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('default_dashboard')
        .eq('id', adminUser.id)
        .single();

      if (error) {
        console.error('Error fetching admin settings:', error);
        // If column doesn't exist, default to 'user'
        if (error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('default_dashboard column does not exist yet. Please run the migration.');
          toast.error('Please run the database migration for default_dashboard column');
        }
        throw error;
      }

      console.log('Fetched admin settings:', data);
      setDefaultDashboard(data?.default_dashboard || 'user');
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      // Default to 'user' if there's an error
      setDefaultDashboard('user');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!adminUser) return;

    console.log('Saving default_dashboard:', defaultDashboard, 'for admin user ID:', adminUser.id);
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update({ default_dashboard: defaultDashboard })
        .eq('id', adminUser.id)
        .select();

      if (error) {
        console.error('Error updating admin_users:', error);

        // Check if it's a column doesn't exist error
        if (error.message?.includes('column') || error.message?.includes('default_dashboard')) {
          toast.error('❌ Database migration required! Please run: 20251104000008_add_admin_default_dashboard.sql');
          return;
        }

        throw error;
      }

      console.log('Update result:', data);

      // Check if any rows were actually updated
      if (!data || data.length === 0) {
        console.error('No rows updated. This means the default_dashboard column likely does not exist.');
        toast.error('❌ No changes saved! The default_dashboard column does not exist. Please run the migration file.');
        return;
      }

      // Verify the update by fetching the data again
      await fetchSettings();

      toast.success('✅ Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please check console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">Configure your admin preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Dashboard</CardTitle>
          <CardDescription>
            Choose which dashboard to show when you log in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={defaultDashboard}
            onValueChange={(value) => setDefaultDashboard(value as 'user' | 'admin')}
            className="space-y-4"
          >
            {/* User Dashboard Option */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent transition-colors">
              <RadioGroupItem value="user" id="user-dashboard" className="mt-1" />
              <Label
                htmlFor="user-dashboard"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <span className="font-semibold">User Dashboard</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start with the regular user dashboard and switch to admin panel when needed
                </p>
              </Label>
            </div>

            {/* Admin Dashboard Option */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent transition-colors">
              <RadioGroupItem value="admin" id="admin-dashboard" className="mt-1" />
              <Label
                htmlFor="admin-dashboard"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Admin Panel</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start directly in the admin panel with full platform management
                </p>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              You can always switch between dashboards using the sidebar buttons
            </p>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This setting only affects your initial landing page after login.
            You can easily switch between user and admin dashboards at any time using the toggle
            buttons in the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
