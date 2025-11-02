/**
 * Fine-Tune Interface Component
 *
 * UI for creating and managing real ML fine-tuning of avatar models
 */

import React, { useState, useEffect } from 'react';
import { FineTuneService, FineTuneJob, FineTuneConfig } from '../../../services/fineTuneService';
import { TrainingService } from '../../../services/trainingService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '../../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Database,
  DollarSign,
  Play,
  StopCircle,
  RefreshCw
} from 'lucide-react';

interface FineTuneInterfaceProps {
  avatarId: string;
  userId: string;
}

export function FineTuneInterface({ avatarId, userId }: FineTuneInterfaceProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [jobs, setJobs] = useState<FineTuneJob[]>([]);
  const [trainingDataSessions, setTrainingDataSessions] = useState<any[]>([]);

  // Create job state
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStep, setCreationStep] = useState('');
  const [selectedTrainingData, setSelectedTrainingData] = useState<string>('');
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>('gpt-4o-mini-2024-07-18');
  const [estimatedCost, setEstimatedCost] = useState<any>(null);

  // Monitoring state
  const [monitoringJobs, setMonitoringJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [avatarId, userId]);

  useEffect(() => {
    // Auto-refresh running jobs every 30 seconds
    const interval = setInterval(() => {
      jobs.forEach(job => {
        if (['queued', 'running', 'validating_files'].includes(job.status)) {
          refreshJobStatus(job.id);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [jobs]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eligibilityData, statsData, jobsData, trainingData] = await Promise.all([
        FineTuneService.checkFineTuneEligibility(avatarId, userId),
        FineTuneService.getExamplesStatistics(avatarId, userId),
        FineTuneService.listFineTuneJobs(avatarId, userId),
        TrainingService.getAvatarTrainingSessions(avatarId, userId)
      ]);

      setEligibility(eligibilityData);
      setStatistics(statsData);
      setJobs(jobsData);
      setTrainingDataSessions(trainingData.filter((td: any) => td.status === 'completed'));
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load fine-tuning data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!selectedTrainingData) {
      toast({
        title: "Error",
        description: "Please select a training data session",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingJob(true);
    setCreationProgress(0);
    setCreationStep('Starting...');

    try {
      const config: FineTuneConfig = {
        baseModel: selectedBaseModel as any,
        nEpochs: 'auto'
      };

      const jobId = await FineTuneService.createFineTuneJob(
        selectedTrainingData,
        userId,
        avatarId,
        config,
        (step, percentage) => {
          setCreationStep(step);
          setCreationProgress(percentage);
        }
      );

      toast({
        title: "Success",
        description: "Fine-tuning job created! Training will take 10-60 minutes."
      });

      // Start monitoring this job
      setMonitoringJobs(prev => new Set(prev).add(jobId));

      // Reload data
      await loadData();

    } catch (error: any) {
      console.error('Error creating fine-tune job:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create fine-tuning job',
        variant: "destructive"
      });
    } finally {
      setIsCreatingJob(false);
      setCreationProgress(0);
      setCreationStep('');
    }
  };

  const refreshJobStatus = async (jobId: string) => {
    try {
      const status = await FineTuneService.checkFineTuneStatus(jobId, userId);

      // Update jobs list
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, status: status.status, fine_tuned_model: status.fineTunedModel }
          : job
      ));

      // Show notification on completion
      if (status.status === 'succeeded') {
        toast({
          title: "Success",
          description: "Fine-tuning completed! Your avatar now uses the custom model."
        });
        setMonitoringJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else if (status.status === 'failed') {
        toast({
          title: "Error",
          description: `Fine-tuning failed: ${status.error}`,
          variant: "destructive"
        });
        setMonitoringJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error refreshing job status:', error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this fine-tuning job?')) {
      return;
    }

    try {
      await FineTuneService.cancelFineTuneJob(jobId, userId);
      toast({
        title: "Success",
        description: "Fine-tuning job cancelled"
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to cancel job',
        variant: "destructive"
      });
    }
  };

  const handleActivateModel = async (modelId: string) => {
    try {
      await FineTuneService.activateFineTunedModel(avatarId, modelId, userId);
      toast({
        title: "Success",
        description: "Fine-tuned model activated!"
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to activate model',
        variant: "destructive"
      });
    }
  };

  const handleDeactivateModel = async () => {
    try {
      await FineTuneService.deactivateFineTunedModel(avatarId, userId);
      toast({
        title: "Success",
        description: "Reverted to base model"
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to deactivate model',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (eligibility && selectedBaseModel) {
      const cost = FineTuneService.estimateFineTuningCost(
        eligibility.currentExamples,
        selectedBaseModel,
        3
      );
      setEstimatedCost(cost);
    }
  }, [eligibility, selectedBaseModel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            Model Fine-Tuning
          </h2>
          <p className="text-gray-600 mt-1">
            Train a custom AI model that deeply learns your communication style
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>What is Fine-Tuning?</AlertTitle>
        <AlertDescription>
          Fine-tuning actually modifies the AI model's internal parameters to deeply learn
          your communication style. Unlike prompt engineering (which just provides instructions),
          fine-tuning creates a custom model that inherently understands how you communicate.
          This provides significantly better results but requires at least 10 conversation examples
          and takes 10-60 minutes to complete.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Fine-Tune</TabsTrigger>
          <TabsTrigger value="jobs">Training Jobs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Training Examples Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Training Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.total || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {eligibility?.requiredExamples} minimum required
                </p>
              </CardContent>
            </Card>

            {/* Quality Score Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics ? Math.round(statistics.averageQuality * 100) : 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Average example quality
                </p>
              </CardContent>
            </Card>

            {/* Active Models Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Fine-Tuned Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.filter(j => j.status === 'succeeded').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Successfully trained
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Eligibility Status */}
          <Card>
            <CardHeader>
              <CardTitle>Fine-Tuning Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                {eligibility?.eligible ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {eligibility?.eligible
                      ? 'Ready for Fine-Tuning!'
                      : 'Need More Examples'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {eligibility?.recommendation}
                  </p>
                </div>
              </div>

              {/* Examples by Pattern Type */}
              {statistics?.byPatternType && Object.keys(statistics.byPatternType).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Examples by Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statistics.byPatternType).map(([type, count]) => (
                      <Badge key={type} variant="secondary">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Fine-Tune Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Fine-Tuning Job</CardTitle>
              <CardDescription>
                Train a custom model based on your conversation examples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!eligibility?.eligible ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Not Eligible</AlertTitle>
                  <AlertDescription>
                    {eligibility?.recommendation}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Training Data Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Training Data Session
                    </label>
                    <Select
                      value={selectedTrainingData}
                      onValueChange={setSelectedTrainingData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a training session..." />
                      </SelectTrigger>
                      <SelectContent>
                        {trainingDataSessions.map((session: any) => (
                          <SelectItem key={session.id} value={session.id}>
                            {new Date(session.created_at).toLocaleDateString()} -
                            {session.training_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Select which training data to use for fine-tuning
                    </p>
                  </div>

                  {/* Base Model Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Model</label>
                    <Select
                      value={selectedBaseModel}
                      onValueChange={setSelectedBaseModel}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini-2024-07-18">
                          GPT-4o Mini (Recommended - Fast & Affordable)
                        </SelectItem>
                        <SelectItem value="gpt-4o-2024-08-06">
                          GPT-4o (Higher Quality, More Expensive)
                        </SelectItem>
                        <SelectItem value="gpt-3.5-turbo-0125">
                          GPT-3.5 Turbo (Budget Option)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cost Estimate */}
                  {estimatedCost && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">Estimated Cost</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                              ${estimatedCost.totalEstimate}
                            </p>
                            <p className="text-sm text-blue-700 mt-2">
                              Training: ${estimatedCost.trainingCost} •
                              Usage: ${estimatedCost.inputCostPer1M}/1M input tokens,
                              ${estimatedCost.outputCostPer1M}/1M output tokens
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Progress Display */}
                  {isCreatingJob && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{creationStep}</span>
                        <span className="font-medium">{creationProgress}%</span>
                      </div>
                      <Progress value={creationProgress} />
                    </div>
                  )}

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateJob}
                    disabled={isCreatingJob || !selectedTrainingData}
                    className="w-full"
                    size="lg"
                  >
                    {isCreatingJob ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Job...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Fine-Tuning
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Fine-tuning typically takes 10-60 minutes depending on data size
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No fine-tuning jobs yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first fine-tuning job to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs.map(job => (
              <FineTuneJobCard
                key={job.id}
                job={job}
                onRefresh={() => refreshJobStatus(job.id)}
                onCancel={() => handleCancelJob(job.id)}
                onActivate={() => job.fine_tuned_model && handleActivateModel(job.fine_tuned_model)}
                isMonitoring={monitoringJobs.has(job.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Job Card Component
function FineTuneJobCard({
  job,
  onRefresh,
  onCancel,
  onActivate,
  isMonitoring
}: {
  job: FineTuneJob;
  onRefresh: () => void;
  onCancel: () => void;
  onActivate: () => void;
  isMonitoring: boolean;
}) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'succeeded':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <StopCircle className="w-5 h-5 text-gray-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, any> = {
      succeeded: 'default',
      failed: 'destructive',
      cancelled: 'secondary',
      running: 'default',
      queued: 'secondary',
      validating_files: 'secondary'
    };

    return (
      <Badge variant={variants[job.status] || 'secondary'}>
        {job.status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">
                {job.base_model}
                {job.model_suffix && <span className="text-gray-500"> • {job.model_suffix}</span>}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {getStatusBadge()}
                <span>•</span>
                <span>{new Date(job.created_at!).toLocaleString()}</span>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['queued', 'running', 'validating_files'].includes(job.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}

            {job.status === 'succeeded' && job.fine_tuned_model && (
              <Button
                variant="default"
                size="sm"
                onClick={onActivate}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Activate Model
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Training Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Examples</p>
            <p className="font-medium">{job.training_examples_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Tokens</p>
            <p className="font-medium">{job.trained_tokens?.toLocaleString() || 'N/A'}</p>
          </div>
          {job.estimated_cost && (
            <div>
              <p className="text-gray-500">Est. Cost</p>
              <p className="font-medium">${job.estimated_cost}</p>
            </div>
          )}
          {job.finished_at && (
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium">
                {Math.round((new Date(job.finished_at).getTime() - new Date(job.created_at!).getTime()) / 60000)} min
              </p>
            </div>
          )}
        </div>

        {/* Fine-tuned Model ID */}
        {job.fine_tuned_model && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Fine-Tuned Model ID</p>
            <code className="text-xs font-mono">{job.fine_tuned_model}</code>
          </div>
        )}

        {/* Error Message */}
        {job.error_message && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{job.error_message}</AlertDescription>
          </Alert>
        )}

        {/* Monitoring Badge */}
        {isMonitoring && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Monitoring progress...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
