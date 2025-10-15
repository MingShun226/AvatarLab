import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  MessageCircle,
  SendHorizontal,
  Bot,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chatbotService, ChatMessage, AvatarContext } from '@/services/chatbotService';
import { useAuth } from '@/hooks/useAuth';
import { apiKeyService } from '@/services/apiKeyService';
import { TrainingService, PromptVersion } from '@/services/trainingService';
import { SmartPromptService } from '@/services/smartPromptService';

interface MessageImage {
  url: string;
  caption?: string;
  is_primary?: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'avatar';
  content: string;
  images?: MessageImage[]; // Support for image attachments
  timestamp: Date;
  feedback?: 'good' | 'bad' | null;
  userMessage?: string; // Store corresponding user message for avatar responses
}

interface TestChatSimpleProps {
  selectedAvatar: any;
}

export const TestChatSimple: React.FC<TestChatSimpleProps> = ({ selectedAvatar }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [availableVersions, setAvailableVersions] = useState<PromptVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        setHasApiKey(!!apiKey);
      } catch (error) {
        setHasApiKey(false);
      }
    };

    checkApiKeyStatus();

    // Check API key status every 5 seconds
    const interval = setInterval(checkApiKeyStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Load available versions when avatar changes
  useEffect(() => {
    const loadVersions = async () => {
      if (!user || !selectedAvatar) return;

      try {
        const versions = await TrainingService.getPromptVersions(selectedAvatar.id, user.id);
        setAvailableVersions(versions);

        // Set default to active version or first available
        const activeVersion = await TrainingService.getActivePromptVersion(selectedAvatar.id, user.id);
        if (activeVersion) {
          setSelectedVersionId(activeVersion.id!);
        } else if (versions.length > 0) {
          setSelectedVersionId(versions[0].id!);
        } else {
          setSelectedVersionId('');
        }
      } catch (error) {
        console.error('Error loading versions:', error);
        setAvailableVersions([]);
        setSelectedVersionId('');
      }
    };

    loadVersions();
  }, [user, selectedAvatar]);

  // Load chat history from localStorage when avatar changes
  useEffect(() => {
    if (selectedAvatar && user) {
      const storageKey = `chat_history_${user.id}_${selectedAvatar.id}`;
      const savedHistory = localStorage.getItem(storageKey);

      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = (parsed.messages || []).map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
          setConversationHistory(parsed.conversationHistory || []);
        } catch (error) {
          console.error('Failed to load chat history:', error);
          setMessages([]);
          setConversationHistory([]);
        }
      } else {
        setMessages([]);
        setConversationHistory([]);
      }
      setApiError(null);
    }
  }, [selectedAvatar, user]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (selectedAvatar && user && messages.length > 0) {
      const storageKey = `chat_history_${user.id}_${selectedAvatar.id}`;
      const dataToSave = {
        messages,
        conversationHistory,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [messages, conversationHistory, selectedAvatar, user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !user || !selectedAvatar) {
      return;
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);
    setApiError(null);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Get the selected version's system prompt if available
      let customSystemPrompt: string | undefined;
      if (selectedVersionId && availableVersions.length > 0) {
        const selectedVersion = availableVersions.find(v => v.id === selectedVersionId);
        if (selectedVersion) {
          customSystemPrompt = selectedVersion.system_prompt;
        }
      }

      // Create avatar context
      const avatarContext: AvatarContext = {
        id: selectedAvatar.id,
        name: selectedAvatar.name,
        backstory: selectedAvatar.backstory,
        personality_traits: selectedAvatar.personality_traits,
        mbti_type: selectedAvatar.mbti_type,
        hidden_rules: selectedAvatar.hidden_rules,
        customSystemPrompt: customSystemPrompt
      };

      let response: string;
      let responseImages: MessageImage[] = [];

      if (hasApiKey) {
        // Use real OpenAI API with gpt-4o-mini
        response = await chatbotService.sendMessage(
          user.id,
          messageContent,
          avatarContext,
          conversationHistory,
          'gpt-4o-mini'
        );

        // Check if response contains image data (JSON format)
        try {
          const parsed = JSON.parse(response);
          if (parsed.type === 'text_with_images') {
            response = parsed.text;
            responseImages = parsed.images || [];
          }
        } catch {
          // Not JSON, treat as regular text response
        }
      } else {
        // Use mock response when no API key
        const mockResponses = [
          "This is a mock response for testing purposes. Please set up your OpenAI API key to use real AI responses.",
          "I'm responding in mock mode since no API key is available.",
          "Mock mode: This would be a real AI response with your API key configured."
        ];
        response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      }

      // Add avatar response
      const avatarMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'avatar',
        content: response,
        images: responseImages.length > 0 ? responseImages : undefined,
        timestamp: new Date(),
        feedback: null,
        userMessage: messageContent
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
    if (!selectedAvatar || !user) return;

    // Clear from localStorage
    const storageKey = `chat_history_${user.id}_${selectedAvatar.id}`;
    localStorage.removeItem(storageKey);

    // Clear from state
    setMessages([]);
    setConversationHistory([]);
    setApiError(null);

    toast({
      title: "Chat Cleared",
      description: "All messages have been cleared successfully.",
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFeedback = async (messageId: string, feedback: 'good' | 'bad') => {
    if (!user || !selectedAvatar) return;

    // Find the message
    const message = messages.find(m => m.id === messageId);
    if (!message || message.type !== 'avatar') return;

    try {
      // Learn from the feedback
      await SmartPromptService.learnFromConversations(
        user.id,
        selectedAvatar.id,
        message.userMessage || '',
        message.content,
        feedback,
        messageId
      );

      // Update UI
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, feedback } : m
        )
      );

      toast({
        title: feedback === 'good' ? "Thanks for the feedback!" : "Feedback noted",
        description: feedback === 'good'
          ? "I'll remember this response pattern"
          : "I'll try to improve next time",
      });

    } catch (error) {
      console.error('Error processing feedback:', error);
      toast({
        title: "Feedback Error",
        description: "Failed to save feedback, but I'll still try to learn",
        variant: "destructive"
      });
    }
  };

  if (!selectedAvatar) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Avatar Selected</h3>
          <p className="text-muted-foreground">
            Select an avatar to start testing conversations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col space-y-4">
      {/* API Error */}
      {apiError && (
        <div className="flex-shrink-0 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
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

      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with {selectedAvatar.name}
            </div>
            <div className="flex items-center gap-2">
              {/* Version Selector */}
              {availableVersions.length > 0 && (
                <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVersions.map((version) => (
                      <SelectItem key={version.id} value={version.id!}>
                        <span className="font-medium">{version.version_number}</span>
                        {version.version_name && (
                          <span className="ml-1 text-muted-foreground">
                            - {version.version_name}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Badge variant="outline" className="text-xs">
                GPT-4o Mini
              </Badge>
              <Badge variant={hasApiKey ? 'default' : 'secondary'} className="text-xs">
                {hasApiKey ? 'Live API' : 'Mock Mode'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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

                <div className={`flex-1 space-y-2 ${
                  message.type === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block p-3 rounded-lg max-w-[85%] break-words ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Display images if present */}
                  {message.images && message.images.length > 0 && (
                    <div className={`inline-block max-w-[85%] ${
                      message.type === 'user' ? 'ml-auto' : ''
                    }`}>
                      <div className="grid grid-cols-2 gap-2">
                        {message.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img.url}
                              alt={img.caption || 'Memory photo'}
                              className="rounded-lg w-full h-auto object-cover shadow-md hover:shadow-lg transition-shadow"
                            />
                            {img.caption && (
                              <p className="text-xs text-muted-foreground mt-1 px-1">
                                {img.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`flex items-center gap-2 text-xs text-muted-foreground ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {/* Feedback buttons for avatar messages */}
                    {message.type === 'avatar' && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${
                            message.feedback === 'good' ? 'text-green-600' : 'text-muted-foreground'
                          }`}
                          onClick={() => handleFeedback(message.id, 'good')}
                          disabled={message.feedback !== null}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${
                            message.feedback === 'bad' ? 'text-red-600' : 'text-muted-foreground'
                          }`}
                          onClick={() => handleFeedback(message.id, 'bad')}
                          disabled={message.feedback !== null}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
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
          <div className="flex-shrink-0 p-4 border-t bg-background">
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
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>

              {/* Clear Chat with Confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isTyping || messages.length === 0}
                    title="Clear chat history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all messages in this conversation. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Press Enter to send</span>
              <Badge variant={hasApiKey ? "default" : "secondary"} className="text-xs">
                {hasApiKey ? "API Ready" : "No API Key - Mock Mode"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};