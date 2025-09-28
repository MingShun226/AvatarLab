import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Image,
  X,
  Brain,
  Wand2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TrainingService, TrainingData, TrainingFile, PromptVersion } from '@/services/trainingService';

interface DatabaseTrainingInterfaceProps {
  avatarId: string;
  avatarName: string;
  isTraining: boolean;
  onTrainingStart: () => void;
  onTrainingComplete: () => void;
}

export const DatabaseTrainingInterface: React.FC<DatabaseTrainingInterfaceProps> = ({
  avatarId,
  avatarName,
  isTraining,
  onTrainingStart,
  onTrainingComplete
}) => {
  const [trainingInstructions, setTrainingInstructions] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem(`training-instructions-${avatarId}`);
    return saved || '';
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentTrainingSession, setCurrentTrainingSession] = useState<TrainingData | null>(null);
  const [trainingFiles, setTrainingFiles] = useState<TrainingFile[]>([]);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStep, setTrainingStep] = useState('');
  const [generatedVersion, setGeneratedVersion] = useState<PromptVersion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing data when component mounts
  useEffect(() => {
    if (user && avatarId) {
      // Add delay to ensure component is mounted
      setTimeout(() => {
        loadPromptVersions();
        loadActiveVersion();
      }, 100);
    }
  }, [user, avatarId]);

  // Save training instructions to localStorage whenever they change
  useEffect(() => {
    if (avatarId) {
      localStorage.setItem(`training-instructions-${avatarId}`, trainingInstructions);
    }
  }, [trainingInstructions, avatarId]);

  const loadPromptVersions = async () => {
    try {
      const versions = await TrainingService.getPromptVersions(avatarId, user!.id);
      setPromptVersions(versions);
    } catch (error) {
      console.error('Error loading prompt versions:', error);
    }
  };

  const loadActiveVersion = async () => {
    try {
      const version = await TrainingService.getActivePromptVersion(avatarId, user!.id);
      setActiveVersion(version);
    } catch (error) {
      console.error('Error loading active version:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/', 'text/', 'application/pdf'];
    const validFiles = files.filter(file =>
      allowedTypes.some(type => file.type.startsWith(type))
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Please upload images, text files, or PDFs only.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTraining = async () => {
    if (!trainingInstructions.trim() && uploadedFiles.length === 0) {
      toast({
        title: "No Training Data",
        description: "Please describe what needs to be enhanced or upload conversation examples.",
        variant: "destructive"
      });
      return;
    }

    onTrainingStart();
    setTrainingProgress(0);
    setTrainingStep('Initializing...');

    try {
      // Create training session
      const trainingData: Omit<TrainingData, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user!.id,
        avatar_id: avatarId,
        training_instructions: trainingInstructions.trim() || undefined,
        training_type: uploadedFiles.length > 0 ? 'file_upload' : 'prompt_update',
        status: 'pending'
      };

      const session = await TrainingService.createTrainingSession(trainingData);
      setCurrentTrainingSession(session);

      // Upload files if any
      const uploadedFileRecords: TrainingFile[] = [];
      if (uploadedFiles.length > 0) {
        setTrainingStep('Uploading files...');
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const fileRecord = await TrainingService.uploadTrainingFile(
            session.id!,
            user!.id,
            file
          );
          uploadedFileRecords.push(fileRecord);
          setTrainingProgress(20 + (i / uploadedFiles.length) * 20);
        }
      }
      setTrainingFiles(uploadedFileRecords);

      // Process training data
      const newVersion = await TrainingService.processTrainingData(
        session.id!,
        user!.id,
        avatarId,
        (step, progress) => {
          setTrainingStep(step);
          setTrainingProgress(Math.max(40, progress));
        }
      );

      setGeneratedVersion(newVersion);
      setTrainingProgress(100);
      setTrainingStep('Training completed!');

      toast({
        title: "Training Complete",
        description: `New prompt version ${newVersion.version_number} has been generated!`,
      });

      // Clear form and localStorage
      setTrainingInstructions('');
      localStorage.removeItem(`training-instructions-${avatarId}`);
      setUploadedFiles([]);
      setCurrentTrainingSession(null);
      setTrainingFiles([]);

      // Reload versions
      await loadPromptVersions();

    } catch (error) {
      console.error('Training error:', error);
      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      onTrainingComplete();
      setTrainingProgress(0);
      setTrainingStep('');
    }
  };

  const activateVersion = async (versionId: string) => {
    try {
      await TrainingService.activatePromptVersion(versionId, avatarId, user!.id);
      await loadActiveVersion();
      await loadPromptVersions();

      toast({
        title: "Version Activated",
        description: "The selected prompt version is now active for your avatar.",
      });
    } catch (error) {
      console.error('Error activating version:', error);
      toast({
        title: "Activation Failed",
        description: "Failed to activate the prompt version.",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Training Interface */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Train Avatar: {avatarName}
          </CardTitle>
          <CardDescription>
            Improve your avatar's personality and communication style with simple instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
              {/* Progress Bar */}
              {isTraining && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Training Progress</span>
                    <span className="text-sm text-muted-foreground">{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{trainingStep}</p>
                </div>
              )}

              {/* Simplified Enhancement Input */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Wand2 className="h-4 w-4" />
                    Conversation Style Training
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Train how your avatar communicates without changing their identity or background.
                  </p>
                  <Textarea
                    placeholder="Describe how you want your avatar to communicate. Examples:
• 'When greeting, be more casual and introduce yourself first'
• 'Use Malaysian slang like lah, lor, and shortforms'
• 'Respond in a more friendly, buddy-like way'
• 'Be more professional in tone'
• 'Use fewer emojis and be more formal'
• 'Ask follow-up questions to keep conversations going'"
                    value={trainingInstructions}
                    onChange={(e) => setTrainingInstructions(e.target.value)}
                    className="min-h-[140px]"
                    disabled={isTraining}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Conversation Examples
                </h4>

                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload conversation screenshots or text files to train your avatar
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTraining}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.txt,.pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports conversation screenshots, text files, and PDFs
                  </p>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isTraining}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Training Button */}
              <Button
                onClick={handleTraining}
                disabled={isTraining}
                className="w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training in Progress...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Improve Avatar
                  </>
                )}
              </Button>

              {/* New Version Preview */}
              {generatedVersion && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    New Version Generated: {generatedVersion.version_number}
                  </h4>
                  <p className="text-sm text-green-800 mb-3">{generatedVersion.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => activateVersion(generatedVersion.id!)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Activate Version
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGeneratedVersion(null)}
                    >
                      <Eye className="mr-2 h-3 w-3" />
                      Review Later
                    </Button>
                  </div>
                </div>
              )}

              {/* Training Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How Smart Learning Works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Describe Changes:</strong> Tell us what you want to improve about your avatar</li>
                  <li>• <strong>Upload Examples:</strong> Share conversation screenshots for the AI to learn from</li>
                  <li>• <strong>AI Enhancement:</strong> Our AI will update your avatar based on your instructions</li>
                  <li>• <strong>Continuous Learning:</strong> Avatar gets better from chat feedback (👍/👎)</li>
                  <li>• <strong>FREE Learning:</strong> No additional costs - learns from every conversation</li>
                </ul>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};