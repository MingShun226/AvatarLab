import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Image,
  Sparkles,
  Download,
  Grid3x3,
  Heart,
  Trash2,
  Loader2,
  Wand2,
  Zap,
  Palette,
  Layers
} from 'lucide-react';
import { MultiImageUploadBox } from '@/components/ui/multi-image-upload-box';
import { ImageDetailDialog } from '@/components/ui/image-detail-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  generateImage,
  checkGenerationProgress,
  saveGeneratedImage,
  downloadImage,
  AIProvider,
  GeneratedImage,
} from '@/services/imageGeneration';
import {
  useGalleryImages,
  useDeleteImage,
  useToggleFavorite,
  useRefreshImages
} from '@/hooks/useGalleryImages';
import { migrateImagesToStorage } from '@/services/migrationService';
import { KIE_IMAGE_SERVICES, KIE_IMG2IMG_SERVICES } from '@/config/kieAIConfig';
import { ADVERTISING_STYLES, getPopularStyles, getAllPlatforms, getStylesByPlatform, AdvertisingStyle } from '@/config/advertisingStyles';

// Aspect ratio presets - optimized for KIE models
const ASPECT_RATIO_PRESETS: Record<string, { width: number; height: number; label: string }> = {
  '1:1': { width: 1024, height: 1024, label: '1:1 Square (1024×1024)' },
  '16:9': { width: 1024, height: 576, label: '16:9 Landscape (1024×576)' },
  '9:16': { width: 576, height: 1024, label: '9:16 Portrait (576×1024)' },
  '4:3': { width: 1024, height: 768, label: '4:3 Standard (1024×768)' },
  '3:4': { width: 768, height: 1024, label: '3:4 Portrait (768×1024)' },
  '3:2': { width: 1152, height: 768, label: '3:2 Photo (1152×768)' },
  '2:3': { width: 768, height: 1152, label: '2:3 Tall (768×1152)' },
  '5:4': { width: 1280, height: 1024, label: '5:4 Classic (1280×1024)' },
  '4:5': { width: 1024, height: 1280, label: '4:5 Story (1024×1280)' },
  '21:9': { width: 2560, height: 1080, label: '21:9 Ultrawide (2560×1080)' },
};

// Build providers list dynamically based on mode
const getProvidersForMode = (mode: 'text2img' | 'img2img') => {
  const services = mode === 'text2img' ? KIE_IMAGE_SERVICES : KIE_IMG2IMG_SERVICES;
  return services.map(service => ({
    value: service.id,
    label: service.name,
    icon: Zap,
    description: `${service.description} (~$${service.costInUSD})`,
    supportsImg2img: service.supportsImg2Img || false,
    supportedAspectRatios: service.supportedAspectRatios || ['1:1'],
    kieService: true,
  }));
};

const ImagesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [selectedImageDetail, setSelectedImageDetail] = useState<GeneratedImage | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  // React Query hooks
  const { data: images = [], isLoading: isLoadingImages } = useGalleryImages();
  const deleteMutation = useDeleteImage();
  const toggleFavoriteMutation = useToggleFavorite();
  const { refresh: refreshImages } = useRefreshImages();

  // Default provider for img2img
  const DEFAULT_PROVIDER: AIProvider = 'kie-nano-banana';

  const handleBatchGenerate = async () => {
    // Validate inputs
    if (inputImages.length === 0) {
      toast({
        title: "Error",
        description: "Please upload a product image first",
        variant: "destructive",
      });
      return;
    }

    if (selectedStyles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one advertising style",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setBatchProgress({ current: 0, total: selectedStyles.length });

    const generatedCount = { success: 0, failed: 0 };

    try {
      toast({
        title: "Starting batch generation...",
        description: `Generating ${selectedStyles.length} advertising images`,
      });

      // Process each selected style
      for (let i = 0; i < selectedStyles.length; i++) {
        const styleId = selectedStyles[i];
        const style = ADVERTISING_STYLES.find(s => s.id === styleId);

        if (!style) continue;

        setBatchProgress({ current: i + 1, total: selectedStyles.length });
        setGenerationProgress(0);

        try {
          // Get aspect ratio dimensions
          const preset = ASPECT_RATIO_PRESETS[style.aspectRatio];
          const width = preset?.width || 1024;
          const height = preset?.height || 1024;

          // Start generation with style-specific parameters
          const response = await generateImage({
            prompt: style.prompt,
            provider: DEFAULT_PROVIDER,
            negativePrompt: style.negativePrompt,
            inputImages: inputImages,
            strength: style.strength,
            width,
            height,
          });

          const { taskId, provider: usedProvider } = response;

          // Poll for completion
          let imageUrl: string | null = null;
          let attempts = 0;
          const maxAttempts = 60;

          while (attempts < maxAttempts && !imageUrl) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const progress = await checkGenerationProgress(taskId, usedProvider);
            setGenerationProgress(progress.progress);

            if (progress.status === 'completed' && progress.imageUrl) {
              imageUrl = progress.imageUrl;
              break;
            }

            if (progress.status === 'failed') {
              throw new Error(progress.error || 'Generation failed');
            }

            attempts++;
          }

          if (!imageUrl) {
            throw new Error('Generation timeout');
          }

          // Auto-save to gallery with style name
          await saveGeneratedImage(
            imageUrl,
            `${style.name} - ${style.platform}`,
            usedProvider,
            undefined,
            {
              negative_prompt: style.negativePrompt,
              width,
              height,
              style: style.name,
              platform: style.platform
            },
            inputImages,
            'img2img'
          );

          generatedCount.success++;

        } catch (error: any) {
          console.error(`Error generating ${style.name}:`, error);
          generatedCount.failed++;
        }
      }

      // Show completion summary
      toast({
        title: "Batch generation complete!",
        description: `Successfully generated ${generatedCount.success} images${generatedCount.failed > 0 ? `, ${generatedCount.failed} failed` : ''}`,
      });

      // Refresh gallery to show new images
      refreshImages();

      // Reset form
      setInputImages([]);
      setSelectedStyles([]);

      // Switch to gallery tab
      const galleryTab = document.querySelector('[value="gallery"]') as HTMLElement;
      galleryTab?.click();

    } catch (error: any) {
      console.error('Error in batch generation:', error);
      toast({
        title: "Batch generation failed",
        description: error.message || "Failed to complete batch generation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
      setGenerationProgress(0);
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

  const handleDownload = async (imageUrl: string, imageId: string) => {
    try {
      const filename = `ai-image-${imageId}.png`;
      await downloadImage(imageUrl, filename);

      toast({
        title: "Download started",
        description: "Your image is being downloaded.",
      });
    } catch (error: any) {
      // Show fallback instructions
      toast({
        title: "Download via proxy failed",
        description: "Right-click the image and select 'Save Image As' instead.",
        variant: "destructive",
      });
      console.error('Download error:', error);
    }
  };

  const handleMigrateToStorage = async () => {
    if (isMigrating) return;

    setIsMigrating(true);
    toast({
      title: "Starting migration...",
      description: "Moving images to Supabase Storage for faster loading.",
    });

    try {
      const result = await migrateImagesToStorage();

      toast({
        title: "Migration complete!",
        description: result.message,
      });

      // Refresh images to show new URLs
      refreshImages();
    } catch (error: any) {
      toast({
        title: "Migration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Toggle style selection
  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  // Quick select all popular styles
  const selectPopularStyles = () => {
    const popularStyles = getPopularStyles();
    setSelectedStyles(popularStyles.map(s => s.id));
    toast({
      title: "Popular styles selected",
      description: `${popularStyles.length} popular advertising styles selected`,
    });
  };

  // Get filtered styles
  const getFilteredStyles = () => {
    if (platformFilter === 'all') {
      return ADVERTISING_STYLES;
    }
    return getStylesByPlatform(platformFilter);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wand2 className="h-8 w-8" />
          Product Images
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload your product photo and generate professional advertising images for Malaysian marketplaces
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="gallery">Gallery ({images.length})</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Upload Product Photo
              </CardTitle>
              <CardDescription>
                Upload a simple product photograph - AI will transform it into professional advertising images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiImageUploadBox
                onImagesChange={(images) => setInputImages(images)}
                currentImages={inputImages}
                maxImages={1}
                maxSizeMB={4}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload a clear product photo. Best results with good lighting and plain background.
              </p>
            </CardContent>
          </Card>

          {/* Style Selection Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Select Advertising Styles
                  </CardTitle>
                  <CardDescription>
                    Choose one or more styles for your product images
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    {selectedStyles.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectPopularStyles}
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Quick Select Popular
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                  variant={platformFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPlatformFilter('all')}
                  disabled={isGenerating}
                >
                  All Platforms
                </Button>
                {getAllPlatforms().map(platform => (
                  <Button
                    key={platform}
                    variant={platformFilter === platform ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlatformFilter(platform)}
                    disabled={isGenerating}
                  >
                    {platform}
                  </Button>
                ))}
              </div>

              {/* Style Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredStyles().map(style => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all ${
                      selectedStyles.includes(style.id)
                        ? 'border-primary ring-2 ring-primary'
                        : 'hover:border-primary'
                    }`}
                    onClick={() => !isGenerating && toggleStyle(style.id)}
                  >
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {selectedStyles.includes(style.id) && (
                              <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-xs text-primary-foreground">✓</span>
                              </div>
                            )}
                            {style.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {style.description}
                          </CardDescription>
                        </div>
                        {style.popular && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline">{style.platform}</Badge>
                          <span className="text-muted-foreground">{style.aspectRatio}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Section */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {batchProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Generating image {batchProgress.current} of {batchProgress.total}
                      </span>
                      <span className="font-medium">
                        {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                      </span>
                    </div>
                    <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
                  </div>
                )}
                {generationProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current image progress...</span>
                      <span className="font-medium">{Math.round(generationProgress)}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleBatchGenerate}
            disabled={isGenerating || inputImages.length === 0 || selectedStyles.length === 0}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Generating {batchProgress?.current} of {batchProgress?.total}...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-6 w-6" />
                Generate {selectedStyles.length} Advertising Image{selectedStyles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    Your Generated Images
                  </CardTitle>
                  <CardDescription>
                    Browse, download, and manage your AI-generated masterpieces
                  </CardDescription>
                </div>
                {/* Migration Button - Shows only if there are base64 images */}
                {images.some(img => img.image_url.startsWith('data:image')) && (
                  <Button
                    onClick={handleMigrateToStorage}
                    disabled={isMigrating}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Speed Up Gallery
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingImages ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading your images...</p>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-16">
                  <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No images yet</h3>
                  <p className="text-muted-foreground mb-6">Create your first AI-generated image in the Generate tab</p>
                  <Button onClick={() => document.querySelector('[value="generate"]')?.click()}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Creating
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image) => (
                    <div key={image.id} className="group relative">
                      <div
                        className="aspect-square overflow-hidden rounded-lg border bg-muted cursor-pointer"
                        onClick={() => setSelectedImageDetail(image)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.prompt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 backdrop-blur-sm bg-background/80"
                          onClick={() => handleDownload(image.image_url, image.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 backdrop-blur-sm bg-background/80"
                          onClick={() => handleToggleFavorite(image.id)}
                        >
                          <Heart className={`h-4 w-4 ${image.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0 backdrop-blur-sm bg-destructive/80"
                          onClick={() => handleDeleteImage(image.id)}
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
      </Tabs>

      {/* Image Detail Dialog */}
      <ImageDetailDialog
        open={!!selectedImageDetail}
        onOpenChange={(open) => !open && setSelectedImageDetail(null)}
        image={selectedImageDetail}
        onDownload={handleDownload}
        onToggleFavorite={handleToggleFavorite}
        onDelete={(id) => {
          handleDeleteImage(id);
          setSelectedImageDetail(null);
        }}
      />
    </div>
  );
};

export default ImagesSection;
