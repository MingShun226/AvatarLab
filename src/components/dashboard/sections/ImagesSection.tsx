import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image,
  Sparkles,
  Download,
  Upload,
  Grid3x3,
  Heart,
  Trash2,
  Plus,
  Loader2,
  FolderPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  original_image_url?: string;
  generation_type: string;
  is_favorite: boolean;
  created_at: string;
}

interface ImageCollection {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

const ImagesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [collections, setCollections] = useState<ImageCollection[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  useEffect(() => {
    if (user) {
      loadImages();
      loadCollections();
    }
  }, [user]);

  const loadImages = async () => {
    try {
      setIsLoadingImages(true);

      if (!user?.id) {
        setIsLoadingImages(false);
        return;
      }

      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setImages(data || []);
    } catch (error: any) {
      console.error('Error loading images:', error);
      toast({
        title: "Error loading images",
        description: error.message || "Failed to load images",
        variant: "destructive"
      });
    } finally {
      setIsLoadingImages(false);
    }
  };

  const loadCollections = async () => {
    try {
      setIsLoadingCollections(true);

      if (!user?.id) {
        setIsLoadingCollections(false);
        return;
      }

      const { data, error } = await supabase
        .from('image_collections')
        .select(`
          *,
          image_collection_items(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCollections(data || []);
    } catch (error: any) {
      console.error('Error loading collections:', error);
      toast({
        title: "Error loading collections",
        description: error.message || "Failed to load collections",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate an image",
        variant: "destructive",
      });
      return;
    }

    // This is a placeholder for image generation
    toast({
      title: "Coming Soon",
      description: "Image generation will be available with full backend integration.",
    });
  };

  const toggleFavorite = async (imageId: string) => {
    try {
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      const { error } = await supabase
        .from('generated_images')
        .update({ is_favorite: !image.is_favorite })
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.map(img =>
        img.id === imageId ? { ...img, is_favorite: !img.is_favorite } : img
      ));

      toast({
        title: image.is_favorite ? "Removed from favorites" : "Added to favorites",
        description: `Image ${image.is_favorite ? 'removed from' : 'added to'} your favorites.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update favorite: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.filter(img => img.id !== imageId));
      toast({
        title: "Image deleted",
        description: "The image has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete image: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const createCollection = async (name: string, description?: string) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('image_collections')
        .insert({
          user_id: user.id,
          name,
          description
        })
        .select()
        .single();

      if (error) throw error;

      setCollections([data, ...collections]);
      toast({
        title: "Collection created",
        description: `Collection "${name}" has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create collection: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Image className="h-6 w-6" />
          AI Images Studio
        </h1>
        <p className="text-muted-foreground">
          Generate, organize, and manage your AI-created images
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate New Image
              </CardTitle>
              <CardDescription>
                Describe what you want to create and let AI bring it to life
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="A majestic mountain landscape at sunset with golden light..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                Your Images ({images.length})
              </CardTitle>
              <CardDescription>
                Browse and manage your generated images
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingImages ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading images...</span>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No images generated yet</p>
                  <p className="text-sm text-muted-foreground">Create your first image in the Generate tab</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg border">
                        <img
                          src={image.image_url}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleFavorite(image.id)}
                        >
                          <Heart className={`h-4 w-4 ${image.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => deleteImage(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {image.prompt}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline">{image.generation_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(image.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                Collections ({collections.length})
              </CardTitle>
              <CardDescription>
                Organize your images into collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCollections ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading collections...</span>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8">
                  <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No collections created yet</p>
                  <Button
                    className="mt-4"
                    onClick={() => createCollection('My First Collection', 'A collection for my favorite images')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Collection
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collections.map((collection) => (
                    <Card key={collection.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{collection.name}</h3>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline">
                            {Array.isArray(collection.image_collection_items)
                              ? collection.image_collection_items.length
                              : 0} images
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(collection.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImagesSection;