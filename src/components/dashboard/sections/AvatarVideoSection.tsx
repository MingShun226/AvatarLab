import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  User,
  Sparkles,
  Video,
  Loader2,
  Play,
  Upload,
  Camera,
  AlertCircle,
  ExternalLink,
  Settings,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  HEYGEN_AVATAR_SERVICES,
  AVATAR_STYLES,
  AVATAR_EMOTIONS,
  TALKING_STYLES,
  PHOTO_EXPRESSIONS,
  VIDEO_DIMENSIONS,
} from '@/config/heygenConfig';
import {
  generateAvatarVideo,
  pollForVideoCompletion,
  listAvatars,
  listVoices,
  HeyGenAvatar,
  HeyGenVoice,
} from '@/services/heygenService';

const AvatarVideoSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [avatarType, setAvatarType] = useState<'preset' | 'photo'>('preset');
  const [script, setScript] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [photoAvatar, setPhotoAvatar] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState('');
  const [avatarStyle, setAvatarStyle] = useState<string>('normal');
  const [emotion, setEmotion] = useState<string>('Friendly');
  const [talkingStyle, setTalkingStyle] = useState<string>('stable');
  const [photoExpression, setPhotoExpression] = useState<string>('default');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [dimension, setDimension] = useState('1920x1080');
  const [addCaptions, setAddCaptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Resource lists
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>([]);
  const [voices, setVoices] = useState<HeyGenVoice[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Load cached resources from localStorage on mount
  React.useEffect(() => {
    if (!user) return;

    try {
      const cached = localStorage.getItem('heygen_resources');
      if (cached) {
        const { avatars: cachedAvatars, voices: cachedVoices, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;

        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setAvatars(cachedAvatars);
          setVoices(cachedVoices);
          setLastFetchTime(new Date(timestamp));

          // Set defaults
          if (cachedAvatars.length > 0 && !avatarId) {
            setAvatarId(cachedAvatars[0].avatar_id);
          }
          if (cachedVoices.length > 0 && !voiceId) {
            setVoiceId(cachedVoices[0].voice_id);
          }

          console.log('[HeyGen] Loaded from cache (age:', Math.round(cacheAge / 1000), 'seconds)');
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached resources:', e);
    }

    // If no cache or cache expired, fetch fresh data
    fetchResources();
  }, [user]);

  // Fetch resources from API
  const fetchResources = async (showToast = false) => {
    setIsLoadingResources(true);
    setApiKeyMissing(false);

    try {
      const [avatarsData, voicesData] = await Promise.all([
        listAvatars(),
        listVoices(),
      ]);

      setAvatars(avatarsData);
      setVoices(voicesData);
      setLastFetchTime(new Date());

      // Cache the results
      try {
        localStorage.setItem('heygen_resources', JSON.stringify({
          avatars: avatarsData,
          voices: voicesData,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to cache resources:', e);
      }

      // Set first avatar and voice as defaults if available
      if (avatarsData.length > 0 && !avatarId) {
        setAvatarId(avatarsData[0].avatar_id);
      }
      if (voicesData.length > 0 && !voiceId) {
        setVoiceId(voicesData[0].voice_id);
      }

      // Only show success toast if requested (manual refresh)
      if (showToast && (avatarsData.length > 0 || voicesData.length > 0)) {
        toast({
          title: "Resources refreshed",
          description: `Found ${avatarsData.length} avatar${avatarsData.length !== 1 ? 's' : ''} and ${voicesData.length} voice${voicesData.length !== 1 ? 's' : ''}`,
        });
      }
    } catch (error: any) {
      console.error('Error loading HeyGen resources:', error);

      // Check if it's an API key error
      if (error.message?.includes('API key') || error.message?.includes('No HeyGen')) {
        setApiKeyMissing(true);
        if (showToast) {
          toast({
            title: "API Key Required",
            description: "Please add your HeyGen API key in Settings.",
            variant: "default",
          });
        }
      } else if (showToast) {
        toast({
          title: "Connection Error",
          description: "Could not connect to HeyGen. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingResources(false);
    }
  };

  // Manual refresh handler
  const handleRefreshResources = () => {
    fetchResources(true);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoAvatar(reader.result as string);
        toast({
          title: "Photo uploaded",
          description: "Your photo has been uploaded successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script for your avatar",
        variant: "destructive",
      });
      return;
    }

    if (avatarType === 'preset' && !avatarId) {
      toast({
        title: "Error",
        description: "Please select an avatar",
        variant: "destructive",
      });
      return;
    }

    if (avatarType === 'photo' && !photoAvatar) {
      toast({
        title: "Error",
        description: "Please upload your photo",
        variant: "destructive",
      });
      return;
    }

    if (!voiceId) {
      toast({
        title: "Error",
        description: "Please select a voice",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      toast({
        title: "Starting avatar video generation...",
        description: "This may take a few minutes depending on script length.",
      });

      // Generate avatar video
      const { videoId } = await generateAvatarVideo({
        avatarType,
        script,
        avatarId,
        photoAvatar,
        voiceId,
        avatarStyle,
        emotion,
        talkingStyle,
        photoExpression,
        speechSpeed,
        pitch,
        dimension,
        addCaptions,
      });

      console.log('Avatar video generation started with ID:', videoId);

      // Poll for completion
      const result = await pollForVideoCompletion(
        videoId,
        (progress) => {
          setGenerationProgress(progress);
        }
      );

      console.log('Avatar video completed:', result.videoUrl);

      toast({
        title: "Avatar video generated!",
        description: "Your avatar video has been generated successfully.",
      });

      // Open the video in a new tab
      window.open(result.videoUrl, '_blank');

      // Reset form
      setScript('');

    } catch (error: any) {
      console.error('Error generating avatar video:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate avatar video",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          AI Avatar Video Studio
        </h1>
        <p className="text-muted-foreground mt-2">
          Create engaging videos with AI avatars speaking custom scripts - powered by HeyGen
        </p>
      </div>

      {/* API Key Missing Notice */}
      {apiKeyMissing && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
              <AlertCircle className="h-5 w-5" />
              HeyGen API Key Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              To use the Avatar Video Studio, you need to add your HeyGen API key. Follow these steps to get started:
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">Get your HeyGen API Key</p>
                  <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                    Visit the HeyGen dashboard and navigate to API settings to generate your API key
                  </p>
                  <a
                    href="https://app.heygen.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
                  >
                    Open HeyGen API Settings
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">Add your API Key to AvatarLab</p>
                  <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                    Go to Settings → API Management, select "HeyGen" as the service, and paste your API key
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-yellow-600 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                    onClick={() => {
                      // Navigate to settings
                      window.location.hash = '#settings';
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Settings
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">Start Creating</p>
                  <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                    Once your API key is added, return here and your available avatars and voices will load automatically
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-yellow-500/30">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> HeyGen offers a free trial with limited credits. For production use, you'll need a paid plan.{' '}
                <a
                  href="https://www.heygen.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  View pricing
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create Avatar Video
          </CardTitle>
          <CardDescription>
            Select an avatar or upload your photo, write a script, and generate your video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Type Selection */}
          <div className="space-y-2">
            <Label>Avatar Type</Label>
            <Tabs value={avatarType} onValueChange={(value) => setAvatarType(value as 'preset' | 'photo')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">Preset Avatar</TabsTrigger>
                <TabsTrigger value="photo">Your Photo</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              {avatarType === 'preset'
                ? 'Choose from professionally designed AI avatars'
                : 'Upload your own photo and let AI animate it'}
            </p>
          </div>

          {/* Resources Refresh */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lastFetchTime && (
                <span>
                  Last updated: {lastFetchTime.toLocaleTimeString()}
                </span>
              )}
              {!lastFetchTime && <span>Resources not loaded</span>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshResources}
              disabled={isLoadingResources}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingResources ? 'animate-spin' : ''}`} />
              Refresh Resources
            </Button>
          </div>

          {/* Preset Avatar Selection */}
          {avatarType === 'preset' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="avatarId">Select Avatar *</Label>
                {isLoadingResources ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading avatars...</span>
                  </div>
                ) : avatars.length > 0 ? (
                  <Select value={avatarId} onValueChange={setAvatarId}>
                    <SelectTrigger id="avatarId">
                      <SelectValue placeholder="Choose an avatar" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {avatars.map((avatar) => (
                        <SelectItem key={avatar.avatar_id} value={avatar.avatar_id}>
                          <div className="flex items-center gap-2">
                            {avatar.preview_image_url && (
                              <img
                                src={avatar.preview_image_url}
                                alt={avatar.avatar_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">{avatar.avatar_name}</span>
                              {avatar.gender && (
                                <span className="text-xs text-muted-foreground">{avatar.gender}</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                    <p className="font-medium text-blue-900 dark:text-blue-100">No Personal Avatars Found</p>
                    <p className="text-blue-800 dark:text-blue-200 text-xs">
                      You haven't created any personal avatars yet. To create avatars:
                    </p>
                    <ol className="text-xs text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                      <li>Visit the HeyGen dashboard</li>
                      <li>Create a custom avatar using their Avatar Builder</li>
                      <li>Return here and refresh to see your avatars</li>
                    </ol>
                    <a
                      href="https://app.heygen.com/avatars"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline mt-2"
                    >
                      Go to HeyGen Avatar Builder
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {avatars.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {avatars.length} personal avatar{avatars.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarStyle">Avatar Style</Label>
                <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                  <SelectTrigger id="avatarStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVATAR_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How the avatar should be framed in the video
                </p>
              </div>
            </>
          )}

          {/* Photo Avatar Upload */}
          {avatarType === 'photo' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="photoUpload">Upload Your Photo *</Label>
                <div className="flex items-center gap-4">
                  <label htmlFor="photoUpload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                      {photoAvatar ? (
                        <img src={photoAvatar} alt="Uploaded" className="h-32 w-32 object-cover rounded-lg mx-auto" />
                      ) : (
                        <>
                          <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload photo</p>
                        </>
                      )}
                    </div>
                    <input
                      id="photoUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isGenerating}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a clear, front-facing photo for best results
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="talkingStyle">Talking Style</Label>
                <Select value={talkingStyle} onValueChange={setTalkingStyle}>
                  <SelectTrigger id="talkingStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TALKING_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoExpression">Expression</Label>
                <Select value={photoExpression} onValueChange={setPhotoExpression}>
                  <SelectTrigger id="photoExpression">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHOTO_EXPRESSIONS.map((expression) => (
                      <SelectItem key={expression} value={expression}>
                        {expression.charAt(0).toUpperCase() + expression.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voiceId">Voice *</Label>
            {isLoadingResources ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading voices...</span>
              </div>
            ) : voices.length > 0 ? (
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger id="voiceId">
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {voices.map((voice) => (
                    <SelectItem key={voice.voice_id} value={voice.voice_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.voice_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {voice.language && voice.gender
                            ? `${voice.language} • ${voice.gender}`
                            : voice.language || voice.gender || 'Unknown'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                No voices found. Please ensure you have added your HeyGen API key in Settings.
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {voices.length} voice{voices.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Emotion (Preset Avatars Only) */}
          {avatarType === 'preset' && (
            <div className="space-y-2">
              <Label htmlFor="emotion">Emotion</Label>
              <Select value={emotion} onValueChange={setEmotion}>
                <SelectTrigger id="emotion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVATAR_EMOTIONS.map((emo) => (
                    <SelectItem key={emo} value={emo}>
                      {emo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Script Input */}
          <div className="space-y-2">
            <Label htmlFor="script">Script *</Label>
            <Textarea
              id="script"
              placeholder="Enter the script your avatar should speak..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Write what you want your avatar to say
            </p>
          </div>

          {/* Speech Controls */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium">Speech Controls</div>

            {/* Speed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Speech Speed</Label>
                <span className="text-sm text-muted-foreground">{speechSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[speechSpeed]}
                onValueChange={(values) => setSpeechSpeed(values[0])}
                min={0.5}
                max={1.5}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Pitch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-muted-foreground">{pitch > 0 ? `+${pitch}` : pitch}</span>
              </div>
              <Slider
                value={[pitch]}
                onValueChange={(values) => setPitch(values[0])}
                min={-50}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Video Dimension */}
          <div className="space-y-2">
            <Label htmlFor="dimension">Video Dimension</Label>
            <Select value={dimension} onValueChange={setDimension}>
              <SelectTrigger id="dimension">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_DIMENSIONS.map((dim) => (
                  <SelectItem key={`${dim.width}x${dim.height}`} value={`${dim.width}x${dim.height}`}>
                    {dim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Captions */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="addCaptions"
              checked={addCaptions}
              onChange={(e) => setAddCaptions(e.target.checked)}
              disabled={isGenerating}
              className="rounded border-gray-300"
            />
            <label htmlFor="addCaptions" className="text-sm cursor-pointer">
              Add captions to video
            </label>
          </div>

          {/* Progress */}
          {isGenerating && generationProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Generating avatar video...</span>
                <span className="font-medium">{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                This may take several minutes depending on script length
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim()}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Generate Avatar Video
              </>
            )}
          </Button>

          {/* Info Note */}
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
            <strong>Note:</strong> Avatar video generation requires a HeyGen API key.
            Please add your API key in Settings → API Management before generating avatar videos.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvatarVideoSection;
