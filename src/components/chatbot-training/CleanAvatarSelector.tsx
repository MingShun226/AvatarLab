import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, User, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Avatar {
  id: string;
  name: string;
  avatar_images: string[];
  primary_language: string;
  secondary_languages: string[];
  backstory?: string;
  personality_traits?: string[];
  mbti_type?: string;
}

interface CleanAvatarSelectorProps {
  selectedAvatarId: string | null;
  onSelectAvatar: (avatarId: string) => void;
}

export const CleanAvatarSelector: React.FC<CleanAvatarSelectorProps> = ({
  selectedAvatarId,
  onSelectAvatar
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  // Fetch user's avatars
  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['training-avatars', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const selectedAvatar = avatars.find((avatar: Avatar) => avatar.id === selectedAvatarId);

  const handleCreateNewAvatar = () => {
    navigate('/create-avatar');
  };

  return (
    <Card className="card-modern">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5" />
            Avatar Training Setup
          </CardTitle>
          {selectedAvatar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compact Avatar Selection */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select value={selectedAvatarId || ''} onValueChange={onSelectAvatar}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select avatar to train..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading avatars...
                  </SelectItem>
                ) : avatars.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No avatars found
                  </SelectItem>
                ) : (
                  avatars.map((avatar: Avatar) => (
                    <SelectItem key={avatar.id} value={avatar.id}>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span>{avatar.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {avatar.primary_language}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNewAvatar}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* Collapsible Avatar Details */}
        {selectedAvatar && showDetails && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground mb-1">Avatar Name</p>
                <p>{selectedAvatar.name}</p>
              </div>

              <div>
                <p className="font-medium text-muted-foreground mb-1">Languages</p>
                <div className="flex flex-wrap gap-1">
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

              <div>
                <p className="font-medium text-muted-foreground mb-1">Training Data</p>
                <div className="flex flex-wrap gap-1">
                  {selectedAvatar.backstory && (
                    <Badge variant="outline" className="text-xs">Backstory</Badge>
                  )}
                  {selectedAvatar.personality_traits && selectedAvatar.personality_traits.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {selectedAvatar.personality_traits.length} Traits
                    </Badge>
                  )}
                  {selectedAvatar.mbti_type && (
                    <Badge variant="outline" className="text-xs">MBTI</Badge>
                  )}
                </div>
              </div>
            </div>

            {selectedAvatar.backstory && (
              <div className="mt-3 pt-3 border-t">
                <p className="font-medium text-muted-foreground mb-1 text-xs">Backstory Preview</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {selectedAvatar.backstory.length > 100
                    ? selectedAvatar.backstory.substring(0, 100) + '...'
                    : selectedAvatar.backstory
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Status */}
        {selectedAvatar && !showDetails && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 rounded px-3 py-2">
            <span>Ready to train: <strong>{selectedAvatar.name}</strong></span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {selectedAvatar.primary_language}
              </Badge>
              {selectedAvatar.backstory && (
                <Badge variant="outline" className="text-xs">Has Story</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};