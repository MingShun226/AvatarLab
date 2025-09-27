
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Loader2, Edit, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string;
  referral_code?: string;
}

// Generate a referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ name: '', phone: '' });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        throw error;
      }

      // If profile exists but no referral code, generate one
      if (data && !data.referral_code) {
        const referralCode = generateReferralCode();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: referralCode })
          .eq('id', user.id);

        if (!updateError) {
          data.referral_code = referralCode;
        }
      }

      return data as Profile;
    },
    enabled: !!user?.id
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Update profile error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename with user ID and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // Update profile with new avatar URL
      await updateProfileMutation.mutateAsync({
        avatar_url: publicUrl
      });

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload your avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditClick = () => {
    if (profile) {
      setEditValues({
        name: profile.name || '',
        phone: profile.phone || ''
      });
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!profile) return;

    // Check if values have changed
    const nameChanged = editValues.name !== (profile.name || '');
    const phoneChanged = editValues.phone !== (profile.phone || '');

    if (!nameChanged && !phoneChanged) {
      toast({
        title: "No Changes",
        description: "You provided the same information. No changes were made.",
        variant: "destructive"
      });
      return;
    }

    const updates: Partial<Profile> = {};
    if (nameChanged) updates.name = editValues.name;
    if (phoneChanged) updates.phone = editValues.phone;

    try {
      await updateProfileMutation.mutateAsync(updates);
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({ name: '', phone: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No profile found. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage 
              src={profile.avatar_url} 
              alt={profile.name || 'User avatar'} 
            />
            <AvatarFallback>
              {profile.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !isEditing}
              className="mb-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Change Avatar
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Upload a new profile picture. Max size: 5MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Profile Form */}
        <div className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  name="name"
                  value={editValues.name}
                  onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={profile.name || ''}
                    disabled
                    className="bg-muted"
                  />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email || user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Email cannot be changed from here
              </p>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={editValues.phone}
                  onChange={(e) => setEditValues(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={profile.phone || ''}
                    disabled
                    className="bg-muted"
                  />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSaveChanges}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleEditClick}
                variant="outline"
                className="w-full"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
