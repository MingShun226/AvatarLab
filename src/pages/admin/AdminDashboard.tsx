import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, MessageSquare, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { PlatformStatistics } from '@/types/admin';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_overview');

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      description: 'All registered users',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Active Users (7d)',
      value: stats?.active_users_7d || 0,
      description: 'Active in last 7 days',
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Active Users (30d)',
      value: stats?.active_users_30d || 0,
      description: 'Active in last 30 days',
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Total Avatars',
      value: stats?.total_avatars || 0,
      description: 'Avatars created on platform',
      icon: Bot,
      color: 'text-purple-500',
    },
    {
      title: 'Total Conversations',
      value: stats?.total_conversations || 0,
      description: 'All conversations',
      icon: MessageSquare,
      color: 'text-orange-500',
    },
    {
      title: 'Monthly Recurring Revenue',
      value: `$${(stats?.mrr || 0).toFixed(2)}`,
      description: 'Current MRR',
      icon: DollarSign,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Welcome to the AvatarLab Admin Panel. Monitor platform statistics and manage users.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <a
            href="/admin/users"
            className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
          >
            <Users className="h-8 w-8 mb-2 text-primary" />
            <span className="font-medium">Manage Users</span>
          </a>
          <a
            href="/admin/tiers"
            className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
          >
            <DollarSign className="h-8 w-8 mb-2 text-primary" />
            <span className="font-medium">Manage Tiers</span>
          </a>
          <a
            href="/admin/statistics"
            className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
          >
            <TrendingUp className="h-8 w-8 mb-2 text-primary" />
            <span className="font-medium">View Statistics</span>
          </a>
          <a
            href="/admin/audit-logs"
            className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
          >
            <MessageSquare className="h-8 w-8 mb-2 text-primary" />
            <span className="font-medium">Audit Logs</span>
          </a>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Activity feed will be displayed here</p>
            <p className="text-sm mt-2">Showing user registrations, avatar creations, and more</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
