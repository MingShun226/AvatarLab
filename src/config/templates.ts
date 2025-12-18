// Template system for A&P Content generation

export type TemplateCategory =
  | 'product-photography'
  | 'social-media'
  | 'advertisement'
  | 'promotional'
  | 'lifestyle'
  | 'ecommerce';

export interface ImageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  previewImage?: string;
  tags: string[];
  generationMode: 'text2img' | 'img2img';
  defaultProvider?: string;
}

export interface VideoTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  prompt: string;
  aspectRatio: string;
  duration: number;
  previewImage?: string;
  tags: string[];
  generationMode: 'text2vid' | 'img2vid';
  defaultProvider?: string;
}

// Image Templates
export const IMAGE_TEMPLATES: ImageTemplate[] = [
  // Product Photography Templates
  {
    id: 'product-white-bg',
    name: 'Product on White Background',
    category: 'product-photography',
    description: 'Clean, professional product shot with pure white background',
    prompt: 'Professional product photography, [PRODUCT] on pure white background, studio lighting, high resolution, commercial quality, centered composition, sharp focus, no shadows',
    negativePrompt: 'background, clutter, blur, distortion, low quality',
    aspectRatio: '1:1',
    tags: ['ecommerce', 'catalog', 'minimal'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'product-lifestyle',
    name: 'Product Lifestyle Shot',
    category: 'product-photography',
    description: 'Product in a natural, lifestyle setting',
    prompt: 'Lifestyle product photography, [PRODUCT] in modern home setting, natural lighting, authentic atmosphere, cozy and inviting, professional quality, shallow depth of field',
    negativePrompt: 'studio, artificial, staged, low quality, blur',
    aspectRatio: '4:3',
    tags: ['lifestyle', 'authentic', 'modern'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'product-hands-holding',
    name: 'Hands Holding Product',
    category: 'product-photography',
    description: 'Person holding or using the product',
    prompt: 'Hand model photography, elegant hands holding [PRODUCT], soft natural lighting, clean background, professional commercial photography, high detail, shallow depth of field',
    negativePrompt: 'multiple hands, deformed, blur, low quality',
    aspectRatio: '4:5',
    tags: ['human-element', 'elegant', 'commercial'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // Social Media Templates
  {
    id: 'instagram-story',
    name: 'Instagram Story Post',
    category: 'social-media',
    description: 'Eye-catching vertical image for Instagram stories',
    prompt: '[PRODUCT] featured prominently, vibrant colors, modern aesthetic, bold typography area at top, professional commercial photography, trendy and engaging, high contrast',
    negativePrompt: 'dull, boring, low quality, cluttered',
    aspectRatio: '9:16',
    tags: ['instagram', 'vertical', 'trendy'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'social-carousel',
    name: 'Social Media Carousel',
    category: 'social-media',
    description: 'Square format perfect for social media carousels',
    prompt: '[PRODUCT] as hero element, modern minimalist design, pastel background, clean composition, professional product photography, Instagram-worthy aesthetic',
    negativePrompt: 'cluttered, messy, low quality, dark',
    aspectRatio: '1:1',
    tags: ['instagram', 'facebook', 'square'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // Advertisement Templates
  {
    id: 'banner-ad',
    name: 'Banner Advertisement',
    category: 'advertisement',
    description: 'Wide format banner for web advertising',
    prompt: '[PRODUCT] showcase, professional advertising photography, dynamic composition, copy space for text, attention-grabbing, premium quality, commercial grade',
    negativePrompt: 'cluttered, amateur, low quality',
    aspectRatio: '16:9',
    tags: ['banner', 'web', 'commercial'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'promotional-hero',
    name: 'Promotional Hero Image',
    category: 'advertisement',
    description: 'Large hero image for promotional campaigns',
    prompt: '[PRODUCT] as centerpiece, dramatic lighting, premium feel, high-end commercial photography, bold and striking, space for headline text, professional advertising quality',
    negativePrompt: 'cheap, amateur, cluttered, low quality',
    aspectRatio: '21:9',
    tags: ['hero', 'premium', 'campaign'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // E-commerce Templates
  {
    id: 'ecommerce-thumbnail',
    name: 'E-commerce Thumbnail',
    category: 'ecommerce',
    description: 'Perfect thumbnail for online stores',
    prompt: '[PRODUCT] catalog photography, clean white background, even lighting, multiple angles visible, high detail, professional e-commerce quality, crisp and clear',
    negativePrompt: 'shadow, background, blur, low quality',
    aspectRatio: '1:1',
    tags: ['thumbnail', 'catalog', 'store'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'ecommerce-zoom',
    name: 'Product Detail Close-up',
    category: 'ecommerce',
    description: 'Detailed close-up showing product features',
    prompt: 'Macro product photography, extreme close-up of [PRODUCT], showing fine details and texture, professional e-commerce photography, sharp focus, high resolution',
    negativePrompt: 'blur, out of focus, low detail, poor quality',
    aspectRatio: '4:3',
    tags: ['detail', 'macro', 'texture'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  }
];

// Video Templates
export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // Promotional Video Templates
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    category: 'promotional',
    description: '360° product reveal with dynamic camera movement',
    prompt: 'Cinematic product reveal of [PRODUCT], smooth 360-degree rotation, professional studio lighting, clean background, premium commercial quality, dynamic camera movement',
    aspectRatio: '16:9',
    duration: 5,
    tags: ['showcase', 'rotation', 'commercial'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'social-video-ad',
    name: 'Social Media Video Ad',
    category: 'social-media',
    description: 'Quick, attention-grabbing video for social platforms',
    prompt: '[PRODUCT] featured prominently, fast-paced dynamic motion, vibrant colors, modern aesthetic, engaging and trendy, optimized for mobile viewing, eye-catching',
    aspectRatio: '9:16',
    duration: 3,
    tags: ['social', 'vertical', 'fast-paced'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'lifestyle-video',
    name: 'Lifestyle Video',
    category: 'lifestyle',
    description: 'Product in everyday use, lifestyle context',
    prompt: '[PRODUCT] being used in modern lifestyle setting, natural movements, authentic atmosphere, soft natural lighting, cinematic quality, relatable and aspirational',
    aspectRatio: '16:9',
    duration: 5,
    tags: ['lifestyle', 'authentic', 'cinematic'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'feature-highlight',
    name: 'Feature Highlight',
    category: 'promotional',
    description: 'Close-up showcasing key product features',
    prompt: 'Close-up video of [PRODUCT], highlighting key features and details, smooth camera movement, professional lighting, premium quality, commercial product video',
    aspectRatio: '1:1',
    duration: 4,
    tags: ['features', 'detail', 'professional'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'unboxing-video',
    name: 'Unboxing Experience',
    category: 'promotional',
    description: 'Product unboxing with premium feel',
    prompt: 'Premium unboxing experience of [PRODUCT], elegant hands opening package, soft lighting, luxury aesthetic, satisfying reveal, high-end commercial quality',
    aspectRatio: '9:16',
    duration: 5,
    tags: ['unboxing', 'premium', 'experience'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  }
];

// Helper functions
export const getImageTemplatesByCategory = (category: TemplateCategory): ImageTemplate[] => {
  return IMAGE_TEMPLATES.filter(t => t.category === category);
};

export const getVideoTemplatesByCategory = (category: TemplateCategory): VideoTemplate[] => {
  return VIDEO_TEMPLATES.filter(t => t.category === category);
};

export const getAllCategories = (): TemplateCategory[] => {
  return [
    'product-photography',
    'social-media',
    'advertisement',
    'promotional',
    'lifestyle',
    'ecommerce'
  ];
};

export const getCategoryLabel = (category: TemplateCategory): string => {
  const labels: Record<TemplateCategory, string> = {
    'product-photography': 'Product Photography',
    'social-media': 'Social Media',
    'advertisement': 'Advertisement',
    'promotional': 'Promotional',
    'lifestyle': 'Lifestyle',
    'ecommerce': 'E-commerce'
  };
  return labels[category];
};
