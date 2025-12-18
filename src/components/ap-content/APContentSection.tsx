import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Film, Grid3x3, Sparkles } from 'lucide-react';
import ImagesSection from '@/components/dashboard/sections/ImagesSection';
import VideosSection from '@/components/dashboard/sections/VideosSection';
import APContentGallery from '@/components/ap-content/APContentGallery';

const APContentSection = () => {
  const [activeTab, setActiveTab] = useState('gallery');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          A&P Content Studio
        </h1>
        <p className="text-muted-foreground mt-2">
          Create professional advertising and promotional content for your business - images and videos in one place
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            All Content
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-6">
          <APContentGallery />
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Generate Product Images</h3>
                <p className="text-sm text-muted-foreground">
                  Create stunning product photos and advertising visuals with AI
                </p>
              </div>
              <ImagesSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Generate Promotional Videos</h3>
                <p className="text-sm text-muted-foreground">
                  Create engaging videos for social media and advertising campaigns
                </p>
              </div>
              <VideosSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APContentSection;
