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
  Palette
} from 'lucide-react';
import { MultiImageUploadBox } from '@/components/ui/multi-image-upload-box';
import { ImagePreviewDialog } from '@/components/ui/image-preview-dialog';
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

const PROVIDERS = [
  { value: 'google', label: 'Google Gemini (Nano Banana 🍌)', icon: Sparkles, description: 'Best for img2img, character consistency, fast & affordable', supportsImg2img: true },
  { value: 'openai', label: 'OpenAI DALL-E 3', icon: Sparkles, description: 'Highest quality, text-to-image only', supportsImg2img: false },
  { value: 'stability', label: 'Stability AI', icon: Palette, description: 'Great for artistic styles, supports img2img', supportsImg2img: true },
  { value: 'kie-ai', label: 'KIE AI Flux', icon: Zap, description: 'Fast generation, text-to-image only', supportsImg2img: false },
];

const ImagesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [generationMode, setGenerationMode] = useState<'text2img' | 'img2img'>('text2img');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [provider, setProvider] = useState<AIProvider>('google');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [strength, setStrength] = useState(0.8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; prompt: string; provider: string; parameters?: any; originalImageUrls?: string[] } | null>(null);
  const [selectedImageDetail, setSelectedImageDetail] = useState<GeneratedImage | null>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);

  // React Query hooks
  const { data: images = [], isLoading: isLoadingImages } = useGalleryImages();
  const deleteMutation = useDeleteImage();
  const toggleFavoriteMutation = useToggleFavorite();
  const { refresh: refreshImages } = useRefreshImages();

  // Auto-switch to compatible provider when switching to img2img
  useEffect(() => {
    if (generationMode === 'img2img') {
      const currentProvider = PROVIDERS.find(p => p.value === provider);
      if (currentProvider && !currentProvider.supportsImg2img) {
        // Switch to Google (Nano Banana) as default for img2img
        const img2imgProvider = PROVIDERS.find(p => p.supportsImg2img);
        if (img2imgProvider) {
          setProvider(img2imgProvider.value as AIProvider);
          toast({
            title: "Provider switched",
            description: `Switched to ${img2imgProvider.label} (supports img2img)`,
          });
        }
      }
      // Clear input images when switching back to text2img
    } else if (generationMode === 'text2img') {
      if (inputImages.length > 0) setInputImages([]);
    }
  }, [generationMode]);

  // No longer needed - React Query handles loading automatically

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate an image",
        variant: "destructive",
      });
      return;
    }

    // Validate img2img requirements
    if (generationMode === 'img2img' && inputImages.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image for img2img generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const providerLabel = PROVIDERS.find(p => p.value === provider)?.label;
      toast({
        title: "Starting generation...",
        description: `Using ${providerLabel} in ${generationMode === 'img2img' ? 'img2img' : 'text-to-image'} mode`,
      });

      // Start generation
      const response = await generateImage({
        prompt,
        provider,
        negativePrompt: negativePrompt || undefined,
        inputImages: generationMode === 'img2img' && inputImages.length > 0 ? inputImages : undefined,
        strength: generationMode === 'img2img' ? strength : undefined,
      });

      const { taskId, provider: usedProvider } = response;
      setCurrentTaskId(taskId);

      // For async providers (kie-ai), poll for completion
      if (usedProvider === 'kie-ai' && taskId) {
        let imageUrl: string | null = null;
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts && !imageUrl) {
          await new Promise(resolve => setTimeout(resolve, 2000));

          const progress = await checkGenerationProgress(taskId);
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

        // Show preview
        setPreviewImage({
          url: imageUrl,
          prompt,
          provider: usedProvider,
          parameters: { negative_prompt: negativePrompt },
          originalImageUrls: generationMode === 'img2img' && inputImages.length > 0 ? inputImages : undefined
        });

        toast({
          title: "Image generated!",
          description: "Review your image and choose what to do next.",
        });
      } else {
        // For sync providers (openai, stability, google)
        // Edge function returns imageUrl and originalImageUrls
        const imageUrl = (response as any).imageUrl || taskId;
        const originalImageUrls = (response as any).originalImageUrls;

        // Show preview
        setPreviewImage({
          url: imageUrl,
          prompt,
          provider: usedProvider,
          parameters: { negative_prompt: negativePrompt },
          originalImageUrls: originalImageUrls
        });

        toast({
          title: "Image generated!",
          description: "Review your image and choose what to do next.",
        });
      }

      // Don't reset form yet - user might want to improve
      setGenerationProgress(100);

    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentTaskId(null);
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

  const handleSavePreview = async () => {
    if (!previewImage) return;

    setIsSavingPreview(true);
    try {
      await saveGeneratedImage(
        previewImage.url,
        previewImage.prompt,
        previewImage.provider,
        undefined,
        previewImage.parameters,
        previewImage.originalImageUrls
      );

      toast({
        title: "Image saved!",
        description: "Your image has been saved to the gallery.",
      });

      // Refresh gallery and close preview
      refreshImages();
      setPreviewImage(null);

      // Reset form
      setPrompt('');
      setNegativePrompt('');
      setInputImages([]);
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPreview(false);
    }
  };

  const handleImproveImage = () => {
    if (!previewImage) return;

    // Use the generated image as input for improvement
    // If there were original images, keep using those; otherwise use the generated image
    const imagesToUse = previewImage.originalImageUrls && previewImage.originalImageUrls.length > 0
      ? [...previewImage.originalImageUrls, previewImage.url] // Add generated to originals
      : [previewImage.url]; // Just use generated image

    // Keep the prompt and switch to img2img mode
    setGenerationMode('img2img');
    setInputImages(imagesToUse);
    setPrompt(previewImage.prompt);

    // Close preview
    setPreviewImage(null);

    toast({
      title: "Ready to improve",
      description: "Adjust your prompt and regenerate to improve the image.",
    });
  };

  const handleDiscardPreview = () => {
    setPreviewImage(null);

    // Reset form
    setPrompt('');
    setNegativePrompt('');
    setInputImages([]);

    toast({
      title: "Image discarded",
      description: "The generated image has been discarded.",
    });
  };

  const handleDownloadPreview = async () => {
    if (!previewImage) return;

    try {
      const filename = `ai-image-${Date.now()}.png`;
      await downloadImage(previewImage.url, filename);

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
    }
  };

  const selectedProvider = PROVIDERS.find(p => p.value === provider);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wand2 className="h-8 w-8" />
          AI Images Studio
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate stunning images with AI - powered by multiple providers
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="gallery">Gallery ({images.length})</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Create New Image
              </CardTitle>
              <CardDescription>
                Describe your vision and let AI bring it to life
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generation Mode Toggle */}
              <div className="space-y-2">
                <Label>Generation Mode</Label>
                <Tabs value={generationMode} onValueChange={(value) => setGenerationMode(value as 'text2img' | 'img2img')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text2img">Text-to-Image</TabsTrigger>
                    <TabsTrigger value="img2img">Image-to-Image</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  {generationMode === 'text2img'
                    ? 'Generate images from text descriptions only'
                    : 'Upload an image and modify it with AI'}
                </p>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select value={provider} onValueChange={(value) => setProvider(value as AIProvider)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedProvider && (
                        <div className="flex items-center gap-2">
                          <selectedProvider.icon className="h-4 w-4" />
                          <span>{selectedProvider.label}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS
                      .filter(p => generationMode === 'text2img' || p.supportsImg2img)
                      .map((p) => {
                        const Icon = p.icon;
                        return (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{p.label}</div>
                                <div className="text-xs text-muted-foreground">{p.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {selectedProvider && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <selectedProvider.icon className="h-4 w-4" />
                    {selectedProvider.description}
                  </p>
                )}
              </div>

              {/* Image Upload for img2img */}
              {generationMode === 'img2img' && (
                <div className="space-y-2">
                  <Label>Input Images *</Label>
                  <MultiImageUploadBox
                    onImagesChange={(images) => setInputImages(images)}
                    currentImages={inputImages}
                    maxImages={5}
                    maxSizeMB={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload one or more images to combine. The AI will blend them together based on your prompt.
                    For example: upload a person photo + product photo to create an advertisement.
                  </p>
                </div>
              )}

              {/* Strength Slider for img2img */}
              {generationMode === 'img2img' && inputImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Transformation Strength</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(strength * 100)}%</span>
                  </div>
                  <Slider
                    value={[strength]}
                    onValueChange={(values) => setStrength(values[0])}
                    min={0.1}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values keep the original image more intact. Higher values allow more creative freedom.
                  </p>
                </div>
              )}

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  placeholder={
                    generationMode === 'text2img'
                      ? "A serene mountain landscape at sunset with golden light streaming through clouds, photorealistic, 4k quality..."
                      : inputImages.length > 1
                        ? "Combine these images into an advertisement, with the person holding the product in a modern studio setting..."
                        : "Change the background to a futuristic cityscape at night with neon lights, keep the subject in focus..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  {generationMode === 'text2img'
                    ? 'Describe the image you want to create in detail'
                    : inputImages.length > 1
                      ? 'Describe how you want to combine and blend the uploaded images'
                      : 'Describe how you want to transform the uploaded image'}
                </p>
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                <Textarea
                  id="negative-prompt"
                  placeholder="blurry, low quality, distorted, ugly..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Describe what you don't want in the image
                </p>
              </div>

              {/* Progress */}
              {isGenerating && generationProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Generating...</span>
                    <span className="font-medium">{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
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

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        prompt={previewImage?.prompt || ''}
        provider={previewImage?.provider || ''}
        onSave={handleSavePreview}
        onImprove={handleImproveImage}
        onDiscard={handleDiscardPreview}
        onDownload={handleDownloadPreview}
        isSaving={isSavingPreview}
      />

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
