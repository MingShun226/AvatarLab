import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Avatar {
  id: string;
  name: string;
  avatar_images: string[];
  primary_language: string;
  secondary_languages: string[];
}

interface AvatarSelectorDropdownProps {
  selectedAvatarId: string | null;
  onSelectAvatar: (avatarId: string) => void;
}

export const AvatarSelectorDropdown: React.FC<AvatarSelectorDropdownProps> = ({
  selectedAvatarId,
  onSelectAvatar
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAvatars();
    }
  }, [user]);

  const fetchAvatars = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('avatars')
        .select('id, name, avatar_images, primary_language, secondary_languages')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching avatars:', error);
        toast({
          title: "Error",
          description: "Failed to load your avatars.",
          variant: "destructive"
        });
      } else {
        setAvatars(data || []);
      }
    } catch (error) {
      console.error('Error fetching avatars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAvatar = avatars.find((avatar: Avatar) => avatar.id === selectedAvatarId);

  const handleCreateNewAvatar = () => {
    navigate('/create-avatar');
  };

  if (isLoading) {
    return (
      <Card className="card-modern mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Select Avatar to Train
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Select Avatar to Train
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedAvatarId || ''} onValueChange={onSelectAvatar}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an avatar to train..." />
              </SelectTrigger>
              <SelectContent>
                {avatars.map((avatar: Avatar) => (
                  <SelectItem key={avatar.id} value={avatar.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {avatar.avatar_images && avatar.avatar_images.length > 0 ? (
                          <img
                            src={avatar.avatar_images[0]}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{avatar.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {avatar.primary_language}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            onClick={handleCreateNewAvatar}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        {selectedAvatar && (
          <div className="mt-4 p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                {selectedAvatar.avatar_images && selectedAvatar.avatar_images.length > 0 ? (
                  <img
                    src={selectedAvatar.avatar_images[0]}
                    alt={selectedAvatar.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{selectedAvatar.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {selectedAvatar.primary_language}
                  </Badge>
                  {selectedAvatar.secondary_languages && selectedAvatar.secondary_languages.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedAvatar.secondary_languages.length} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
