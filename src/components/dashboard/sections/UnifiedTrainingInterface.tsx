/**
 * Unified Training Interface
 * Combines prompt engineering and real ML fine-tuning in one place
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Zap,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';

import { TrainingService } from '../../../services/trainingService';
import { FineTuneService, FineTuneJob } from '../../../services/fineTuneService';

interface UnifiedTrainingInterfaceProps {
  avatarId: string;
  avatarName: string;
  userId: string;
  onTrainingComplete?: () => void;
}

export function UnifiedTrainingInterface({
  avatarId,
  avatarName,
  userId,
  onTrainingComplete
}: UnifiedTrainingInterfaceProps) {
  const { toast } = useToast();

  // Training data
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [trainingInstructions, setTrainingInstructions] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Training sessions
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');

  // Statistics
  const [stats, setStats] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);

  // Fine-tuning jobs
  const [fineTuneJobs, setFineTuneJobs] = useState<FineTuneJob[]>([]);
  const [isCreatingFineTune, setIsCreatingFineTune] = useState(false);
  const [fineTuneProgress, setFineTuneProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini-2024-07-18');

  useEffect(() => {
    loadData();
  }, [avatarId, userId]);

  const loadData = async () => {
    try {
      const [sessions, statistics, eligibilityData, jobs] = await Promise.all([
        TrainingService.getAvatarTrainingSessions(avatarId, userId),
        FineTuneService.getExamplesStatistics(avatarId, userId),
        FineTuneService.checkFineTuneEligibility(avatarId, userId),
        FineTuneService.listFineTuneJobs(avatarId, userId)
      ]);

      setTrainingSessions(sessions.filter((s: any) => s.status === 'completed'));
      setStats(statistics);
      setEligibility(eligibilityData);
      setFineTuneJobs(jobs);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // STEP 1: Quick Training (Prompt Engineering)
  const handleQuickTraining = async () => {
    if (files.length === 0 && !textInput.trim() && !trainingInstructions.trim()) {
      toast({
        title: "No Data",
        description: "Please upload files or enter conversation text",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Creating training session...');
    setProcessingProgress(10);

    try {
      // Create training session
      const trainingData = await TrainingService.createTrainingSession({
        user_id: userId,
        avatar_id: avatarId,
        training_type: files.length > 0 ? 'file_upload' : 'conversation_analysis',
        training_instructions: trainingInstructions || textInput,
        status: 'pending'
      });

      setProcessingProgress(20);

      // Upload files if any
      if (files.length > 0) {
        setProcessingStep(`Uploading ${files.length} files...`);
        for (let i = 0; i < files.length; i++) {
          await TrainingService.uploadTrainingFile(
            trainingData.id,
            userId,
            avatarId,
            files[i]
          );
          setProcessingProgress(20 + (30 * (i + 1) / files.length));
        }
      }

      // Process training data
      setProcessingStep('Analyzing conversations...');
      setProcessingProgress(50);

      await TrainingService.processTrainingData(
        trainingData.id,
        userId,
        avatarId,
        (step, percentage) => {
          setProcessingStep(step);
          setProcessingProgress(50 + (percentage / 2));
        }
      );

      setProcessingProgress(100);
      setProcessingStep('Training complete!');

      toast({
        title: "Quick Training Complete!",
        description: "Your avatar's prompt has been enhanced with new patterns."
      });

      // Reset and reload
      setFiles([]);
      setTextInput('');
      setTrainingInstructions('');
      await loadData();
      onTrainingComplete?.();

    } catch (error: any) {
      console.error('Training error:', error);
      toast({
        title: "Training Failed",
        description: error.message || "Failed to complete training",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStep('');
    }
  };

  // STEP 2: Deep Training (Fine-Tuning)
  const handleDeepTraining = async () => {
    if (!selectedSession) {
      toast({
        title: "No Training Data",
        description: "Please complete Quick Training first to generate training data",
        variant: "destructive"
      });
      return;
    }

    if (!eligibility?.eligible) {
      toast({
        title: "Not Eligible",
        description: eligibility?.recommendation || "Need more training examples",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingFineTune(true);
    setFineTuneProgress(0);

    try {
      const jobId = await FineTuneService.createFineTuneJob(
        selectedSession,
        userId,
        avatarId,
        { baseModel: selectedModel as any },
        (step, percentage) => {
          setProcessingStep(step);
          setFineTuneProgress(percentage);
        }
      );

      toast({
        title: "Fine-Tuning Started!",
        description: "Training will take 10-60 minutes. You'll be notified when complete."
      });

      await loadData();

    } catch (error: any) {
      toast({
        title: "Fine-Tuning Failed",
        description: error.message || "Failed to start fine-tuning",
        variant: "destructive"
      });
    } finally {
      setIsCreatingFineTune(false);
      setFineTuneProgress(0);
    }
  };

  const costEstimate = eligibility ? FineTuneService.estimateFineTuningCost(
    eligibility.currentExamples,
    selectedModel,
    3
  ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-500" />
          Train {avatarName}
        </h2>
        <p className="text-gray-600 mt-1">
          Upload conversations to teach your avatar how to communicate
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Training Examples</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Quality Score</p>
                <p className="text-2xl font-bold">
                  {stats ? Math.round(stats.averageQuality * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Training Status</p>
                <p className="text-lg font-semibold">
                  {eligibility?.eligible ? (
                    <span className="text-green-600">Ready</span>
                  ) : (
                    <span className="text-orange-600">Need More Data</span>
                  )}
                </p>
              </div>
              <CheckCircle2 className={`w-8 h-8 opacity-20 ${
                eligibility?.eligible ? 'text-green-500' : 'text-orange-500'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="quick">
            <Zap className="w-4 h-4 mr-2" />
            Quick Training
          </TabsTrigger>
          <TabsTrigger value="deep">
            <Sparkles className="w-4 h-4 mr-2" />
            Deep Training
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Upload Data */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Training Data</CardTitle>
              <CardDescription>
                Upload conversation screenshots, text files, or paste conversations directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Files (Images, PDFs, Text)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.txt,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, PDF, TXT (Max 10 files)
                    </p>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((file, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Or Paste Conversation Text
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="User: Hi, how are you?&#10;Assistant: I'm great! How can I help?&#10;&#10;User: Tell me about yourself&#10;Assistant: I'm an AI assistant..."
                  className="w-full h-32 p-3 border rounded-lg resize-none"
                />
              </div>

              {/* Training Instructions */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Training Instructions (Optional)
                </label>
                <textarea
                  value={trainingInstructions}
                  onChange={(e) => setTrainingInstructions(e.target.value)}
                  placeholder="e.g., 'Be more casual and friendly', 'Use Malaysian slang', 'Respond with shorter messages'"
                  className="w-full h-20 p-3 border rounded-lg resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Quick Training */}
        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Training (Prompt Engineering)
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Instant results • Free • Good for style changes
                  </CardDescription>
                </div>
                <Badge variant="secondary">Instant</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>How Quick Training Works</AlertTitle>
                <AlertDescription>
                  Analyzes your conversations and creates enhanced instructions for the AI.
                  Results are immediate but the AI still follows instructions rather than
                  deeply learning your style.
                </AlertDescription>
              </Alert>

              {/* Data Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Files uploaded:</span>
                  <span className="font-medium">{files.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Text input:</span>
                  <span className="font-medium">
                    {textInput.trim() ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Instructions:</span>
                  <span className="font-medium">
                    {trainingInstructions.trim() ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{processingStep}</span>
                    <span className="font-medium">{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} />
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={handleQuickTraining}
                disabled={isProcessing || (files.length === 0 && !textInput.trim())}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start Quick Training
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Takes 30-60 seconds • Creates enhanced prompt
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Deep Training */}
        <TabsContent value="deep" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Deep Training (ML Fine-Tuning)
                  </CardTitle>
                  <CardDescription className="mt-2">
                    10-60 minutes • $3-20 cost • Best quality results
                  </CardDescription>
                </div>
                <Badge variant="default">Premium</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>How Deep Training Works</AlertTitle>
                <AlertDescription>
                  Creates a custom AI model trained specifically on your communication style.
                  The model's neural network weights are modified to deeply understand
                  how you communicate. Much better than prompt engineering!
                </AlertDescription>
              </Alert>

              {/* Eligibility Check */}
              <div className={`p-4 rounded-lg ${
                eligibility?.eligible
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-start gap-3">
                  {eligibility?.eligible ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {eligibility?.eligible ? 'Ready for Fine-Tuning!' : 'Not Ready Yet'}
                    </p>
                    <p className="text-sm mt-1 text-gray-700">
                      {eligibility?.recommendation}
                    </p>
                    <p className="text-xs mt-2 text-gray-600">
                      Current: {eligibility?.currentExamples || 0} examples •
                      Need: {eligibility?.requiredExamples || 10} minimum
                    </p>
                  </div>
                </div>
              </div>

              {eligibility?.eligible && (
                <>
                  {/* Training Session Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Training Data
                    </label>
                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a training session..." />
                      </SelectTrigger>
                      <SelectContent>
                        {trainingSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {new Date(session.created_at).toLocaleDateString()} -
                            {session.training_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Base Model
                    </label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini-2024-07-18">
                          GPT-4o Mini (Recommended - $3-5)
                        </SelectItem>
                        <SelectItem value="gpt-4o-2024-08-06">
                          GPT-4o (Higher Quality - $10-20)
                        </SelectItem>
                        <SelectItem value="gpt-3.5-turbo-0125">
                          GPT-3.5 Turbo (Budget - $2-3)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cost Estimate */}
                  {costEstimate && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">Cost Estimate</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            ${costEstimate.totalEstimate}
                          </p>
                          <p className="text-sm text-blue-700 mt-2">
                            Training: ${costEstimate.trainingCost} •
                            Usage: ${costEstimate.inputCostPer1M}/1M tokens
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  {isCreatingFineTune && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{processingStep}</span>
                        <span className="font-medium">{fineTuneProgress}%</span>
                      </div>
                      <Progress value={fineTuneProgress} />
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={handleDeepTraining}
                    disabled={isCreatingFineTune || !selectedSession}
                    className="w-full"
                    size="lg"
                  >
                    {isCreatingFineTune ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Fine-Tune Job...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Deep Training
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Takes 10-60 minutes • Creates custom model
                  </div>
                </>
              )}

              {/* Training Jobs */}
              {fineTuneJobs.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Recent Training Jobs</h3>
                  <div className="space-y-2">
                    {fineTuneJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{job.base_model}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(job.created_at!).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          job.status === 'succeeded' ? 'default' :
                          job.status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Which Training Should I Use?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h4 className="font-semibold">Quick Training</h4>
              </div>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✓ Instant results</li>
                <li>✓ Free</li>
                <li>✓ Good for testing</li>
                <li>✓ Easy to iterate</li>
                <li>⚠️ Moderate quality</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h4 className="font-semibold">Deep Training</h4>
              </div>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✓ Best quality (70-90% match)</li>
                <li>✓ Deep learning</li>
                <li>✓ Production ready</li>
                <li>⚠️ Takes time (10-60 min)</li>
                <li>⚠️ Costs $3-20</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
            <p className="font-medium">💡 Recommendation:</p>
            <p className="mt-1">
              Start with Quick Training to test, then upgrade to Deep Training
              once you have 50+ high-quality examples for best results!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
