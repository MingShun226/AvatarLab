// Malaysia-focused advertising styles for img2img product transformation
// CRITICAL: All prompts preserve uploaded product while changing style/background/presentation
// Lower strength values (0.45-0.62) ensure product identity is maintained

export interface AdvertisingStyle {
  id: string;
  name: string;
  platform: string;
  seriesNumber: number;
  description: string;
  prompt: string;
  aspectRatio: string;
  strength: number;
}

export interface PlatformSeries {
  id: string;
  name: string;
  description: string;
  popular: boolean;
  styles: AdvertisingStyle[];
}

const ADVERTISING_STYLES_DATA: AdvertisingStyle[] = [
  // SHOPEE MALAYSIA
  {
    id: 'shopee-1-hero',
    name: 'Hero Product Shot',
    platform: 'Shopee Malaysia',
    seriesNumber: 1,
    description: 'Clean professional shot with Shopee orange energy',
    prompt: 'Professional e-commerce product photography on clean white background, vibrant Shopee orange (#EE4D2D) accent elements and borders, bright studio lighting, sharp product details, modern commercial style, space for price tags and badges, mobile-optimized composition',
    aspectRatio: '1:1',
    strength: 0.5
  },
  {
    id: 'shopee-2-lifestyle',
    name: 'Lifestyle Context',
    platform: 'Shopee Malaysia',
    seriesNumber: 2,
    description: 'Product in Malaysian home setting',
    prompt: 'Product displayed in clean Malaysian home lifestyle setting, warm natural lighting, organized arrangement, middle-class home environment with neutral background, relatable everyday context, family-friendly atmosphere, value-for-money aesthetic',
    aspectRatio: '1:1',
    strength: 0.6
  },
  {
    id: 'shopee-3-features',
    name: 'Features Highlight',
    platform: 'Shopee Malaysia',
    seriesNumber: 3,
    description: 'Multi-angle product showcase',
    prompt: 'Product shown from multiple angles in grid layout, white background, orange accent dividers, bright even lighting showing all product details clearly, professional e-commerce multi-view presentation',
    aspectRatio: '1:1',
    strength: 0.55
  },
  {
    id: 'shopee-4-comparison',
    name: 'Size Comparison',
    platform: 'Shopee Malaysia',
    seriesNumber: 4,
    description: 'Product with size reference',
    prompt: 'Product displayed with size reference objects for scale comparison, white background, clear product visibility, honest size demonstration, helpful buyer information, clean commercial photography',
    aspectRatio: '1:1',
    strength: 0.55
  },
  {
    id: 'shopee-5-promo',
    name: 'Flash Sale Style',
    platform: 'Shopee Malaysia',
    seriesNumber: 5,
    description: 'Energetic promotional presentation',
    prompt: 'Product on vibrant orange gradient background with burst effects, high energy promotional style, Shopee flash sale aesthetic, bright exciting lighting, space for discount badges, mobile shopping optimized',
    aspectRatio: '1:1',
    strength: 0.58
  },
  // LAZADA MALAYSIA
  {
    id: 'lazada-1-hero',
    name: 'Premium Hero Shot',
    platform: 'Lazada Malaysia',
    seriesNumber: 1,
    description: 'Elegant product with blue accents',
    prompt: 'Premium e-commerce photography on white background, subtle blue (#0F156D) accent elements, sophisticated lighting showing quality, slightly upscale presentation, LazMall aesthetic, professional commercial style',
    aspectRatio: '1:1',
    strength: 0.5
  },
  {
    id: 'lazada-2-lifestyle',
    name: 'Aspirational Living',
    platform: 'Lazada Malaysia',
    seriesNumber: 2,
    description: 'Product in refined setting',
    prompt: 'Product in modern middle-class Malaysian home setting, refined environment with quality furniture, soft natural lighting, aspirational yet accessible lifestyle context, premium feel',
    aspectRatio: '1:1',
    strength: 0.6
  },
  {
    id: 'lazada-3-features',
    name: 'Quality Features',
    platform: 'Lazada Malaysia',
    seriesNumber: 3,
    description: 'Multi-angle quality showcase',
    prompt: 'Product from multiple angles in elegant grid layout, white background with blue accent dividers, professional lighting showing quality details, premium e-commerce presentation',
    aspectRatio: '1:1',
    strength: 0.55
  },
  {
    id: 'lazada-4-authenticity',
    name: 'Brand Quality',
    platform: 'Lazada Malaysia',
    seriesNumber: 4,
    description: 'Professional quality presentation',
    prompt: 'Product with clean professional presentation on white background, blue premium accent elements, studio lighting highlighting authenticity and quality, official seller aesthetic',
    aspectRatio: '1:1',
    strength: 0.52
  },
  {
    id: 'lazada-5-promo',
    name: 'Blue Sale Campaign',
    platform: 'Lazada Malaysia',
    seriesNumber: 5,
    description: 'Premium promotional style',
    prompt: 'Product on white-to-blue gradient background, Lazada blue promotional elements, energetic yet sophisticated presentation, bright professional lighting, premium sale aesthetic',
    aspectRatio: '1:1',
    strength: 0.58
  },
  // INSTAGRAM MALAYSIA
  {
    id: 'instagram-1-feed',
    name: 'Aesthetic Feed',
    platform: 'Instagram Malaysia',
    seriesNumber: 1,
    description: 'Beautifully styled feed post',
    prompt: 'Product beautifully styled with curated aesthetic, cohesive pastel color palette, soft natural window light with gentle shadows, minimalist composition with negative space, modern Malaysian Instagram style',
    aspectRatio: '4:5',
    strength: 0.62
  },
  {
    id: 'instagram-2-story',
    name: 'Story Format',
    platform: 'Instagram Malaysia',
    seriesNumber: 2,
    description: 'Vertical story-optimized',
    prompt: 'Product prominently displayed in vertical 9:16 composition, bright vibrant mobile-optimized colors, authentic casual Malaysian aesthetic, natural or ring light, space for stickers and text',
    aspectRatio: '9:16',
    strength: 0.6
  },
  {
    id: 'instagram-3-carousel',
    name: 'Carousel Style',
    platform: 'Instagram Malaysia',
    seriesNumber: 3,
    description: 'Clean carousel presentation',
    prompt: 'Product in clean organized composition perfect for carousel series, consistent aesthetic, soft even lighting, cohesive color scheme, modern Malaysian Instagram feed style',
    aspectRatio: '1:1',
    strength: 0.58
  },
  {
    id: 'instagram-4-influencer',
    name: 'Influencer Style',
    platform: 'Instagram Malaysia',
    seriesNumber: 4,
    description: 'Authentic recommendation aesthetic',
    prompt: 'Product featured in authentic lifestyle context, soft flattering natural light, relatable styling suggesting genuine review, modern Malaysian influencer aesthetic, trust-building presentation',
    aspectRatio: '4:5',
    strength: 0.62
  },
  {
    id: 'instagram-5-reels',
    name: 'Reels Thumbnail',
    platform: 'Instagram Malaysia',
    seriesNumber: 5,
    description: 'Eye-catching vertical format',
    prompt: 'Product in bold eye-catching vertical composition, vibrant saturated mobile-optimized colors, dynamic interesting angle, modern trendy Malaysian aesthetic, vertical 9:16 phone screen format',
    aspectRatio: '9:16',
    strength: 0.6
  },
  // TIKTOK MALAYSIA
  {
    id: 'tiktok-1-hook',
    name: 'Scroll Stopper',
    platform: 'TikTok Malaysia',
    seriesNumber: 1,
    description: 'Attention-grabbing vertical shot',
    prompt: 'Product in bold vertical 9:16 composition, vibrant saturated colors optimized for phone screens, dynamic trending angle, youthful energetic TikTok aesthetic, eye-catching presentation',
    aspectRatio: '9:16',
    strength: 0.6
  },
  {
    id: 'tiktok-2-demo',
    name: 'Action Shot',
    platform: 'TikTok Malaysia',
    seriesNumber: 2,
    description: 'Product in use demonstration',
    prompt: 'Product shown in realistic usage context, vertical mobile format, bright authentic lighting, casual relatable setting, TikTok educational content style, practical demonstration aesthetic',
    aspectRatio: '9:16',
    strength: 0.62
  },
  {
    id: 'tiktok-3-unbox',
    name: 'Unboxing Style',
    platform: 'TikTok Malaysia',
    seriesNumber: 3,
    description: 'Fresh unboxing presentation',
    prompt: 'Product in fresh unboxing presentation, vertical phone format, bright overhead lighting, honest review aesthetic, authentic TikTok unboxing style, excitement-building composition',
    aspectRatio: '9:16',
    strength: 0.58
  },
  {
    id: 'tiktok-4-compare',
    name: 'Before/After',
    platform: 'TikTok Malaysia',
    seriesNumber: 4,
    description: 'Comparison showcase',
    prompt: 'Product in split-screen comparison layout, vertical format, clear demonstration of benefits, TikTok transformation content style, dramatic before-after presentation',
    aspectRatio: '9:16',
    strength: 0.6
  },
  {
    id: 'tiktok-5-trend',
    name: 'Trending Format',
    platform: 'TikTok Malaysia',
    seriesNumber: 5,
    description: 'Viral-ready composition',
    prompt: 'Product in trendy viral video format, vertical composition, bold vibrant phone-optimized colors, Malaysian Gen-Z aesthetic, TikTok trending content style, shareability-focused presentation',
    aspectRatio: '9:16',
    strength: 0.6
  },
  // FACEBOOK MALAYSIA
  {
    id: 'facebook-1-organic',
    name: 'Organic Post',
    platform: 'Facebook Malaysia',
    seriesNumber: 1,
    description: 'Natural social sharing style',
    prompt: 'Product in natural everyday setting, authentic casual photography, warm relatable lighting, family-friendly Malaysian context, organic Facebook post aesthetic, trustworthy presentation',
    aspectRatio: '1:1',
    strength: 0.6
  },
  {
    id: 'facebook-2-marketplace',
    name: 'Marketplace Style',
    platform: 'Facebook Malaysia',
    seriesNumber: 2,
    description: 'Clear marketplace listing',
    prompt: 'Product on clean simple background, honest straightforward photography, bright even lighting, clear product visibility, Facebook Marketplace listing style, practical presentation',
    aspectRatio: '1:1',
    strength: 0.52
  },
  {
    id: 'facebook-3-ad',
    name: 'Sponsored Ad',
    platform: 'Facebook Malaysia',
    seriesNumber: 3,
    description: 'Professional ad format',
    prompt: 'Product in professional advertising composition, clean organized layout, balanced lighting, space for text overlay, Facebook ad format optimization, conversion-focused presentation',
    aspectRatio: '1:1',
    strength: 0.55
  },
  {
    id: 'facebook-4-review',
    name: 'Review Style',
    platform: 'Facebook Malaysia',
    seriesNumber: 4,
    description: 'User review aesthetic',
    prompt: 'Product in authentic customer review setting, genuine photography style, natural home lighting, relatable Malaysian environment, trust-building review aesthetic, honest presentation',
    aspectRatio: '1:1',
    strength: 0.62
  },
  {
    id: 'facebook-5-event',
    name: 'Event/Sale Post',
    platform: 'Facebook Malaysia',
    seriesNumber: 5,
    description: 'Promotional event style',
    prompt: 'Product in promotional event presentation, festive Malaysian context, bright celebratory lighting, Facebook sale event aesthetic, excitement-building composition',
    aspectRatio: '1:1',
    strength: 0.58
  },
  // TEMU MALAYSIA
  {
    id: 'temu-1-value',
    name: 'Value Hero Shot',
    platform: 'Temu Malaysia',
    seriesNumber: 1,
    description: 'Affordable quality showcase',
    prompt: 'Product on clean white background with purple (#8000FF) accent elements, bright studio lighting, value-for-money presentation, modern e-commerce style, Temu brand aesthetic',
    aspectRatio: '1:1',
    strength: 0.5
  },
  {
    id: 'temu-2-bundle',
    name: 'Bundle Deal',
    platform: 'Temu Malaysia',
    seriesNumber: 2,
    description: 'Multi-item value presentation',
    prompt: 'Product with complementary items in organized arrangement, white background with purple accents, bright even lighting, bundle deal presentation, value-maximizing composition',
    aspectRatio: '1:1',
    strength: 0.58
  },
  {
    id: 'temu-3-features',
    name: 'Feature Showcase',
    platform: 'Temu Malaysia',
    seriesNumber: 3,
    description: 'Multi-angle value demonstration',
    prompt: 'Product from multiple angles in grid layout, white background with purple accent dividers, bright lighting showing all details, comprehensive value presentation, Temu marketplace style',
    aspectRatio: '1:1',
    strength: 0.55
  },
  {
    id: 'temu-4-lifestyle',
    name: 'Practical Living',
    platform: 'Temu Malaysia',
    seriesNumber: 4,
    description: 'Product in everyday use',
    prompt: 'Product in practical everyday Malaysian setting, natural lighting, relatable middle-class environment, value-conscious lifestyle context, accessible presentation',
    aspectRatio: '1:1',
    strength: 0.6
  },
  {
    id: 'temu-5-promo',
    name: 'Flash Deal',
    platform: 'Temu Malaysia',
    seriesNumber: 5,
    description: 'Promotional deal style',
    prompt: 'Product on vibrant purple gradient background, energetic promotional style, Temu flash deal aesthetic, bright exciting lighting, bargain-focused presentation, mobile-optimized composition',
    aspectRatio: '1:1',
    strength: 0.58
  }
];

