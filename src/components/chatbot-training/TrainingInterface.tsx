
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, X, Brain, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrainingInterfaceProps {
  avatarName: string;
}

export const TrainingInterface: React.FC<TrainingInterfaceProps> = ({ avatarName }) => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [trainingPrompt, setTrainingPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Please upload image files only.",
        variant: "destructive"
      });
      return;
    }

    setUploadedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTraining = () => {
    if (!trainingPrompt.trim() && uploadedImages.length === 0) {
      toast({
        title: "No Training Data",
        description: "Please provide training prompt or upload images.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate training process
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Training Complete",
        description: `${avatarName}'s prompts have been updated successfully.`,
      });
      
      // Clear form
      setTrainingPrompt('');
      setUploadedImages([]);
    }, 3000);
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Train Avatar: {avatarName}
        </CardTitle>
        <CardDescription>
          Upload conversation screenshots or provide training prompts to improve your avatar's responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Image className="h-4 w-4" />
            Upload Conversation Screenshots
          </h3>
          
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload WhatsApp or other conversation screenshots
            </p>
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Uploaded Images ({uploadedImages.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isProcessing}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Training Prompt Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Training Instructions
          </h3>
          <Textarea
            placeholder="Example: 'Please study these conversation screenshots and update the system prompt to be more casual and friendly' or 'Use less emoji while speaking and be more professional'"
            value={trainingPrompt}
            onChange={(e) => setTrainingPrompt(e.target.value)}
            className="min-h-[120px]"
            disabled={isProcessing}
          />
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleTraining}
          disabled={isProcessing}
          className="btn-hero w-full"
        >
          {isProcessing ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-spin" />
              Processing Training Data...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Update Avatar Prompts
            </>
          )}
        </Button>

        {/* Training Examples */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Training Examples</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• "Please study these conversation screenshots and set it into rules"</li>
            <li>• "Use less emoji while you speak"</li>
            <li>• "Be more professional in business conversations"</li>
            <li>• "Add more personality and humor to responses"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
