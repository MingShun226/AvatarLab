
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Globe, Brain, FileText, BookOpen, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Avatar {
  id: string;
  name: string;
  avatar_images: string[];
  primary_language: string;
  secondary_languages: string[];
  origin_country: string;
  age: number;
  gender: string;
  backstory: string;
  personality_traits: string[];
  hidden_rules: string;
  created_at: string;
  status?: string;
}

interface KnowledgeFile {
  id: string;
  file_name: string;
  content_type: string;
  file_size: number;
}

interface ExtendedAvatar extends Avatar {
  knowledgeFiles?: KnowledgeFile[];
}

interface AvatarStatusProps {
  avatar: Avatar;
}

const AvatarStatus: React.FC<AvatarStatusProps> = ({ avatar: initialAvatar }) => {
  const { user } = useAuth();

  // Fetch full avatar data with knowledge files
  const { data: extendedAvatar, isLoading } = useQuery({
    queryKey: ['avatar-full', initialAvatar.id],
    queryFn: async () => {
      if (!user?.id) return { ...initialAvatar, knowledgeFiles: [] };

      // Fetch avatar details
      const { data: avatarData, error: avatarError } = await supabase
        .from('avatars')
        .select('*')
        .eq('id', initialAvatar.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (avatarError) {
        console.error('Error fetching avatar:', avatarError);
        return { ...initialAvatar, knowledgeFiles: [] };
      }

      // Fetch knowledge files
      const { data: knowledgeFiles, error: knowledgeError } = await supabase
        .from('avatar_knowledge_files')
        .select('id, file_name, content_type, file_size')
        .eq('avatar_id', initialAvatar.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_linked', true);

      if (knowledgeError) {
        console.error('Error fetching knowledge files:', knowledgeError);
      }

      return {
        ...avatarData,
        knowledgeFiles: knowledgeFiles || []
      } as ExtendedAvatar;
    },
    enabled: !!user?.id && !!initialAvatar.id
  });

  const avatar = extendedAvatar || { ...initialAvatar, knowledgeFiles: [] };

  // Generate dummy system and user prompts based on avatar data
  const generateSystemPrompt = () => {
    const traits = avatar.personality_traits?.join(', ') || 'friendly, helpful';
    const languages = [avatar.primary_language, ...(avatar.secondary_languages || [])].join(', ');
    
    return `You are ${avatar.name}, a ${avatar.age}-year-old ${avatar.gender} from ${avatar.origin_country}. 
Your personality traits include: ${traits}. 
You can communicate in: ${languages}.
${avatar.backstory ? `Your background: ${avatar.backstory}` : ''}
${avatar.hidden_rules ? `Special instructions: ${avatar.hidden_rules}` : ''}

Always stay in character and respond according to your personality and background.`;
  };

  const generateUserPrompt = () => {
    return `Remember, you are interacting with ${avatar.name}. They have knowledge from ${avatar.knowledgeFiles?.length || 0} uploaded documents. Please ask questions or have conversations that align with their personality and expertise.`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Overview */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Avatar Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar Image */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Avatar Image</h4>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {avatar.avatar_images && avatar.avatar_images.length > 0 ? (
                  <img
                    src={avatar.avatar_images[0]}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                          <svg class="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Basic Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{avatar.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Age:</span>
                    <span className="text-sm font-medium">{avatar.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gender:</span>
                    <span className="text-sm font-medium capitalize">{avatar.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Origin:</span>
                    <span className="text-sm font-medium">{avatar.origin_country}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Languages
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Primary:</span>
                    <Badge variant="default" className="ml-2 text-xs">{avatar.primary_language}</Badge>
                  </div>
                  {avatar.secondary_languages && avatar.secondary_languages.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Secondary:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {avatar.secondary_languages.map((lang: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality & Traits */}
      {avatar.personality_traits && avatar.personality_traits.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              Personality Traits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {avatar.personality_traits.map((trait: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm">{trait}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Base */}
      {avatar.knowledgeFiles && avatar.knowledgeFiles.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Knowledge Base ({avatar.knowledgeFiles.length} files)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {avatar.knowledgeFiles.slice(0, 5).map((file: KnowledgeFile) => (
                <div key={file.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{file.file_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {file.content_type === 'application/pdf' ? 'PDF' : 'FILE'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                </div>
              ))}
              {avatar.knowledgeFiles.length > 5 && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  +{avatar.knowledgeFiles.length - 5} more files...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backstory */}
      {avatar.backstory && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Backstory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {avatar.backstory}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hidden Rules */}
      {avatar.hidden_rules && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Hidden Rules & Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border-l-4 border-primary">
              {avatar.hidden_rules}
            </p>
          </CardContent>
        </Card>
      )}

      {/* System & User Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-lg">System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-3 rounded-lg border">
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {generateSystemPrompt()}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-lg">User Prompt Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-3 rounded-lg border">
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {generateUserPrompt()}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvatarStatus;
