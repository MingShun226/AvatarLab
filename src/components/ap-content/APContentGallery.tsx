import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Grid3x3,
  Image,
  Film,
  Download,
  Heart,
  Trash2,
  Loader2,
  Play,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useGalleryImages,
  useDeleteImage,
  useToggleFavorite,
} from '@/hooks/useGalleryImages';
import { getUserVideos, deleteVideo, type GeneratedVideo } from '@/services/videoGeneration';
import { downloadImage, GeneratedImage } from '@/services/imageGeneration';
import { ImageDetailDialog } from '@/components/ui/image-detail-dialog';

type ContentType = 'all' | 'images' | 'videos' | 'favorites';

const APContentGallery = () => {
  const { toast } = useToast();
  const [contentFilter, setContentFilter] = useState<ContentType>('all');
  const [selectedImageDetail, setSelectedImageDetail] = useState<GeneratedImage | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  // Image hooks
  const { data: images = [], isLoading: isLoadingImages } = useGalleryImages();
  const deleteMutation = useDeleteImage();
  const toggleFavoriteMutation = useToggleFavorite();

  // Video state
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Load videos
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const userVideos = await getUserVideos();
      setVideos(userVideos);
    } catch (error: any) {
      console.error('Error loading videos:', error);
      toast({
        title: "Failed to load videos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleToggleFavorite = async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const newFavoriteStatus = !image.is_favorite;

    toggleFavoriteMutation.mutate(
      { imageId, isFavorite: newFavoriteStatus },
      {
        onSuccess: () => {
          toast({
            title: newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteImage = async (imageId: string) => {
    deleteMutation.mutate(imageId, {
      onSuccess: () => {
        toast({
          title: "Image deleted",
          description: "The image has been deleted successfully.",
        });
        setSelectedImageDetail(null);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideo(videoId);
      toast({
        title: "Video deleted",
        description: "The video has been deleted successfully.",
      });
      loadVideos();
      setSelectedVideo(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async (imageUrl: string, imageId: string) => {
    try {
      const filename = `product-image-${imageId}.png`;
      await downloadImage(imageUrl, filename);

      toast({
        title: "Download started",
        description: "Your image is being downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: "Right-click the image and select 'Save Image As' instead.",
        variant: "destructive",
      });
      console.error('Download error:', error);
    }
  };

  const handleDownloadVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
    toast({
      title: "Opening video",
      description: "The video will open in a new tab where you can download it.",
    });
  };

  // Filter content based on selected filter
  const filteredImages = images.filter(img => {
    if (contentFilter === 'favorites') return img.is_favorite;
    if (contentFilter === 'images' || contentFilter === 'all') return true;
    return false;
  });

  const filteredVideos = videos.filter(vid => {
    if (contentFilter === 'favorites') return false; // Videos don't have favorites yet
    if (contentFilter === 'videos' || contentFilter === 'all') return true;
    return false;
  });

  const isLoading = isLoadingImages || isLoadingVideos;
  const totalContent = filteredImages.length + filteredVideos.length;

  // Combine and sort content by date
  const combinedContent = [
    ...filteredImages.map(img => ({ type: 'image' as const, data: img, date: new Date(img.created_at) })),
    ...filteredVideos.map(vid => ({ type: 'video' as const, data: vid, date: new Date(vid.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                All A&P Content
              </CardTitle>
              <CardDescription>
                Browse all your product images and promotional videos in one place
              </CardDescription>
            </div>
            <Tabs value={contentFilter} onValueChange={(value) => setContentFilter(value as ContentType)} className="w-auto">
              <TabsList>
                <TabsTrigger value="all" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  All ({images.length + videos.length})
                </TabsTrigger>
                <TabsTrigger value="images" className="gap-1">
                  <Image className="h-3 w-3" />
                  Images ({images.length})
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-1">
                  <Film className="h-3 w-3" />
                  Videos ({videos.length})
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-1">
                  <Heart className="h-3 w-3" />
                  Favorites ({images.filter(img => img.is_favorite).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your content...</p>
            </div>
          ) : totalContent === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No content yet</h3>
              <p className="text-muted-foreground mb-6">
                {contentFilter === 'favorites'
                  ? 'No favorite content yet. Mark images as favorites to see them here.'
                  : 'Start creating product images or promotional videos to see them here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combinedContent.map((item, index) => {
                if (item.type === 'image') {
                  const image = item.data as GeneratedImage;
                  return (
                    <div key={`image-${image.id}`} className="group relative">
                      <div
                        className="aspect-square overflow-hidden rounded-lg border bg-muted cursor-pointer relative"
                        onClick={() => setSelectedImageDetail(image)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.prompt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
                            <Image className="h-3 w-3 mr-1" />
                            Image
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 backdrop-blur-sm bg-background/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(image.image_url, image.id);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 backdrop-blur-sm bg-background/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(image.id);
                          }}
                        >
                          <Heart className={`h-4 w-4 ${image.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0 backdrop-blur-sm bg-destructive/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Image Info */}
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                          {image.prompt}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-xs">
                            {image.provider || 'kie-ai'}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(image.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const video = item.data as GeneratedVideo;
                  const statusColor = video.status === 'completed' ? 'text-green-600' :
                                     video.status === 'failed' ? 'text-red-600' :
                                     'text-yellow-600';
                  return (
                    <div key={`video-${video.id}`} className="group relative">
                      <div
                        className="aspect-square overflow-hidden rounded-lg border bg-muted cursor-pointer relative"
                        onClick={() => video.video_url && window.open(video.video_url, '_blank')}
                      >
                        {video.video_url ? (
                          <video
                            src={video.video_url}
                            className="w-full h-full object-cover"
                            controls={false}
                            preload="metadata"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <div className="text-center">
                              <Loader2 className={`h-12 w-12 mx-auto mb-2 ${video.status === 'processing' ? 'animate-spin' : ''} ${statusColor}`} />
                              <p className="text-sm text-muted-foreground capitalize">{video.status}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
                            <Film className="h-3 w-3 mr-1" />
                            Video
                          </Badge>
                        </div>
                        {video.video_url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {video.video_url && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 backdrop-blur-sm bg-background/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadVideo(video.video_url!);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0 backdrop-blur-sm bg-destructive/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(video.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Video Info */}
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                          {video.prompt}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-xs">
                            {video.provider}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(video.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Detail Dialog */}
      <ImageDetailDialog
        open={!!selectedImageDetail}
        onOpenChange={(open) => !open && setSelectedImageDetail(null)}
        image={selectedImageDetail}
        onDownload={handleDownloadImage}
        onToggleFavorite={handleToggleFavorite}
        onDelete={(id) => {
          handleDeleteImage(id);
          setSelectedImageDetail(null);
        }}
      />
    </div>
  );
};

export default APContentGallery;
