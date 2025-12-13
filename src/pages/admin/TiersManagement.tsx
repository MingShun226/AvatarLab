import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Users as UsersIcon, Building2 } from 'lucide-react';
import type { SubscriptionTier } from '@/types/admin';

export const TiersManagement = () => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      // Fetch tiers
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
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free':
        return <UsersIcon className="h-8 w-8" />;
      case 'starter':
        return <Zap className="h-8 w-8" />;
      case 'pro':
        return <Crown className="h-8 w-8" />;
      case 'enterprise':
        return <Building2 className="h-8 w-8" />;
      default:
        return <UsersIcon className="h-8 w-8" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free':
        return 'text-gray-500';
      case 'starter':
        return 'text-blue-500';
      case 'pro':
        return 'text-purple-500';
      case 'enterprise':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
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
        <h2 className="text-2xl font-bold tracking-tight">Subscription Tiers</h2>
        <p className="text-muted-foreground">Manage pricing plans and avatar limits</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={tier.is_featured ? 'border-primary shadow-lg' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`${getTierColor(tier.name)}`}>
                  {getTierIcon(tier.name)}
                </div>
                {tier.is_featured && (
                  <Badge variant="default">Featured</Badge>
                )}
              </div>
              <CardTitle className="mt-4">{tier.display_name}</CardTitle>
              <CardDescription className="min-h-[40px]">
                {tier.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div>
                <div className="text-3xl font-bold">
                  ${tier.price_monthly}
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                {tier.price_yearly > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ${tier.price_yearly}/year (save ${(tier.price_monthly * 12 - tier.price_yearly).toFixed(0)})
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>
                    {tier.max_avatars === -1 ? 'Unlimited' : tier.max_avatars}{' '}
                    {tier.max_avatars === 1 ? 'avatar' : 'avatars'}
                  </span>
                </div>

                {tier.trial_days > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{tier.trial_days} day free trial</span>
                  </div>
                )}

                {tier.priority_support ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority support</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>Standard support</span>
                  </div>
                )}

                {tier.custom_branding ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Custom branding</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>No custom branding</span>
                  </div>
                )}
              </div>

              {/* User Count */}
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {userCounts[tier.id] || 0}
                  </span>{' '}
                  users on this tier
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {tier.is_active ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Note about API Keys */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Important Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All tiers require users to provide their own API keys for services (OpenAI, ElevenLabs, etc.).
            The subscription tiers only limit the <strong>number of avatars</strong> users can create.
            All other features (conversations, images, knowledge files, etc.) are unlimited as users
            provide their own API access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
