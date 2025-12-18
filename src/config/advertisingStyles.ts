// Malaysia-focused advertising styles for batch product image generation
// All templates are img2img-based: user uploads simple product photo, AI transforms it
// Organized as platform series: selecting a platform generates 5 variations

export interface AdvertisingStyle {
  id: string;
  name: string;
  platform: string;
  seriesNumber: number; // 1-5 indicating order in series
  description: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  strength: number; // img2img strength
  icon?: string;
}

export interface PlatformSeries {
  id: string;
  name: string;
  description: string;
  popular: boolean;
  icon?: string;
  styles: AdvertisingStyle[];
}

// Malaysian marketplace advertising styles - organized by platform
const ADVERTISING_STYLES_DATA: AdvertisingStyle[] = [
  // ==================== SHOPEE MALAYSIA SERIES (5 variations) ====================
  {
    id: 'shopee-1-hero',
    name: 'Hero Product Shot',
    platform: 'Shopee Malaysia',
    seriesNumber: 1,
    description: 'Bold main product showcase with Shopee orange energy',
    prompt: 'Transform this product into Shopee Malaysia hero product shot, vibrant orange (#EE4D2D) and white color scheme, product centered and prominently displayed on clean white background with subtle orange gradient elements, bright studio lighting making product details pop and colors vivid, professional e-commerce photography creating trust and quality perception, product takes up 60-70% of frame showing all important features clearly, space for Shopee orange badges and price overlays, clean modern composition, sharp product details and textures visible, Southeast Asian marketplace aesthetic, energetic and inviting presentation, mobile shopping optimized square format, deal-focused visual language, Malaysian consumer appeal, commercial product photography quality, 4k resolution',
    negativePrompt: 'dark, muted colors, cluttered, messy background, poor product visibility, blurry, low quality, complicated, premium luxury only, western-only aesthetic, unclear details, boring',
    aspectRatio: '1:1',
    strength: 0.65
  },
  {
    id: 'shopee-2-lifestyle',
    name: 'Lifestyle Context',
    platform: 'Shopee Malaysia',
    seriesNumber: 2,
    description: 'Product in daily Malaysian life setting',
    prompt: 'Transform this product into Shopee Malaysia lifestyle photography showing product in authentic Malaysian home or daily use setting, product as hero item in clean organized arrangement suggesting everyday practicality, bright natural window lighting creating warm approachable mood, neat middle-class Malaysian home environment with relatable props and setting, orange accent touches subtly integrated through styling elements, product clearly visible and details sharp while showing real-life usage context, family-friendly wholesome atmosphere, affordable quality aesthetic not luxury, practical everyday scenario building trust, clean composition with neutral background allowing product to stand out, value-for-money presentation, honest and relatable, mobile-optimized square format, Southeast Asian lifestyle photography, 4k resolution',
    negativePrompt: 'luxury mansion, expensive decor, western-only setting, dark moody lighting, overly styled, boutique feel, messy, cluttered, impractical, unclear product, chaotic',
    aspectRatio: '1:1',
    strength: 0.7
  },
  {
    id: 'shopee-3-features',
    name: 'Features Highlight',
    platform: 'Shopee Malaysia',
    seriesNumber: 3,
    description: 'Multiple angles showing product features',
    prompt: 'Transform this product into Shopee Malaysia features showcase layout, product shown from multiple key angles in clean grid or sequential arrangement, white background keeping focus on product variations and details, each angle clearly displaying different features and benefits, bright even studio lighting ensuring all details visible across all views, orange accent lines or borders separating different views following Shopee brand, professional product photography showing quality and thoroughness, space for feature callout text and specification highlights, comparison or detail shots showing quality and value, informative and comprehensive presentation building buyer confidence, mobile-friendly layout, practical e-commerce photography, Malaysian consumer-focused, square format, 4k resolution',
    negativePrompt: 'single angle only, unclear details, poor lighting, inconsistent quality, cluttered, messy, confusing layout, boring, static, low quality',
    aspectRatio: '1:1',
    strength: 0.65
  },
  {
    id: 'shopee-4-comparison',
    name: 'Before/After or Size Comparison',
    platform: 'Shopee Malaysia',
    seriesNumber: 4,
    description: 'Comparison shot showing value or transformation',
    prompt: 'Transform this product into Shopee Malaysia comparison style showing product effectiveness or value proposition, before-after split or side-by-side size comparison demonstrating product benefit clearly, clean white background with orange dividing line following Shopee aesthetic, both sides equally well-lit for fair honest comparison, product benefit or improvement immediately obvious and compelling, professional product photography maintaining credibility, visual proof of quality or functionality, Malaysian market expectations for value demonstration, practical comparison relatable to everyday use, text-ready spaces for labels, trust-building through transparent comparison, mobile-optimized square format, commercial e-commerce photography, 4k resolution',
    negativePrompt: 'unclear comparison, misleading, poor lighting mismatch, confusing, too subtle difference, fake-looking, cluttered, messy, unprofessional',
    aspectRatio: '1:1',
    strength: 0.68
  },
  {
    id: 'shopee-5-promo',
    name: 'Flash Sale Promo',
    platform: 'Shopee Malaysia',
    seriesNumber: 5,
    description: 'High-energy promotional flash sale style',
    prompt: 'Transform this product into Shopee Malaysia flash sale promotional style, maximum energy and urgency through vibrant orange (#EE4D2D) dominating the composition, product clearly displayed on dynamic orange-to-white gradient background with burst or ray effects, bright high-key lighting making everything pop with excitement, space for large discount percentages and flash sale badges, promotional e-commerce photography creating strong call-to-action, product remains clearly visible despite energetic background, deal-focused composition with room for price strike-through and savings highlight, orange and white color explosion following Shopee brand, mobile shopping optimized creating thumb-stopping effect, Southeast Asian flash sale aesthetic, urgent limited-time feeling, Malaysian consumer excitement triggers, square format, 4k resolution',
    negativePrompt: 'subtle, calm, boring, dark, muted, unclear product, too busy product invisible, confusing, low energy, professional only, luxury feel',
    aspectRatio: '1:1',
    strength: 0.65
  },

  // ==================== LAZADA MALAYSIA SERIES (5 variations) ====================
  {
    id: 'lazada-1-hero',
    name: 'Premium Hero Shot',
    platform: 'Lazada Malaysia',
    seriesNumber: 1,
    description: 'Elegant main product with blue accents',
    prompt: 'Transform this product into Lazada Malaysia premium hero shot, sophisticated blue and white color scheme with Lazada blue (#0F156D) accent elements, product elegantly centered on clean white background with subtle blue gradient touches, professional studio lighting creating quality perception, slightly more premium feel than Shopee while remaining accessible to Malaysian middle class, product occupies 60-70% of frame showing quality craftsmanship and details, space for blue LazMall badges and trust indicators, clean modern e-commerce composition, sharp product photography showing texture and build quality, established brand aesthetic, reliable and trustworthy presentation, mobile-optimized square format, Malaysian consumer aspiration balanced with affordability, commercial product photography, 4k resolution',
    negativePrompt: 'cheap-looking, cluttered, dark, messy, poor lighting, unclear details, too luxury inaccessible, overly casual, boring, low quality',
    aspectRatio: '1:1',
    strength: 0.65
  },
  {
    id: 'lazada-2-lifestyle',
    name: 'Aspirational Lifestyle',
    platform: 'Lazada Malaysia',
    seriesNumber: 2,
    description: 'Product in refined Malaysian home setting',
    prompt: 'Transform this product into Lazada Malaysia aspirational lifestyle photography, product in modern middle-to-upper class Malaysian home setting showing refined taste, clean organized environment with quality furniture and styling suggesting success and good choices, product as centerpiece in thoughtfully composed scene, soft natural lighting creating premium warm atmosphere, blue accent touches through styling elements following Lazada brand, product clearly visible showing quality in real-life premium context, family-oriented professional lifestyle, trust and reliability through sophisticated presentation, practical yet elevated scenario, Malaysian aspirational home aesthetic, honest quality showcase, mobile-optimized square format, lifestyle e-commerce photography, 4k resolution',
    negativePrompt: 'messy, cheap decor, dark, overly luxury mansion, western-only, cluttered, unclear product, too casual, boring, impractical',
    aspectRatio: '1:1',
    strength: 0.68
  },
  {
    id: 'lazada-3-features',
    name: 'Quality Features Showcase',
    platform: 'Lazada Malaysia',
    seriesNumber: 3,
    description: 'Detailed multi-angle feature presentation',
    prompt: 'Transform this product into Lazada Malaysia quality features showcase, product displayed from multiple strategic angles in elegant grid layout, white background maintaining premium feel with blue accent dividers, each angle highlighting specific quality features and build details, professional even studio lighting ensuring consistent quality across all views, blue line separators or borders following Lazada brand identity, detailed product photography emphasizing quality materials and construction, space for feature highlights and quality certifications, comprehensive informative presentation building trust in product quality, LazMall quality standard aesthetic, mobile-friendly sophisticated layout, Malaysian consumer quality expectations, square format, 4k resolution',
    negativePrompt: 'single view only, poor detail, inconsistent lighting, messy, cluttered, cheap-looking, confusing layout, boring, amateur',
    aspectRatio: '1:1',
    strength: 0.65
  },
  {
    id: 'lazada-4-authenticity',
    name: 'Brand Authenticity Proof',
    platform: 'Lazada Malaysia',
    seriesNumber: 4,
    description: 'Product with authenticity and quality indicators',
    prompt: 'Transform this product into Lazada Malaysia authenticity showcase style, product displayed with elements suggesting genuine brand quality and certification, clean white background with blue premium accent elements, professional product photography highlighting brand logos, quality seals, or authenticity indicators, well-lit showing product genuine details and official packaging, space for LazMall badge, free shipping indicator, and authenticity guarantees, trust-building composition for Malaysian consumers concerned with genuine products, premium reliable aesthetic, official seller presentation, product details sharp and verifiable, blue and white color scheme, established marketplace credibility, mobile-optimized square format, 4k resolution',
    negativePrompt: 'fake-looking, unclear branding, poor quality, messy, cluttered, suspicious, dark, unprofessional, too flashy',
    aspectRatio: '1:1',
    strength: 0.66
  },
  {
    id: 'lazada-5-promo',
    name: 'Blue Sale Campaign',
    platform: 'Lazada Malaysia',
    seriesNumber: 5,
    description: 'Premium sale with blue promotional energy',
    prompt: 'Transform this product into Lazada Malaysia sale campaign style, energetic yet sophisticated blue-themed promotional presentation, product clearly displayed on white-to-blue gradient background with premium burst effects, Lazada blue (#0F156D) dominating promotional elements while maintaining quality feel, bright professional lighting keeping product visible and attractive, space for large discount badges and voucher indicators, sale e-commerce photography with premium touch distinguishing from Shopee, product details remain clear despite promotional energy, deal-focused yet maintaining trust and quality perception, blue and white color balance, mobile shopping optimized with premium feel, Malaysian consumer sale excitement with quality assurance, square format, 4k resolution',
    negativePrompt: 'cheap flashy, too busy product lost, unclear, cluttered, messy, low quality, overly casual, dark, boring',
    aspectRatio: '1:1',
    strength: 0.65
  },

  // ==================== INSTAGRAM MALAYSIA SERIES (5 variations) ====================
  {
    id: 'instagram-1-feed',
    name: 'Aesthetic Feed Post',
    platform: 'Instagram Malaysia',
    seriesNumber: 1,
    description: 'Beautiful curated feed aesthetic',
    prompt: 'Transform this product into Instagram Malaysia aesthetic feed post style, beautifully curated and styled product photography with cohesive color palette using pastel tones or complementary colors popular in Malaysian Instagram aesthetic, product artfully arranged with carefully selected lifestyle props creating aspirational scene, soft natural window light creating gentle shadows and depth, minimalist clean composition with negative space for captions, product as elegant focal point in styled flat-lay or elevated angle, modern trendy Malaysian Instagram taste with cultural inclusivity, feed-cohesive aesthetic matching popular Malaysian influencer styles, warm inviting mood balancing aspiration with authenticity, professional content creator quality, vertical or square format, authentic premium feel, 4-6k resolution optimized for Instagram, engaging and scroll-stopping',
    negativePrompt: 'cluttered, chaotic, harsh lighting, no aesthetic cohesion, boring catalog feel, dated look, messy, corporate, poor composition, ugly',
    aspectRatio: '4:5',
    strength: 0.65
  },
  {
    id: 'instagram-2-story',
    name: 'Story Engagement',
    platform: 'Instagram Malaysia',
    seriesNumber: 2,
    description: 'Vertical story format for mobile viewing',
    prompt: 'Transform this product into Instagram Malaysia Story format vertical composition, product prominently displayed in phone screen-filling 9:16 vertical layout, bright vibrant colors optimized for mobile Instagram viewing, authentic casual Malaysian aesthetic with genuine relatable vibe, product clearly visible in upper-two-thirds leaving space for story interaction stickers and text, natural or ring light creating flattering modern illumination, trendy story-friendly presentation style, genuine enthusiasm and authenticity, product shown in hand or lifestyle context suggesting real usage, engaging and interactive composition, Malaysian youth and millennial appeal, modern energetic feel, vertical storytelling format perfect for swipe-up or product tag, mobile-native aesthetic, 4k vertical resolution',
    negativePrompt: 'horizontal, boring, overly formal, corporate catalog, dark, unclear product, cluttered, dated, poor mobile optimization, static',
    aspectRatio: '9:16',
    strength: 0.7
  },
  {
    id: 'instagram-3-carousel',
    name: 'Carousel Swipe Series',
    platform: 'Instagram Malaysia',
    seriesNumber: 3,
    description: 'Swipeable carousel-style presentation',
    prompt: 'Transform this product into Instagram Malaysia carousel post style, product displayed in clean organized manner perfect for multi-image swipe series, consistent aesthetic across implied multiple frames, product shown from key angle with clear details and beautiful composition, soft even lighting maintaining consistency for carousel flow, cohesive color scheme and styling that works in series, each angle tells part of product story, modern Malaysian Instagram aesthetic with aspirational yet authentic feel, space for subtle slide indicators, product clearly hero in frame with supporting lifestyle elements, engaging composition encouraging swipe-through, vertical or square format, professional influencer content quality, carousel-optimized presentation, 4k resolution',
    negativePrompt: 'inconsistent style, cluttered, messy, poor flow, boring single-angle only, unclear story, chaotic, dated aesthetic',
    aspectRatio: '1:1',
    strength: 0.66
  },
  {
    id: 'instagram-4-influencer',
    name: 'Influencer Endorsement Style',
    platform: 'Instagram Malaysia',
    seriesNumber: 4,
    description: 'Authentic influencer product feature',
    prompt: 'Transform this product into Instagram Malaysia influencer endorsement style, product featured authentically as if Malaysian influencer is genuinely recommending it, natural lifestyle context showing real usage scenario, soft flattering natural light creating trustworthy authentic mood, product clearly visible with relatable styling suggesting honest review, modern Malaysian influencer aesthetic blending aspiration with authenticity, genuine enthusiasm implied through beautiful but not overly perfect composition, space for authentic caption about product experience, lifestyle props suggesting real life not studio, trust-building through relatable presentation, Malaysian multicultural inclusivity, vertical or square format, content creator quality, authentic sponsored post aesthetic, 4-6k resolution',
    negativePrompt: 'fake, overly staged, corporate ad feel, unrelatable, too perfect, suspicious, cluttered, messy, boring, dated',
    aspectRatio: '4:5',
    strength: 0.68
  },
  {
    id: 'instagram-5-reels',
    name: 'Reels Thumbnail',
    platform: 'Instagram Malaysia',
    seriesNumber: 5,
    description: 'Eye-catching reels cover thumbnail',
    prompt: 'Transform this product into Instagram Malaysia Reels thumbnail style, bold eye-catching vertical composition designed to stop mid-scroll, product prominently displayed in dynamic interesting angle, vibrant saturated colors optimized for Reels feed visibility, modern trendy Malaysian aesthetic with entertainment-first approach, product clearly visible in attention-grabbing presentation, space for bold text overlay typical of Reels thumbnails, energetic engaging composition suggesting motion and entertainment, authentic yet polished Malaysian content creator quality, product benefit or transformation immediately apparent, vertical 9:16 format filling phone screen, reels-optimized thumbnail that promises engaging content, mobile-native dynamic presentation, 4k vertical resolution',
    negativePrompt: 'boring, static, corporate, subtle muted colors, unclear product, dated, formal traditional, poor mobile optimization, cluttered messy',
    aspectRatio: '9:16',
    strength: 0.67
  },

  // ==================== TIKTOK MALAYSIA SERIES (5 variations) ====================
  {
    id: 'tiktok-1-hero',
    name: 'Viral Product Showcase',
    platform: 'TikTok Malaysia',
    seriesNumber: 1,
    description: 'Bold scroll-stopping product reveal',
    prompt: 'Transform this product into TikTok Malaysia viral product showcase style, bold dramatic vertical 9:16 composition designed to stop scrolling immediately, product displayed in eye-catching attention-grabbing manner, vibrant highly saturated colors optimized for phone screens and TikTok algorithm preference, product prominently featured with dynamic interesting presentation, natural or ring light creating modern TikTok aesthetic, space for large bold text overlay typical of viral product TikToks, authentic Malaysian TikTok style not overly polished or corporate, product benefit or wow-factor immediately visible, energetic composition suggesting transformation or reveal, Gen Z and millennial Malaysian appeal, entertainment-first product showcase, vertical mobile-native format, 4k resolution',
    negativePrompt: 'boring, static, corporate polished, horizontal, subtle colors, formal traditional, slow-paced feel, unclear product, dated',
    aspectRatio: '9:16',
    strength: 0.7
  },
  {
    id: 'tiktok-2-before-after',
    name: 'Transformation Split',
    platform: 'TikTok Malaysia',
    seriesNumber: 2,
    description: 'Dramatic before/after comparison',
    prompt: 'Transform this product into TikTok Malaysia before-after split style, dramatic compelling transformation showing product impact, vertical split-screen or side-by-side comparison in 9:16 format, clear contrast between before and after states with both sides well-lit, product transformation benefit immediately obvious and satisfying, bold visual difference creating wow-factor, space for "BEFORE" and "AFTER" text overlays, authentic Malaysian TikTok aesthetic with genuine feel, product clearly visible showing dramatic improvement, trust-building through honest comparison, vibrant colors optimized for mobile, transformation storytelling perfect for TikTok, scroll-stopping visual proof, relatable and engaging, vertical mobile format, 4k resolution',
    negativePrompt: 'subtle difference, unclear comparison, confusing, too similar, fake misleading, boring, static, poor lighting mismatch, horizontal',
    aspectRatio: '9:16',
    strength: 0.68
  },
  {
    id: 'tiktok-3-unboxing',
    name: 'Unboxing Moment',
    platform: 'TikTok Malaysia',
    seriesNumber: 3,
    description: 'Exciting product reveal unboxing',
    prompt: 'Transform this product into TikTok Malaysia unboxing moment style, product displayed as if being revealed from packaging in exciting moment, authentic unboxing aesthetic popular in Malaysian TikTok, product clearly visible with packaging or hands implied suggesting real unboxing experience, natural or ring light creating genuine review lighting, vertical 9:16 format capturing unboxing excitement, space for reaction text or commentary overlays, first impression freshness and authenticity, product shown in attractive reveal moment, trust-building through genuine unboxing presentation, vibrant colors and engaging composition, relatable Malaysian consumer perspective, honest product showcase, TikTok unboxing/review aesthetic, mobile-optimized vertical format, 4k resolution',
    negativePrompt: 'overly staged, fake, corporate, boring, unclear product, too perfect suspicious, horizontal, dated, static, messy cluttered',
    aspectRatio: '9:16',
    strength: 0.7
  },
  {
    id: 'tiktok-4-tutorial',
    name: 'Quick Tutorial Style',
    platform: 'TikTok Malaysia',
    seriesNumber: 4,
    description: 'Product in use demonstration',
    prompt: 'Transform this product into TikTok Malaysia tutorial style, product shown in use or demonstration context as if from quick how-to video, vertical 9:16 composition showing product from user perspective, clear visibility of product and its application, natural lighting creating authentic tutorial feel, product benefit and usage immediately understandable from single frame, space for step number or tutorial text overlay, hands or usage context implied showing practical demonstration, authentic Malaysian TikTok tutorial aesthetic, educational yet entertaining presentation, product clearly featured as tutorial hero, relatable and easy-to-follow visual, trust-building through practical demonstration, mobile-optimized vertical format, TikTok tutorial thumbnail aesthetic, 4k resolution',
    negativePrompt: 'unclear usage, confusing, too complex, boring corporate, horizontal, overly polished, fake, static, poor visibility, messy',
    aspectRatio: '9:16',
    strength: 0.68
  },
  {
    id: 'tiktok-5-trend',
    name: 'Trending Audio Style',
    platform: 'TikTok Malaysia',
    seriesNumber: 5,
    description: 'Trendy viral aesthetic thumbnail',
    prompt: 'Transform this product into TikTok Malaysia trending style, product integrated into current TikTok trend aesthetic popular in Malaysia, bold energetic vertical composition following viral content patterns, product clearly displayed while matching trending video aesthetic, vibrant saturated colors and dynamic presentation, modern Gen Z Malaysian TikTok taste, product shown in trendy entertaining context, space for trending audio lyrics or catchphrase text overlay, authentic casual Malaysian TikTok vibe, product benefit obvious while fitting trend format, entertainment-first approach with product naturally featured, scroll-stopping thumbnail energy, vertical 9:16 mobile format, trend-aware cultural relevance, 4k resolution',
    negativePrompt: 'dated, corporate, boring, formal, subtle, horizontal, unclear product, too serious, off-trend, stiff, cluttered',
    aspectRatio: '9:16',
    strength: 0.67
  },

  // ==================== FACEBOOK MALAYSIA SERIES (5 variations) ====================
  {
    id: 'facebook-1-hero',
    name: 'Marketplace Hero',
    platform: 'Facebook Malaysia',
    seriesNumber: 1,
    description: 'Clear honest main product shot',
    prompt: 'Transform this product into Facebook Marketplace Malaysia main listing style, honest straightforward product photography with authentic casual feel, product clearly displayed on simple clean background or real-life setting, natural good lighting showing true product condition and details, not overly professional but clean and trustworthy, product occupies most of frame allowing buyers to see clearly what they are purchasing, Malaysian personal seller or small business aesthetic, practical no-nonsense presentation building trust, product details and features visible for informed decision, mobile-optimized square or slightly vertical format perfect for Facebook feed, genuine Facebook marketplace photography, honest value-for-money presentation, 4k resolution',
    negativePrompt: 'overly professional studio, too perfect suspicious, fake, poor lighting hiding details, messy without authenticity, unclear, dark',
    aspectRatio: '1:1',
    strength: 0.72
  },
  {
    id: 'facebook-2-lifestyle',
    name: 'In-Use Context',
    platform: 'Facebook Malaysia',
    seriesNumber: 2,
    description: 'Product shown in real usage',
    prompt: 'Transform this product into Facebook Malaysia in-use photography, product shown in genuine Malaysian home or daily life context, authentic real-life setting not studio-perfect, product as hero item in natural usage scenario, casual lighting from windows or home lighting creating honest feel, relatable environment showing practical application, product clearly visible while demonstrating real-world use, Malaysian middle-class lifestyle context, family-friendly honest presentation, trust-building through authentic non-staged feel, mobile phone photography quality but good and clear, practical everyday usage, Facebook Shop or Marketplace lifestyle aesthetic, square or vertical format, 4k resolution',
    negativePrompt: 'luxury mansion, overly staged, corporate feel, fake perfect, western-only, unclear product, messy confusing, dark poor lighting',
    aspectRatio: '4:5',
    strength: 0.7
  },
  {
    id: 'facebook-3-multiple',
    name: 'Multi-Angle Details',
    platform: 'Facebook Malaysia',
    seriesNumber: 3,
    description: 'Several views showing condition',
    prompt: 'Transform this product into Facebook Malaysia multi-angle listing style, product shown from multiple important angles in casual grid or collage layout, each view clearly displaying different aspects and condition details, consistent natural lighting showing honest product state, white or real-life background keeping focus on product variations, authentic seller photography showing thoroughness and transparency, space between angles or clean divisions, informative presentation helping buyer confidence, practical Facebook Marketplace documentation style, all angles equally visible and clear, Malaysian casual seller standard, trustworthy comprehensive showcase, mobile-friendly layout, square format, 4k resolution',
    negativePrompt: 'single angle only, inconsistent quality, poor lighting, unclear details, messy confusing layout, too artistic, fake',
    aspectRatio: '1:1',
    strength: 0.7
  },
  {
    id: 'facebook-4-closeup',
    name: 'Quality Close-Up',
    platform: 'Facebook Malaysia',
    seriesNumber: 4,
    description: 'Detail shot showing quality',
    prompt: 'Transform this product into Facebook Malaysia quality close-up style, product detail shot showing quality, condition, or key features up close, natural good lighting revealing textures and true condition, honest close-up building buyer trust through transparency, product detail clearly visible showing what buyer needs to verify, authentic Malaysian seller documentation, practical detail photography common in Facebook listings, clean or natural background focusing attention on detail, trust-building through comprehensive disclosure, mobile phone photography style but clear and well-lit, genuine quality showcase, Facebook marketplace detail documentation aesthetic, square or vertical format, 4k resolution',
    negativePrompt: 'blurry, poor lighting, unclear details, too far away, messy, confusing, overly artistic, fake perfect, misleading',
    aspectRatio: '1:1',
    strength: 0.68
  },
  {
    id: 'facebook-5-promo',
    name: 'Facebook Shop Sale',
    platform: 'Facebook Malaysia',
    seriesNumber: 5,
    description: 'Small business sale promotion',
    prompt: 'Transform this product into Facebook Shop Malaysia sale promotion style, product displayed with small business promotional feel, clean professional-enough presentation with sale energy, product clearly visible on white or light background with subtle sale elements, good even lighting showing product quality, space for discount percentage or free shipping badges, Malaysian small business online shop aesthetic, trustworthy business page presentation not overly flashy, product details clear and attractive, promotional but maintaining credibility, Facebook Shop campaign feel, mobile-friendly composition optimized for Facebook feed, approachable pricing tier promotion, honest sale showcase, square format, 4k resolution',
    negativePrompt: 'too flashy cheap, cluttered messy, unclear product, overly corporate, too casual amateur, dark, confusing, suspicious',
    aspectRatio: '1:1',
    strength: 0.68
  },

  // ==================== WHATSAPP BUSINESS MALAYSIA SERIES (5 variations) ====================
  {
    id: 'whatsapp-1-hero',
    name: 'Catalog Main Photo',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 1,
    description: 'Clean catalog hero shot',
    prompt: 'Transform this product into WhatsApp Business Malaysia catalog hero style, clean simple professional product photo on pure white background, product perfectly centered and well-framed showing all important details, even studio-quality lighting eliminating shadows and showing true colors, catalog-ready professional presentation suitable for WhatsApp Business catalog listing, product occupying 70-80% of frame leaving clean white space, Malaysian SME business standard quality, trustworthy clean online seller presentation, product details sharp and clear for mobile viewing, professional but achievable quality for small business, suitable for easy sharing and messaging, square format perfect for WhatsApp, 4k resolution',
    negativePrompt: 'cluttered, messy background, dark shadows, poor lighting, unprofessional, unclear details, too artistic, amateur bad quality',
    aspectRatio: '1:1',
    strength: 0.65
  },
  {
    id: 'whatsapp-2-white-bg',
    name: 'Pure White Background',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 2,
    description: 'Studio white backdrop product',
    prompt: 'Transform this product into WhatsApp Business Malaysia pure white background style, product photographed on seamless pure white backdrop with professional result, completely clean white background with no shadows or distractions, product evenly lit showing all details clearly, professional catalog photography standard, product centered with perfect framing, colors accurate and vibrant against white, Malaysian online business catalog quality, clean trustworthy presentation, product isolated perfectly for catalog use, easy to view on mobile messaging, professional SME standard, WhatsApp Business catalog optimized, square format, 4k resolution',
    negativePrompt: 'gray background, shadows, messy, cluttered, poor lighting, unclear, amateur, distracting elements, bad isolation',
    aspectRatio: '1:1',
    strength: 0.62
  },
  {
    id: 'whatsapp-3-lifestyle',
    name: 'WhatsApp Lifestyle Shot',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 3,
    description: 'Product in clean usage context',
    prompt: 'Transform this product into WhatsApp Business Malaysia lifestyle style, product shown in clean simple lifestyle context on light neutral background, product clearly visible in minimal usage scenario, natural even lighting showing both product and simple setting, neat organized composition keeping product as clear focus, Malaysian small business lifestyle photography, professional but not overly styled, product details visible while showing practical usage, clean background not distracting from product, trustworthy online seller presentation, suitable for mobile messaging and catalog, easy to understand product application, square format, 4k resolution',
    negativePrompt: 'cluttered, messy, dark, overly styled, unclear product, complicated background, amateur, confusing, poor lighting',
    aspectRatio: '1:1',
    strength: 0.68
  },
  {
    id: 'whatsapp-4-detail',
    name: 'Feature Detail Shot',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 4,
    description: 'Close-up of important feature',
    prompt: 'Transform this product into WhatsApp Business Malaysia feature detail style, close-up shot highlighting important product feature or quality detail, white or very light clean background, excellent lighting revealing texture and craftsmanship, product detail clearly visible building buyer confidence, professional close-up photography showing quality, Malaysian SME business detail documentation, trust-building through transparency and clarity, clean composition focusing on specific feature, suitable for answering customer questions, mobile-optimized clear detail visibility, WhatsApp Business catalog detail shot, square format, 4k resolution',
    negativePrompt: 'blurry, poor lighting, unclear, too far, messy background, amateur, confusing, dark, bad focus',
    aspectRatio: '1:1',
    strength: 0.66
  },
  {
    id: 'whatsapp-5-package',
    name: 'Package Contents Display',
    platform: 'WhatsApp Business Malaysia',
    seriesNumber: 5,
    description: 'What customer receives',
    prompt: 'Transform this product into WhatsApp Business Malaysia package contents style, product displayed with all included items in organized flat-lay arrangement, white clean background showing everything customer will receive, even lighting showing all components clearly, organized neat layout with product as hero, professional honest presentation showing value, Malaysian online business packaging documentation, trust-building through transparency, all items clearly visible and identifiable, suitable for answering "what is included" questions, mobile-friendly clear layout, WhatsApp Business catalog complete package shot, square format, 4k resolution',
    negativePrompt: 'messy, cluttered, unclear what is included, poor lighting, disorganized, confusing, amateur, dark, chaotic',
    aspectRatio: '1:1',
    strength: 0.68
  }
];

