import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Trash2,
  Loader2,
  AlertTriangle,
  Key,
  Info,
  Clock,
  Zap,
  Settings,
  Brain,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chatbotService, ChatMessage, AvatarContext } from '@/services/chatbotService';
import { useAuth } from '@/hooks/useAuth';
import { apiKeyService } from '@/services/apiKeyService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'avatar';
  content: string;
  timestamp: Date;
  model?: string;
}

interface Avatar {
  id: string;
  name: string;
  backstory?: string;
  personality_traits?: string[];
  mbti_type?: string;
  hidden_rules?: string;
  avatar_images?: string[];
}

const OPENAI_MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', cost: '$0.002/1K tokens' },
  { value: 'gpt-4', label: 'GPT-4', cost: '$0.03/1K tokens' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', cost: '$0.01/1K tokens' },
  { value: 'gpt-4o', label: 'GPT-4o', cost: '$0.005/1K tokens' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', cost: '$0.0015/1K tokens' }
];

export const TestChatNew: React.FC = () => {
  const { user } = useAuth();
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('Checking...');
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [testingMode, setTestingMode] = useState<'openai' | 'mock'>('openai');
  const [knowledgeFilesCount, setKnowledgeFilesCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch user's avatars
  const { data: avatars = [], isLoading: avatarsLoading } = useQuery({
    queryKey: ['user-avatars', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API key status
  useEffect(() => {
    const checkApiKeyStatus = async () => {
      if (!user) return;

      try {
        const apiKey = await apiKeyService.getDecryptedApiKey(user.id, 'OpenAI');
        if (apiKey) {
          setHasApiKey(true);
          setApiKeyStatus(`✅ OpenAI API Key Active (${apiKey.substring(0, 7)}...)`);
        } else {
          setHasApiKey(false);
          setApiKeyStatus('❌ No OpenAI API Key Found');
        }
      } catch (error) {
        setHasApiKey(false);
        setApiKeyStatus('⚠️ Error checking API key');
      }
    };

    checkApiKeyStatus();
  }, [user]);

  // Load selected avatar and check knowledge files
  useEffect(() => {
    if (selectedAvatarId) {
      const avatar = avatars.find(a => a.id === selectedAvatarId);
      if (avatar) {
        setSelectedAvatar(avatar);
        setMessages([{
          id: '1',
          type: 'avatar',
          content: `Hello! I'm ${avatar.name}. I'm ready to chat with you using my latest training. How can I help you today?`,
          timestamp: new Date()
        }]);
        setConversationHistory([]);
        setTotalMessages(0);
        setLastResponseTime(null);
        setApiError(null);

        // Check knowledge files count
        checkKnowledgeFiles(avatar.id);
      }
    } else {
      setSelectedAvatar(null);
      setMessages([]);
      setKnowledgeFilesCount(0);
    }
  }, [selectedAvatarId, avatars]);

  const checkKnowledgeFiles = async (avatarId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('avatar_knowledge_files')
        .select('id')
        .eq('user_id', user.id)
        .eq('avatar_id', avatarId)
        .eq('status', 'active');

      if (!error && data) {
        setKnowledgeFilesCount(data.length);
      }
    } catch (error) {
      console.error('Error checking knowledge files:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !user || !selectedAvatar) {
      return;
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);
    setApiError(null);

    const startTime = Date.now();

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setTotalMessages(prev => prev + 1);

    try {
      // Create avatar context
      const avatarContext: AvatarContext = {
        id: selectedAvatar.id,
        name: selectedAvatar.name,
        backstory: selectedAvatar.backstory,
        personality_traits: selectedAvatar.personality_traits,
        mbti_type: selectedAvatar.mbti_type,
        hidden_rules: selectedAvatar.hidden_rules
      };

      let response: string;

      if (testingMode === 'openai' && hasApiKey) {
        // Use real OpenAI API
        response = await chatbotService.sendMessage(
          user.id,
          messageContent,
          avatarContext,
          conversationHistory,
          selectedModel
        );
      } else {
        // Use mock response
        const mockResponses = [
          "This is a mock response for testing purposes.",
          "I'm responding in mock mode since no API key is available.",
          "Mock mode: This would be a real AI response with your API key."
        ];
        response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      }

      const responseTime = Date.now() - startTime;
      setLastResponseTime(responseTime);

      // Add avatar response
      const avatarMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'avatar',
        content: response,
        timestamp: new Date(),
        model: testingMode === 'openai' ? selectedModel : undefined
      };

      setMessages(prev => [...prev, avatarMessage]);

      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: messageContent },
        { role: 'assistant', content: response }
      ]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setApiError(errorMessage);

      // Add error message
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'avatar',
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (selectedAvatar) {
      setMessages([{
        id: '1',
        type: 'avatar',
        content: `Hello! I'm ${selectedAvatar.name}. I'm ready to chat with you using my latest training. How can I help you today?`,
        timestamp: new Date()
      }]);
    } else {
      setMessages([]);
    }
    setConversationHistory([]);
    setApiError(null);
    setTotalMessages(0);
    setLastResponseTime(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Chatbot Testing Studio
          </CardTitle>
          <CardDescription>
            Test your avatar's conversational abilities with real AI models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar & Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Avatar to Test</label>
              <Select value={selectedAvatarId} onValueChange={setSelectedAvatarId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an avatar..." />
                </SelectTrigger>
                <SelectContent>
                  {avatarsLoading ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading avatars...
                    </SelectItem>
                  ) : avatars.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No avatars found
                    </SelectItem>
                  ) : (
                    avatars.map((avatar) => (
                      <SelectItem key={avatar.id} value={avatar.id}>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          {avatar.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPENAI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span>{model.label}</span>
                        <span className="text-xs text-muted-foreground">{model.cost}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Testing Status */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">API Status</p>
                  <p className="text-xs text-muted-foreground">{apiKeyStatus}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">Testing Mode</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={testingMode === 'openai' ? 'default' : 'secondary'} className="text-xs">
                      {testingMode === 'openai' ? 'OpenAI API' : 'Mock Mode'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTestingMode(testingMode === 'openai' ? 'mock' : 'openai')}
                      className="h-6 px-2 text-xs"
                    >
                      Switch
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="font-medium">Response Time</p>
                  <p className="text-xs text-muted-foreground">
                    {lastResponseTime ? `${lastResponseTime}ms` : 'No data'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-xs text-muted-foreground">
                    {totalMessages} sent / {Math.floor(conversationHistory.length / 2)} conversations
                  </p>
                </div>
              </div>
            </div>

            {selectedAvatar && (
              <div className="border-t pt-3">
                <div className="flex items-start gap-2 text-xs">
                  <Info className="h-3 w-3 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Active Avatar Context:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAvatar.backstory && <Badge variant="outline" className="text-xs">Backstory</Badge>}
                      {selectedAvatar.personality_traits && selectedAvatar.personality_traits.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {selectedAvatar.personality_traits.length} Traits
                        </Badge>
                      )}
                      {selectedAvatar.mbti_type && <Badge variant="outline" className="text-xs">MBTI: {selectedAvatar.mbti_type}</Badge>}
                      {selectedAvatar.hidden_rules && <Badge variant="outline" className="text-xs">Hidden Rules</Badge>}
                      {knowledgeFilesCount > 0 && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          📄 {knowledgeFilesCount} Knowledge Files
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {knowledgeFilesCount > 0 && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-green-800">
                      <Info className="h-3 w-3" />
                      <span className="font-medium">
                        Knowledge Base Active: {knowledgeFilesCount} document{knowledgeFilesCount > 1 ? 's' : ''} will be used for context
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{apiError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApiError(null)}
                className="ml-auto"
              >
                ✕
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Interface */}
      {selectedAvatar ? (
        <Card className="card-modern h-[700px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Testing Chat with {selectedAvatar.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Model: {OPENAI_MODELS.find(m => m.value === selectedModel)?.label}
              </Badge>
              <Badge variant={testingMode === 'openai' ? 'default' : 'secondary'} className="text-xs">
                {testingMode === 'openai' ? 'Live API' : 'Mock'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}>
                    {message.type === 'user' ? (
                      <UserIcon className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div className={`flex-1 space-y-1 ${
                    message.type === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[85%] break-words ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
                      message.type === 'user' ? 'justify-end' : ''
                    }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.model && (
                        <Badge variant="outline" className="text-xs">
                          {message.model}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-secondary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {selectedAvatar.name} is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isTyping || !inputMessage.trim()}
                  size="sm"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={clearChat}
                  variant="outline"
                  size="sm"
                  disabled={isTyping}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Press Enter to send</span>
                <div className="flex items-center gap-2">
                  <Badge variant={hasApiKey ? "default" : "destructive"} className="text-xs">
                    {hasApiKey ? "API Ready" : "No API Key"}
                  </Badge>
                  {lastResponseTime && (
                    <span>{lastResponseTime}ms</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-modern">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select an Avatar to Begin Testing</h3>
            <p className="text-muted-foreground text-center mb-4">
              Choose an avatar from the dropdown above to start testing conversations with AI models
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};