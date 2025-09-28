import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  FileText,
  Image,
  Calendar,
  User,
  Settings,
  MessageCircle,
  Target,
  Zap,
  GitBranch,
  ArrowDown,
  ArrowUp,
  GitCompare,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { PromptVersion, TrainingData, TrainingService } from '@/services/trainingService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PromptComparison from './PromptComparison';

interface VersionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: PromptVersion | null;
  trainingSession: TrainingData | null;
  parentVersion?: PromptVersion | null;
  avatarId: string;
  onVersionUpdated?: () => void;
}

export const VersionDetailsModal: React.FC<VersionDetailsModalProps> = ({
  isOpen,
  onClose,
  version,
  trainingSession,
  parentVersion,
  avatarId,
  onVersionUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [parentVersionData, setParentVersionData] = useState<PromptVersion | null>(parentVersion || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOriginalData = async () => {
      if (!version || !user) return;

      try {
        // If this version has a parent, fetch the parent version
        if (version.parent_version_id && !parentVersionData) {
          const allVersions = await TrainingService.getPromptVersions(avatarId, user.id);
          const parent = allVersions.find(v => v.id === version.parent_version_id);
          if (parent) {
            setParentVersionData(parent);
            setOriginalPrompt(parent.system_prompt);
          }
        } else if (parentVersionData) {
          setOriginalPrompt(parentVersionData.system_prompt);
        } else {
          // This is a base version, get the original avatar prompt
          const avatarPrompt = await TrainingService.getAvatarSystemPrompt(avatarId, user.id);
          setOriginalPrompt(avatarPrompt);
        }
      } catch (error) {
        console.error('Error fetching original prompt:', error);
        setOriginalPrompt('Original prompt not available');
      }
    };

    if (isOpen && version) {
      fetchOriginalData();
    }
  }, [isOpen, version, avatarId, user, parentVersionData, version?.parent_version_id]);

  const handleEditStart = () => {
    setEditedPrompt(version?.system_prompt || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedPrompt('');
  };

  const handleEditSave = async () => {
    if (!version || !user || !editedPrompt.trim()) return;

    setIsSaving(true);
    try {
      await TrainingService.updatePromptVersion(version.id!, {
        system_prompt: editedPrompt.trim()
      }, user.id);

      toast({
        title: "Prompt Updated",
        description: "The system prompt has been successfully updated.",
      });

      // Update the version object in place to reflect changes immediately
      if (version) {
        version.system_prompt = editedPrompt.trim();
      }

      setIsEditing(false);
      setEditedPrompt('');

      // Notify parent component to refresh data
      if (onVersionUpdated) {
        onVersionUpdated();
      }

    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!version) return null;

  const responseStyle = version.response_style as any || {};

  const getKeyChanges = () => {
    const changes = [];
    if (version.personality_traits && version.personality_traits.length > 0) {
      changes.push(`Added ${version.personality_traits.length} personality traits: ${version.personality_traits.slice(0, 3).join(', ')}${version.personality_traits.length > 3 ? '...' : ''}`);
    }
    if (version.behavior_rules && version.behavior_rules.length > 0) {
      changes.push(`Defined ${version.behavior_rules.length} behavior rules for consistent responses`);
    }
    if (responseStyle.formality) {
      changes.push(`Set communication style to: ${responseStyle.formality}`);
    }
    if (responseStyle.tone) {
      changes.push(`Adjusted tone to be: ${responseStyle.tone}`);
    }
    return changes;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Version {version.version_number} Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this training version and its capabilities
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Prompt Comparison</TabsTrigger>
            <TabsTrigger value="training">Training Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[calc(85vh-140px)] w-full border rounded-md">
              <div className="p-4">
                {/* System Prompt Only */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      System Prompt
                    </h3>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditStart}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditCancel}
                          disabled={isSaving}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleEditSave}
                          disabled={isSaving || !editedPrompt.trim()}
                          className="flex items-center gap-1"
                        >
                          <Save className="h-3 w-3" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editedPrompt}
                        onChange={(e) => setEditedPrompt(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="Enter the system prompt..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Edit the system prompt to customize how your avatar responds. Changes will take effect immediately.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {version.system_prompt}
                      </pre>
                    </div>
                  )}
                </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="comparison" className="flex-1 min-h-0 mt-4">
        <ScrollArea className="h-[calc(85vh-140px)] w-full border rounded-md">
          <div className="p-4">
            {originalPrompt ? (
              <PromptComparison
              originalPrompt={originalPrompt}
              newPrompt={version.system_prompt}
              versionNumber={version.version_number}
              parentVersionNumber={parentVersionData?.version_number}
              changes={getKeyChanges()}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Loading Comparison...</h3>
                  <p className="text-muted-foreground">
                    Fetching original prompt for comparison
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="training" className="flex-1 min-h-0 mt-4">
        <ScrollArea className="h-[calc(85vh-140px)] w-full border rounded-md">
          <div className="space-y-6 p-4">
            {/* Training Session Details */}
            {trainingSession && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Training Session Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Training Type</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {trainingSession.training_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Session Status</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge
                          variant={
                            trainingSession.status === 'completed' ? 'default' :
                            trainingSession.status === 'failed' ? 'destructive' : 'secondary'
                          }
                        >
                          {trainingSession.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Original Training Instructions */}
                  {trainingSession.training_instructions && (
                    <div>
                      <h4 className="font-medium mb-2">Training Instructions</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{trainingSession.training_instructions}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis Results */}
                  {trainingSession.ai_analysis && (
                    <div>
                      <h4 className="font-medium mb-2">AI Analysis Results</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(trainingSession.ai_analysis, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* AI Improvement Notes */}
                  {trainingSession.ai_improvement_notes && (
                    <div>
                      <h4 className="font-medium mb-2">AI Improvement Notes</h4>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">{trainingSession.ai_improvement_notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!trainingSession && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Training Data</h3>
                <p className="text-muted-foreground">
                  This version was created without a training session
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
      </DialogContent>
    </Dialog>
  );
};