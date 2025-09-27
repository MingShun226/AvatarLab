
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  Pause,
  RotateCcw,
  TrendingUp,
  Activity
} from 'lucide-react';

interface LearningVersion {
  id: string;
  version: string;
  timestamp: string;
  description: string;
  status: 'active' | 'completed' | 'training';
  accuracy: number;
  changes: string[];
}

const LearningPathSection = () => {
  const learningVersions: LearningVersion[] = [
    {
      id: '1',
      version: 'v2.1.3',
      timestamp: '2 hours ago',
      description: 'Enhanced voice model with improved naturalness',
      status: 'active',
      accuracy: 94,
      changes: ['Voice pitch optimization', 'Pronunciation improvements', 'Emotion recognition']
    },
    {
      id: '2',
      version: 'v2.1.2',
      timestamp: '1 day ago',
      description: 'Language model update with personality refinements',
      status: 'completed',
      accuracy: 87,
      changes: ['Personality trait adjustments', 'Response length optimization', 'Context understanding']
    },
    {
      id: '3',
      version: 'v2.1.1',
      timestamp: '3 days ago',
      description: 'Visual appearance updates and image generation',
      status: 'completed',
      accuracy: 91,
      changes: ['Facial feature refinements', 'Lighting improvements', 'Style consistency']
    },
    {
      id: '4',
      version: 'v2.1.0',
      timestamp: '1 week ago',
      description: 'Major personality overhaul with new training data',
      status: 'training',
      accuracy: 78,
      changes: ['Core personality restructure', 'New training dataset', 'Behavior pattern updates']
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      case 'training':
        return <PlayCircle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="learning-path-gradient text-white">Active</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'training':
        return <Badge variant="secondary">Training</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <GitBranch className="h-6 w-6" />
            Learning Path
          </h1>
          <p className="text-muted-foreground">
            Track your avatar's learning progress and version history
          </p>
        </div>
        <Badge variant="outline" className="learning-path-gradient text-white">
          Version Control System
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Version
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v2.1.3</div>
            <p className="text-xs text-muted-foreground">
              94% accuracy score
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Versions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              Since creation
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127h</div>
            <p className="text-xs text-muted-foreground">
              +8h this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Path Timeline */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            Chronological view of your avatar's learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {learningVersions.map((version, index) => (
              <div key={version.id} className="relative">
                {/* Timeline Line */}
                {index < learningVersions.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                )}
                
                <div className="flex gap-4">
                  {/* Timeline Dot */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(version.status)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{version.version}</h4>
                        {getStatusBadge(version.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">{version.timestamp}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{version.description}</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Accuracy:</span>
                        <div className="flex items-center gap-1">
                          <Progress value={version.accuracy} className="w-16 h-2" />
                          <span className="text-xs font-medium">{version.accuracy}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {version.changes.map((change, changeIndex) => (
                        <Badge key={changeIndex} variant="outline" className="text-xs">
                          {change}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {version.status !== 'active' && (
                        <Button variant="outline" size="sm">
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Revert to this version
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Track your avatar's learning performance over time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Language Processing</span>
                <span className="text-sm font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Voice Synthesis</span>
                <span className="text-sm font-medium">91%</span>
              </div>
              <Progress value={91} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Personality Consistency</span>
                <span className="text-sm font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Visual Generation</span>
                <span className="text-sm font-medium">89%</span>
              </div>
              <Progress value={89} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your avatar's learning process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full btn-hero">
              <PlayCircle className="mr-2 h-4 w-4" />
              Start New Training Session
            </Button>
            
            <Button variant="outline" className="w-full">
              <Pause className="mr-2 h-4 w-4" />
              Pause Current Training
            </Button>
            
            <Button variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Previous Version
            </Button>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Training Schedule</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Next Training</span>
                  <span className="text-muted-foreground">Tomorrow 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Training</span>
                  <Badge variant="outline" className="text-xs">Enabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Backup Frequency</span>
                  <span className="text-muted-foreground">Daily</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningPathSection;
