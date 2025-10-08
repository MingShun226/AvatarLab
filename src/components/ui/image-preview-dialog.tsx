import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, RefreshCw, Download } from 'lucide-react';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  prompt: string;
  provider: string;
  onSave: () => void;
  onImprove: () => void;
  onDiscard: () => void;
  onDownload: () => void;
  isSaving?: boolean;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  prompt,
  provider,
  onSave,
  onImprove,
  onDiscard,
  onDownload,
  isSaving = false,
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generated Image Preview</DialogTitle>
          <DialogDescription>
            Review your image and choose what to do next
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative aspect-square w-full max-w-2xl mx-auto overflow-hidden rounded-lg border bg-muted">
            <img
              src={imageUrl}
              alt="Generated preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prompt</p>
              <p className="text-sm">{prompt}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Provider</p>
              <Badge variant="outline">{provider}</Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={onDiscard}
            disabled={isSaving}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Discard
          </Button>
          <Button
            variant="outline"
            onClick={onDownload}
            disabled={isSaving}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="secondary"
            onClick={onImprove}
            disabled={isSaving}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Improve
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save to Gallery'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
