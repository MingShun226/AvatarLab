
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CleanAvatarSelector } from '@/components/chatbot-training/CleanAvatarSelector';
import AvatarStatus from '@/components/chatbot-training/AvatarStatus';
import { SimplifiedTrainingInterface } from '@/components/chatbot-training/SimplifiedTrainingInterface';
import { DatabaseTrainingInterface } from '@/components/chatbot-training/DatabaseTrainingInterface';
import { TestChatNew } from '@/components/chatbot-training/TestChatNew';
import { KnowledgeBase } from '@/components/chatbot-training/KnowledgeBase';
import { VersionControl } from '@/components/chatbot-training/VersionControl';
import { DatabaseVersionControl } from '@/components/chatbot-training/DatabaseVersionControl';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ChatbotSection = () => {
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
    return localStorage.getItem('chatbot_active_tab') || 'train';
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
      console.log('Fetching avatar data for:', avatarId);
      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('id', avatarId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching avatar:', error);
        // Clear invalid avatar selection
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

      console.log('Loaded avatar:', data);
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
    
    console.log('Selected avatar:', avatarId);
    setSelectedAvatarId(avatarId);
    localStorage.setItem('chatbot_selected_avatar_id', avatarId);
    setShowAvatarDetails(false);
    
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
    
    // Create a new version entry
    if (selectedAvatarId) {
      const existingVersions = JSON.parse(localStorage.getItem(`avatar_${selectedAvatarId}_versions`) || '[]');
      const newVersion = {
        id: Date.now().toString(),
        version: `v2.1.${existingVersions.length + 4}`,
        status: 'Active',
        description: 'Latest training update with prompt improvements',
        accuracy: Math.floor(Math.random() * 10) + 90, // 90-99%
        improvements: ['System prompt optimization', 'Response quality enhancement', 'Context understanding'],
        timestamp: 'Just now',
        trainingType: 'language'
      };
      
      // Mark previous version as completed
      const updatedVersions = existingVersions.map((v: any) => ({ ...v, status: 'Completed' }));
      updatedVersions.unshift(newVersion);
      
      localStorage.setItem(`avatar_${selectedAvatarId}_versions`, JSON.stringify(updatedVersions));
    }
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
      <CleanAvatarSelector
        selectedAvatarId={selectedAvatarId}
        onSelectAvatar={handleAvatarSelection}
      />

      {/* Collapsible Avatar Details */}
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
                <span className="font-medium">Avatar Details & Prompts</span>
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="train" disabled={isTraining && activeTab !== 'train'}>
            Train Model
          </TabsTrigger>
          <TabsTrigger value="test" disabled={isTraining && activeTab !== 'test'}>
            Test Chat
          </TabsTrigger>
          <TabsTrigger value="knowledge" disabled={isTraining && activeTab !== 'knowledge'}>
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="versions" disabled={isTraining && activeTab !== 'versions'}>
            Version Control
          </TabsTrigger>
        </TabsList>

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
                  Please select an avatar from the dropdown above to start training
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Chat Tab */}
        <TabsContent value="test" className="space-y-6">
          <TestChatNew />
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

export default ChatbotSection;
