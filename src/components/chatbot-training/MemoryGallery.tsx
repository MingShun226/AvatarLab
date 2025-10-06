import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Upload,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Users,
  Activity,
  Coffee,
  Heart,
  Trash2,
  Eye,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MemoryService, AvatarMemory } from '@/services/memoryService';

interface MemoryGalleryProps {
  avatarId: string;
  avatarName: string;
}

export const MemoryGallery: React.FC<MemoryGalleryProps> = ({ avatarId, avatarName }) => {
  const [memories, setMemories] = useState<AvatarMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<AvatarMemory | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Upload form state - Support multiple images
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [memoryContext, setMemoryContext] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user && avatarId) {
      loadMemories();
    }
  }, [user, avatarId]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const data = await MemoryService.getAvatarMemories(avatarId, user!.id);
      setMemories(data);
    } catch (error) {
      console.error('Error loading memories:', error);
      toast({
        title: "Error",
        description: "Failed to load memories.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    const oversizedFiles = files.filter(f => f.size > maxSize);

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid Files",
        description: "Please upload image files only.",
        variant: "destructive"
      });
      return;
    }

    if (oversizedFiles.length > 0) {
      toast({
        title: "Files Too Large",
        description: "Each image must be smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Limit to 10 images
    if (uploadFiles.length + files.length > 10) {
      toast({
        title: "Too Many Images",
        description: "You can upload up to 10 images per memory.",
        variant: "destructive"
      });
      return;
    }

    // Add new files to existing ones
    setUploadFiles(prev => [...prev, ...files]);

    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setUploadPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !memoryTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select at least one photo.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      // Use multi-image creation if more than one image
      const memory = await MemoryService.createMemoryFromPhotos(
        uploadFiles,
        user!.id,
        avatarId,
        memoryTitle,
        memoryDate,
        memoryContext || undefined
      );

      toast({
        title: "Memory Created",
        description: `${memory.title} with ${uploadFiles.length} ${uploadFiles.length > 1 ? 'photos' : 'photo'} has been added to ${avatarName}'s memories!`,
      });

      // Reset form
      setUploadFiles([]);
      setUploadPreviews([]);
      setMemoryTitle('');
      setMemoryDate(new Date().toISOString().split('T')[0]);
      setMemoryContext('');
      setShowUploadDialog(false);

      // Reload memories
      await loadMemories();

    } catch (error) {
      console.error('Error creating memory:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to create memory.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory? This cannot be undone.')) {
      return;
    }

    try {
      await MemoryService.deleteMemory(memoryId, user!.id);
      toast({
        title: "Memory Deleted",
        description: "The memory has been removed.",
      });
      await loadMemories();
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({
        title: "Error",
        description: "Failed to delete memory.",
        variant: "destructive"
      });
    }
  };

  const toggleFavorite = async (memory: AvatarMemory) => {
    try {
      await MemoryService.updateMemory(memory.id!, { is_favorite: !memory.is_favorite });
      await loadMemories();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Memory Gallery - {avatarName}
              </CardTitle>
              <CardDescription>
                Upload photos to give your avatar visual memories they can reference in conversations
              </CardDescription>
            </div>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Memory
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Memory Photos</DialogTitle>
                  <DialogDescription>
                    Upload one or multiple photos - AI will analyze them to create a memory for your avatar
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pb-4">
                  {/* File Upload */}
                  <div>
                    <Label>Photos ({uploadFiles.length}/10)</Label>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadPreviews.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {uploadPreviews.map((preview, idx) => (
                            <div key={idx} className="relative group">
                              <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(idx);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {idx === 0 && (
                                <Badge className="absolute bottom-1 left-1 text-xs">Primary</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload photos</p>
                          <p className="text-xs text-muted-foreground mt-1">You can select multiple images at once</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Memory Details */}
                  <div>
                    <Label htmlFor="title">Memory Title *</Label>
                    <Input
                      id="title"
                      value={memoryTitle}
                      onChange={(e) => setMemoryTitle(e.target.value)}
                      placeholder="e.g., Dinner at Italian Restaurant"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">When did this happen? *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={memoryDate}
                      onChange={(e) => setMemoryDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="context">Additional Context (Optional)</Label>
                    <Textarea
                      id="context"
                      value={memoryContext}
                      onChange={(e) => setMemoryContext(e.target.value)}
                      placeholder="e.g., Celebrating Mom's birthday with family. We had amazing pasta!"
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>How it works:</strong> Our AI will analyze your {uploadFiles.length > 1 ? 'photos' : 'photo'} to extract details like location, food items, activities, and mood. Your avatar will then be able to naturally reference this memory in conversations!
                    </p>
                    {uploadFiles.length > 1 && (
                      <p className="text-xs text-blue-800 mt-2">
                        📸 Uploading {uploadFiles.length} photos - the first photo will be analyzed and used as the primary memory image.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading || uploadFiles.length === 0 || !memoryTitle.trim()}>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Memory...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Memory {uploadFiles.length > 0 && `(${uploadFiles.length})`}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Memories Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start uploading photos to give {avatarName} visual memories!
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload First Memory
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memories.map((memory) => (
                <Card key={memory.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video">
                    <img
                      src={memory.image_url}
                      alt={memory.title}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => toggleFavorite(memory)}
                    >
                      <Heart
                        className={`h-4 w-4 ${memory.is_favorite ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">{memory.title}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {memory.memory_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(memory.memory_date).toLocaleDateString()}
                        </div>
                      )}
                      {memory.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {memory.location}
                        </div>
                      )}
                      {memory.food_items && memory.food_items.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4" />
                          {memory.food_items.slice(0, 2).join(', ')}
                          {memory.food_items.length > 2 && ` +${memory.food_items.length - 2} more`}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {memory.memory_summary}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedMemory(memory)}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMemory(memory.id!)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memory Details Dialog */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedMemory && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMemory.title}</DialogTitle>
                <DialogDescription>
                  {new Date(selectedMemory.memory_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <img
                  src={selectedMemory.image_url}
                  alt={selectedMemory.title}
                  className="w-full rounded-lg"
                />

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedMemory.memory_description}</p>
                </div>

                {selectedMemory.location && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </h4>
                    <p className="text-sm">{selectedMemory.location}</p>
                  </div>
                )}

                {selectedMemory.people_present && selectedMemory.people_present.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      People Present
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.people_present.map((person, idx) => (
                        <Badge key={idx} variant="outline">{person}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMemory.activities && selectedMemory.activities.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.activities.map((activity, idx) => (
                        <Badge key={idx} variant="secondary">{activity}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMemory.food_items && selectedMemory.food_items.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Coffee className="h-4 w-4" />
                      Food & Drinks
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.food_items.map((item, idx) => (
                        <Badge key={idx}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMemory.conversational_hooks && selectedMemory.conversational_hooks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">How Avatar References This</h4>
                    <div className="space-y-1">
                      {selectedMemory.conversational_hooks.map((hook, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground italic">
                          "{hook}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