// Group styles by platform
export const PLATFORM_SERIES: PlatformSeries[] = [
  {
    id: 'shopee',
    name: 'Shopee Malaysia',
    description: '5-image series with orange energy and value-focused presentation',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Shopee Malaysia')
  },
  {
    id: 'lazada',
    name: 'Lazada Malaysia',
    description: '5-image series with premium blue aesthetic and quality focus',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Lazada Malaysia')
  },
  {
    id: 'instagram',
    name: 'Instagram Malaysia',
    description: '5-image series with aesthetic feed, stories, and influencer styles',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Instagram Malaysia')
  },
  {
    id: 'tiktok',
    name: 'TikTok Malaysia',
    description: '5-image series with viral, trending, and entertainment-first approach',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'TikTok Malaysia')
  },
  {
    id: 'facebook',
    name: 'Facebook Malaysia',
    description: '5-image series with authentic marketplace and shop styles',
    popular: false,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'Facebook Malaysia')
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Malaysia',
    description: '5-image series with clean catalog and professional SME styles',
    popular: true,
    styles: ADVERTISING_STYLES_DATA.filter(s => s.platform === 'WhatsApp Business Malaysia')
  }
];

// Export all styles for backwards compatibility
export const ADVERTISING_STYLES = ADVERTISING_STYLES_DATA;

// Get all platforms
export const getAllPlatforms = (): PlatformSeries[] => {
  return PLATFORM_SERIES;
};

// Get popular platforms
export const getPopularPlatforms = (): PlatformSeries[] => {
  return PLATFORM_SERIES.filter(p => p.popular);
};

// Get platform by ID
export const getPlatformById = (id: string): PlatformSeries | undefined => {
  return PLATFORM_SERIES.find(p => p.id === id);
};

// Get styles for a platform
export const getStylesByPlatform = (platformId: string): AdvertisingStyle[] => {
  const platform = getPlatformById(platformId);
  return platform?.styles || [];
};
