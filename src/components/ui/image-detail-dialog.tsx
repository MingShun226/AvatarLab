import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Heart, Trash2, Image as ImageIcon } from 'lucide-react';
import { GeneratedImage } from '@/services/imageGeneration';

interface ImageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: GeneratedImage | null;
  onDownload: (url: string, id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ImageDetailDialog({
  open,
  onOpenChange,
  image,
  onDownload,
  onToggleFavorite,
  onDelete,
}: ImageDetailDialogProps) {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Details
          </DialogTitle>
          <DialogDescription>
            View full details, metadata, and actions for this generated image
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Preview Section */}
          <div className="space-y-4">
            {/* Show original image if exists */}
            {image.original_image_url && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Original Input Image</h3>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={image.original_image_url}
                    alt="Original input"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Generated image */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                {image.original_image_url ? 'AI Generated Result' : 'Generated Image'}
              </h3>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                <img
                  src={image.image_url}
                  alt={image.prompt}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onDownload(image.image_url, image.id)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onToggleFavorite(image.id)}
              >
                <Heart
                  className={`h-4 w-4 ${
                    image.is_favorite ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
                {image.is_favorite ? 'Unfavorite' : 'Favorite'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  onDelete(image.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Prompt</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {image.prompt}
              </p>
            </div>

            {image.negative_prompt && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Negative Prompt</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {image.negative_prompt}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">AI Provider</h3>
              <Badge variant="outline">{image.provider || 'Unknown'}</Badge>
            </div>

            {image.model && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Model</h3>
                <Badge variant="secondary">{image.model}</Badge>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">Generation Info</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant={image.generation_type === 'img2img' ? 'default' : 'secondary'}>
                    {image.generation_type === 'img2img' ? 'Image-to-Image' : 'Text-to-Image'}
                  </Badge>
                </div>
                {image.width && image.height && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{image.width} × {image.height}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(image.created_at).toLocaleDateString()}</span>
                </div>
                {image.original_image_url && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Has Original:</span>
                    <span className="text-green-600">✓ Yes</span>
                  </div>
                )}
              </div>
            </div>

            {image.parameters && Object.keys(image.parameters).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Parameters</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(image.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-right max-w-[200px] truncate">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
