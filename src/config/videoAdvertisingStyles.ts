// Malaysia-focused video advertising styles for batch video generation
// All templates are text2video: user's product photo becomes the starting frame
// Organized as platform series: selecting a platform generates 5 video variations

export interface VideoAdvertisingStyle {
  id: string;
  name: string;
  platform: string;
  seriesNumber: number; // 1-5 indicating order in series
  description: string;
  prompt: string;
  aspectRatio: string;
  duration: number; // seconds
  icon?: string;
}

export interface VideoPlatformSeries {
  id: string;
  name: string;
  description: string;
  popular: boolean;
  icon?: string;
  styles: VideoAdvertisingStyle[];
}

// Malaysian video advertising styles - organized by platform
const VIDEO_STYLES_DATA: VideoAdvertisingStyle[] = [
  // ==================== SHOPEE MALAYSIA VIDEO SERIES (5 variations) ====================
  {
    id: 'shopee-video-1-showcase',
    name: 'Product Showcase Spin',
    platform: 'Shopee Malaysia',
    seriesNumber: 1,
    description: 'Clean 360° product rotation with orange energy',
    prompt: 'Shopee Malaysia product showcase video with smooth 360-degree rotation of product on clean white background with vibrant orange (#EE4D2D) accent elements appearing, professional studio lighting making product details clearly visible throughout rotation, product centered and maintains focus while rotating smoothly showing all angles, orange burst effects and Shopee-style graphic elements subtly animated in background, energetic upbeat feel with flash sale energy, product features highlighted with small animated callouts, mobile-optimized vertical or square format perfect for Shopee feed, clean modern e-commerce video aesthetic, bright cheerful presentation, Malaysian marketplace video style, smooth camera-like rotation, 5-second engaging loop',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'shopee-video-2-lifestyle',
    name: 'Lifestyle Quick Demo',
    platform: 'Shopee Malaysia',
    seriesNumber: 2,
    description: 'Product in use showing Malaysian daily life',
    prompt: 'Shopee Malaysia lifestyle video showing product in authentic Malaysian home setting transitioning from static display to implied usage context, warm bright lighting creating inviting atmosphere, product prominently featured with orange accent touches appearing through animation, quick demonstration of product benefit or application, relatable middle-class Malaysian environment, family-friendly wholesome presentation, natural camera movement suggesting handheld authenticity, practical everyday scenario building trust, value-for-money aesthetic, mobile-optimized format, Southeast Asian lifestyle video style, honest and approachable, 5-second engaging story',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'shopee-video-3-features',
    name: 'Features Highlight Sequence',
    platform: 'Shopee Malaysia',
    seriesNumber: 3,
    description: 'Multiple angles revealing key features',
    prompt: 'Shopee Malaysia features video with quick sequential cuts showing product from multiple strategic angles, white background with orange accent frames and transitions, each angle highlighting different feature or detail with subtle zoom-ins, bright consistent studio lighting across all shots, orange graphic elements and feature callouts appearing dynamically, professional product videography showing quality and thoroughness, informative presentation building buyer confidence, fast-paced energetic editing matching Shopee brand energy, mobile-friendly composition, comprehensive feature showcase, Malaysian e-commerce video style, 5-second feature highlight sequence',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'shopee-video-4-before-after',
    name: 'Transformation Video',
    platform: 'Shopee Malaysia',
    seriesNumber: 4,
    description: 'Dynamic before/after showing product benefit',
    prompt: 'Shopee Malaysia transformation video showing dramatic before-and-after comparison with smooth transition effect, split-screen or wipe transition revealing product benefit, orange transition effects following Shopee aesthetic, both states well-lit for fair comparison, product benefit immediately obvious and satisfying, professional video editing maintaining credibility, visual proof of quality or effectiveness, Malaysian market value demonstration, engaging transformation storytelling, mobile-optimized format, trust-building through transparent comparison, energetic presentation, 5-second transformation reveal',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'shopee-video-5-sale',
    name: 'Flash Sale Animation',
    platform: 'Shopee Malaysia',
    seriesNumber: 5,
    description: 'High-energy promotional video with motion',
    prompt: 'Shopee Malaysia flash sale promotional video with maximum energy, vibrant orange (#EE4D2D) burst animations and sale graphics appearing dynamically, product featured with energetic camera movement or zoom effects, bright high-key lighting creating excitement, animated discount badges and price callouts, promotional video creating urgent call-to-action, product clearly visible despite energetic effects, deal-focused composition with savings highlighted, orange and white animated elements, mobile shopping optimized with thumb-stopping motion, Southeast Asian flash sale video aesthetic, urgent limited-time feeling, Malaysian consumer excitement, 5-second sale announcement',
    aspectRatio: '1:1',
    duration: 5
  },

  // ==================== LAZADA MALAYSIA VIDEO SERIES (5 variations) ====================
  {
    id: 'lazada-video-1-premium',
    name: 'Premium Reveal',
    platform: 'Lazada Malaysia',
    seriesNumber: 1,
    description: 'Elegant product reveal with blue accents',
    prompt: 'Lazada Malaysia premium product reveal video with sophisticated slow camera push-in or elegant rotation, clean white background with subtle blue (#0F156D) accent elements appearing gracefully, professional studio lighting creating quality perception, slightly more refined feel than Shopee while remaining accessible, product elegantly framed with smooth cinematic movement, blue graphic elements and trust badges animating in, premium yet approachable aesthetic for Malaysian middle class, LazMall quality presentation, smooth polished videography, mobile-optimized composition, established brand video style, reliable and trustworthy feel, 5-second elegant showcase',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'lazada-video-2-lifestyle',
    name: 'Aspirational Living',
    platform: 'Lazada Malaysia',
    seriesNumber: 2,
    description: 'Premium lifestyle context video',
    prompt: 'Lazada Malaysia aspirational lifestyle video showing product in modern middle-to-upper class Malaysian home with smooth camera movement, refined setting suggesting quality choices, product as centerpiece with elegant reveal or demonstration, soft cinematic lighting creating premium atmosphere, blue accent touches through environment or graphics, product quality evident in context, sophisticated yet relatable presentation, Malaysian aspirational home aesthetic, family-oriented premium lifestyle, trust-building through elegant presentation, mobile-optimized format, lifestyle e-commerce video, 5-second aspirational story',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'lazada-video-3-features',
    name: 'Quality Features Tour',
    platform: 'Lazada Malaysia',
    seriesNumber: 3,
    description: 'Smooth feature highlights with detail shots',
    prompt: 'Lazada Malaysia quality features video with smooth camera movements showcasing product from multiple angles, elegant transitions between views with blue accent graphics, white background maintaining premium feel, each angle highlighting quality features and build details, consistent professional lighting, blue divider animations following Lazada brand, detailed videography emphasizing quality materials and construction, feature callouts appearing elegantly, comprehensive presentation building trust in quality, LazMall quality standard, mobile-friendly sophisticated video, Malaysian consumer quality expectations, 5-second feature showcase',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'lazada-video-4-authenticity',
    name: 'Brand Trust Video',
    platform: 'Lazada Malaysia',
    seriesNumber: 4,
    description: 'Authenticity and certification showcase',
    prompt: 'Lazada Malaysia authenticity video showcasing product with elegant animations of brand logos, quality seals, and certification indicators appearing, clean white background with blue premium elements, smooth product rotation or camera movement, professional presentation highlighting genuine quality, LazMall badge and trust indicators animating in, Malaysian consumer trust-building for genuine products, premium reliable aesthetic, official seller video presentation, quality details clearly shown, blue and white elegant graphics, established marketplace credibility video, mobile-optimized format, 5-second trust showcase',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'lazada-video-5-sale',
    name: 'Blue Sale Campaign',
    platform: 'Lazada Malaysia',
    seriesNumber: 5,
    description: 'Premium sale video with blue energy',
    prompt: 'Lazada Malaysia sale campaign video with energetic yet sophisticated blue-themed animations, product with dynamic camera movement on white-to-blue gradient background, Lazada blue (#0F156D) promotional elements appearing with premium polish, bright professional lighting, animated discount badges and voucher indicators, sale video maintaining quality feel distinguishing from Shopee, product remains clearly visible, deal-focused yet trustworthy presentation, blue and white animated elements, mobile shopping optimized with premium energy, Malaysian consumer sale excitement with quality assurance, 5-second premium sale',
    aspectRatio: '1:1',
    duration: 5
  },

  // ==================== INSTAGRAM MALAYSIA VIDEO SERIES (5 variations) ====================
  {
    id: 'instagram-video-1-feed',
    name: 'Feed Aesthetic Video',
    platform: 'Instagram Malaysia',
    seriesNumber: 1,
    description: 'Beautiful curated feed-style video',
    prompt: 'Instagram Malaysia aesthetic feed video with beautifully styled product cinematography, smooth camera movements revealing product in curated setting, cohesive color palette with trending Malaysian Instagram aesthetic, soft natural lighting creating elegant depth, product as focal point with lifestyle props adding context, modern trendy camera work, feed-cohesive visual storytelling, warm inviting mood, professional content creator quality, vertical or square format optimized for feed, authentic premium feel, engaging motion capturing attention, 5-second aesthetic story',
    aspectRatio: '4:5',
    duration: 5
  },
  {
    id: 'instagram-video-2-reels',
    name: 'Reels Viral Style',
    platform: 'Instagram Malaysia',
    seriesNumber: 2,
    description: 'Dynamic Reels-optimized video',
    prompt: 'Instagram Malaysia Reels-style video with bold dynamic camera movements and quick cuts, product featured with trending video techniques popular in Malaysian Reels, vibrant colors optimized for mobile viewing, energetic pacing with beat-driven editing feel, product clearly visible in attention-grabbing presentation, trendy transitions and effects, modern Malaysian content creator aesthetic, entertainment-first approach, authentic yet polished quality, product benefit quickly demonstrated, vertical 9:16 format filling phone screen, scroll-stopping motion and energy, 5-second viral-style clip',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'instagram-video-3-story',
    name: 'Story Engagement Video',
    platform: 'Instagram Malaysia',
    seriesNumber: 3,
    description: 'Vertical story-optimized video',
    prompt: 'Instagram Malaysia Story-format video with vertical composition and casual dynamic camera work, product prominently featured with authentic Malaysian aesthetic, bright vibrant presentation optimized for mobile story viewing, product shown with natural movement or demonstration, space for story stickers and text overlays, trendy story-style cinematography, genuine relatable vibe, product clearly visible throughout, engaging motion encouraging interaction, Malaysian youth appeal, modern energetic feel, vertical 9:16 storytelling, mobile-native aesthetic, 5-second story clip',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'instagram-video-4-carousel',
    name: 'Carousel Video Segment',
    platform: 'Instagram Malaysia',
    seriesNumber: 4,
    description: 'Swipeable carousel-style video',
    prompt: 'Instagram Malaysia carousel video with consistent aesthetic for multi-video series, smooth single-take camera movement showcasing product, cohesive styling for carousel flow, product from key angle with beautiful composition, soft even lighting, color scheme works in series format, engaging camera work encouraging swipe-through, modern Malaysian Instagram aesthetic, aspirational yet authentic, professional influencer quality, vertical or square format, carousel-optimized presentation, 5-second series segment',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'instagram-video-5-boomerang',
    name: 'Boomerang Loop Effect',
    platform: 'Instagram Malaysia',
    seriesNumber: 5,
    description: 'Satisfying loop-back video style',
    prompt: 'Instagram Malaysia boomerang-style video with satisfying loop-back effect, product featured with simple repeating motion that works forwards and backwards, clean composition perfect for loop, trendy Malaysian Instagram aesthetic, product clearly visible throughout loop, engaging repetitive motion, modern content creator style, vertical or square format, loop-optimized movement, authentic Malaysian taste, mobile-native presentation, satisfying and hypnotic loop, 3-second clip that loops seamlessly',
    aspectRatio: '1:1',
    duration: 3
  },

  // ==================== TIKTOK MALAYSIA VIDEO SERIES (5 variations) ====================
  {
    id: 'tiktok-video-1-showcase',
    name: 'Viral Product Reveal',
    platform: 'TikTok Malaysia',
    seriesNumber: 1,
    description: 'Bold scroll-stopping product video',
    prompt: 'TikTok Malaysia viral product showcase video with dramatic reveal or transformation, bold dynamic camera movements stopping mid-scroll, product displayed with eye-catching presentation, vibrant highly saturated colors optimized for phone screens, energetic editing with quick cuts or transitions, authentic Malaysian TikTok style not overly polished, product benefit or wow-factor immediately visible, space for text overlay, Gen Z and millennial appeal, entertainment-first product showcase, vertical 9:16 mobile-native format, scroll-stopping motion and energy, 5-second viral clip',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'tiktok-video-2-tutorial',
    name: 'Quick Tutorial Demo',
    platform: 'TikTok Malaysia',
    seriesNumber: 2,
    description: 'Fast how-to demonstration video',
    prompt: 'TikTok Malaysia quick tutorial video showing product usage from user perspective, fast-paced demonstration with clear steps, product benefit immediately understandable, natural lighting creating authentic tutorial feel, quick cuts keeping pace energetic, hands-on demonstration implying ease of use, authentic Malaysian TikTok tutorial aesthetic, educational yet entertaining, product as tutorial hero, text overlay space for step numbers, relatable and easy-to-follow, trust-building through practical demo, vertical 9:16 format, mobile-optimized tutorial, 5-second how-to',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'tiktok-video-3-unboxing',
    name: 'Unboxing First Impression',
    platform: 'TikTok Malaysia',
    seriesNumber: 3,
    description: 'Exciting unboxing reveal video',
    prompt: 'TikTok Malaysia unboxing video with authentic reveal moment, product emerging from packaging with exciting presentation, hands-on unboxing aesthetic popular in Malaysian TikTok, natural lighting creating genuine review feel, product revealed attractively, first impression freshness and authenticity, quick energetic pacing, honest product showcase, vibrant engaging presentation, relatable Malaysian consumer perspective, trust-building through genuine unboxing, vertical 9:16 mobile format, TikTok unboxing aesthetic, 5-second reveal moment',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'tiktok-video-4-comparison',
    name: 'Before/After Transformation',
    platform: 'TikTok Malaysia',
    seriesNumber: 4,
    description: 'Dramatic transformation video',
    prompt: 'TikTok Malaysia before-after transformation video with bold dramatic reveal, split-screen or creative transition showing product impact, clear visual difference with satisfying transformation, product benefit immediately obvious, space for BEFORE/AFTER text overlays, authentic Malaysian TikTok aesthetic, vibrant colors and energetic editing, transformation storytelling perfect for TikTok, scroll-stopping visual proof, honest comparison building trust, vertical 9:16 format, mobile-optimized dramatic reveal, 5-second transformation',
    aspectRatio: '9:16',
    duration: 5
  },
  {
    id: 'tiktok-video-5-trend',
    name: 'Trending Format Video',
    platform: 'TikTok Malaysia',
    seriesNumber: 5,
    description: 'Current TikTok trend integration',
    prompt: 'TikTok Malaysia trending video format with product integrated into current viral trend, bold energetic vertical composition following trending patterns, product clearly featured while matching trend aesthetic, vibrant colors and dynamic editing, modern Gen Z Malaysian TikTok taste, product in trendy context, space for trending audio or catchphrase text, authentic casual Malaysian vibe, product benefit obvious while fitting trend, entertainment-first with product naturally featured, vertical 9:16 mobile format, trend-aware cultural relevance, 5-second trend clip',
    aspectRatio: '9:16',
    duration: 5
  },

  // ==================== FACEBOOK MALAYSIA VIDEO SERIES (5 variations) ====================
  {
    id: 'facebook-video-1-showcase',
    name: 'Marketplace Product Video',
    platform: 'Facebook Malaysia',
    seriesNumber: 1,
    description: 'Honest straightforward product video',
    prompt: 'Facebook Marketplace Malaysia product video with straightforward camera movements showing product clearly, honest authentic presentation, simple clean background or real setting, natural good lighting showing true product details, not overly professional but trustworthy quality, smooth handheld-style camera work, product shown from multiple angles, Malaysian personal seller or small business video aesthetic, practical presentation building trust, clear demonstration of product condition and features, mobile-optimized square or vertical format, genuine marketplace video style, 5-second honest showcase',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'facebook-video-2-demo',
    name: 'Usage Demonstration',
    platform: 'Facebook Malaysia',
    seriesNumber: 2,
    description: 'Product in real-world use',
    prompt: 'Facebook Malaysia usage demonstration video showing product in authentic Malaysian context, real-life setting not studio, product demonstrated in practical application, casual camera work creating honest feel, natural home or environment lighting, product clearly visible while showing real usage, Malaysian middle-class lifestyle context, family-friendly authentic presentation, trust-building through genuine non-staged demo, mobile phone video quality but clear, practical everyday usage, vertical or square format, 5-second usage demo',
    aspectRatio: '4:5',
    duration: 5
  },
  {
    id: 'facebook-video-3-features',
    name: 'Feature Walkthrough',
    platform: 'Facebook Malaysia',
    seriesNumber: 3,
    description: 'Multiple angles and details',
    prompt: 'Facebook Malaysia feature walkthrough video with camera panning across product showing different angles and details, consistent natural lighting throughout, authentic seller documentation style, product shown comprehensively, practical presentation helping buyer confidence, Malaysian casual seller standard, trustworthy thorough showcase, smooth but simple camera movements, all features clearly visible, mobile-friendly video, square format, 5-second feature tour',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'facebook-video-4-closeup',
    name: 'Quality Close-Up Video',
    platform: 'Facebook Malaysia',
    seriesNumber: 4,
    description: 'Detail video showing quality',
    prompt: 'Facebook Malaysia quality close-up video with slow camera movement revealing product details, honest documentation showing condition and quality, natural good lighting revealing textures, product detail clearly visible building buyer trust, authentic Malaysian seller style, practical detail videography, clean or natural background, trust-building through transparency, mobile phone video aesthetic but clear and well-lit, genuine quality showcase, vertical or square format, 5-second detail reveal',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'facebook-video-5-promo',
    name: 'Shop Sale Video',
    platform: 'Facebook Malaysia',
    seriesNumber: 5,
    description: 'Small business promotional video',
    prompt: 'Facebook Shop Malaysia sale promotional video with product featured and simple animated sale elements appearing, clean presentation with promotional energy, product clearly visible throughout, good lighting showing quality, animated discount or free shipping graphics, Malaysian small business video aesthetic, trustworthy business page presentation, product details clear and attractive, promotional but maintaining credibility, mobile-friendly composition, square format, 5-second sale announcement',
    aspectRatio: '1:1',
    duration: 5
  },

  // ==================== WHATSAPP BUSINESS MALAYSIA VIDEO SERIES (5 variations) ====================
  {
    id: 'whatsapp-video-1-showcase',
    name: 'Catalog Product Video',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 1,
    description: 'Clean professional product video',
    prompt: 'WhatsApp Business Malaysia catalog video with smooth 360-degree rotation or simple camera movement, pure white background, product perfectly centered and well-framed, even studio-quality lighting showing all details, professional catalog video suitable for WhatsApp Business, product clearly visible throughout, Malaysian SME business quality standard, trustworthy presentation, smooth rotation or reveal, suitable for mobile messaging and sharing, square format, 5-second catalog video',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'whatsapp-video-2-features',
    name: 'Feature Highlight Video',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 2,
    description: 'Key features demonstration',
    prompt: 'WhatsApp Business Malaysia features video with camera movements highlighting key product features, white or very light clean background, excellent lighting revealing details, smooth transitions between feature highlights, professional SME video quality, Malaysian small business standard, feature callouts space, trust-building through clear presentation, product details visible, suitable for answering customer questions, mobile-optimized clear video, square format, 5-second feature highlights',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'whatsapp-video-3-lifestyle',
    name: 'Usage Context Video',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 3,
    description: 'Product in clean usage context',
    prompt: 'WhatsApp Business Malaysia lifestyle video showing product in clean simple context, light neutral background, smooth camera movement showing product and usage, natural even lighting, neat composition keeping product clear, Malaysian small business lifestyle video, professional but not overly styled, product details visible while showing practical application, clean background not distracting, trustworthy presentation, suitable for catalog and messaging, square format, 5-second usage video',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'whatsapp-video-4-detail',
    name: 'Detail Close-Up Video',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 4,
    description: 'Quality detail reveal',
    prompt: 'WhatsApp Business Malaysia detail video with slow camera push-in revealing product quality and texture, white or very light background, excellent lighting showing craftsmanship, smooth camera movement to detail, professional close-up videography, Malaysian SME detail documentation, trust-building through clarity, clean composition focusing on quality, suitable for quality questions, mobile-optimized detail visibility, square format, 5-second detail reveal',
    aspectRatio: '1:1',
    duration: 5
  },
  {
    id: 'whatsapp-video-5-package',
    name: 'Package Contents Video',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 5,
    description: 'What customer receives',
    prompt: 'WhatsApp Business Malaysia package video with camera panning across all included items in organized arrangement, white clean background, even lighting showing everything clearly, smooth camera movement revealing complete package, professional honest presentation showing value, Malaysian online business packaging video, trust-building through transparency, all items clearly visible, suitable for "what is included" questions, mobile-friendly clear video, square format, 5-second package tour',
    aspectRatio: '1:1',
    duration: 5
  }
];

