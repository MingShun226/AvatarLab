import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Bot,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Database,
  Key,
  Calendar,
  Mail,
  Shield,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SubscriptionTier } from '@/types/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface UserDetails {
  id: string;
  email: string;
  name: string;
  account_status: string;
  subscription_tier_id: string | null;
  created_at: string;
  last_login: string | null;
  banned_at: string | null;
  banned_reason: string | null;
}

interface Avatar {
  id: string;
  name: string;
  backstory: string | null;
  status: string;
  base_model: string;
  created_at: string;
  updated_at: string;
  active_fine_tuned_model: string | null;
  use_fine_tuned_model: boolean;
  // Fields from active prompt version
  active_prompt?: {
    system_prompt: string;
    version_name: string;
    version_number: number;
  } | null;
}

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  original_image_url: string | null;
  generation_type: string;
  is_favorite: boolean;
  created_at: string;
}

interface Memory {
  id: string;
  avatar_id: string;
  title: string;
  memory_date: string;
  image_url: string;
  memory_description: string;
  location: string | null;
  people_present: string[] | null;
  mood: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  created_at: string;
}

interface KnowledgeFile {
  id: string;
  avatar_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  is_linked: boolean;
  uploaded_at: string;
}

interface TrainingJob {
  id: string;
  avatar_id: string;
  training_data_id: string | null;
  openai_job_id: string;
  base_model: string;
  fine_tuned_model: string | null;
  status: string;
  training_examples_count: number | null;
  hyperparameters: any;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

interface TrainingFile {
  id: string;
  file_name: string;
  original_name: string;
  extracted_text: string | null;
  processing_status: string;
  uploaded_at: string;
}

export const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avatars_count: 0,
    images_count: 0,
    memories_count: 0,
    knowledge_files_count: 0,
    training_jobs_count: 0,
  });
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [trainingFiles, setTrainingFiles] = useState<Record<string, TrainingFile[]>>({});

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserAvatars();
      fetchUserStats();
      fetchTiers();
      fetchUserImages();
      fetchUserMemories();
      fetchUserKnowledgeFiles();
      fetchUserTrainingJobs();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
      setSelectedTier(data.subscription_tier_id || '');
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAvatars = async () => {
    try {
      // First, fetch avatars
      const { data: avatarsData, error: avatarsError } = await supabase
        .from('avatars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (avatarsError) throw avatarsError;

      // Then, for each avatar, fetch its active prompt version (ONLY the active one)
      const avatarsWithPrompts = await Promise.all(
        (avatarsData || []).map(async (avatar) => {
          const { data: promptData, error: promptError } = await supabase
            .from('avatar_prompt_versions')
            .select('system_prompt, version_name, version_number')
            .eq('avatar_id', avatar.id)
            .eq('is_active', true)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle no active prompt gracefully

          if (promptError) {
            console.error(`Error fetching prompt for avatar ${avatar.id}:`, promptError);
          }

          return {
            ...avatar,
            active_prompt: promptData || null,
          };
        })
      );

      setAvatars(avatarsWithPrompts);
    } catch (error) {
      console.error('Error fetching avatars:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Count avatars
      const { count: avatarsCount } = await supabase
        .from('avatars')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count generated images
      const { count: imagesCount } = await supabase
        .from('generated_images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count memories
      const { count: memoriesCount } = await supabase
        .from('avatar_memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count knowledge files
      const { count: knowledgeCount } = await supabase
        .from('avatar_knowledge_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count training jobs
      const { count: trainingCount } = await supabase
        .from('avatar_fine_tune_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setStats({
        avatars_count: avatarsCount || 0,
        images_count: imagesCount || 0,
        memories_count: memoriesCount || 0,
        knowledge_files_count: knowledgeCount || 0,
        training_jobs_count: trainingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const fetchUserImages = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchUserMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('avatar_memories')
        .select('*')
        .eq('user_id', userId)
        .order('memory_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  };

  const fetchUserKnowledgeFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('avatar_knowledge_files')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setKnowledgeFiles(data || []);
    } catch (error) {
      console.error('Error fetching knowledge files:', error);
    }
  };

  const fetchUserTrainingJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('avatar_fine_tune_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTrainingJobs(data || []);
    } catch (error) {
      console.error('Error fetching training jobs:', error);
    }
  };

  const fetchTrainingFiles = async (jobId: string, trainingDataId: string | null) => {
    if (!trainingDataId) return;

    try {
      const { data, error } = await supabase
        .from('avatar_training_files')
        .select('id, file_name, original_name, extracted_text, processing_status, uploaded_at')
        .eq('training_data_id', trainingDataId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setTrainingFiles(prev => ({ ...prev, [jobId]: data || [] }));
    } catch (error) {
      console.error('Error fetching training files:', error);
    }
  };

  const handleDownloadKnowledgeFile = async (file: KnowledgeFile) => {
    try {
      // Use authenticated download for private bucket
      const { data, error } = await supabase.storage
        .from('knowledge-base')
        .download(file.file_path);

      if (error) {
        console.error('Download error:', error);
        throw new Error(error.message || 'Failed to download file');
      }

      if (data) {
        // Create blob URL and trigger download
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('No data received');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please make sure you have applied the database migration.');
    }
  };

  const handleTierChange = async (newTierId: string) => {
    try {
      // Update user's tier
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier_id: newTierId })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Check if user subscription exists
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('tier_id', newTierId)
        .single();

      if (!existingSub) {
        // Create or update user subscription
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            tier_id: newTierId,
            status: 'active',
            billing_cycle: 'monthly',
            started_at: new Date().toISOString(),
          });

        if (subError) throw subError;
      }

      setSelectedTier(newTierId);
      await fetchUserDetails();
      alert('Tier updated successfully!');
    } catch (error) {
      console.error('Error updating tier:', error);
      alert('Failed to update tier');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const currentTier = tiers.find((t) => t.id === user.subscription_tier_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold">{user.name || 'Unknown User'}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
          {user.account_status}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Bot className="h-4 w-4" />
              Avatars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avatars_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.images_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Database className="h-4 w-4" />
              Memories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memories_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              Knowledge Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.knowledge_files_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Key className="h-4 w-4" />
              Training Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.training_jobs_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="avatars">Avatars ({avatars.length})</TabsTrigger>
          <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
          <TabsTrigger value="memories">Memories ({memories.length})</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge ({knowledgeFiles.length})</TabsTrigger>
          <TabsTrigger value="training">Training ({trainingJobs.length})</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Information</CardTitle>
              <CardDescription className="text-sm">Basic account details and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <div className="text-sm font-medium">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Name</div>
                  <div className="text-sm font-medium">{user.name || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Joined</div>
                  <div className="text-sm font-medium">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Login</div>
                  <div className="text-sm font-medium">
                    {user.last_login
                      ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true })
                      : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current Tier</div>
                  <div className="text-sm font-medium">{currentTier?.display_name || 'No tier'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Account Status</div>
                  <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'} className="text-xs">
                    {user.account_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avatars Tab */}
        <TabsContent value="avatars" className="space-y-4">
          {avatars.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No avatars created yet
              </CardContent>
            </Card>
          ) : (
            avatars.map((avatar) => (
              <Card key={avatar.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{avatar.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Created {formatDistanceToNow(new Date(avatar.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Badge className="text-xs">{avatar.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Base Model</div>
                      <div className="text-sm font-medium">{avatar.base_model || 'gpt-4o-mini-2024-07-18'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Prompt Version</div>
                      <div className="text-sm font-medium">
                        {avatar.active_prompt?.version_name || 'No active version'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fine-tuned Model</div>
                      <div className="text-sm font-medium">
                        {avatar.use_fine_tuned_model && avatar.active_fine_tuned_model
                          ? 'Yes'
                          : 'No'}
                      </div>
                    </div>
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View System Prompt
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                        {avatar.active_prompt?.system_prompt || (
                          <span className="text-muted-foreground italic not-italic">
                            No active prompt version. This avatar may not have been configured yet.
                          </span>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {images.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No images generated yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    {/* Image Comparison */}
                    {image.generation_type === 'image-to-image' && image.original_image_url ? (
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Original</div>
                          <div className="relative aspect-square rounded overflow-hidden bg-muted cursor-pointer"
                               onClick={() => setSelectedImage(image)}>
                            <img
                              src={image.original_image_url}
                              alt="Original"
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Generated</div>
                          <div className="relative aspect-square rounded overflow-hidden bg-muted cursor-pointer"
                               onClick={() => setSelectedImage(image)}>
                            <img
                              src={image.image_url}
                              alt="Generated"
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-square rounded overflow-hidden bg-muted cursor-pointer"
                           onClick={() => setSelectedImage(image)}>
                        <img
                          src={image.image_url}
                          alt={image.prompt}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}</span>
                        {image.is_favorite && (
                          <Badge className="text-xs h-5">Favorite</Badge>
                        )}
                      </div>
                      <div className="text-xs">
                        <Badge variant="outline" className="text-xs">
                          {image.generation_type}
                        </Badge>
                      </div>
                      {/* Prompt Display */}
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {image.prompt}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Memories Tab */}
        <TabsContent value="memories" className="space-y-4">
          {memories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No memories created yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {memories.map((memory) => (
                <Card key={memory.id} className="overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    <div className="relative aspect-square rounded overflow-hidden bg-muted">
                      <img
                        src={memory.image_url}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                      {memory.is_favorite && (
                        <Badge className="absolute top-2 right-2 text-xs">Favorite</Badge>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-semibold line-clamp-1">{memory.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(memory.memory_date).toLocaleDateString()}
                      </div>
                      {memory.location && (
                        <div className="text-xs">
                          <span className="font-medium">Location:</span> <span className="text-muted-foreground">{memory.location}</span>
                        </div>
                      )}
                      {memory.mood && (
                        <div className="text-xs">
                          <span className="font-medium">Mood:</span> <span className="text-muted-foreground">{memory.mood}</span>
                        </div>
                      )}
                      <div className="text-xs">
                        <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                          {memory.memory_description}
                        </p>
                      </div>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {memory.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{memory.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Knowledge Files Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          {knowledgeFiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No knowledge files uploaded yet
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Files</CardTitle>
                <CardDescription className="text-sm">Files uploaded to avatars for RAG system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {knowledgeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{file.file_name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {(file.file_size / 1024).toFixed(2)} KB • {file.content_type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={file.is_linked ? 'default' : 'secondary'} className="text-xs">
                          {file.is_linked ? 'Linked' : 'Unlinked'}
                        </Badge>
                        <div className="text-xs text-muted-foreground hidden md:block">
                          {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadKnowledgeFile(file)}
                          className="text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Training Jobs Tab */}
        <TabsContent value="training" className="space-y-4">
          {trainingJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No training jobs yet
              </CardContent>
            </Card>
          ) : (
            trainingJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-mono">{job.openai_job_id}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        job.status === 'succeeded'
                          ? 'default'
                          : job.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Base Model</div>
                      <div className="text-sm font-medium">{job.base_model}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fine-tuned Model</div>
                      <div className="text-sm font-medium truncate" title={job.fine_tuned_model || 'N/A'}>
                        {job.fine_tuned_model || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Training Examples</div>
                      <div className="text-sm font-medium">{job.training_examples_count || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Completed</div>
                      <div className="text-sm font-medium">
                        {job.finished_at
                          ? formatDistanceToNow(new Date(job.finished_at), { addSuffix: true })
                          : 'In progress'}
                      </div>
                    </div>
                  </div>

                  {job.error_message && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <div className="text-sm font-medium text-destructive mb-1">Error</div>
                      <div className="text-xs text-muted-foreground">{job.error_message}</div>
                    </div>
                  )}

                  {job.hyperparameters && (
                    <div>
                      <div className="text-sm font-medium mb-2">Hyperparameters</div>
                      <div className="text-xs bg-muted p-3 rounded-lg font-mono">
                        {JSON.stringify(job.hyperparameters, null, 2)}
                      </div>
                    </div>
                  )}

                  {job.training_data_id && (
                    <Collapsible
                      open={expandedJobId === job.id}
                      onOpenChange={(open) => {
                        setExpandedJobId(open ? job.id : null);
                        if (open && !trainingFiles[job.id]) {
                          fetchTrainingFiles(job.id, job.training_data_id);
                        }
                      }}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full text-sm">
                          {expandedJobId === job.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Hide Training Materials
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              View Training Materials
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        {trainingFiles[job.id] ? (
                          trainingFiles[job.id].length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {trainingFiles[job.id].map((file, idx) => (
                                <div key={file.id} className="border rounded-lg p-4 bg-muted/30">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{file.original_name}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Uploaded {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                                      </div>
                                    </div>
                                    <Badge
                                      variant={file.processing_status === 'completed' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {file.processing_status}
                                    </Badge>
                                  </div>
                                  {file.extracted_text && (
                                    <Collapsible>
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-xs mt-2">
                                          <Eye className="h-3 w-3 mr-1" />
                                          View Content
                                          <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="mt-2">
                                        <div className="text-xs bg-white dark:bg-gray-900 p-3 rounded border max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
                                          {file.extracted_text}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              No training materials found
                            </div>
                          )
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            Loading training materials...
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage Subscription Tier</CardTitle>
              <CardDescription className="text-sm">
                Assign or change the user's subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Tier</label>
                <Select value={selectedTier} onValueChange={handleTierChange}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select a tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id} className="text-sm">
                        {tier.display_name} - {tier.max_avatars === -1 ? 'Unlimited' : tier.max_avatars} avatars (${tier.price_monthly}/mo)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentTier && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="text-sm font-semibold">{currentTier.display_name}</div>
                  <div className="text-sm text-muted-foreground">{currentTier.description}</div>
                  <div className="text-sm">
                    <span className="font-medium">Avatar Limit:</span>{' '}
                    <span className="text-muted-foreground">
                      {currentTier.max_avatars === -1 ? 'Unlimited' : currentTier.max_avatars}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Price:</span>{' '}
                    <span className="text-muted-foreground">${currentTier.price_monthly}/month</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-lg">Image Details</DialogTitle>
                <DialogDescription className="text-sm">
                  {selectedImage && formatDistanceToNow(new Date(selectedImage.created_at), { addSuffix: true })}
                </DialogDescription>
              </div>
              {selectedImage && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!selectedImage) return;
                      try {
                        const response = await fetch(selectedImage.image_url);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `generated-image-${selectedImage.id}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Error downloading image:', error);
                        alert('Failed to download image');
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              {selectedImage.generation_type === 'image-to-image' && selectedImage.original_image_url ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Original Image</div>
                    <div className="relative rounded-lg overflow-hidden bg-muted">
                      <img
                        src={selectedImage.original_image_url}
                        alt="Original"
                        className="w-full h-auto max-h-[50vh] object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Generated Image</div>
                    <div className="relative rounded-lg overflow-hidden bg-muted">
                      <img
                        src={selectedImage.image_url}
                        alt="Generated"
                        className="w-full h-auto max-h-[50vh] object-contain"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.prompt}
                    className="w-auto h-auto max-h-[60vh] max-w-full object-contain"
                  />
                </div>
              )}
              <div>
                <div className="text-sm font-medium mb-2">Prompt:</div>
                <div className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                  {selectedImage.prompt}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedImage.generation_type}
                </Badge>
                {selectedImage.is_favorite && (
                  <Badge className="text-xs">Favorite</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
