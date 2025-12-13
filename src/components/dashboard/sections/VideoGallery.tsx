import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, Download, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserVideos, deleteVideo, type GeneratedVideo } from '@/services/videoGeneration';
import { supabase } from '@/integrations/supabase/client';

const VideoGallery = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadVideos = async (showToast = false) => {
    try {
      const userVideos = await getUserVideos();
      setVideos(userVideos);

      if (showToast) {
        toast({
          title: "Videos refreshed",
          description: `Loaded ${userVideos.length} video(s)`,
        });
      }
    } catch (error: any) {
      console.error('Error loading videos:', error);
      toast({
        title: "Failed to load videos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const triggerPoll = async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      // Call poll-video-status edge function
      await fetch(
        `${supabase.supabaseUrl}/functions/v1/poll-video-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error triggering poll:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await triggerPoll();
    await loadVideos(true);
  };

  const handlePasteVideoUrl = async (video: GeneratedVideo) => {
    const videoUrl = prompt('Paste the video URL from your KIE.AI logs:\n\nExample: https://tempfile.aiquickdraw.com/v/...\n\nNote: Remove the brackets if you copied ["url"]');

    if (!videoUrl) return;

    // Clean URL - remove brackets and quotes if present
    let cleanUrl = videoUrl.trim();
    if (cleanUrl.startsWith('["') && cleanUrl.endsWith('"]')) {
      cleanUrl = cleanUrl.slice(2, -2);
    } else if (cleanUrl.startsWith('[') && cleanUrl.endsWith(']')) {
      try {
        const parsed = JSON.parse(cleanUrl);
        cleanUrl = Array.isArray(parsed) ? parsed[0] : cleanUrl;
      } catch (e) {
        // Not valid JSON, use as is
      }
    }

    if (!cleanUrl.startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "Please paste a valid video URL starting with http",
        variant: "destructive",
      });
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      toast({
        title: "Setting video URL...",
        description: "Updating video in database",
      });

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/manual-set-video-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId: video.id,
            videoUrl: cleanUrl,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Video URL set!",
          description: "Video is now ready to watch",
        });
        await loadVideos();
      } else {
        toast({
          title: "Failed to set URL",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to set URL",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDebugResponse = async (video: GeneratedVideo) => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      toast({
        title: "Debugging KIE.AI response...",
        description: "Check browser console for details",
      });

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/debug-kie-response`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: video.task_id,
            provider: video.provider,
          }),
        }
      );

      const result = await response.json();
      console.log('=== KIE.AI DEBUG RESPONSE ===');
      console.log('Task ID:', video.task_id);
      console.log('Provider:', video.provider);
      console.log('Results:', result);
      console.log('===========================');

      alert(`Debug complete! Check:\n1. Browser console (F12)\n2. Supabase logs: https://supabase.com/dashboard/project/xatrtqdgghanwdujyhkq/functions/debug-kie-response/logs\n\nLook for the exact API response format.`);
    } catch (error: any) {
      console.error('Debug error:', error);
      toast({
        title: "Debug failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManualUpdate = async (video: GeneratedVideo) => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      toast({
        title: "Checking video status...",
        description: "Manually updating from KIE.AI",
      });

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/manual-update-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId: video.id,
            taskId: video.task_id,
            provider: video.provider,
          }),
        }
      );

      const result = await response.json();
      console.log('Manual update result:', result);

      if (result.success) {
        toast({
          title: "Status updated!",
          description: "Video status has been refreshed",
        });
        await loadVideos();
      } else {
        toast({
          title: "Update info",
          description: result.message || "Video is still processing",
        });
      }
    } catch (error: any) {
      console.error('Manual update error:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await deleteVideo(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
      toast({
        title: "Video deleted",
        description: "Video has been removed from your gallery",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete video",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadVideos();

    // Auto-refresh every 10 seconds if there are processing videos
    const interval = setInterval(async () => {
      const hasProcessing = videos.some(v => v.status === 'processing');
      if (hasProcessing) {
        await triggerPoll();
        await loadVideos();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [videos]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Play className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Generate your first video using the Generate tab
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Video Gallery</h2>
          <p className="text-muted-foreground">
            {videos.length} video(s) - {videos.filter(v => v.status === 'processing').length} processing
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {/* Video Preview or Processing State */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                {video.status === 'completed' && video.video_url ? (
                  <video
                    src={video.video_url}
                    className="w-full h-full object-cover"
                    controls
                    poster={video.thumbnail_url}
                  />
                ) : video.status === 'processing' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">Generating...</p>
                      <p className="text-xs text-muted-foreground">
                        This may take a few minutes
                      </p>
                    </div>
                    {video.progress > 0 && (
                      <Progress value={video.progress} className="w-full" />
                    )}
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManualUpdate(video)}
                          className="flex-1"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Check Status
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDebugResponse(video)}
                          className="flex-1"
                        >
                          🐛 Debug
                        </Button>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePasteVideoUrl(video)}
                        className="w-full"
                      >
                        📋 Paste Video URL
                      </Button>
                    </div>
                  </div>
                ) : video.status === 'failed' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                    <p className="text-sm font-medium text-destructive">Generation Failed</p>
                    <p className="text-xs text-center text-muted-foreground">
                      {video.error_message || 'Unknown error'}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Video Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-2 flex-1">{video.prompt}</p>
                  <Badge variant={
                    video.status === 'completed' ? 'default' :
                    video.status === 'processing' ? 'secondary' :
                    'destructive'
                  }>
                    {video.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{video.provider.replace('kie-', '')}</span>
                  <span>•</span>
                  <span>{video.aspect_ratio}</span>
                  <span>•</span>
                  <span>{video.duration}s</span>
                </div>

                {/* Actions */}
                {video.status === 'completed' && video.video_url && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(video.video_url, '_blank')}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Watch
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = video.video_url!;
                        a.download = `video-${video.id}.mp4`;
                        a.click();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {video.status === 'failed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VideoGallery;
