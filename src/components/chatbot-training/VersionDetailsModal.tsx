import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  FileText,
  Image,
  Calendar,
  User,
  Settings,
  MessageSquare,
  Target,
  Zap,
  GitBranch,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { PromptVersion, TrainingData } from '@/services/trainingService';

interface VersionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: PromptVersion | null;
  trainingSession: TrainingData | null;
}

export const VersionDetailsModal: React.FC<VersionDetailsModalProps> = ({
  isOpen,
  onClose,
  version,
  trainingSession
}) => {
  if (!version) return null;

  const responseStyle = version.response_style as any || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Version {version.version_number} Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this training version and its capabilities
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Version Information
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Version Number</div>
                  <div className="text-sm text-muted-foreground">{version.version_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Version Name</div>
                  <div className="text-sm text-muted-foreground">
                    {version.version_name || 'No name provided'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(version.created_at!).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="text-sm">
                    <Badge variant={version.is_active ? "default" : "secondary"}>
                      {version.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Version Lineage */}
            {(version.parent_version_id || version.inheritance_type) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Version Lineage
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Inheritance Type:</span>
                    <Badge variant="outline">
                      {version.inheritance_type?.toUpperCase() || 'FULL'}
                    </Badge>
                  </div>
                  {version.parent_version_id && (
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-3 w-3" />
                      <span className="text-sm">Built upon a previous version</span>
                    </div>
                  )}
                  {!version.parent_version_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Base version (created from original avatar data)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Changes from Parent */}
            {version.changes_from_parent && Object.keys(version.changes_from_parent).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Changes from Previous Version
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(version.changes_from_parent, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Description */}
            {version.description && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">{version.description}</p>
                </div>
              </div>
            )}

            {/* System Prompt */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Generated System Prompt
              </h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {version.system_prompt}
                </pre>
              </div>
            </div>

            {/* Personality Traits */}
            {version.personality_traits && version.personality_traits.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personality Traits ({version.personality_traits.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {version.personality_traits.map((trait, index) => (
                    <Badge key={index} variant="outline">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Behavior Rules */}
            {version.behavior_rules && version.behavior_rules.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Behavior Rules ({version.behavior_rules.length})
                </h3>
                <div className="space-y-2">
                  {version.behavior_rules.map((rule, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Style */}
            {Object.keys(responseStyle).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Response Style Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  {responseStyle.formality && (
                    <div>
                      <div className="text-sm font-medium">Formality Level</div>
                      <div className="text-sm text-muted-foreground">{responseStyle.formality}</div>
                    </div>
                  )}
                  {responseStyle.tone && (
                    <div>
                      <div className="text-sm font-medium">Tone</div>
                      <div className="text-sm text-muted-foreground">{responseStyle.tone}</div>
                    </div>
                  )}
                  {responseStyle.emoji_usage && (
                    <div>
                      <div className="text-sm font-medium">Emoji Usage</div>
                      <div className="text-sm text-muted-foreground">{responseStyle.emoji_usage}</div>
                    </div>
                  )}
                  {responseStyle.response_length && (
                    <div>
                      <div className="text-sm font-medium">Response Length</div>
                      <div className="text-sm text-muted-foreground">{responseStyle.response_length}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Training Session Details */}
            {trainingSession && (
              <>
                <Separator />
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

                    {/* Original System Prompt Input */}
                    {trainingSession.system_prompt && (
                      <div>
                        <h4 className="font-medium mb-2">System Prompt Enhancement Input</h4>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {trainingSession.system_prompt}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* User Prompt Template */}
                    {trainingSession.user_prompt_template && (
                      <div>
                        <h4 className="font-medium mb-2">User Prompt Template</h4>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {trainingSession.user_prompt_template}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* AI Analysis Results */}
                    {trainingSession.analysis_results && (
                      <div>
                        <h4 className="font-medium mb-2">AI Analysis Results</h4>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {JSON.stringify(trainingSession.analysis_results, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Improvement Notes */}
                    {trainingSession.improvement_notes && (
                      <div>
                        <h4 className="font-medium mb-2">AI Improvement Notes</h4>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">{trainingSession.improvement_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Usage Statistics */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Usage Statistics
              </h3>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Usage Count</div>
                  <div className="text-sm text-muted-foreground">{version.usage_count || 0}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Rating</div>
                  <div className="text-sm text-muted-foreground">
                    {version.rating ? `${version.rating}/5` : 'Not rated'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Published</div>
                  <div className="text-sm text-muted-foreground">
                    {version.is_published ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};