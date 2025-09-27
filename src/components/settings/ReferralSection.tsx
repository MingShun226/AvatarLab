
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Gift, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReferralSectionProps {
  profileData: {
    referralCode: string;
    referrerCode: string;
  };
  onUpdate: (data: { referrerCode: string }) => void;
}

const ReferralSection: React.FC<ReferralSectionProps> = ({ profileData, onUpdate }) => {
  const [referrerCode, setReferrerCode] = useState(profileData.referrerCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const copyReferralCode = () => {
    if (profileData.referralCode) {
      navigator.clipboard.writeText(profileData.referralCode);
      toast({
        title: "Copied!",
        description: "Your referral code has been copied to clipboard.",
      });
    }
  };

  const validateReferrerCode = async (code: string): Promise<boolean> => {
    if (!code.trim()) return true; // Empty code is allowed
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', code.trim())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error validating referrer code:', error);
        return false;
      }

      return !!data; // Return true if referrer exists
    } catch (error) {
      console.error('Error validating referrer code:', error);
      return false;
    }
  };

  const handleSaveReferrer = async () => {
    if (!user) return;
    
    const trimmedCode = referrerCode.trim();
    
    // Validate the referrer code exists in database
    setIsLoading(true);
    const isValid = await validateReferrerCode(trimmedCode);
    
    if (!isValid && trimmedCode !== '') {
      setIsLoading(false);
      toast({
        title: "Invalid Referrer Code",
        description: "The referrer code doesn't exist. Please check and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ referrer_code: trimmedCode })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        onUpdate({ referrerCode: trimmedCode });
        toast({
          title: "Referrer Updated",
          description: trimmedCode ? "Your referrer code has been saved successfully." : "Referrer code has been cleared.",
        });
      }
    } catch (error) {
      toast({
        title: "Update Error",
        description: "An unexpected error occurred while updating your referrer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasExistingReferrer = profileData.referrerCode && profileData.referrerCode.trim() !== '';

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5" />
          Referral System
        </CardTitle>
        <CardDescription>
          Share your referral code with friends and earn rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Your Referral Code */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Your Referral Code</Label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-lg font-mono tracking-wider">
              {profileData.referralCode || 'Loading...'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyReferralCode}
              disabled={!profileData.referralCode}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with friends to earn referral rewards when they sign up.
          </p>
        </div>

        {/* Your Referrer */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Your Referrer Code</Label>
          {hasExistingReferrer ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {profileData.referrerCode}
              </Badge>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter referrer's code (optional)"
                value={referrerCode}
                onChange={(e) => setReferrerCode(e.target.value)}
                className="input-modern"
              />
              <Button
                onClick={handleSaveReferrer}
                disabled={isLoading}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {hasExistingReferrer 
              ? "Your referrer has been set and cannot be changed."
              : "If someone referred you, enter their referral code here. This can only be set once."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralSection;
