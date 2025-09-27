import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface AvatarSelectorProps {
  selectedAvatarId: string | null;
  onSelectAvatar: (avatarId: string) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
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

  const handleCreateNewAvatar = () => {
    navigate('/create-avatar');
  };

  if (isLoading) {
    return (
      <Card className="card-modern mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Avatar to Train
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Select Avatar to Train
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Create New Avatar Card */}
          <div
            onClick={handleCreateNewAvatar}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          >
            <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Create New Avatar</p>
          </div>

          {/* Existing Avatars */}
          {avatars.map((avatar: Avatar) => (
            <div
              key={avatar.id}
              onClick={() => onSelectAvatar(avatar.id)}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedAvatarId === avatar.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                {avatar.avatar_images && avatar.avatar_images.length > 0 ? (
                  <img
                    src={avatar.avatar_images[0]}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-sm truncate mb-2">{avatar.name}</h3>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  {avatar.primary_language}
                </Badge>
                {avatar.secondary_languages && avatar.secondary_languages.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    +{avatar.secondary_languages.length} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {avatars.length === 0 && (
          <div className="text-center py-8">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Avatars Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first avatar to start training.
            </p>
            <Button onClick={handleCreateNewAvatar}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Avatar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
