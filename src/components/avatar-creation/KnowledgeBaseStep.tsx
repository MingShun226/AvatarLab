
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Trash2,
  FileText,
  Database,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface KnowledgeFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  file?: File;
}

interface KnowledgeBaseStepProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  avatarId?: string;
}

export const KnowledgeBaseStep: React.FC<KnowledgeBaseStepProps> = ({ 
  data, 
  onUpdate, 
  avatarId 
}) => {
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(data.knowledgeFiles || []);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<KnowledgeFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing files from database if editing an avatar
  React.useEffect(() => {
    if (avatarId && user) {
      loadExistingFiles();
    }
  }, [avatarId, user]);

  const loadExistingFiles = async () => {
    if (!avatarId || !user) return;
    
    setIsLoading(true);
    try {
      const { data: files, error } = await supabase
        .from('avatar_knowledge_files')
        .select('*')
        .eq('avatar_id', avatarId)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error loading existing files:', error);
        return;
      }

      if (files) {
        const formattedFiles = files.map(file => ({
          id: file.id,
          name: file.file_name,
          size: `${(file.file_size / (1024 * 1024)).toFixed(2)} MB`,
          type: 'PDF',
          uploadedAt: file.uploaded_at
        }));
        
        setKnowledgeFiles(formattedFiles);
        onUpdate('knowledgeFiles', formattedFiles);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const pdfFiles = files.filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are allowed in the knowledge base.",
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes (50MB limit)
    const oversizedFiles = pdfFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File Too Large",
        description: `Files must be under 50MB. ${oversizedFiles.map(f => f.name).join(', ')} exceeded the limit.`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const newFiles: KnowledgeFile[] = [];

      for (const file of pdfFiles) {
        let filePath = '';
        let fileId = '';

        // If editing existing avatar, upload to storage and database
        if (avatarId && user) {
          const fileName = `${user.id}/${avatarId}/${Date.now()}-${file.name}`;
          
          const { data: storageData, error: storageError } = await supabase.storage
            .from('knowledge-base')
            .upload(fileName, file);

          if (storageError) {
            throw new Error(`Failed to upload ${file.name}: ${storageError.message}`);
          }

          const { data: dbData, error: dbError } = await supabase
            .from('avatar_knowledge_files')
            .insert({
              avatar_id: avatarId,
              user_id: user.id,
              file_name: file.name,
              original_name: file.name,
              file_path: storageData.path,
              file_size: file.size,
              content_type: file.type || 'application/pdf',
              is_linked: true
            })
            .select()
            .single();

          if (dbError) {
            // Clean up uploaded file
            await supabase.storage.from('knowledge-base').remove([fileName]);
            throw new Error(`Failed to save ${file.name} metadata: ${dbError.message}`);
          }

          fileId = dbData.id;
          filePath = storageData.path;
        } else {
          // For new avatar creation, just store temporarily
          fileId = `temp-${Date.now()}-${Math.random()}`;
        }

        const knowledgeFile: KnowledgeFile = {
          id: fileId,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: 'PDF',
          uploadedAt: new Date().toISOString(),
          file: avatarId ? undefined : file // Keep file reference for new avatars
        };

        newFiles.push(knowledgeFile);
      }

      const updatedFiles = [...knowledgeFiles, ...newFiles];
      setKnowledgeFiles(updatedFiles);
      onUpdate('knowledgeFiles', updatedFiles);

      toast({
        title: "Upload Successful",
        description: `${newFiles.length} file(s) uploaded successfully.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during upload.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (file: KnowledgeFile) => {
    if (!avatarId || file.id.startsWith('temp-')) {
      toast({
        title: "Download Not Available",
        description: "File download is only available for saved avatars.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: fileData, error } = await supabase
        .from('avatar_knowledge_files')
        .select('file_path')
        .eq('id', file.id)
        .single();

      if (error || !fileData) {
        throw new Error('File not found');
      }

      const { data: blob, error: downloadError } = await supabase.storage
        .from('knowledge-base')
        .download(fileData.file_path);

      if (downloadError) {
        throw new Error(downloadError.message);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file.",
        variant: "destructive"
      });
    }
  };

  const confirmDelete = (file: KnowledgeFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      // If it's an existing file in database, delete from storage and database
      if (avatarId && !fileToDelete.id.startsWith('temp-')) {
        const { data: fileData } = await supabase
          .from('avatar_knowledge_files')
          .select('file_path')
          .eq('id', fileToDelete.id)
          .single();

        const { error: dbError } = await supabase
          .from('avatar_knowledge_files')
          .delete()
          .eq('id', fileToDelete.id)
          .eq('user_id', user?.id);

        if (dbError) {
          throw new Error(dbError.message);
        }

        if (fileData?.file_path) {
          await supabase.storage
            .from('knowledge-base')
            .remove([fileData.file_path]);
        }
      }

      // Update local state
      const updatedFiles = knowledgeFiles.filter(file => file.id !== fileToDelete.id);
      setKnowledgeFiles(updatedFiles);
      onUpdate('knowledgeFiles', updatedFiles);
      
      toast({
        title: "File Deleted",
        description: `${fileToDelete.name} has been removed.`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive"
      });
    }
    
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  return (
    <>
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                Upload PDF documents to give your avatar specialized knowledge
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {knowledgeFiles.length} files
              </Badge>
              {avatarId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadExistingFiles}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="space-y-4">
            {/* Upload Area - Show when no files */}
            {knowledgeFiles.length === 0 && !isLoading && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload Knowledge Documents</h3>
                <p className="text-muted-foreground mb-4">
                  Add PDF documents to give your avatar specialized knowledge
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-hero"
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Choose PDF Files'}
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading knowledge files...</span>
              </div>
            )}

            {/* Files List */}
            {knowledgeFiles.length > 0 && !isLoading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Knowledge Documents ({knowledgeFiles.length})</h4>
                  {isUploading && (
                    <Badge variant="destructive" className="text-xs">
                      Upload in progress
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  {knowledgeFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default" className="text-xs">
                              Linked
                            </Badge>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmDelete(file)}
                          disabled={isUploading}
                          className="text-destructive hover:text-destructive"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Knowledge Base Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload PDF documents that contain information you want your avatar to reference</li>
                <li>• Files are automatically linked and available to your avatar during conversations</li>
                <li>• Maximum file size: 50MB per PDF</li>
                <li>• {avatarId ? 'Files are saved to your avatar immediately' : 'Files will be saved when you create the avatar'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Knowledge File"
        description="Are you sure you want to permanently delete"
        itemName={fileToDelete?.name}
      />
    </>
  );
};
