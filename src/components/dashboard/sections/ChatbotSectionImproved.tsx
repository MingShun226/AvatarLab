import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Brain,
  BookOpen,
  TestTube,
  History,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CleanAvatarSelector } from '@/components/chatbot-training/CleanAvatarSelector';
import AvatarStatus from '@/components/chatbot-training/AvatarStatus';
import { DatabaseTrainingInterface } from '@/components/chatbot-training/DatabaseTrainingInterface';
import { TestChatNew } from '@/components/chatbot-training/TestChatNew';
import { KnowledgeBase } from '@/components/chatbot-training/KnowledgeBase';
import { DatabaseVersionControl } from '@/components/chatbot-training/DatabaseVersionControl';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ChatbotSectionImproved = () => {
  const [searchParams] = useSearchParams();
  const avatarFromUrl = searchParams.get('avatar');

  // Load selected avatar from localStorage or URL
  const getInitialAvatarId = () => {
    if (avatarFromUrl) return avatarFromUrl;
    return localStorage.getItem('chatbot_selected_avatar_id') || null;
  };

  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(getInitialAvatarId());
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);

  // Load active tab from localStorage
  const getInitialTab = () => {
    return localStorage.getItem('chatbot_active_tab') || 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [showAvatarDetails, setShowAvatarDetails] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Update selected avatar when URL param changes
  useEffect(() => {
    if (avatarFromUrl && avatarFromUrl !== selectedAvatarId) {
      setSelectedAvatarId(avatarFromUrl);
      localStorage.setItem('chatbot_selected_avatar_id', avatarFromUrl);
    }
  }, [avatarFromUrl]);

  // Fetch avatar data when selectedAvatarId changes
  useEffect(() => {
    if (selectedAvatarId && user) {
      fetchAvatarData(selectedAvatarId);
    } else {
      setSelectedAvatar(null);
    }
  }, [selectedAvatarId, user]);

  const fetchAvatarData = async (avatarId: string) => {
    try {
      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('id', avatarId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching avatar:', error);
        if (error.code === 'PGRST116') {
          localStorage.removeItem('chatbot_selected_avatar_id');
          setSelectedAvatarId(null);
        }
        toast({
          title: "Error",
          description: "Failed to load avatar data.",
          variant: "destructive"
        });
        return;
      }

      setSelectedAvatar(data);
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const handleAvatarSelection = (avatarId: string) => {
    if (isTraining) {
      toast({
        title: "Cannot Switch Avatar",
        description: "Please wait for current training to complete before switching avatars.",
        variant: "destructive"
      });
      return;
    }

    setSelectedAvatarId(avatarId);
    localStorage.setItem('chatbot_selected_avatar_id', avatarId);
    setShowAvatarDetails(false);
    setActiveTab('overview');

    toast({
      title: "Avatar Selected",
      description: "You can now start training your avatar.",
    });
  };

  const handleTrainingStart = () => {
    setIsTraining(true);
    toast({
      title: "Training Started",
      description: "Avatar training is in progress. Please wait...",
    });
  };

  const handleTrainingComplete = () => {
    setIsTraining(false);
  };

  const handleTabChange = (value: string) => {
    if (isTraining && value !== activeTab) {
      toast({
        title: "Training in Progress",
        description: "Please wait for training to complete before switching tabs.",
        variant: "destructive"
      });
      return;
    }
    setActiveTab(value);
    localStorage.setItem('chatbot_active_tab', value);
  };

  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'overview': return <TrendingUp className="h-4 w-4" />;
      case 'train': return <Brain className="h-4 w-4" />;
      case 'knowledge': return <BookOpen className="h-4 w-4" />;
      case 'test': return <TestTube className="h-4 w-4" />;
      case 'versions': return <History className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTabStatus = (tabId: string) => {
    if (tabId === 'overview') return 'completed';
    if (!selectedAvatar) return 'disabled';
    return 'available';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            AI Chatbot Training
          </h1>
          <p className="text-muted-foreground">
            Train your avatar's language processing and conversation abilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="learning-path-gradient text-white">
            Language Model v2.1
          </Badge>
          {isTraining && (
            <Badge variant="destructive" className="animate-pulse">
              Training Active
            </Badge>
          )}
        </div>
      </div>

      {/* Avatar Selection */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Avatar
          </CardTitle>
          <CardDescription>
            Choose an avatar to start training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CleanAvatarSelector
            selectedAvatarId={selectedAvatarId}
            onSelectAvatar={handleAvatarSelection}
          />
        </CardContent>
      </Card>

      {/* Avatar Details */}
      {selectedAvatar && (
        <Card className="card-modern">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              onClick={() => setShowAvatarDetails(!showAvatarDetails)}
              className="w-full flex items-center justify-between p-2 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Avatar Details & Current Status</span>
              </div>
              {showAvatarDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showAvatarDetails && (
              <div className="mt-4 pt-4 border-t">
                <AvatarStatus avatar={selectedAvatar} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <Card className="card-modern">
          <CardContent className="p-6">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              <TabsTrigger
                value="overview"
                disabled={isTraining && activeTab !== 'overview'}
                className="flex items-center gap-2 py-3"
              >
                {getTabIcon('overview')}
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="train"
                disabled={(isTraining && activeTab !== 'train') || !selectedAvatar}
                className="flex items-center gap-2 py-3"
              >
                {getTabIcon('train')}
                <span className="hidden sm:inline">Train</span>
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                disabled={(isTraining && activeTab !== 'knowledge') || !selectedAvatar}
                className="flex items-center gap-2 py-3"
              >
                {getTabIcon('knowledge')}
                <span className="hidden sm:inline">Knowledge</span>
              </TabsTrigger>
              <TabsTrigger
                value="test"
                disabled={(isTraining && activeTab !== 'test') || !selectedAvatar}
                className="flex items-center gap-2 py-3"
              >
                {getTabIcon('test')}
                <span className="hidden sm:inline">Test</span>
              </TabsTrigger>
              <TabsTrigger
                value="versions"
                disabled={(isTraining && activeTab !== 'versions') || !selectedAvatar}
                className="flex items-center gap-2 py-3"
              >
                {getTabIcon('versions')}
                <span className="hidden sm:inline">Versions</span>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Training Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">
                      {selectedAvatar ? '85%' : '0%'}
                    </span>
                  </div>
                  <Progress value={selectedAvatar ? 85 : 0} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {selectedAvatar ? 'Avatar ready for advanced training' : 'Select an avatar to begin'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedAvatar ? '92%' : '--'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedAvatar ? 'Excellent training quality' : 'No data available'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => selectedAvatar && setActiveTab('train')}
                    disabled={!selectedAvatar}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Start Training
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => selectedAvatar && setActiveTab('test')}
                    disabled={!selectedAvatar}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Guide */}
          {selectedAvatar && (
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Training Workflow
                </CardTitle>
                <CardDescription>
                  Follow these steps to optimize your avatar's performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">1. Upload Training Data</h4>
                      <p className="text-xs text-muted-foreground">Add conversations and examples</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">2. Build Knowledge Base</h4>
                      <p className="text-xs text-muted-foreground">Upload documents and context</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TestTube className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">3. Test & Refine</h4>
                      <p className="text-xs text-muted-foreground">Chat and improve responses</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <History className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">4. Manage Versions</h4>
                      <p className="text-xs text-muted-foreground">Track and rollback changes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Avatar Selected */}
          {!selectedAvatar && (
            <Card className="card-modern">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Avatar Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Please select an avatar from the dropdown above to start training
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="train" className="space-y-6">
          {selectedAvatar ? (
            <DatabaseTrainingInterface
              avatarName={selectedAvatar.name}
              avatarId={selectedAvatar.id}
              isTraining={isTraining}
              onTrainingStart={handleTrainingStart}
              onTrainingComplete={handleTrainingComplete}
            />
          ) : (
            <Card className="card-modern">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Avatar Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Please select an avatar to start training
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          {selectedAvatar ? (
            <KnowledgeBase
              avatarId={selectedAvatar.id}
              isTraining={isTraining}
            />
          ) : (
            <Card className="card-modern">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Avatar Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Please select an avatar to manage its knowledge base
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Chat Tab */}
        <TabsContent value="test" className="space-y-6">
          <TestChatNew />
        </TabsContent>

        {/* Version Control Tab */}
        <TabsContent value="versions" className="space-y-6">
          {selectedAvatar ? (
            <DatabaseVersionControl
              avatarId={selectedAvatar.id}
              isTraining={isTraining}
            />
          ) : (
            <Card className="card-modern">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Avatar Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Please select an avatar to view its version history
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatbotSectionImproved;