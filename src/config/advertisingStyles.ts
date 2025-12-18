// Malaysia-focused advertising styles for batch product image generation
// All templates are img2img-based: user uploads simple product photo, AI transforms it

export interface AdvertisingStyle {
  id: string;
  name: string;
  platform: string;
  description: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  strength: number; // img2img strength
  popular: boolean; // Show in quick select
  icon?: string;
}

// Malaysian marketplace advertising styles
export const ADVERTISING_STYLES: AdvertisingStyle[] = [
  // ==================== SHOPEE MALAYSIA ====================
  {
    id: 'shopee-flash-sale',
    name: 'Shopee Flash Sale',
    platform: 'Shopee',
    description: 'High-energy Shopee Malaysia style with orange accents and promo feel',
    prompt: 'Transform this product photo into Shopee Malaysia flash sale advertisement style, vibrant orange (#EE4D2D) and white color scheme creating urgency, product centered and clearly visible against clean white or light orange gradient background, bright cheerful lighting making colors pop, professional e-commerce photography quality, space for orange promotional badges and price tags, Southeast Asian marketplace aesthetic, deal-focused and energetic presentation, mobile shopping optimized, product details sharp and clear, affordable yet quality feel, flash sale energy, Malaysian consumer appeal, square format perfect for Shopee product listing, commercial online marketplace photography, 4k resolution',
    negativePrompt: 'dark, muted, premium luxury feel, complicated background, western-only aesthetic, cluttered, messy, poor product visibility, unclear details, low energy, boring',
    aspectRatio: '1:1',
    strength: 0.65,
    popular: true
  },
  {
    id: 'shopee-lifestyle',
    name: 'Shopee Lifestyle',
    platform: 'Shopee',
    description: 'Relatable lifestyle shot for Shopee with product in daily use',
    prompt: 'Transform this product into Shopee Malaysia lifestyle photography showing product in relatable Malaysian home or daily life setting, bright natural lighting, product as hero item in organized neat arrangement, affordable quality aesthetic not luxury, Southeast Asian home environment, warm friendly mood building trust, practical everyday usage scenario, clean composition with white or pastel background elements, middle-class Malaysian lifestyle aspiration, family-friendly feel, honest product showcase with details visible, mobile-optimized for smartphone shoppers, value-for-money presentation, approachable and inclusive, square format, 4k resolution',
    negativePrompt: 'luxury, expensive-looking, dark moody, western mansion, overly styled, boutique feel, impractical setting, messy, unclear product',
    aspectRatio: '1:1',
    strength: 0.7,
    popular: true
  },

  // ==================== LAZADA MALAYSIA ====================
  {
    id: 'lazada-premium',
    name: 'Lazada Premium',
    platform: 'Lazada',
    description: 'Lazada Malaysia style with blue accents, slightly more premium',
    prompt: 'Transform this product into Lazada Malaysia premium listing style, blue and orange accent colors, product on clean white background with subtle blue gradient elements, professional studio lighting showing quality, slightly more premium feel than Shopee while remaining accessible, LazMall aesthetic, product centered and clearly photographed, all features visible, space for blue voucher badges and discount elements, Malaysian e-commerce marketplace style, trustworthy and established brand feel, free shipping emphasis possible, mobile-optimized composition, commercial product photography, square format, high resolution 4k',
    negativePrompt: 'cheap-looking, cluttered, dark, poor lighting, messy background, unclear product details, overly luxury, inaccessible feel',
    aspectRatio: '1:1',
    strength: 0.65,
    popular: true
  },

  // ==================== FACEBOOK MARKETPLACE MALAYSIA ====================
  {
    id: 'facebook-casual',
    name: 'Facebook Casual',
    platform: 'Facebook',
    description: 'Authentic casual style for Facebook Marketplace Malaysia',
    prompt: 'Transform this product into Facebook Marketplace Malaysia style authentic product photo, casual and genuine not overly professional, product in natural home or lifestyle setting, natural lighting appearing achievable by average seller, real-life context showing product use, personal touch making it relatable, clear product visibility from multiple implied angles, Malaysian home environment, honest and trustworthy presentation, not too polished but clean and appealing, local seller aesthetic, practical and straightforward, mobile phone photography quality but good, square or slightly vertical format, genuine Facebook marketplace vibe, 4k quality',
    negativePrompt: 'overly professional studio, fake, staged perfectly, corporate feel, luxury boutique, western aesthetic only, unclear product, messy without authenticity',
    aspectRatio: '4:5',
    strength: 0.75,
    popular: true
  },
  {
    id: 'facebook-shop-clean',
    name: 'Facebook Shop Clean',
    platform: 'Facebook',
    description: 'Clean professional style for Facebook Shop',
    prompt: 'Transform this product into Facebook Shop Malaysia clean professional product photo, product on white or very light background, good even lighting, product clearly visible and well-presented, slightly more polished than marketplace but not studio-perfect, Malaysian small business aesthetic, trustworthy online shop presentation, product details clear, suitable for business page, clean and organized feel, approachable pricing tier, mobile-friendly composition, honest product showcase, square format optimized for Facebook feed, commercial but accessible quality, 4k resolution',
    negativePrompt: 'messy, dark, premium luxury only, overly artistic, cluttered background, poor product visibility, amateur bad lighting',
    aspectRatio: '1:1',
    strength: 0.7,
    popular: false
  },

  // ==================== INSTAGRAM MALAYSIA ====================
  {
    id: 'instagram-aesthetic',
    name: 'Instagram Aesthetic',
    platform: 'Instagram',
    description: 'Curated aesthetic feed style popular in Malaysia',
    prompt: 'Transform this product into Instagram Malaysia aesthetic feed style, beautifully curated and styled product photography, cohesive color palette with pastel tones or complementary colors, product artfully arranged with lifestyle props, natural window light creating soft shadows, minimalist and clean composition, aspirational yet achievable Malaysian lifestyle, influencer content creator quality, feed-cohesive aesthetic, product as focal point in styled scene, modern and trendy Malaysian taste, negative space for caption area, vertical or square format, warm inviting mood, authentic premium feel, professional content creation quality, 4-6k resolution optimized for Instagram',
    negativePrompt: 'cluttered, chaotic, harsh lighting, no aesthetic cohesion, boring, dated look, messy, corporate catalog feel, poor composition',
    aspectRatio: '4:5',
    strength: 0.65,
    popular: true
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'Instagram',
    description: 'Vertical story format for Instagram Malaysia',
    prompt: 'Transform this product into Instagram Story Malaysia format, vertical 9:16 composition filling phone screen, product prominently displayed with eye-catching presentation, bright and vibrant optimized for mobile viewing, authentic and relatable Malaysian aesthetic, space for text overlay and stickers, trendy and current visual style, product clearly visible and appealing, natural or ring light creating flattering illumination, story-friendly casual yet polished feel, engagement-optimized, Malaysian youth appeal, modern and energetic, vertical storytelling format, 4k mobile-optimized resolution',
    negativePrompt: 'horizontal, dark, boring, overly formal, corporate, unclear product, cluttered, dated aesthetic, poor mobile optimization',
    aspectRatio: '9:16',
    strength: 0.7,
    popular: true
  },

  // ==================== TIKTOK SHOP MALAYSIA ====================
  {
    id: 'tiktok-viral',
    name: 'TikTok Viral Style',
    platform: 'TikTok',
    description: 'Attention-grabbing TikTok Shop Malaysia thumbnail',
    prompt: 'Transform this product into TikTok Shop Malaysia viral-style thumbnail, eye-catching and scroll-stopping vertical 9:16 format, product displayed boldly with dramatic presentation, vibrant saturated colors optimized for phone screens, authentic Malaysian TikTok aesthetic not overly polished, product clearly visible and instantly recognizable, space for text overlay and captions, energetic and dynamic composition, Gen Z and millennial Malaysian appeal, trending visual style, entertainment-first product showcase, natural or ring light, casual authentic feel, attention-grabbing without being chaotic, mobile-native vertical format, 4k resolution',
    negativePrompt: 'boring, static, corporate, overly professional studio, horizontal, subtle muted colors, formal, traditional advertising, unclear product, slow-paced feel',
    aspectRatio: '9:16',
    strength: 0.7,
    popular: true
  },
  {
    id: 'tiktok-before-after',
    name: 'TikTok Before/After',
    platform: 'TikTok',
    description: 'Before/after split popular on TikTok Malaysia',
    prompt: 'Transform this product photo into TikTok Malaysia before-after split style, image showing dramatic transformation or improvement, clear contrast between original product state and enhanced presentation, split screen or side-by-side layout, both sides well-lit for fair comparison, vertical 9:16 mobile format, compelling visual story, authentic Malaysian TikTok aesthetic, product benefit obvious through comparison, text-ready space for BEFORE/AFTER labels, scroll-stopping transformation, relatable and trustworthy, natural environment not studio, proof of quality or effectiveness, modern engaging format, 4k resolution',
    negativePrompt: 'unclear comparison, poor lighting mismatch, confusing layout, subtle difference, overly professional corporate, horizontal format, boring, no visual impact',
    aspectRatio: '9:16',
    strength: 0.65,
    popular: false
  },

  // ==================== CAROUSELL MALAYSIA ====================
  {
    id: 'carousell-honest',
    name: 'Carousell Honest',
    platform: 'Carousell',
    description: 'Straightforward honest style for Carousell Malaysia',
    prompt: 'Transform this product into Carousell Malaysia honest listing style, straightforward and authentic product photography, product on simple clean background showing true condition, natural or good indoor lighting making details clear, multiple angle perspective implied in single shot, honest representation building buyer trust, Malaysian personal seller aesthetic, practical and no-nonsense presentation, clear product visibility, value-for-money feel, mobile photography quality but clear and well-lit, square format, genuine second-hand market or new item listing style, approachable and trustworthy, 4k resolution',
    negativePrompt: 'overly professional, studio perfect, misleading glamour, poor lighting hiding details, messy confusing, unclear condition, too artistic, corporate',
    aspectRatio: '1:1',
    strength: 0.75,
    popular: false
  },

  // ==================== GENERAL MALAYSIAN STYLES ====================
  {
    id: 'whatsapp-catalog',
    name: 'WhatsApp Catalog',
    platform: 'WhatsApp Business',
    description: 'Clean catalog style for WhatsApp Business Malaysia',
    prompt: 'Transform this product into WhatsApp Business Malaysia catalog style, clean and simple product photo on white or very light background, product clearly photographed showing all important details, good even lighting, catalog-ready presentation, small business friendly aesthetic, professional but achievable quality, product centered and well-framed, suitable for WhatsApp Business catalog listing, Malaysian SME standard, trustworthy online seller presentation, mobile-optimized for easy sharing, square format perfect for messaging apps, honest product showcase, 4k resolution',
    negativePrompt: 'cluttered, dark, overly artistic, poor product visibility, messy background, unprofessional bad lighting, too fancy, unclear',
    aspectRatio: '1:1',
    strength: 0.65,
    popular: true
  },
  {
    id: 'malaysian-premium',
    name: 'Malaysian Premium',
    platform: 'Multi-platform',
    description: 'Premium quality for upmarket Malaysian buyers',
    prompt: 'Transform this product into premium Malaysian market style, high-quality professional product photography, product on elegant clean background with subtle premium elements, sophisticated lighting highlighting quality and craftsmanship, aspirational yet accessible to Malaysian middle-upper class, modern Malaysian premium aesthetic, product presented beautifully showing attention to detail, clean and refined composition, upmarket positioning while remaining relatable, commercial photography quality, suitable for premium Malaysian brands, neutral sophisticated color palette, professional studio-quality lighting, square or vertical format, luxury meets accessibility, 6k high resolution',
    negativePrompt: 'cheap-looking, messy, poor quality, overly casual, cluttered, bad lighting, amateur, too flashy, inaccessible luxury, western-only premium',
    aspectRatio: '4:5',
    strength: 0.6,
    popular: false
  },
  {
    id: 'ramadan-raya',
    name: 'Raya/Festive Style',
    platform: 'Seasonal',
    description: 'Festive style for Ramadan, Raya, and Malaysian celebrations',
    prompt: 'Transform this product into Malaysian festive celebration style perfect for Raya, Ramadan, or cultural festivities, product beautifully presented with subtle festive elements and warm celebratory mood, traditional Malaysian color touches like green, gold, or festive tones, product as perfect gift or celebration item, warm inviting lighting creating festive atmosphere, cultural sensitivity and Malaysian multicultural appeal, family and togetherness implied, premium festive feel while accessible, suitable for Hari Raya, Chinese New Year, Deepavali promotions, product clearly visible with celebratory styling, festive but not overwhelming, Malaysian festive market aesthetic, 4k resolution',
    negativePrompt: 'dull, boring, inappropriate cultural elements, too commercial, Western Christmas only, messy, unclear product, offensive, poor taste, chaotic',
    aspectRatio: '1:1',
    strength: 0.65,
    popular: false
  },
];

// Get popular styles for quick selection
export const getPopularStyles = (): AdvertisingStyle[] => {
  return ADVERTISING_STYLES.filter(style => style.popular);
};

// Get styles by platform
export const getStylesByPlatform = (platform: string): AdvertisingStyle[] => {
  return ADVERTISING_STYLES.filter(style => style.platform === platform);
};

// Get all unique platforms
export const getAllPlatforms = (): string[] => {
  return Array.from(new Set(ADVERTISING_STYLES.map(style => style.platform)));
};
