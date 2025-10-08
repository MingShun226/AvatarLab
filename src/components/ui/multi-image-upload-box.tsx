import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from './button';

interface MultiImageUploadBoxProps {
  onImagesChange: (base64Images: string[]) => void;
  currentImages: string[];
  maxImages?: number;
  maxSizeMB?: number;
}

export function MultiImageUploadBox({
  onImagesChange,
  currentImages,
  maxImages = 5,
  maxSizeMB = 4
}: MultiImageUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    // Check if we've reached max images
    if (currentImages.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImagesChange([...currentImages, base64]);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, [maxSizeMB, currentImages, maxImages, onImagesChange]);

  const handleFiles = useCallback((files: FileList) => {
    const filesArray = Array.from(files);
    const remainingSlots = maxImages - currentImages.length;

    if (filesArray.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more image(s)`);
      return;
    }

    filesArray.forEach(file => handleFile(file));
  }, [handleFile, maxImages, currentImages.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFiles]);

  const handleRemove = useCallback((index: number) => {
    setError(null);
    const newImages = currentImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [currentImages, onImagesChange]);

  const handleRemoveAll = useCallback(() => {
    setError(null);
    onImagesChange([]);
  }, [onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {currentImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Selected Images ({currentImages.length}/{maxImages})
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemoveAll}
              className="h-7 text-xs"
            >
              Remove All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span className="text-xs font-medium">{index + 1}</span>
                </div>
              </div>
            ))}

            {/* Add More Button */}
            {currentImages.length < maxImages && (
              <div
                className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => document.getElementById('multi-image-upload-input')?.click()}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Add More</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {currentImages.length === 0 && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center
            transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${error ? 'border-destructive' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('multi-image-upload-input')?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              {isDragging ? (
                <Upload className="h-8 w-8 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-8 w-8 text-primary" />
              )}
            </div>

            <div>
              <p className="text-lg font-medium">
                {isDragging ? 'Drop images here' : 'Upload Images'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports: JPG, PNG, WebP • Max {maxImages} images • Max {maxSizeMB}MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        id="multi-image-upload-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive text-center">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {currentImages.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {currentImages.length < maxImages
            ? `You can add ${maxImages - currentImages.length} more image(s)`
            : `Maximum ${maxImages} images reached`}
        </p>
      )}
    </div>
  );
}
