import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Avatar {
  id: string;
  name: string;
}

interface SimpleAvatarSelectorProps {
  selectedAvatarId: string | null;
  onSelectAvatar: (avatarId: string) => void;
}

export const SimpleAvatarSelector: React.FC<SimpleAvatarSelectorProps> = ({
  selectedAvatarId,
  onSelectAvatar
}) => {
  const { user } = useAuth();

  // Fetch user's avatars
  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['simple-avatars', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('avatars')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const selectedAvatar = avatars.find((avatar: Avatar) => avatar.id === selectedAvatarId);

  return (
    <Select value={selectedAvatarId || ''} onValueChange={onSelectAvatar}>
      <SelectTrigger className="w-auto gap-2 h-9 px-3">
        <User className="h-4 w-4" />
        <SelectValue placeholder="Select Avatar">
          {selectedAvatar ? selectedAvatar.name : 'Select Avatar'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Loading...
          </SelectItem>
        ) : avatars.length === 0 ? (
          <SelectItem value="none" disabled>
            No avatars found
          </SelectItem>
        ) : (
          avatars.map((avatar: Avatar) => (
            <SelectItem key={avatar.id} value={avatar.id}>
              {avatar.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};