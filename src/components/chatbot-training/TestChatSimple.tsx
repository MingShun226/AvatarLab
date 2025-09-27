import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chatbotService, ChatMessage, AvatarContext } from '@/services/chatbotService';
import { useAuth } from '@/hooks/useAuth';
import { apiKeyService } from '@/services/apiKeyService';

interface Message {
  id: string;
  type: 'user' | 'avatar';
  content: string;
  timestamp: Date;
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
  }, [user]);

  // Initialize with welcome message when avatar changes
  useEffect(() => {
    if (selectedAvatar) {
      setMessages([{
        id: '1',
        type: 'avatar',
        content: `Hello! I'm ${selectedAvatar.name}. I'm ready to chat with you using my latest training. How can I help you today?`,
        timestamp: new Date()
      }]);
      setConversationHistory([]);
      setApiError(null);
    }
  }, [selectedAvatar]);

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

      if (hasApiKey) {
        // Use real OpenAI API with gpt-4o-mini
        response = await chatbotService.sendMessage(
          user.id,
          messageContent,
          avatarContext,
          conversationHistory,
          'gpt-4o-mini'
        );
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
        timestamp: new Date()
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
    }
    setConversationHistory([]);
    setApiError(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedAvatar) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Avatar Selected</h3>
          <p className="text-muted-foreground">
            Select an avatar to start testing conversations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Error */}
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

      {/* Chat Interface */}
      <Card className="h-[calc(100vh-280px)] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat with {selectedAvatar.name}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                GPT-4o Mini
              </Badge>
              <Badge variant={hasApiKey ? 'default' : 'secondary'} className="text-xs">
                {hasApiKey ? 'Live API' : 'Mock Mode'}
              </Badge>
            </div>
          </CardTitle>
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
                  <div className={`text-xs text-muted-foreground ${
                    message.type === 'user' ? 'text-right' : ''
                  }`}>
                    {formatTime(message.timestamp)}
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