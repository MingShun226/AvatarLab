
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Globe, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AvatarDetailStepProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  avatarId?: string;
}

export const AvatarDetailStep: React.FC<AvatarDetailStepProps> = ({ 
  data, 
  onUpdate, 
  avatarId 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Set up real-time updates for avatar changes
  useEffect(() => {
    if (!avatarId || !user) return;

    const channel = supabase
      .channel('avatar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avatars',
          filter: `id=eq.${avatarId}`
        },
        (payload) => {
          console.log('Avatar updated:', payload);
          // Update local state with new data
          if (payload.new) {
            const newData = payload.new as any;
            onUpdate('name', newData.name);
            onUpdate('originCountry', newData.origin_country);
            onUpdate('age', newData.age?.toString());
            onUpdate('gender', newData.gender);
            onUpdate('primaryLanguage', newData.primary_language);
            onUpdate('secondaryLanguages', newData.secondary_languages || []);
            onUpdate('avatarImages', newData.avatar_images || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [avatarId, user, onUpdate]);

  // Set up real-time updates for knowledge files
  useEffect(() => {
    if (!avatarId || !user) return;

    const knowledgeChannel = supabase
      .channel('knowledge-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avatar_knowledge_files',
          filter: `avatar_id=eq.${avatarId}`
        },
        (payload) => {
          console.log('Knowledge files updated:', payload);
          // Trigger a refresh of knowledge files in parent component
          // This will be handled by the KnowledgeBase component's real-time updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(knowledgeChannel);
    };
  }, [avatarId, user]);

  const countries = [
    'Malaysia', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Singapore', 'China', 'Japan', 'South Korea', 'Thailand', 'Indonesia',
    'Philippines', 'Vietnam', 'India', 'Germany', 'France', 'Italy', 'Spain',
    'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Brazil', 'Mexico',
    'Argentina', 'South Africa', 'Egypt', 'Turkey', 'Russia', 'Ukraine'
  ];

  const primaryLanguages = [
    'English', 'Chinese (Mandarin)', 'Malay', 'Spanish', 'French', 'German', 
    'Italian', 'Portuguese', 'Russian', 'Japanese', 'Korean', 'Arabic', 
    'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Dutch', 'Swedish'
  ];

  const secondaryLanguages = [
    'English', 'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Malay', 'Spanish', 
    'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Korean', 
    'Arabic', 'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Dutch', 'Swedish', 
    'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian', 
    'Bulgarian', 'Greek', 'Turkish', 'Hebrew', 'Urdu', 'Bengali', 'Tamil', 'Telugu'
  ];

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    if (!user) {
      console.error('No user found for upload');
      return null;
    }

    try {
      // Generate unique filename with user ID and timestamp
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${user.id}/avatars/${timestamp}-${randomId}.${fileExt}`;
      
      console.log('Uploading file to path:', fileName);
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload image: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload images.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const currentImages = data.avatarImages || [];
    const newImageUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File",
            description: `${file.name} is not a valid image file.`,
            variant: "destructive"
          });
          continue;
        }

        console.log(`✅ File size check: ${file.name} is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        // Validate file size (50MB max - matches Supabase bucket limit)
        if (file.size > 50 * 1024 * 1024) {
          console.error(`❌ File too large: ${file.name} is ${(file.size / 1024 / 1024).toFixed(2)}MB, limit is 50MB`);
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
          console.log('Successfully uploaded image:', uploadedUrl);
        }
      }

      if (newImageUrls.length > 0) {
        const updatedImages = [...currentImages, ...newImageUrls];
        console.log('Updating avatarImages with:', updatedImages);
        onUpdate('avatarImages', updatedImages);
        
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
      event.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const currentImages = data.avatarImages || [];
    const imageUrl = currentImages[index];
    
    console.log('Removing image at index:', index, 'URL:', imageUrl);
    
    // If it's a Supabase storage URL, try to delete it from storage
    if (imageUrl && imageUrl.includes('supabase') && user) {
      try {
        // Extract the file path from the URL
        // URL format: https://project.supabase.co/storage/v1/object/public/avatars/path/to/file
        const urlParts = imageUrl.split('/storage/v1/object/public/avatars/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          console.log('Attempting to delete file at path:', filePath);
          
          const { error } = await supabase.storage
            .from('avatars')
            .remove([filePath]);

          if (error) {
            console.error('Error deleting file from storage:', error);
          } else {
            console.log('Successfully deleted file from storage');
          }
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    
    const updatedImages = currentImages.filter((_: any, i: number) => i !== index);
    console.log('Updated images after removal:', updatedImages);
    onUpdate('avatarImages', updatedImages);
  };

  const handleSecondaryLanguageToggle = (language: string) => {
    const currentSecondaryLanguages = data.secondaryLanguages || [];
    const updatedLanguages = currentSecondaryLanguages.includes(language)
      ? currentSecondaryLanguages.filter((lang: string) => lang !== language)
      : [...currentSecondaryLanguages, language];
    onUpdate('secondaryLanguages', updatedLanguages);
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Avatar Detail
          {avatarId && (
            <Badge variant="outline" className="text-xs">
              Real-time Updates Enabled
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Set up your avatar's basic information, images, and language preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Images Upload */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Avatar Images (Upload multiple images)
          </Label>
          
          {/* Upload Button */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              id="avatar-images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="avatar-images" className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading ? (
                <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {isUploading ? 'Uploading images...' : 'Click to upload avatar images or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF up to 50MB each
              </p>
            </label>
          </div>

          {/* Image Previews */}
          {data.avatarImages && data.avatarImages.length > 0 && (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {data.avatarImages.map((image: string, index: number) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('Image loaded successfully:', image)}
                      onError={(e) => {
                        console.error('Image failed to load:', image);
                        // Don't set placeholder, just log the error
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Avatar Name *</Label>
          <Input
            id="name"
            placeholder="Enter your avatar's name"
            value={data.name || ''}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="input-modern"
          />
        </div>

        {/* Origin Country */}
        <div className="space-y-2">
          <Label>Origin Country *</Label>
          <Select 
            value={data.originCountry || 'Malaysia'} 
            onValueChange={(value) => onUpdate('originCountry', value)}
          >
            <SelectTrigger className="input-modern">
              <SelectValue placeholder="Select origin country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This affects the avatar's cultural background and communication style
          </p>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter age"
            value={data.age || ''}
            onChange={(e) => onUpdate('age', e.target.value)}
            className="input-modern"
            min="1"
            max="120"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label>Gender *</Label>
          <Select value={data.gender || ''} onValueChange={(value) => onUpdate('gender', value)}>
            <SelectTrigger className="input-modern">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Primary Language */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Primary Language * (Select one)
          </Label>
          <Select 
            value={data.primaryLanguage || ''} 
            onValueChange={(value) => onUpdate('primaryLanguage', value)}
          >
            <SelectTrigger className="input-modern">
              <SelectValue placeholder="Select primary language" />
            </SelectTrigger>
            <SelectContent>
              {primaryLanguages.map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The main language your avatar will communicate in
          </p>
        </div>

        {/* Secondary Languages */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Secondary Languages (Select multiple - Optional)
          </Label>
          
          {/* Selected Secondary Languages */}
          {data.secondaryLanguages && data.secondaryLanguages.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg">
              {data.secondaryLanguages.map((language: string) => (
                <Badge key={language} variant="secondary" className="flex items-center gap-1">
                  {language}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => handleSecondaryLanguageToggle(language)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Language Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {secondaryLanguages
              .filter(lang => lang !== data.primaryLanguage)
              .map((language) => {
                const isSelected = data.secondaryLanguages?.includes(language);
                return (
                  <Button
                    key={language}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => handleSecondaryLanguageToggle(language)}
                  >
                    {language}
                  </Button>
                );
              })}
          </div>

          <p className="text-xs text-muted-foreground">
            Selected {data.secondaryLanguages?.length || 0} secondary language(s)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
