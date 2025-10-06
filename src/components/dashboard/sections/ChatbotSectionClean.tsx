import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  AlertCircle,
  Brain,
  BookOpen,
  TestTube,
  History,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SimpleAvatarSelector } from '@/components/chatbot-training/SimpleAvatarSelector';
import { DatabaseTrainingInterface } from '@/components/chatbot-training/DatabaseTrainingInterface';
import { TestChatSimple } from '@/components/chatbot-training/TestChatSimple';
import { KnowledgeBase } from '@/components/chatbot-training/KnowledgeBase';
import { DatabaseVersionControl } from '@/components/chatbot-training/DatabaseVersionControl';
import { MemoryGallery } from '@/components/chatbot-training/MemoryGallery';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ChatbotSectionClean = () => {
  const [searchParams] = useSearchParams();
  const avatarFromUrl = searchParams.get('avatar');

  const getInitialAvatarId = () => {
    if (avatarFromUrl) return avatarFromUrl;
    return localStorage.getItem('chatbot_selected_avatar_id') || null;
  };

  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(getInitialAvatarId());
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('chatbot_active_tab') || 'train');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (avatarFromUrl && avatarFromUrl !== selectedAvatarId) {
      setSelectedAvatarId(avatarFromUrl);
      localStorage.setItem('chatbot_selected_avatar_id', avatarFromUrl);
    }
  }, [avatarFromUrl]);

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

    toast({
      title: "Avatar Selected",
      description: "You can now start training your avatar.",
    });
  };

  const handleTrainingStart = () => {
    setIsTraining(true);
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MessageCircle className="h-6 w-6" />
            Chatbot Training
            {selectedAvatar && (
              <Badge variant="outline" className="text-sm font-normal">
                {selectedAvatar.name}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Train and manage your AI avatar
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isTraining && (
            <Badge variant="destructive" className="animate-pulse">
              Training Active
            </Badge>
          )}
          <SimpleAvatarSelector
            selectedAvatarId={selectedAvatarId}
            onSelectAvatar={handleAvatarSelection}
          />
        </div>
      </div>

      {/* Main Content */}
      {!selectedAvatar ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select an Avatar</h3>
            <p className="text-muted-foreground">
              Choose an avatar above to start training
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="train"
              disabled={isTraining && activeTab !== 'train'}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Train
            </TabsTrigger>
            <TabsTrigger
              value="memories"
              disabled={isTraining && activeTab !== 'memories'}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Memories
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              disabled={(isTraining && activeTab !== 'knowledge')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger
              value="test"
              disabled={(isTraining && activeTab !== 'test')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="versions"
              disabled={(isTraining && activeTab !== 'versions')}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Versions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="train">
            <DatabaseTrainingInterface
              avatarName={selectedAvatar.name}
              avatarId={selectedAvatar.id}
              isTraining={isTraining}
              onTrainingStart={handleTrainingStart}
              onTrainingComplete={handleTrainingComplete}
            />
          </TabsContent>

          <TabsContent value="memories">
            <MemoryGallery
              avatarId={selectedAvatar.id}
              avatarName={selectedAvatar.name}
            />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeBase
              avatarId={selectedAvatar.id}
              isTraining={isTraining}
            />
          </TabsContent>

          <TabsContent value="test">
            <TestChatSimple selectedAvatar={selectedAvatar} />
          </TabsContent>

          <TabsContent value="versions">
            <DatabaseVersionControl
              avatarId={selectedAvatar.id}
              isTraining={isTraining}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ChatbotSectionClean;