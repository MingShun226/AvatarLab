/**
 * Prompt Modification Interface
 * Direct prompt editing through natural language instructions
 * Shows current prompt and allows targeted modifications
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Textarea } from '../../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  EyeOff,
  Loader2,
  Wand2,
  Info,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { TrainingService } from '../../../services/trainingService';

interface PromptModificationInterfaceProps {
  avatarId: string;
  avatarName: string;
  userId: string;
  onModificationComplete?: () => void;
}

export function PromptModificationInterface({
  avatarId,
  avatarName,
  userId,
  onModificationComplete
}: PromptModificationInterfaceProps) {
  const { toast } = useToast();

  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [promptSource, setPromptSource] = useState<'active_version' | 'base_prompt'>('base_prompt');
  const [activeVersionInfo, setActiveVersionInfo] = useState<string>('');
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [modificationInstructions, setModificationInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  useEffect(() => {
    loadCurrentPrompt();
  }, [avatarId, userId]);

  const loadCurrentPrompt = async () => {
    try {
      setIsLoadingPrompt(true);

      // First try to get the active version
      const activeVersion = await TrainingService.getActivePromptVersion(avatarId, userId);

      if (activeVersion && activeVersion.system_prompt) {
        // Use active version's prompt
        setCurrentPrompt(activeVersion.system_prompt);
        setPromptSource('active_version');
        setActiveVersionInfo(`${activeVersion.version_number} - ${activeVersion.version_name || 'Active Version'}`);
      } else {
        // Fallback to base avatar prompt if no active version
        const basePrompt = await TrainingService.getAvatarSystemPrompt(avatarId, userId);
        setCurrentPrompt(basePrompt);
        setPromptSource('base_prompt');
        setActiveVersionInfo('');
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast({
        title: "Error",
        description: "Failed to load current prompt",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleApplyModification = async () => {
    if (!modificationInstructions.trim()) {
      toast({
        title: "No Instructions",
        description: "Please describe what changes you want to make",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Analyzing modification request...');

    try {
      // Create a training session for prompt modification
      const trainingData = await TrainingService.createTrainingSession({
        user_id: userId,
        avatar_id: avatarId,
        training_type: 'prompt_update',
        training_instructions: modificationInstructions,
        status: 'pending'
      });

      setProcessingStep('Applying targeted modifications...');

      // Process the modification (this will call our new surgical edit logic)
      const result = await TrainingService.applyPromptModification(
        trainingData.id,
        userId,
        avatarId,
        modificationInstructions,
        currentPrompt
      );

      toast({
        title: "Modifications Applied!",
        description: `Your prompt has been updated with targeted changes.`,
      });

      // Reload the prompt to show changes
      await loadCurrentPrompt();

      // Clear the input
      setModificationInstructions('');

      onModificationComplete?.();

    } catch (error: any) {
      console.error('Modification error:', error);
      toast({
        title: "Modification Failed",
        description: error.message || "Failed to apply modifications",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const promptPreview = currentPrompt.substring(0, 300);
  const hasMore = currentPrompt.length > 300;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">Modify {avatarName}'s Prompt</h2>
        <p className="text-gray-600 mt-2">
          Make targeted changes to your avatar's system prompt
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>How it works:</strong> Describe the specific changes you want to make (e.g., "Make the backstory more detailed",
          "Change personality to be more friendly", "Update age to 25"). The AI will make surgical edits to only the sections you mention.
        </AlertDescription>
      </Alert>

      {/* Current Prompt Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Current System Prompt
                {promptSource === 'active_version' ? (
                  <Badge className="ml-2 bg-green-600">Active Version</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2">Base Prompt</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {promptSource === 'active_version'
                  ? `Showing: ${activeVersionInfo}`
                  : 'Showing base avatar prompt (no trained versions active)'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullPrompt(!showFullPrompt)}
            >
              {showFullPrompt ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Full
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPrompt ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading prompt...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                  {showFullPrompt ? currentPrompt : promptPreview}
                  {!showFullPrompt && hasMore && (
                    <span className="text-gray-500">... ({currentPrompt.length} characters total)</span>
                  )}
                </pre>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{currentPrompt.length} characters • {currentPrompt.split('\n').length} lines</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadCurrentPrompt}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modification Instructions */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            Modification Instructions
          </CardTitle>
          <CardDescription>
            Describe what specific changes you want to make to the prompt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              What would you like to change?
            </label>
            <Textarea
              value={modificationInstructions}
              onChange={(e) => setModificationInstructions(e.target.value)}
              placeholder="Examples:&#10;• 'Change the backstory - make them a software engineer from California'&#10;• 'Update personality to be more outgoing and friendly'&#10;• 'Make them younger, around 22 years old'&#10;• 'Add that they love hiking and outdoor activities'&#10;• 'Change communication style to be more professional'"
              className="w-full h-32 resize-none"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific about what you want to change. The AI will only modify the sections you mention.
            </p>
          </div>

          {/* Examples Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-900 text-sm mb-2">Example Modifications:</p>
            <div className="space-y-2 text-xs text-blue-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Backstory Change:</strong> "Make them a doctor who graduated from Harvard and now works in pediatrics"
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Personality Update:</strong> "Make them more introverted and thoughtful, less spontaneous"
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Multiple Changes:</strong> "Update age to 28, change location to Tokyo, and add passion for photography"
                </div>
              </div>
            </div>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-900 font-medium">{processingStep}</span>
              </div>
            </div>
          )}

          {/* Apply Button */}
          <Button
            onClick={handleApplyModification}
            disabled={isProcessing || !modificationInstructions.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Applying Modifications...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Apply Targeted Modifications
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
            <AlertCircle className="w-4 h-4" />
            <span>Only the sections you mention will be modified. Everything else stays the same.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
