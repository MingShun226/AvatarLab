import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Image as ImageIcon,
  Film,
  Tag,
  ArrowRight,
  Layers
} from 'lucide-react';
import {
  ImageTemplate,
  VideoTemplate,
  IMAGE_TEMPLATES,
  VIDEO_TEMPLATES,
  TemplateCategory,
  getAllCategories,
  getCategoryLabel,
  getImageTemplatesByCategory,
  getVideoTemplatesByCategory
} from '@/config/templates';

interface TemplateLibraryProps {
  type: 'image' | 'video';
  onSelectTemplate: (template: ImageTemplate | VideoTemplate) => void;
}

const TemplateLibrary = ({ type, onSelectTemplate }: TemplateLibraryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  const templates = type === 'image' ? IMAGE_TEMPLATES : VIDEO_TEMPLATES;
  const Icon = type === 'image' ? ImageIcon : Film;

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : type === 'image'
      ? getImageTemplatesByCategory(selectedCategory)
      : getVideoTemplatesByCategory(selectedCategory);

  const categories = getAllCategories();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Template Library</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {getCategoryLabel(cat).split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getCategoryLabel(template.category)}
                </Badge>
              </div>
              <CardDescription className="text-xs line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Preview Area */}
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center border">
                <div className="text-center p-4">
                  <Icon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {template.aspectRatio}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Prompt Preview */}
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                  {template.prompt.replace('[PRODUCT]', 'your product')}
                </p>
              </div>

              {/* Use Template Button */}
              <Button
                onClick={() => onSelectTemplate(template)}
                size="sm"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                variant="outline"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Use Template
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try selecting a different category
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
