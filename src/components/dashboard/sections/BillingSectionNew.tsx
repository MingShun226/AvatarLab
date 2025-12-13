import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Users, Building2, ArrowLeft, Bot } from 'lucide-react';
import type { SubscriptionTier } from '@/types/admin';

interface UserTierInfo {
  current_tier: SubscriptionTier | null;
  avatar_count: number;
  max_avatars: number;
}

const BillingSectionNew = () => {
  const { user } = useAuth();
  const [showPricing, setShowPricing] = useState(false);
  const [userTierInfo, setUserTierInfo] = useState<UserTierInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserTierInfo();
    }
  }, [user]);

  const fetchUserTierInfo = async () => {
    try {
      // Get user's profile with tier
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          subscription_tier_id,
          subscription_tiers:subscription_tier_id (*)
        `)
        .eq('id', user?.id)
        .single();

      // Get avatar count
      const { count } = await supabase
        .from('avatars')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      setUserTierInfo({
        current_tier: profile?.subscription_tiers || null,
        avatar_count: count || 0,
        max_avatars: profile?.subscription_tiers?.max_avatars || 1,
      });
    } catch (error) {
      console.error('Error fetching user tier:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showPricing) {
    return <PricingPage onBack={() => setShowPricing(false)} onTierSelect={() => fetchUserTierInfo()} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentTier = userTierInfo?.current_tier;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view available plans
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Current Plan</CardTitle>
          <CardDescription>Your active subscription tier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {currentTier?.display_name || 'Free'}
              </h3>
              <p className="text-muted-foreground">
                {currentTier?.description || 'Basic free tier'}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span>
                    {userTierInfo?.avatar_count || 0} / {userTierInfo?.max_avatars === -1 ? '∞' : userTierInfo?.max_avatars} avatars
                  </span>
                </div>
                {currentTier?.price_monthly ? (
                  <Badge variant="secondary">
                    ${currentTier.price_monthly}/month
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowPricing(true)}
            >
              View all plans
            </Button>
          </div>

          {/* Features */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>
                {currentTier?.max_avatars === -1 ? 'Unlimited' : currentTier?.max_avatars || 1}{' '}
                {(currentTier?.max_avatars || 1) === 1 ? 'avatar' : 'avatars'}
              </span>
            </div>
            {currentTier?.priority_support && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Priority support</span>
              </div>
            )}
            {currentTier?.custom_branding && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Custom branding</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>Use your own API keys (OpenAI, ElevenLabs, etc.)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Note */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">How Billing Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Subscription tiers only limit the <strong>number of avatars</strong> you can create
          </p>
          <p>
            • You provide your own API keys for all services (OpenAI, ElevenLabs, etc.)
          </p>
          <p>
            • Conversations, images, and other features are <strong>unlimited</strong>
          </p>
          <p>
            • To request an upgrade, contact support or view available plans
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

interface PricingPageProps {
  onBack: () => void;
  onTierSelect: () => void;
}

const PricingPage = ({ onBack, onTierSelect }: PricingPageProps) => {
  const { user } = useAuth(); // Move hook to component level
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free':
        return <Users className="h-8 w-8" />;
      case 'starter':
        return <Zap className="h-8 w-8" />;
      case 'pro':
        return <Crown className="h-8 w-8" />;
      case 'enterprise':
        return <Building2 className="h-8 w-8" />;
      default:
        return <Users className="h-8 w-8" />;
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

  const handleRequestUpgrade = async (tierId: string, tierName: string) => {
    try {
      // Check if user already has a pending request
      const { data: existingRequest } = await supabase
        .from('tier_upgrade_requests')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        alert('You already have a pending upgrade request. Please wait for admin review.');
        return;
      }

      // Get current tier ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier_id')
        .eq('id', user?.id)
        .single();

      // Create upgrade request
      const { error } = await supabase
        .from('tier_upgrade_requests')
        .insert({
          user_id: user?.id,
          requested_tier_id: tierId,
          current_tier_id: profile?.subscription_tier_id,
          status: 'pending',
        });

      if (error) throw error;

      alert(`Upgrade request for ${tierName} submitted successfully! An admin will review your request soon.`);
    } catch (error) {
      console.error('Error creating upgrade request:', error);
      alert('Failed to submit upgrade request. Please try again.');
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground">Select the plan that fits your needs</p>
        </div>
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
                  <Badge variant="default">Popular</Badge>
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
                    ${tier.price_yearly}/year
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

              <Button
                className="w-full"
                variant={tier.is_featured ? 'default' : 'outline'}
                onClick={() => handleRequestUpgrade(tier.id, tier.display_name)}
              >
                Request Upgrade
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Note */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            All plans require you to provide your own API keys. Tiers only limit avatar quantity.
            <br />
            Upgrade requests will be reviewed by an administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingSectionNew;
