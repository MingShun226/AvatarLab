
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  existingImages?: string[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImagesChange, 
  maxImages = 5, 
  label = "Upload Images",
  existingImages = []
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (const file of files) {
        if (existingImages.length + newImageUrls.length >= maxImages) {
          break;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File",
            description: `${file.name} is not a valid image file.`,
            variant: "destructive"
          });
          continue;
        }

        console.log(`✅ ImageUpload: File size check: ${file.name} is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        // Validate file size (50MB max - matches Supabase bucket limit)
        if (file.size > 50 * 1024 * 1024) {
          console.error(`❌ ImageUpload: File too large: ${file.name} is ${(file.size / 1024 / 1024).toFixed(2)}MB, limit is 50MB`);
          toast({
            title: "File Too Large",
            description: `${file.name} is larger than 50MB (${(file.size / 1024 / 1024).toFixed(2)}MB).`,
            variant: "destructive"
          });
          continue;
        }

        const uploadedUrl = await uploadImageToSupabase(file);
        if (uploadedUrl) {
          newImageUrls.push(uploadedUrl);
        }
      }

      if (newImageUrls.length > 0) {
        onImagesChange([...existingImages, ...newImageUrls]);
        toast({
          title: "Images Uploaded",
          description: `Successfully uploaded ${newImageUrls.length} image(s).`,
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading images.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = existingImages[index];
    
    // If it's a Supabase storage URL, try to delete it
    if (imageUrl && imageUrl.includes('supabase') && user) {
      try {
        // Extract the file path from the URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;
        
        await supabase.storage
          .from('avatars')
          .remove([filePath]);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    
    const newImages = existingImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={existingImages.length >= maxImages || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {existingImages.length === 0 ? 'Upload Images' : `Add More (${existingImages.length}/${maxImages})`}
            </>
          )}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
          disabled={isUploading}
        />

        {existingImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded border"
                  onError={(e) => {
                    console.error('Image failed to load:', url);
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