// Group video styles by platform
export const VIDEO_PLATFORM_SERIES: VideoPlatformSeries[] = [
  {
    id: 'shopee',
    name: 'Shopee Malaysia',
    description: '5-video series with orange energy and flash sale motion',
    popular: true,
    styles: VIDEO_STYLES_DATA.filter(s => s.platform === 'Shopee Malaysia')
  },
  {
    id: 'lazada',
    name: 'Lazada Malaysia',
    description: '5-video series with premium blue aesthetic and quality motion',
    popular: true,
    styles: VIDEO_STYLES_DATA.filter(s => s.platform === 'Lazada Malaysia')
  },
  {
    id: 'instagram',
    name: 'Instagram Malaysia',
    description: '5-video series with feed, reels, and story formats',
    popular: true,
    styles: VIDEO_STYLES_DATA.filter(s => s.platform === 'Instagram Malaysia')
  },
  {
    id: 'tiktok',
    name: 'TikTok Malaysia',
    description: '5-video series with viral trends and entertainment motion',
    popular: true,
    styles: VIDEO_STYLES_DATA.filter(s => s.platform === 'TikTok Malaysia')
  },
  {
    id: 'facebook',
    name: 'Facebook Malaysia',
    description: '5-video series with authentic marketplace motion',
    popular: false,
    styles: VIDEO_STYLES_DATA.filter(s => s.platform === 'Facebook Malaysia')
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Malaysia',
    description: '5-video series with clean catalog presentations',
    popular: true,
    styles: VIDEO_STYLES_DATA.filter(s => s.platform === 'WhatsApp Business Malaysia')
  }
];

// Export all video styles
export const VIDEO_ADVERTISING_STYLES = VIDEO_STYLES_DATA;

// Get all video platforms
export const getAllVideoPlatforms = (): VideoPlatformSeries[] => {
  return VIDEO_PLATFORM_SERIES;
};

// Get popular video platforms
export const getPopularVideoPlatforms = (): VideoPlatformSeries[] => {
  return VIDEO_PLATFORM_SERIES.filter(p => p.popular);
};

// Get video platform by ID
export const getVideoPlatformById = (id: string): VideoPlatformSeries | undefined => {
  return VIDEO_PLATFORM_SERIES.find(p => p.id === id);
};

// Get video styles for a platform
export const getVideoStylesByPlatform = (platformId: string): VideoAdvertisingStyle[] => {
  const platform = getVideoPlatformById(platformId);
  return platform?.styles || [];
};
