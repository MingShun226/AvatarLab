
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  History, 
  CheckCircle, 
  Clock, 
  RotateCcw,
  Eye,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Version {
  id: string;
  version: string;
  status: 'Active' | 'Completed';
  description: string;
  accuracy: number;
  improvements: string[];
  timestamp: string;
  trainingType: 'voice' | 'language' | 'visual';
}

interface VersionControlProps {
  avatarId: string;
  isTraining: boolean;
}

export const VersionControl: React.FC<VersionControlProps> = ({ avatarId, isTraining }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load version history for the selected avatar
    const savedVersions = JSON.parse(localStorage.getItem(`avatar_${avatarId}_versions`) || '[]');
    if (savedVersions.length === 0) {
      // Create mock data for demonstration
      const mockVersions: Version[] = [
        {
          id: '1',
          version: 'v2.1.3',
          status: 'Active',
          description: 'Enhanced voice model with improved naturalness',
          accuracy: 94,
          improvements: ['Voice pitch optimization', 'Pronunciation improvements', 'Emotion recognition'],
          timestamp: '2 hours ago',
          trainingType: 'voice'
        },
        {
          id: '2',
          version: 'v2.1.2',
          status: 'Completed',
          description: 'Language model update with personality refinements',
          accuracy: 87,
          improvements: ['Personality trait adjustments', 'Response length optimization', 'Context understanding'],
          timestamp: '1 day ago',
          trainingType: 'language'
        },
        {
          id: '3',
          version: 'v2.1.1',
          status: 'Completed',
          description: 'Visual appearance updates and image generation',
          accuracy: 91,
          improvements: ['Facial feature refinements', 'Lighting improvements', 'Style consistency'],
          timestamp: '3 days ago',
          trainingType: 'visual'
        }
      ];
      setVersions(mockVersions);
      localStorage.setItem(`avatar_${avatarId}_versions`, JSON.stringify(mockVersions));
    } else {
      setVersions(savedVersions);
    }
  }, [avatarId]);

  const handleRevertVersion = (versionId: string) => {
    if (isTraining) {
      toast({
        title: "Cannot Revert",
        description: "Please wait for current training to complete before reverting.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Version Reverted",
      description: "Avatar has been reverted to selected version.",
    });
  };

  const handleViewDetails = (versionId: string) => {
    toast({
      title: "Version Details",
      description: "Detailed training logs and metrics would be displayed here.",
    });
  };

  const getStatusIcon = (status: string) => {
    return status === 'Active' ? 
      <Play className="h-4 w-4" /> : 
      <CheckCircle className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'voice': return 'bg-blue-500';
      case 'language': return 'bg-green-500';
      case 'visual': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
        </CardTitle>
        <CardDescription>
          Chronological view of your avatar's learning journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version) => (
            <div 
              key={version.id} 
              className={`border rounded-lg p-4 ${version.status === 'Active' ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(version.status)}
                    <span className="font-semibold">{version.version}</span>
                  </div>
                  <Badge 
                    variant={version.status === 'Active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {version.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {version.timestamp}
                  </span>
                </div>
              </div>

              <p className="text-sm mb-3">{version.description}</p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Accuracy:</span>
                  <span className="font-medium">{version.accuracy}%</span>
                </div>
                <Progress value={version.accuracy} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {version.improvements.map((improvement, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {improvement}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(version.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {version.status !== 'Active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevertVersion(version.id)}
                    disabled={isTraining}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Revert to this version
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
