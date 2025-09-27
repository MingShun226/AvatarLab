import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  History,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  Play,
  Brain,
  FileText,
  Image,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TrainingService, PromptVersion, TrainingData } from '@/services/trainingService';
import { VersionDetailsModal } from './VersionDetailsModal';

interface DatabaseVersionControlProps {
  avatarId: string;
  isTraining: boolean;
}

export const DatabaseVersionControl: React.FC<DatabaseVersionControlProps> = ({
  avatarId,
  isTraining
}) => {
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<TrainingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<PromptVersion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user && avatarId) {
      loadVersionData();
    }
  }, [user, avatarId]);

  const loadVersionData = async () => {
    setIsLoading(true);
    try {
      // Load prompt versions
      const versions = await TrainingService.getPromptVersions(avatarId, user!.id);
      setPromptVersions(versions);

      // Load active version
      const active = await TrainingService.getActivePromptVersion(avatarId, user!.id);
      setActiveVersion(active);

      // Load training sessions
      const sessions = await TrainingService.getAvatarTrainingSessions(avatarId, user!.id);
      setTrainingSessions(sessions);
    } catch (error) {
      console.error('Error loading version data:', error);
      toast({
        title: "Loading Error",
        description: "Could not load version history. Please ensure the training system is set up.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (isTraining) {
      toast({
        title: "Cannot Activate",
        description: "Please wait for current training to complete before switching versions.",
        variant: "destructive"
      });
      return;
    }

    try {
      await TrainingService.activatePromptVersion(versionId, avatarId, user!.id);
      await loadVersionData(); // Reload to update UI

      toast({
        title: "Version Activated",
        description: "The selected prompt version is now active for your avatar.",
      });
    } catch (error) {
      console.error('Error activating version:', error);
      toast({
        title: "Activation Failed",
        description: "Failed to activate the selected version.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (version: PromptVersion) => {
    setSelectedVersion(version);
    setIsModalOpen(true);
  };

  const handleDeleteVersion = async (version: PromptVersion) => {
    if (isTraining || isDeleting) {
      toast({
        title: "Cannot Delete",
        description: "Please wait for current operations to complete before deleting versions.",
        variant: "destructive"
      });
      return;
    }

    setVersionToDelete(version);
  };

  const confirmDeleteVersion = async () => {
    if (!versionToDelete || !user) return;

    setIsDeleting(true);
    try {
      await TrainingService.deletePromptVersion(versionToDelete.id!, user.id);
      await loadVersionData(); // Reload to update UI
      setVersionToDelete(null);

      toast({
        title: "Version Deleted",
        description: `Version ${versionToDelete.version_number} has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting version:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete the version.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteVersion = () => {
    setVersionToDelete(null);
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ?
      <Play className="h-4 w-4 text-green-600" /> :
      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrainingTypeIcon = (session: TrainingData | undefined) => {
    if (!session) return <Brain className="h-4 w-4" />;

    switch (session.training_type) {
      case 'file_upload':
        return <Image className="h-4 w-4" />;
      case 'conversation_analysis':
        return <FileText className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const calculateAccuracy = (version: PromptVersion): number => {
    // Simple heuristic based on version features
    let score = 70; // Base score

    if (version.personality_traits && version.personality_traits.length > 0) score += 10;
    if (version.behavior_rules && version.behavior_rules.length > 0) score += 10;
    if (version.response_style && Object.keys(version.response_style).length > 0) score += 10;

    return Math.min(score, 95);
  };

  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 animate-pulse" />
            <span>Loading version history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Training Version History
        </CardTitle>
        <CardDescription>
          Track your avatar's training progress and manage prompt versions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{promptVersions.length}</div>
              <div className="text-sm text-muted-foreground">Total Versions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{trainingSessions.length}</div>
              <div className="text-sm text-muted-foreground">Training Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {activeVersion ? activeVersion.version_number : 'Original'}
              </div>
              <div className="text-sm text-muted-foreground">Active Version</div>
            </div>
          </div>

          {/* No versions message */}
          {promptVersions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Training Versions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start training your avatar to create version history
              </p>
              <Button onClick={() => window.location.hash = '#train'}>
                <Brain className="mr-2 h-4 w-4" />
                Start Training
              </Button>
            </div>
          ) : (
            /* Version List */
            promptVersions.map((version) => {
              const isActive = activeVersion?.id === version.id;
              const trainingSession = trainingSessions.find(s => s.id === version.training_data_id);
              const accuracy = calculateAccuracy(version);

              return (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(isActive)}
                        <span className="font-semibold">{version.version_number}</span>
                      </div>
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {isActive ? 'Active' : 'Available'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getTrainingTypeIcon(trainingSession)}
                        <Clock className="h-3 w-3" />
                        {new Date(version.created_at!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm mb-3">
                    {version.description || version.version_name || 'No description available'}
                  </p>

                  {/* Training Quality Score */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Training Quality:</span>
                      <span className="font-medium">{accuracy}%</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {version.personality_traits && version.personality_traits.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {version.personality_traits.length} Personality Traits
                      </Badge>
                    )}
                    {version.behavior_rules && version.behavior_rules.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {version.behavior_rules.length} Behavior Rules
                      </Badge>
                    )}
                    {version.response_style && Object.keys(version.response_style).length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Response Style Configured
                      </Badge>
                    )}
                    {trainingSession && (
                      <Badge variant="outline" className="text-xs">
                        {trainingSession.training_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(version)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateVersion(version.id!)}
                        disabled={isTraining}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Activate Version
                      </Button>
                    )}
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        Currently Active
                      </Badge>
                    )}
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVersion(version)}
                        disabled={isTraining || isDeleting}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Version Control Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Training Quality:</strong> Estimated effectiveness based on prompt features</li>
              <li>• <strong>Version Activation:</strong> Switch between different trained personalities</li>
              <li>• <strong>Safe Rollback:</strong> Return to previous versions or original personality</li>
              <li>• <strong>Training History:</strong> Track what data was used for each version</li>
            </ul>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!versionToDelete} onOpenChange={(open) => !open && cancelDeleteVersion()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Version {versionToDelete?.version_number}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training version? This action cannot be undone.
              {versionToDelete?.description && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Version:</strong> {versionToDelete.description}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteVersion} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVersion}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Version'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Version Details Modal */}
      <VersionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        version={selectedVersion}
        trainingSession={selectedVersion ? trainingSessions.find(s => s.id === selectedVersion.training_data_id) || null : null}
      />
    </Card>
  );
};