
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image, X, Brain, Wand2, FileText, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTrainingInterfaceProps {
  avatarName: string;
  isTraining: boolean;
  onTrainingStart: () => void;
  onTrainingComplete: () => void;
}

export const EnhancedTrainingInterface: React.FC<EnhancedTrainingInterfaceProps> = ({ 
  avatarName, 
  isTraining,
  onTrainingStart,
  onTrainingComplete
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [trainingInstructions, setTrainingInstructions] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleTraining = () => {
    if (!systemPrompt.trim() && !userPrompt.trim() && !trainingInstructions.trim() && uploadedFiles.length === 0) {
      toast({
        title: "No Training Data",
        description: "Please provide training data before starting.",
        variant: "destructive"
      });
      return;
    }

    onTrainingStart();
    
    // Simulate training process
    setTimeout(() => {
      onTrainingComplete();
      toast({
        title: "Training Complete",
        description: `${avatarName}'s model has been updated successfully.`,
      });
      
      // Clear form
      setSystemPrompt('');
      setUserPrompt('');
      setTrainingInstructions('');
      setUploadedFiles([]);
    }, 5000);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Train Avatar: {avatarName}
        </CardTitle>
        <CardDescription>
          Use prompting and file uploads to improve your avatar's responses and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="prompting" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompting">Prompting</TabsTrigger>
            <TabsTrigger value="files">File Upload</TabsTrigger>
          </TabsList>

          {/* Prompting Tab */}
          <TabsContent value="prompting" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  System Prompt
                </h4>
                <Textarea
                  placeholder="Define how your avatar should behave, its personality, and core instructions..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isTraining}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Wand2 className="h-4 w-4" />
                  User Prompt Template
                </h4>
                <Textarea
                  placeholder="Define how user inputs should be processed and responded to..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isTraining}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4" />
                  Training Instructions
                </h4>
                <Textarea
                  placeholder="Provide specific instructions on how to improve the avatar's responses..."
                  value={trainingInstructions}
                  onChange={(e) => setTrainingInstructions(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isTraining}
                />
              </div>
            </div>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload conversation screenshots, documents, or training materials
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
                accept="image/*,.txt,.pdf,.doc,.docx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supports images, text files, and PDFs
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
          </TabsContent>
        </Tabs>

        {/* Training Button */}
        <Button 
          onClick={handleTraining}
          disabled={isTraining}
          className="btn-hero w-full"
        >
          {isTraining ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-spin" />
              Training in Progress...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Start Training
            </>
          )}
        </Button>

        {/* Training Examples */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Training Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use clear system prompts to define personality and behavior</li>
            <li>• Upload conversation examples to train response patterns</li>
            <li>• Provide specific instructions for improvements</li>
            <li>• Test changes in the Test Chat tab after training</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