// Group styles by platform
export const PLATFORM_SERIES: PlatformSeries[] = [
  {
    id: 'shopee-malaysia',
    name: 'Shopee Malaysia',
    description: 'Vibrant orange-themed e-commerce styles with energetic flash sale aesthetics',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Shopee Malaysia')
  },
  {
    id: 'lazada-malaysia',
    name: 'Lazada Malaysia',
    description: 'Premium blue-themed styles with sophisticated LazMall quality',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Lazada Malaysia')
  },
  {
    id: 'instagram-malaysia',
    name: 'Instagram Malaysia',
    description: 'Aesthetic feed, story, and reels formats with influencer vibes',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Instagram Malaysia')
  },
  {
    id: 'tiktok-malaysia',
    name: 'TikTok Malaysia',
    description: 'Vertical scroll-stopping content with trending viral aesthetics',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'TikTok Malaysia')
  },
  {
    id: 'facebook-malaysia',
    name: 'Facebook Malaysia',
    description: 'Organic posts, marketplace listings, and sponsored ad formats',
    popular: false,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Facebook Malaysia')
  },
  {
    id: 'temu-malaysia',
    name: 'Temu Malaysia',
    description: 'Purple-themed value-focused styles with bundle deal presentations',
    popular: false,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Temu Malaysia')
  }
];

// Helper functions
export function getAllPlatforms(): PlatformSeries[] {
  return PLATFORM_SERIES;
}

export function getPlatformById(id: string): PlatformSeries | undefined {
  return PLATFORM_SERIES.find(p => p.id === id);
}

export function getStyleById(id: string): AdvertisingStyle | undefined {
  return ADVERTISING_STYLES_DATA.find(s => s.id === id);
}

export function getStylesByPlatform(platform: string): AdvertisingStyle[] {
  return ADVERTISING_STYLES_DATA.filter(s => s.platform === platform);
}

export function getPopularPlatforms(): PlatformSeries[] {
  return PLATFORM_SERIES.filter(p => p.popular);
}
