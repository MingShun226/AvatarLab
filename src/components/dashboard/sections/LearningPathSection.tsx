
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  GitBranch,
  Clock,
  CheckCircle,
  PlayCircle,
  RotateCcw,
  TrendingUp,
  Activity,
  Loader2,
  Sparkles,
  AlertCircle,
  Pause,
  Trash2
} from 'lucide-react';
import { FineTuneService } from '@/services/fineTuneService';
import { supabase } from '@/integrations/supabase/client';

interface TrainingHistory {
  id: string;
  created_at: string;
  training_type: string;
  fine_tune_status?: string;
  fine_tuned_model_id?: string;
  avatars?: {
    id: string;
    name: string;
  };
  fine_tune_jobs?: {
    estimated_cost?: number;
    actual_cost?: number;
    training_examples_count?: number;
  };
}

const LearningPathSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [avatars, setAvatars] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [stats, setStats] = useState({
    totalVersions: 0,
    totalTrainingHours: 0,
    activeModel: null as string | null,
    totalExamples: 0
  });

  // Load user's avatars
  useEffect(() => {
    const loadAvatars = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('avatars')
        .select('id, name, active_fine_tuned_model, use_fine_tuned_model')
        .eq('user_id', user.id);
      setAvatars(data || []);
    };
    loadAvatars();
  }, [user]);

  // Load active training jobs and history for all avatars
  useEffect(() => {
    if (user && avatars.length > 0) {
      loadActiveJobs();
      loadTrainingHistory();
    }
  }, [user, avatars]);

  // Poll jobs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeJobs.length > 0 && user) {
        loadActiveJobs();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeJobs, user]);

  const loadActiveJobs = async () => {
    if (!user) return;

    try {
      setIsLoadingJobs(true);
      // Get active jobs from all user's avatars
      const { data, error } = await supabase
        .from('avatar_fine_tune_jobs')
        .select(`
          *,
          avatars:avatar_id (
            name
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['validating_files', 'queued', 'running'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActiveJobs(data || []);

      // Check for completed/failed jobs and notify
      data?.forEach(job => {
        if (job.status === 'succeeded' && !sessionStorage.getItem(`notified_${job.id}`)) {
          toast({
            title: "Fine-Tuning Complete!",
            description: `${job.avatars?.name}: Model ${job.fine_tuned_model} is ready!`,
          });
          sessionStorage.setItem(`notified_${job.id}`, 'true');
        }
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadTrainingHistory = async () => {
    if (!user) return;

    try {
      setIsLoadingHistory(true);

      // Get all training data for user's avatars with fine-tune job details
      const { data: historyData, error } = await supabase
        .from('avatar_training_data')
        .select(`
          id,
          created_at,
          training_type,
          fine_tune_status,
          fine_tuned_model_id,
          avatars:avatar_id (
            id,
            name,
            active_fine_tuned_model
          ),
          fine_tune_jobs:avatar_fine_tune_jobs!avatar_fine_tune_jobs_training_data_id_fkey (
            estimated_cost,
            actual_cost,
            training_examples_count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrainingHistory(historyData || []);

      // Calculate stats
      const totalVersions = historyData?.length || 0;
      const totalExamples = await getTotalExamplesCount();

      // Get active model from first avatar with fine-tuned model ENABLED
      const activeAvatar = avatars.find((a: any) =>
        a.active_fine_tuned_model && a.use_fine_tuned_model === true
      );
      const activeModel = activeAvatar?.active_fine_tuned_model || null;

      setStats({
        totalVersions,
        totalTrainingHours: 0, // We don't track hours
        activeModel,
        totalExamples
      });

    } catch (error) {
      console.error('Error loading training history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getTotalExamplesCount = async () => {
    if (!user) return 0;

    const { count } = await supabase
      .from('avatar_training_examples')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return count || 0;
  };

  const refreshJobStatus = async (jobId: string, openaiJobId: string) => {
    if (!user) return;
    try {
      // checkFineTuneStatus expects the database UUID (jobId), not the OpenAI job ID
      await FineTuneService.checkFineTuneStatus(jobId, user.id);
      await loadActiveJobs();

      toast({
        title: "Status Updated",
        description: "Training job status has been refreshed from OpenAI",
      });
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not update job status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'running':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (training: TrainingHistory) => {
    // Check if this version is currently active
    const isActive = training.fine_tuned_model_id &&
                     avatars.some((a: any) =>
                       a.id === training.avatars?.id &&
                       a.active_fine_tuned_model === training.fine_tuned_model_id &&
                       a.use_fine_tuned_model === true
                     );

    if (isActive) {
      return <Badge className="bg-green-600 text-white">Active Now</Badge>;
    } else if (training.fine_tune_status === 'succeeded') {
      return <Badge className="bg-gray-600 text-white">Completed</Badge>;
    } else if (training.fine_tune_status === 'running') {
      return <Badge className="bg-blue-600 text-white">Training</Badge>;
    } else if (training.fine_tune_status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    } else if (training.training_type === 'prompt_update') {
      return <Badge variant="outline">Quick Training</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const activateFineTunedModel = async (training: TrainingHistory) => {
    if (!user || !training.fine_tuned_model_id || !training.avatars?.id) return;

    try {
      const { error } = await supabase
        .from('avatars')
        .update({
          active_fine_tuned_model: training.fine_tuned_model_id,
          use_fine_tuned_model: true
        })
        .eq('id', training.avatars.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload data to reflect changes
      await loadTrainingHistory();
      const updatedAvatars = await supabase
        .from('avatars')
        .select('id, name, active_fine_tuned_model, use_fine_tuned_model')
        .eq('user_id', user.id);
      setAvatars(updatedAvatars.data || []);

      toast({
        title: "Model Activated",
        description: `Now using fine-tuned model: ${training.fine_tuned_model_id}`,
      });
    } catch (error) {
      console.error('Error activating model:', error);
      toast({
        title: "Activation Failed",
        description: "Could not activate fine-tuned model",
        variant: "destructive"
      });
    }
  };

  const deactivateFineTunedModel = async (training: TrainingHistory) => {
    if (!user || !training.avatars?.id) return;

    try {
      const { error } = await supabase
        .from('avatars')
        .update({
          use_fine_tuned_model: false
        })
        .eq('id', training.avatars.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload data
      await loadTrainingHistory();
      const updatedAvatars = await supabase
        .from('avatars')
        .select('id, name, active_fine_tuned_model, use_fine_tuned_model')
        .eq('user_id', user.id);
      setAvatars(updatedAvatars.data || []);

      toast({
        title: "Model Deactivated",
        description: "Switched back to base model",
      });
    } catch (error) {
      console.error('Error deactivating model:', error);
      toast({
        title: "Deactivation Failed",
        description: "Could not deactivate model",
        variant: "destructive"
      });
    }
  };

  const deleteTrainingVersion = async (training: TrainingHistory) => {
    if (!user) return;

    // Check if this model is currently active
    const isActive = training.fine_tuned_model_id &&
                     avatars.some((a: any) =>
                       a.id === training.avatars?.id &&
                       a.active_fine_tuned_model === training.fine_tuned_model_id &&
                       a.use_fine_tuned_model === true
                     );

    // Confirm deletion
    const confirmMessage = isActive
      ? `This model is currently ACTIVE. Deleting it will deactivate the fine-tuned model and switch back to base model.\n\nAre you sure you want to delete this training version?`
      : `Are you sure you want to delete this training version?\n\n${training.fine_tuned_model_id || 'Quick Training session'}\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // If active, deactivate first
      if (isActive && training.avatars?.id) {
        await supabase
          .from('avatars')
          .update({
            use_fine_tuned_model: false,
            active_fine_tuned_model: null
          })
          .eq('id', training.avatars.id)
          .eq('user_id', user.id);
      }

      // Delete related fine-tune jobs
      if (training.fine_tuned_model_id) {
        await supabase
          .from('avatar_fine_tune_jobs')
          .delete()
          .eq('training_data_id', training.id)
          .eq('user_id', user.id);
      }

      // Delete training examples associated with this training session
      await supabase
        .from('avatar_training_examples')
        .delete()
        .eq('training_data_id', training.id)
        .eq('user_id', user.id);

      // Delete the training data record
      const { error } = await supabase
        .from('avatar_training_data')
        .delete()
        .eq('id', training.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload data
      await loadTrainingHistory();
      const updatedAvatars = await supabase
        .from('avatars')
        .select('id, name, active_fine_tuned_model, use_fine_tuned_model')
        .eq('user_id', user.id);
      setAvatars(updatedAvatars.data || []);

      toast({
        title: "Version Deleted",
        description: isActive
          ? "Active model was deactivated and deleted successfully"
          : "Training version deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting training version:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete training version",
        variant: "destructive"
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <GitBranch className="h-6 w-6" />
            Learning Path
          </h1>
          <p className="text-muted-foreground">
            Track your avatar's learning progress and version history
          </p>
        </div>
        <Badge variant="outline" className="learning-path-gradient text-white">
          Version Control System
        </Badge>
      </div>

      {/* Active Training Jobs */}
      {activeJobs.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mt-1" />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Active Training Jobs
                </h3>
                <AlertDescription className="text-blue-700 text-sm mt-1">
                  Your avatars are being trained. This process typically takes 10-60 minutes.
                </AlertDescription>
              </div>

              <div className="space-y-3">
                {activeJobs.map(job => (
                  <Card key={job.id} className="bg-white border-blue-100">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-sm">
                            {job.avatars?.name || 'Unknown Avatar'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Model: {job.base_model}
                          </p>
                          <p className="text-xs text-gray-500">
                            Training {job.training_examples_count} examples
                          </p>
                        </div>
                        <Badge
                          variant={job.status === 'running' ? 'default' : 'secondary'}
                          className={job.status === 'running' ? 'bg-blue-600' : ''}
                        >
                          {job.status}
                        </Badge>
                      </div>

                      {job.status === 'running' && job.estimated_finish_at && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Estimated completion
                            </span>
                            <span className="font-medium">
                              {new Date(job.estimated_finish_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <Progress value={50} className="h-2" />
                        </div>
                      )}

                      {job.status === 'queued' && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Waiting in queue...
                          </p>
                        </div>
                      )}

                      {job.status === 'validating_files' && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Validating training files...
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refreshJobStatus(job.id, job.openai_job_id)}
                          className="text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Refresh Status
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Model
            </CardTitle>
            {stats.activeModel ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-sm font-mono truncate">
                  {stats.activeModel || 'Base Model (gpt-4o-mini)'}
                </div>
                <div className="mt-2">
                  {stats.activeModel ? (
                    <Badge className="bg-green-600 text-white text-xs">
                      Fine-Tuned Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      No Fine-Tuning
                    </Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalVersions}</div>
                <p className="text-xs text-muted-foreground">
                  Total completed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Examples
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalExamples}</div>
                <p className="text-xs text-muted-foreground">
                  Conversation pairs
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training History Timeline */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Training History
          </CardTitle>
          <CardDescription>
            Chronological view of your chatbot training sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : trainingHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No training sessions yet</p>
              <p className="text-sm mt-1">Start training your chatbot in the Chatbot Studio</p>
            </div>
          ) : (
            <div className="space-y-6">
              {trainingHistory.map((training: any, index) => (
                <div key={training.id} className="relative">
                  {/* Timeline Line */}
                  {index < trainingHistory.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                  )}

                  <div className="flex gap-4">
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(training.fine_tune_status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">
                            {training.avatars?.name || 'Unknown Avatar'}
                          </h4>
                          {getStatusBadge(training)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(training.created_at)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {training.training_type === 'prompt_update' ? 'Quick Training' : 'Deep Training'}
                        </Badge>

                        {training.fine_tuned_model_id && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {training.fine_tuned_model_id}
                          </Badge>
                        )}

                        {(training.fine_tune_jobs as any)?.[0]?.actual_cost && (
                          <Badge variant="outline" className="text-xs">
                            ${((training.fine_tune_jobs as any)[0].actual_cost).toFixed(2)}
                          </Badge>
                        )}

                        {!((training.fine_tune_jobs as any)?.[0]?.actual_cost) && (training.fine_tune_jobs as any)?.[0]?.estimated_cost && (
                          <Badge variant="outline" className="text-xs">
                            ~${((training.fine_tune_jobs as any)[0].estimated_cost).toFixed(2)}
                          </Badge>
                        )}
                      </div>

                      {training.fine_tuned_model_id && (
                        <p className="text-sm text-muted-foreground">
                          Fine-tuned model: <code className="text-xs bg-muted px-2 py-1 rounded">{training.fine_tuned_model_id}</code>
                        </p>
                      )}

                      {/* Version Control Actions */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {training.fine_tuned_model_id && training.fine_tune_status === 'succeeded' && (
                          <>
                            {/* Check if this model is currently active */}
                            {avatars.some((a: any) =>
                              a.id === training.avatars?.id &&
                              a.active_fine_tuned_model === training.fine_tuned_model_id &&
                              a.use_fine_tuned_model === true
                            ) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deactivateFineTunedModel(training)}
                              >
                                <Pause className="mr-1 h-3 w-3" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => activateFineTunedModel(training)}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Activate This Version
                              </Button>
                            )}
                          </>
                        )}

                        {training.training_type === 'prompt_update' && (
                          <Button size="sm" variant="outline">
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Restore Prompt
                          </Button>
                        )}

                        {/* Delete button - always show */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => deleteTrainingVersion(training)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default LearningPathSection;
