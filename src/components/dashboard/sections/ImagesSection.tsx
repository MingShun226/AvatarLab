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
import { ImageUploadBox } from '@/components/ui/image-upload-box';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  generateImage,
  checkGenerationProgress,
  saveGeneratedImage,
  getUserImages,
  deleteImage as deleteImageService,
  toggleFavorite as toggleFavoriteService,
  downloadImage,
  AIProvider,
  GeneratedImage,
} from '@/services/imageGeneration';

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
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [strength, setStrength] = useState(0.8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Load images on mount
  useEffect(() => {
    if (user) {
      loadImages();
    }
  }, [user]);

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
      // Clear input image when switching back to text2img
    } else if (generationMode === 'text2img' && inputImage) {
      setInputImage(null);
    }
  }, [generationMode]);

  const loadImages = async () => {
    try {
      setIsLoadingImages(true);
      const loadedImages = await getUserImages();
      setImages(loadedImages);
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
    if (generationMode === 'img2img' && !inputImage) {
      toast({
        title: "Error",
        description: "Please upload an image for img2img generation",
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
      const { taskId, provider: usedProvider } = await generateImage({
        prompt,
        provider,
        negativePrompt: negativePrompt || undefined,
        inputImage: generationMode === 'img2img' ? inputImage || undefined : undefined,
        strength: generationMode === 'img2img' ? strength : undefined,
      });

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

        // Save the generated image
        const savedImage = await saveGeneratedImage(
          imageUrl,
          prompt,
          usedProvider,
          'flux-kontext-pro',
          { negative_prompt: negativePrompt }
        );

        setImages([savedImage, ...images]);

        toast({
          title: "Image generated!",
          description: "Your image has been saved to the gallery.",
        });
      } else {
        // For sync providers (openai, stability)
        // The response already contains the image URL
        toast({
          title: "Image generated!",
          description: "Your image has been saved to the gallery.",
        });

        // Reload images to get the new one
        await loadImages();
      }

      // Reset form
      setPrompt('');
      setNegativePrompt('');
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
    try {
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      const newFavoriteStatus = !image.is_favorite;
      await toggleFavoriteService(imageId, newFavoriteStatus);

      setImages(images.map(img =>
        img.id === imageId ? { ...img, is_favorite: newFavoriteStatus } : img
      ));

      toast({
        title: newFavoriteStatus ? "Added to favorites" : "Removed from favorites",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteImageService(imageId);
      setImages(images.filter(img => img.id !== imageId));

      toast({
        title: "Image deleted",
        description: "The image has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
                  <Label>Input Image *</Label>
                  <ImageUploadBox
                    onImageSelect={(base64) => setInputImage(base64)}
                    onImageRemove={() => setInputImage(null)}
                    currentImage={inputImage || undefined}
                    maxSizeMB={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload the image you want to modify. The AI will transform it based on your prompt.
                  </p>
                </div>
              )}

              {/* Strength Slider for img2img */}
              {generationMode === 'img2img' && inputImage && (
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
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                Your Generated Images
              </CardTitle>
              <CardDescription>
                Browse, download, and manage your AI-generated masterpieces
              </CardDescription>
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
                      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
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
    </div>
  );
};

export default ImagesSection;
