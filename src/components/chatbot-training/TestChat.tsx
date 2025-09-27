import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User as UserIcon, Trash2, Loader2, AlertTriangle, Key, Info, Clock, Zap } from 'lucide-react';
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

interface TestChatProps {
  avatar: {
    id: string;
    name: string;
    backstory?: string;
    personality_traits?: string[];
    mbti_type?: string;
    hidden_rules?: string;
    avatar_images?: string[];
  };
  isTraining: boolean;
}

export const TestChat: React.FC<TestChatProps> = ({ avatar, isTraining }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'avatar',
      content: `Hello! I'm ${avatar.name}. I'm ready to chat with you using my latest training. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('Checking...');
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [testingMode, setTestingMode] = useState<'openai' | 'mock'>('openai');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API key status on component mount
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTraining || isTyping || !user) {
      if (isTraining) {
        toast({
          title: "Training in Progress",
          description: "Please wait for training to complete before testing.",
          variant: "destructive"
        });
      }
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
        name: avatar.name,
        backstory: avatar.backstory,
        personality_traits: avatar.personality_traits,
        mbti_type: avatar.mbti_type,
        hidden_rules: avatar.hidden_rules
      };

      let response: string;

      if (testingMode === 'openai' && hasApiKey) {
        // Use real OpenAI API
        response = await chatbotService.sendMessage(
          user.id,
          messageContent,
          avatarContext,
          conversationHistory
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
    setMessages([{
      id: '1',
      type: 'avatar',
      content: `Hello! I'm ${avatar.name}. I'm ready to chat with you using my latest training. How can I help you today?`,
      timestamp: new Date()
    }]);
    setConversationHistory([]);
    setApiError(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="card-modern h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Test Chat with {avatar.name}
        </CardTitle>
        <CardDescription>
          Chat with your avatar to test its responses and personality
        </CardDescription>
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
      </CardHeader>

      {/* Testing Status Panel */}
      <div className="px-6 pb-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
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
                    {totalMessages} sent / {conversationHistory.length / 2} conversations
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="flex items-start gap-2 text-xs">
                <Info className="h-3 w-3 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Avatar Context Active:</p>
                  <div className="flex flex-wrap gap-1">
                    {avatar.backstory && <Badge variant="outline" className="text-xs">Backstory</Badge>}
                    {avatar.personality_traits && avatar.personality_traits.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {avatar.personality_traits.length} Traits
                      </Badge>
                    )}
                    {avatar.mbti_type && <Badge variant="outline" className="text-xs">MBTI: {avatar.mbti_type}</Badge>}
                    {avatar.hidden_rules && <Badge variant="outline" className="text-xs">Hidden Rules</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </p>
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
                    {avatar.name} is typing...
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
              placeholder={isTraining ? "Training in progress..." : "Type your message..."}
              disabled={isTraining || isTyping}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isTraining || isTyping || !inputMessage.trim()}
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
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send</span>
            <Badge variant={isTraining ? "destructive" : "secondary"}>
              {isTraining ? "Training" : "Ready"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};