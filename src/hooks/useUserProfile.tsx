
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string;
  referral_code: string;
  referrer_code: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { error: error.message };
      }

      setProfile(data);
      return { data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: 'Failed to update profile' };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: 'No user logged in' };

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { error: 'Please select an image file' };
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return { error: 'Image must be under 5MB' };
      }

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`profiles/${fileName}`, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { error: 'Failed to upload image' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`profiles/${fileName}`);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: urlData.publicUrl
      });

      if (updateError) {
        return { error: updateError };
      }

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });

      return { data: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { error: 'Failed to upload avatar' };
    }
  };

  return {
    profile,
    isLoading,
    fetchProfile,
    updateProfile,
    uploadAvatar
  };
};
