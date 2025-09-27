
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ttsService } from '@/services/ttsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  Play, 
  Pause, 
  Upload, 
  Download, 
  Volume2,
  Settings,
  AudioLines
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TTSSection = () => {
  const [selectedVoice, setSelectedVoice] = useState('aria');
  const [pitch, setPitch] = useState([1.0]);
  const [speed, setSpeed] = useState([1.0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testText, setTestText] = useState('Hello, this is your AI avatar speaking. How do you like my voice?');
  const { toast } = useToast();

  // Fetch TTS voices from database
  const { data: voiceOptions = [], isLoading: voicesLoading } = useQuery({
    queryKey: ['tts-voices'],
    queryFn: ttsService.getTTSVoices,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const showComingSoon = () => {
    toast({
      title: "Coming Soon",
      description: "This feature will be available with full backend integration.",
    });
  };

  // Show loading state for voices
  if (voicesLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <AudioLines className="h-8 w-8 animate-pulse mr-2" />
        <span>Loading voice options...</span>
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
            TTS Voice Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure and train your avatar's voice characteristics
          </p>
        </div>
        <Badge variant="outline" className="learning-path-gradient text-white text-xs">
          Voice Model v3.2
        </Badge>
      </div>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configure Voice</TabsTrigger>
          <TabsTrigger value="clone">Clone Voice</TabsTrigger>
          <TabsTrigger value="library">Voice Library</TabsTrigger>
        </TabsList>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Voice Settings
                </CardTitle>
                <CardDescription className="text-sm">
                  Customize your avatar's voice parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Voice Selection</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="input-modern h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{voice.name}</span>
                            <span className="text-xs text-muted-foreground">{voice.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Pitch: {pitch[0].toFixed(1)}</Label>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Speed: {speed[0].toFixed(1)}x</Label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-text" className="text-sm">Test Text</Label>
                  <Input
                    id="test-text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="input-modern h-9 text-sm"
                    placeholder="Enter text to test voice..."
                  />
                </div>

                <Button 
                  className="w-full btn-hero h-9"
                  onClick={showComingSoon}
                  size="sm"
                >
                  <Play className="mr-2 h-3 w-3" />
                  Test Voice
                </Button>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AudioLines className="h-4 w-4" />
                  Voice Preview
                </CardTitle>
                <CardDescription className="text-sm">
                  Real-time voice visualization and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-24 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-muted-foreground text-center">
                    <Volume2 className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-xs">Voice waveform will appear here</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Current Voice</span>
                    <span className="text-xs font-medium capitalize">{selectedVoice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Quality</span>
                    <Badge variant="outline" className="text-xs">High Definition</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Language</span>
                    <span className="text-xs font-medium">English (US)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Sample Rate</span>
                    <span className="text-xs font-medium">48kHz</span>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <Button variant="outline" className="w-full h-8 text-xs" onClick={showComingSoon}>
                    <Download className="mr-2 h-3 w-3" />
                    Export Voice Sample
                  </Button>
                  <Button variant="outline" className="w-full h-8 text-xs" onClick={showComingSoon}>
                    <Upload className="mr-2 h-3 w-3" />
                    Upload Audio Reference
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clone Voice Tab */}
        <TabsContent value="clone" className="space-y-4">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-base">Voice Cloning</CardTitle>
              <CardDescription className="text-sm">
                Create a custom voice model based on your voice samples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
                <Mic className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-base font-medium mb-2">Upload Voice Samples</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload high-quality audio recordings (minimum 10 minutes recommended)
                </p>
                <Button className="btn-hero h-9 text-sm" onClick={showComingSoon}>
                  <Upload className="mr-2 h-3 w-3" />
                  Choose Audio Files
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Recording Quality</h4>
                  <p className="text-xs text-muted-foreground">Clear, noise-free audio</p>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Duration</h4>
                  <p className="text-xs text-muted-foreground">10+ minutes recommended</p>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Format</h4>
                  <p className="text-xs text-muted-foreground">WAV, MP3, or FLAC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="text-base">Voice Library</CardTitle>
              <CardDescription className="text-sm">
                Browse and test available voice models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {voiceOptions.map((voice) => (
                  <div key={voice.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{voice.name}</h4>
                      <Badge variant="outline" className="text-xs">{voice.accent}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{voice.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-8 text-xs"
                        onClick={showComingSoon}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Preview
                      </Button>
                      <Button 
                        variant={selectedVoice === voice.id ? "default" : "outline"} 
                        size="sm" 
                        className="flex-1 h-8 text-xs"
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                        {selectedVoice === voice.id ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TTSSection;
