
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ttsService } from '@/services/ttsService';
import { voiceCloneService, VoiceClone, VoiceSample } from '@/services/voiceCloneService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic,
  Play,
  Pause,
  Upload,
  Download,
  Volume2,
  Settings,
  AudioLines,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TTSSection = () => {
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [stability, setStability] = useState([0.5]);
  const [similarityBoost, setSimilarityBoost] = useState([0.75]);
  const [testText, setTestText] = useState('Hello, this is your AI avatar speaking. How do you like my voice?');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Voice cloning states
  const [uploadedSamples, setUploadedSamples] = useState<VoiceSample[]>([]);
  const [cloneName, setCloneName] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default to English
  const [removeBackgroundNoise, setRemoveBackgroundNoise] = useState(true); // Enable by default for better quality
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingClone, setIsCreatingClone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch voice clones
  const { data: voiceClones = [], isLoading: clonesLoading } = useQuery({
    queryKey: ['voice-clones'],
    queryFn: voiceCloneService.getVoiceClones,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch TTS generation history
  const { data: ttsHistory = [] } = useQuery({
    queryKey: ['tts-generations'],
    queryFn: voiceCloneService.getTTSGenerations,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file =>
        voiceCloneService.uploadVoiceSample(file)
      );

      const samples = await Promise.all(uploadPromises);
      setUploadedSamples(prev => [...prev, ...samples]);

      toast({
        title: "Success",
        description: `${samples.length} sample(s) uploaded successfully!`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload voice samples',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle create voice clone
  const handleCreateClone = async () => {
    // Check Creator plan limit: max 1 professional voice clone
    const professionalVoiceCount = voiceClones.filter(v => v.status === 'active').length;
    if (professionalVoiceCount >= 1) {
      toast({
        title: "Voice Clone Limit Reached",
        description: "Creator plan allows 1 professional voice clone. Delete your existing voice to create a new one, or upgrade to Pro plan for unlimited clones.",
        variant: "destructive",
      });
      return;
    }

    if (!cloneName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for your voice clone",
        variant: "destructive",
      });
      return;
    }

    if (uploadedSamples.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one voice sample",
        variant: "destructive",
      });
      return;
    }

    // Check total audio duration (ElevenLabs recommends at least 1 minute, ideally 3-5 minutes)
    const totalDuration = uploadedSamples.reduce((sum, sample) => sum + (sample.duration_seconds || 0), 0);
    if (totalDuration < 60) {
      toast({
        title: "Audio Duration Warning",
        description: `Your samples are only ${Math.round(totalDuration)}s long. ElevenLabs recommends at least 60s (ideally 3-5 minutes) for best results. The cloned voice may not sound accurate.`,
        variant: "destructive",
      });
      // Allow to continue but warn user
    }

    setIsCreatingClone(true);
    try {
      const samples = uploadedSamples.map(s => ({
        url: s.file_url,
        filename: s.filename,
        size: s.file_size_bytes,
        duration: s.duration_seconds,
      }));

      await voiceCloneService.createVoiceClone(
        cloneName,
        cloneDescription,
        samples,
        {
          language: selectedLanguage,
          remove_background_noise: removeBackgroundNoise,
        }
      );

      toast({
        title: "Professional Voice Clone Training Started!",
        description: `Your voice "${cloneName}" is being trained with Professional Voice Cloning. This takes 2-4 hours. Check ElevenLabs for status and use it in Test Voice tab once ready.`,
      });

      // Reset form
      setCloneName('');
      setCloneDescription('');
      setSelectedLanguage('en');
      setRemoveBackgroundNoise(true);
      setUploadedSamples([]);

      // Refresh voice clones list
      queryClient.invalidateQueries({ queryKey: ['voice-clones'] });
    } catch (error: any) {
      toast({
        title: "Clone Failed",
        description: error.message || 'Failed to create voice clone',
        variant: "destructive",
      });
    } finally {
      setIsCreatingClone(false);
    }
  };

  // Handle delete voice clone
  const handleDeleteClone = async (cloneId: string) => {
    if (!confirm('Are you sure you want to delete this voice clone? This will also remove it from your ElevenLabs account.')) return;

    try {
      await voiceCloneService.deleteVoiceClone(cloneId);
      toast({
        title: "Voice Clone Deleted",
        description: "The voice clone has been removed successfully from both the app and ElevenLabs.",
      });
      queryClient.invalidateQueries({ queryKey: ['voice-clones'] });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || 'Failed to delete voice clone',
        variant: "destructive",
      });
    }
  };

  // Handle remove uploaded sample
  const handleRemoveSample = async (sample: VoiceSample) => {
    try {
      await voiceCloneService.deleteVoiceSample(sample.id, sample.file_url);
      setUploadedSamples(prev => prev.filter(s => s.id !== sample.id));
      toast({
        title: "Sample Removed",
        description: "Voice sample has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to remove sample',
        variant: "destructive",
      });
    }
  };

  // Handle generate TTS
  const handleGenerateTTS = async () => {
    if (!testText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter some text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoice) {
      toast({
        title: "No Voice Selected",
        description: "Please select a voice clone from the dropdown before generating speech",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Generating TTS with voice:', selectedVoice);

      const settings = {
        stability: stability[0],
        similarity_boost: similarityBoost[0],
      };

      const generation = await voiceCloneService.generateTTS(
        testText,
        selectedVoice,
        settings
      );

      toast({
        title: "TTS Generated!",
        description: "Your audio has been generated successfully.",
      });

      // Play the generated audio
      if (generation.audio_url) {
        playAudio(generation.audio_url);
      }

      // Refresh TTS history
      queryClient.invalidateQueries({ queryKey: ['tts-generations'] });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate TTS',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle play audio
  const playAudio = (url: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(url);
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => {
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
    });

    audio.play();
    setCurrentAudio(audio);
    setIsPlaying(true);
  };

  // Handle stop audio
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Show loading state
  if (clonesLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <AudioLines className="h-8 w-8 animate-pulse mr-2" />
        <span>Loading voice clones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6" />
            TTS Voice Cloning Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Clone your voice and generate natural-sounding speech with ElevenLabs
          </p>
        </div>
        <Badge variant="outline" className="learning-path-gradient text-white text-xs">
          ElevenLabs Integration
        </Badge>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">Test Voice</TabsTrigger>
          <TabsTrigger value="clone">Clone Voice</TabsTrigger>
          <TabsTrigger value="library">My Voices</TabsTrigger>
        </TabsList>

        {/* Test Voice Tab */}
        <TabsContent value="test" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Voice Settings
                </CardTitle>
                <CardDescription className="text-sm">
                  Select a voice and customize speech parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Voice Selection</Label>
                  <Select value={selectedVoice || ''} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="input-modern h-9">
                      <SelectValue placeholder="Select a voice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceClones.length === 0 ? (
                        <SelectItem value="default" disabled>
                          No voices available - create one in Clone Voice tab
                        </SelectItem>
                      ) : (
                        voiceClones.map((clone) => (
                          <SelectItem key={clone.id} value={clone.id}>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{clone.name}</span>
                              <span className="text-xs text-muted-foreground">{clone.description || 'Custom voice'}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Stability: {stability[0].toFixed(2)}</Label>
                  <Slider
                    value={stability}
                    onValueChange={setStability}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher = more consistent, Lower = more expressive</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Similarity Boost: {similarityBoost[0].toFixed(2)}</Label>
                  <Slider
                    value={similarityBoost}
                    onValueChange={setSimilarityBoost}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher = closer to original voice</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-text" className="text-sm">Text to Convert</Label>
                  <Textarea
                    id="test-text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="input-modern text-sm min-h-[100px]"
                    placeholder="Enter text to convert to speech..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 btn-hero h-9"
                    onClick={handleGenerateTTS}
                    disabled={isGenerating || !testText.trim() || !selectedVoice}
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-3 w-3" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                  {isPlaying && (
                    <Button
                      variant="outline"
                      className="h-9"
                      onClick={stopAudio}
                      size="sm"
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AudioLines className="h-4 w-4" />
                  Recent Generations
                </CardTitle>
                <CardDescription className="text-sm">
                  Your TTS generation history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {ttsHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No generations yet</p>
                      <p className="text-xs">Generate your first TTS audio to see it here</p>
                    </div>
                  ) : (
                    ttsHistory.map((gen) => (
                      <div key={gen.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                            {gen.text}
                          </p>
                          {gen.audio_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => playAudio(gen.audio_url!)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(gen.created_at).toLocaleDateString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {gen.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clone Voice Tab */}
        <TabsContent value="clone" className="space-y-4">
          {/* Professional Voice Cloning Notice */}
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-green-600">Professional Voice Cloning (PVC) - Creator Plan</h4>
              <p className="text-xs text-muted-foreground">
                This uses <strong>Professional Voice Cloning API</strong> for hyper-realistic voice replication.
                Upload 1-5 minutes of high-quality audio. Training takes 2-4 hours after submission.
              </p>
              <div className="mt-2 p-3 bg-background/50 rounded border border-green-500/20">
                <p className="text-xs font-medium text-green-600 mb-1">How it works:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>✅ Upload voice samples → Submit for training</li>
                  <li>✅ Training completes in 2-4 hours</li>
                  <li>✅ Voice becomes available in your ElevenLabs account</li>
                  <li>✅ Use the voice for high-quality TTS generation</li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-base">Create Professional Voice Clone</CardTitle>
              <CardDescription className="text-sm">
                Upload voice samples and create a professional voice clone (training: 2-4 hours)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Details */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="clone-name" className="text-sm">Voice Name *</Label>
                  <Input
                    id="clone-name"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                    className="input-modern h-9 text-sm"
                    placeholder="e.g., My Voice, Professional Voice"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clone-description" className="text-sm">Description (Optional)</Label>
                  <Textarea
                    id="clone-description"
                    value={cloneDescription}
                    onChange={(e) => setCloneDescription(e.target.value)}
                    className="input-modern text-sm"
                    placeholder="Describe this voice..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voice-language" className="text-sm">Audio Sample Language * (Required for PVC)</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger id="voice-language" className="input-modern h-9">
                      <SelectValue placeholder="Select language (required)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="pl">Polish</SelectItem>
                      <SelectItem value="nl">Dutch</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="tr">Turkish</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Required:</strong> Select the language used in your audio samples. Critical for PVC accuracy.
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="remove-noise" className="text-sm font-medium cursor-pointer">
                      Remove Background Noise
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically clean up audio samples (recommended)
                    </p>
                  </div>
                  <input
                    id="remove-noise"
                    type="checkbox"
                    checked={removeBackgroundNoise}
                    onChange={(e) => setRemoveBackgroundNoise(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* File Upload Area */}
              <div className="space-y-3">
                <Label className="text-sm">Voice Samples *</Label>
                <div
                  className="text-center p-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.flac,.ogg,audio/mpeg,audio/wav,audio/flac,audio/ogg"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {isUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
                      <p className="text-sm">Uploading samples...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-base font-medium mb-2">Upload Voice Samples</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Click to choose audio files (MP3, WAV, FLAC, OGG)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 1-5 minutes of clear speech per sample
                      </p>
                    </>
                  )}
                </div>

                {/* Uploaded Samples List */}
                {uploadedSamples.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Uploaded Samples ({uploadedSamples.length})</Label>
                      <span className="text-xs text-muted-foreground">
                        Total: {Math.round(uploadedSamples.reduce((sum, s) => sum + (s.duration_seconds || 0), 0))}s
                        {uploadedSamples.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) < 60 && (
                          <span className="text-destructive ml-1">(Need 60s+ for best results)</span>
                        )}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {uploadedSamples.map((sample) => (
                        <div key={sample.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm truncate block">{sample.filename}</span>
                              {sample.duration_seconds && (
                                <span className="text-xs text-muted-foreground">{Math.round(sample.duration_seconds)}s</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={() => handleRemoveSample(sample)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Quality ⭐</h4>
                  <p className="text-xs text-muted-foreground">Crystal clear, noise-free, single speaker</p>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Duration ⭐</h4>
                  <p className="text-xs text-muted-foreground">1-5 min total (more is better)</p>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Format</h4>
                  <p className="text-xs text-muted-foreground">MP3, WAV, FLAC, OGG</p>
                </div>
              </div>

              {/* Create Button */}
              <Button
                className="w-full btn-hero h-9"
                onClick={handleCreateClone}
                disabled={
                  isCreatingClone ||
                  !cloneName.trim() ||
                  uploadedSamples.length === 0
                }
              >
                {isCreatingClone ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Creating Voice Clone...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-3 w-3" />
                    Create Professional Voice Clone
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Library Tab */}
        <TabsContent value="library" className="space-y-4">
          {/* Voice Clone Status Banner */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
            <div className="flex-1">
              <h4 className="text-sm font-medium">Professional Voice Clones</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active: {voiceClones.filter(v => v.status === 'active').length} |
                Training: {voiceClones.filter(v => v.status === 'training').length} |
                Total: {voiceClones.length}
              </p>
            </div>
            <Badge variant="default">
              PVC API Enabled
            </Badge>
          </div>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-base">My Voice Clones</CardTitle>
              <CardDescription className="text-sm">
                Manage your professional voice clones created via API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voiceClones.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base font-medium mb-2">No Voice Clones Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first voice clone in the "Clone Voice" tab
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {voiceClones.map((clone) => (
                    <div key={clone.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{clone.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {clone.description || 'Custom voice clone'}
                          </p>
                        </div>
                        {clone.status === 'training' ? (
                          <Badge
                            variant="secondary"
                            className="text-xs ml-2 flex-shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20"
                          >
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Training
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="text-xs ml-2 flex-shrink-0 bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                      </div>

                      {clone.status === 'training' && (
                        <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded text-xs text-amber-600">
                          Voice is training (2-6h). Check your ElevenLabs account or wait for email notification.
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AudioLines className="h-3 w-3" />
                        <span>{clone.sample_count} sample{clone.sample_count !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created {new Date(clone.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant={selectedVoice === clone.id ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setSelectedVoice(clone.id)}
                        >
                          {selectedVoice === clone.id ? 'Selected' : 'Select'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteClone(clone.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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

export default TTSSection;
