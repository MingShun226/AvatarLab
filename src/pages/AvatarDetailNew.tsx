import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Download, Heart, Share, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Avatar {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  total_sales: number;
  creator: string;
  mbti: string;
  personality: string[];
  favorites: string[];
  grow_up_story: string;
  voice_description: string;
  languages: string[];
  lifestyle: string[];
  gallery_images: string[];
  category: string;
  is_public: boolean;
}

const AvatarDetailNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchAvatar();
    }
  }, [id, user]);

  const fetchAvatar = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // First try to get user's own avatar (only if user is authenticated)
      let { data, error } = null;

      if (user?.id) {
        const result = await supabase
          .from('avatars')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      // If not found, try to get marketplace avatar
      if (!data) {
        const { data: marketplaceData, error: marketplaceError } = await supabase
          .from('avatars')
          .select('*')
          .eq('id', id)
          .eq('is_public', true)
          .eq('status', 'active')
          .maybeSingle();

        data = marketplaceData;
        error = marketplaceError;
      }

      if (error) {
        console.error('Error fetching avatar:', error);
        toast({
          title: "Error",
          description: "Failed to load avatar details",
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        toast({
          title: "Avatar Not Found",
          description: "The avatar you're looking for doesn't exist or you don't have permission to view it.",
          variant: "destructive"
        });
        navigate('/marketplace');
        return;
      }

      setAvatar(data);
    } catch (error: any) {
      console.error('Error fetching avatar:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!avatar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Avatar Not Found</h2>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold">{avatar.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="aspect-square overflow-hidden rounded-lg mb-4">
                  <img
                    src={avatar.image_url || '/placeholder-avatar.png'}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{avatar.name}</h2>
                    <p className="text-muted-foreground">by {avatar.creator}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{avatar.rating}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {avatar.total_sales} sales
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Badge variant="secondary">{avatar.category}</Badge>
                    <Badge variant="outline">{avatar.mbti}</Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-3xl font-bold text-primary mb-4">
                      ${avatar.price}
                    </div>
                    <Button className="w-full" size="lg">
                      Purchase Avatar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="personality">Personality</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{avatar.description}</p>
                  </CardContent>
                </Card>

                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Background Story</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{avatar.grow_up_story}</p>
                  </CardContent>
                </Card>

                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {avatar.languages?.map((language, index) => (
                        <Badge key={index} variant="outline">{language}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personality" className="space-y-6">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Personality Traits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {avatar.personality?.map((trait, index) => (
                        <Badge key={index} variant="secondary">{trait}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Favorites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {avatar.favorites?.map((favorite, index) => (
                        <Badge key={index} variant="outline">{favorite}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Lifestyle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {avatar.lifestyle?.map((style, index) => (
                        <Badge key={index} variant="outline">{style}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="voice" className="space-y-6">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Voice Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{avatar.voice_description}</p>
                    <div className="mt-4">
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Preview Voice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gallery" className="space-y-6">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {avatar.gallery_images?.map((image, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarDetailNew;