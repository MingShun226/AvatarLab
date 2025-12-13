import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, Clock, ArrowUp, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SubscriptionTier } from '@/types/admin';

interface UpgradeRequest {
  id: string;
  user_id: string;
  requested_tier_id: string;
  current_tier_id: string | null;
  status: string;
  created_at: string;
  user: {
    email: string;
    name: string;
  };
  requested_tier: {
    display_name: string;
    price_monthly: number;
  };
  current_tier: {
    display_name: string;
  } | null;
}

export const TiersManagementNew = () => {
  const { adminUser } = useAdminAuth();
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchUpgradeRequests(),
        fetchTiers(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpgradeRequests = async () => {
    try {
      // First get the requests
      const { data: requests, error: requestsError } = await supabase
        .from('tier_upgrade_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Then enrich with user and tier data
      const enrichedRequests = await Promise.all(
        (requests || []).map(async (req) => {
          // Get user info
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', req.user_id)
            .single();

          // Get requested tier info
          const { data: requestedTier } = await supabase
            .from('subscription_tiers')
            .select('display_name, price_monthly')
            .eq('id', req.requested_tier_id)
            .single();

          // Get current tier info
          let currentTier = null;
          if (req.current_tier_id) {
            const { data: current } = await supabase
              .from('subscription_tiers')
              .select('display_name')
              .eq('id', req.current_tier_id)
              .single();
            currentTier = current;
          }

          return {
            id: req.id,
            user_id: req.user_id,
            requested_tier_id: req.requested_tier_id,
            current_tier_id: req.current_tier_id,
            status: req.status,
            created_at: req.created_at,
            user: {
              email: profile?.email || 'Unknown',
              name: profile?.name || 'Unknown',
            },
            requested_tier: requestedTier || { display_name: 'Unknown', price_monthly: 0 },
            current_tier: currentTier,
          };
        })
      );

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error fetching upgrade requests:', error);
    }
  };

  const fetchTiers = async () => {
    try {
      const { data: tiersData, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (tiersError) throw tiersError;
      setTiers(tiersData || []);

      // Fetch user counts for each tier
      const counts: Record<string, number> = {};
      for (const tier of tiersData || []) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_tier_id', tier.id);

        counts[tier.id] = count || 0;
      }
      setUserCounts(counts);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const handleApproveRequest = async (request: UpgradeRequest) => {
    try {
      // Update user's tier
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier_id: request.requested_tier_id })
        .eq('id', request.user_id);

      if (profileError) throw profileError;

      // Update or create user subscription
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: request.user_id,
          tier_id: request.requested_tier_id,
          status: 'active',
          billing_cycle: 'monthly',
          started_at: new Date().toISOString(),
        });

      if (subError) throw subError;

      // Update request status
      const { error: requestError } = await supabase
        .from('tier_upgrade_requests')
        .update({
          status: 'approved',
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      alert(`Upgrade request approved! ${request.user.name} is now on ${request.requested_tier.display_name}`);
      await fetchData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('tier_upgrade_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      alert('Upgrade request rejected');
      await fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: Check },
      rejected: { variant: 'destructive', icon: X },
    };

    const config = variants[status] || { variant: 'secondary', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const reviewedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tier Management</h2>
        <p className="text-muted-foreground">Manage subscription tiers and upgrade requests</p>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">
            Upgrade Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="tiers">Tier Overview</TabsTrigger>
        </TabsList>

        {/* Upgrade Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>
                User requests waiting for your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending upgrade requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Tier</TableHead>
                      <TableHead>Requested Tier</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {request.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.current_tier?.display_name || 'No tier'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-4 w-4 text-green-500" />
                            <Badge variant="default">
                              {request.requested_tier.display_name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ${request.requested_tier.price_monthly}/mo
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Reviewed Requests History */}
          {reviewedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Request History</CardTitle>
                <CardDescription>Previously reviewed upgrade requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Requested Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewedRequests.slice(0, 10).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="text-sm">{request.user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.requested_tier.display_name}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tiers Overview Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <Card key={tier.id}>
                <CardHeader>
                  <CardTitle>{tier.display_name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">
                    ${tier.price_monthly}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tier.max_avatars === -1 ? 'Unlimited' : tier.max_avatars} avatars
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{userCounts[tier.id] || 0}</strong> users
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
