// Template system for A&P Content generation

export type TemplateCategory =
  | 'fashion-apparel'
  | 'electronics-tech'
  | 'food-beverage'
  | 'beauty-cosmetics'
  | 'home-living'
  | 'platform-temu'
  | 'platform-instagram'
  | 'platform-tiktok'
  | 'platform-shopee'
  | 'platform-amazon'
  | 'platform-pinterest';

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
  // ==================== FASHION & APPAREL ====================
  {
    id: 'fashion-model-studio',
    name: 'Fashion Model Studio Shot',
    category: 'fashion-apparel',
    description: 'Professional fashion photography with model wearing clothing',
    prompt: 'High-end fashion photography of professional model wearing [PRODUCT], shot in modern photography studio with professional three-point lighting setup, clean seamless white or gray backdrop, model in dynamic pose showing garment movement and drape, fashion editorial style, shot with 85mm lens at f/2.8 for shallow depth of field, crisp details on fabric texture and stitching, commercial fashion campaign quality, model with confident expression, hair and makeup professionally styled, full body or 3/4 composition, studio strobes creating soft shadows, color-accurate representation of fabric, high fashion aesthetic, vogue magazine quality, 8k resolution, professionally retouched',
    negativePrompt: 'amateur, blurry, poor lighting, wrinkled clothes, bad posture, cluttered background, over-saturated, unnatural skin tones, visible artifacts, low resolution, distorted proportions',
    aspectRatio: '4:5',
    tags: ['fashion', 'apparel', 'model', 'studio', 'professional'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'fashion-flat-lay',
    name: 'Fashion Flat Lay Composition',
    category: 'fashion-apparel',
    description: 'Overhead flat lay of clothing with lifestyle accessories',
    prompt: 'Stylish overhead flat lay photography featuring [PRODUCT] as the hero piece, arranged artfully on pristine white or pastel background, surrounded by complementary fashion accessories like sunglasses, jewelry, handbag, shoes, and lifestyle items, shot from directly above with even soft lighting to eliminate shadows, minimalist and clean aesthetic, Instagram-worthy composition, items arranged in visually pleasing geometric pattern, natural materials and textures visible, soft shadows for depth, professional commercial photography, color coordinated palette, aspirational lifestyle feel, negative space for text overlay, shot with tilt-shift lens for perfect overhead perspective, magazine editorial quality, clean and modern, 4k resolution',
    negativePrompt: 'messy, cluttered, harsh shadows, uneven lighting, crooked items, poor arrangement, dirty background, low quality, pixelated',
    aspectRatio: '1:1',
    tags: ['fashion', 'flat-lay', 'overhead', 'lifestyle', 'instagram'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'fashion-lifestyle-outdoor',
    name: 'Fashion Lifestyle Outdoor',
    category: 'fashion-apparel',
    description: 'Clothing photographed in natural outdoor lifestyle setting',
    prompt: 'Authentic lifestyle fashion photography of person wearing [PRODUCT] in natural outdoor environment, golden hour lighting for warm glow, urban street or nature setting as backdrop, candid moment captured mid-movement showing garment flow, shot with 50mm prime lens at f/1.8 for beautiful bokeh, professional depth of field with subject in sharp focus and background softly blurred, natural and effortless styling, genuine emotion and expression, environmental storytelling, aspirational yet relatable aesthetic, lifestyle brand campaign quality, sun flare and natural light creating atmosphere, color grading with warm tones, authentic street style or nature aesthetic, commercial fashion photography, high detail on fabric while maintaining dreamy background, 6k resolution',
    negativePrompt: 'studio, artificial, staged, harsh lighting, unflattering angles, static pose, boring background, over-edited, fake-looking, poor composition',
    aspectRatio: '4:5',
    tags: ['fashion', 'lifestyle', 'outdoor', 'natural-light', 'candid'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== ELECTRONICS & TECH ====================
  {
    id: 'tech-product-hero',
    name: 'Tech Product Hero Shot',
    category: 'electronics-tech',
    description: 'Premium tech product photography with dramatic lighting',
    prompt: 'Premium technology product photography of [PRODUCT], shot on pure black gradient background fading to deep blue, dramatic rim lighting highlighting product edges and creating glowing effect, single key light from 45-degree angle revealing texture and build quality, product positioned at slight angle showing multiple facets, reflective surfaces catching light beautifully, sleek and modern aesthetic, Apple-style product photography, studio perfection with flawless reflections, sharp focus on brand logo and key features, commercial grade product shot, LED accent lights creating tech ambiance, gradient lighting from cool blue to warm orange suggesting innovation, premium feel with luxurious presentation, shot with macro lens for extreme detail, 8k ultra high resolution, color-accurate screen display if applicable, professional retouching, flagship product campaign quality',
    negativePrompt: 'cheap-looking, poor lighting, dirty, scratched, low quality, boring angle, flat lighting, overexposed, underexposed, color cast, visible dust',
    aspectRatio: '16:9',
    tags: ['electronics', 'tech', 'premium', 'hero-shot', 'dramatic-lighting'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'tech-lifestyle-usage',
    name: 'Tech Product in Use',
    category: 'electronics-tech',
    description: 'Technology product being used in modern lifestyle setting',
    prompt: 'Modern lifestyle photography showing [PRODUCT] being actively used by person in contemporary environment, clean minimalist workspace or modern home setting, hands interacting with device showing scale and usability, natural window light supplemented with soft fill light, shallow depth of field focusing on product while showing context, professional commercial photography, modern aesthetic with neutral color palette, clean desk or surface with minimal complementary items like coffee cup or notebook, product screen showing compelling content if applicable, natural and relatable usage scenario, aspirational yet achievable lifestyle, shot from over-shoulder or side angle, warm and inviting atmosphere, professional lighting setup appearing natural, high-key lighting style, crisp product details, lifestyle brand marketing quality, 6k resolution',
    negativePrompt: 'cluttered, messy, poor composition, bad lighting, awkward hands, unrealistic usage, cheap aesthetic, dated interior, unflattering angle',
    aspectRatio: '4:3',
    tags: ['electronics', 'lifestyle', 'usage', 'modern', 'workspace'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'tech-feature-exploded',
    name: 'Tech Feature Breakdown',
    category: 'electronics-tech',
    description: 'Exploded view or detailed feature showcase of technology',
    prompt: 'Technical product photography of [PRODUCT] with exploded view or extreme close-up showing internal components, parts, or key features, studio lighting highlighting technological details, clean white or dark gray background, multiple elements suspended or arranged to show assembly or feature breakdown, professional commercial tech photography, sharp macro focus on intricate details, components arranged in organized floating composition, annotations or callout-ready layout, precision engineering visible, premium build quality evident, studio strobes with diffusers for even lighting, no harsh shadows, technical illustration meets photography aesthetic, engineering beauty showcase, shot with tilt-shift or macro lens, extreme depth of field or selective focus, futuristic and innovative feel, commercial product launch quality, 8k ultra high detail resolution',
    negativePrompt: 'messy, confusing layout, poor focus, cluttered, unprofessional, low detail, blurry components, bad arrangement, cheap-looking',
    aspectRatio: '16:9',
    tags: ['electronics', 'technical', 'exploded-view', 'features', 'macro'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== FOOD & BEVERAGE ====================
  {
    id: 'food-overhead-styling',
    name: 'Food Styling Overhead',
    category: 'food-beverage',
    description: 'Beautifully styled food photography from overhead angle',
    prompt: 'Professional food photography of [PRODUCT] shot from directly overhead, artfully styled and plated on rustic wooden table or marble surface, surrounded by complementary fresh ingredients and props telling a story, natural window light from side creating soft shadows and highlighting textures, food styling with garnishes and details making dish look irresistible, steam or freshness indicators where appropriate, rich and vibrant colors showing food at peak appeal, shallow depth of field on hero dish while showing context, professional culinary photography, appetizing and mouth-watering presentation, editorial food magazine quality, props like vintage utensils, linen napkins, fresh herbs, complementary dishes or ingredients arranged harmoniously, negative space for text overlay, warm color grading, inviting and cozy atmosphere, shot with 50mm lens from overhead rig, perfect exposure showing food texture, glistening surfaces, restaurant quality plating, 6k resolution',
    negativePrompt: 'unappetizing, artificial, plastic-looking, poor styling, harsh lighting, cold colors, messy, unnatural arrangement, overcooked appearance, dull, flat lighting',
    aspectRatio: '1:1',
    tags: ['food', 'overhead', 'styling', 'appetizing', 'editorial'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'food-action-shot',
    name: 'Food Action & Preparation',
    category: 'food-beverage',
    description: 'Dynamic food photography showing action or preparation',
    prompt: 'Dynamic food action photography capturing [PRODUCT] in moment of preparation, pouring, cutting, or serving, professional culinary photography showing movement and freshness, ingredients splashing, steam rising, or sauce drizzling frozen in time with high shutter speed, dramatic side or backlighting highlighting steam and textures, shallow depth of field isolating action, commercial food advertisement quality, hands of chef or person in frame showing human element, rustic or modern kitchen background softly blurred, warm and inviting color palette, motion captured at peak moment, appetizing and engaging, editorial magazine worthy, professional food styling with every element deliberately placed, natural light or studio setup mimicking natural light, authentic and artisanal feel, making viewer crave the food, shot with fast lens at high shutter speed, perfect moment timing, premium restaurant or brand campaign quality, 8k high resolution',
    negativePrompt: 'static, boring, poor timing, blurry subject, harsh lighting, unappetizing, messy without purpose, cheap-looking, artificial, cold atmosphere',
    aspectRatio: '4:3',
    tags: ['food', 'action', 'dynamic', 'preparation', 'movement'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'beverage-refreshing',
    name: 'Refreshing Beverage Shot',
    category: 'food-beverage',
    description: 'Cold beverage with condensation and ice, looking refreshing',
    prompt: 'Professional beverage photography of ice-cold [PRODUCT] in crystal-clear glass with perfect condensation droplets running down exterior, ice cubes floating and catching light, refreshing and thirst-quenching appearance, shot against clean gradient background from light to vibrant color, dramatic backlighting making liquid glow and highlighting transparency, bubbles and carbonation visible if applicable, garnishes like mint, citrus, or fruit perfectly placed, glass positioned at slight angle, professional commercial drink photography, studio lighting with multiple sources creating dimension, light catching ice and creating sparkle, color of beverage vivid and appetizing, pristine glass with no smudges, professional liquid styling, splash elements or dynamic pour if appropriate, premium bar or advertisement quality, shot with macro lens capturing every droplet detail, luxury beverage campaign aesthetic, 6k ultra sharp resolution',
    negativePrompt: 'flat, boring, poor condensation, unrealistic, bad lighting, cloudy glass, unappetizing color, no sparkle, cheap-looking, poorly styled',
    aspectRatio: '4:5',
    tags: ['beverage', 'drink', 'refreshing', 'ice', 'commercial'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== BEAUTY & COSMETICS ====================
  {
    id: 'beauty-product-luxury',
    name: 'Luxury Beauty Product Shot',
    category: 'beauty-cosmetics',
    description: 'High-end cosmetics product with luxurious presentation',
    prompt: 'Luxury beauty product photography of [PRODUCT] positioned on premium surface like marble, silk, or metallic platform, dramatic gradient lighting transitioning from soft pink to gold creating elegant ambiance, product photographed at angle showing label and packaging design clearly, glass or metallic elements reflecting light beautifully, complementary items like flowers, crystals, or fabric adding luxury context, soft focus background with bokeh effect, high-end cosmetics advertisement aesthetic, pristine product with perfect lighting showing texture and quality, professional beauty industry photography, elegant and sophisticated composition, neutral to warm color palette, aspirational and premium feel, negative space allowing product to be hero, studio setup with multiple light sources for dimension, shot with macro lens for packaging detail, flawless product presentation, commercial beauty campaign quality, glossy magazine editorial standard, 8k resolution showing every detail',
    negativePrompt: 'cheap, cluttered, poor lighting, scratched product, messy, boring composition, harsh shadows, color cast, low quality, amateur',
    aspectRatio: '4:5',
    tags: ['beauty', 'cosmetics', 'luxury', 'premium', 'elegant'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'beauty-swatch-texture',
    name: 'Beauty Product Swatch & Texture',
    category: 'beauty-cosmetics',
    description: 'Product swatches showing colors and textures',
    prompt: 'Professional beauty swatch photography showing [PRODUCT] swatches on flawless skin or clean surface, makeup colors or skincare textures displayed in appealing way, macro photography capturing fine shimmer, pigmentation, or cream texture, soft diffused lighting eliminating harsh shadows while showing true color, white or neutral background keeping focus on swatches, multiple shades arranged artistically if applicable, skin tone perfect and even if using model, commercial cosmetics photography quality, colors accurate and vibrant, texture details visible including sparkle or matte finish, professional beauty industry standard, clean and minimalist composition, product packaging visible in background out of focus, shot with ring light or beauty dish for even illumination, extreme close-up detail, editorial cosmetics magazine quality, swatches looking smooth and appealing, 6k high resolution showing pigment details',
    negativePrompt: 'uneven application, poor skin texture, harsh lighting, color inaccurate, blotchy, messy, unprofessional, unflattering, low quality, blurry',
    aspectRatio: '1:1',
    tags: ['beauty', 'cosmetics', 'swatch', 'texture', 'macro'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'beauty-lifestyle-application',
    name: 'Beauty Lifestyle Application',
    category: 'beauty-cosmetics',
    description: 'Person applying or using beauty product in lifestyle setting',
    prompt: 'Lifestyle beauty photography showing person applying [PRODUCT] in modern bathroom or vanity setting, natural morning or evening light from window creating soft glow, mirror and beauty products visible in background suggesting routine, hands elegantly applying product showing usage and texture, genuine smile or concentrated expression feeling authentic, clean and minimal aesthetic with organized beauty space, aspirational yet achievable lifestyle, commercial beauty brand campaign style, soft focus on background while product application in sharp focus, warm and inviting color palette, professional photography with natural-looking setup, beauty influencer aesthetic, relatable moment making product desirable, shot with 50mm lens for natural perspective, shallow depth of field, high-end beauty advertisement quality, realistic and approachable feel, 6k resolution',
    negativePrompt: 'staged, artificial, poor lighting, messy background, unflattering angle, fake expressions, cluttered, unprofessional, harsh shadows, unrealistic',
    aspectRatio: '4:5',
    tags: ['beauty', 'lifestyle', 'application', 'routine', 'authentic'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== HOME & LIVING ====================
  {
    id: 'home-interior-styled',
    name: 'Home Décor Interior Styled',
    category: 'home-living',
    description: 'Home products styled in beautiful interior setting',
    prompt: 'Interior design photography featuring [PRODUCT] styled in gorgeous modern home setting, professional interior photography with multiple light sources creating warm inviting atmosphere, product integrated naturally into room design, complementary furniture and décor creating cohesive aesthetic, natural light from large windows supplemented with practical and ambient lighting, shot from flattering angle showing product in context of lifestyle, shallow depth of field highlighting product while showing room environment, aspirational yet livable interior design, neutral color palette with pops of color, clean and uncluttered space feeling spacious, professional real estate or home magazine photography quality, perfect styling with every element intentionally placed, cozy and inviting mood, lifestyle brand campaign aesthetic, shot with wide-angle or standard lens, perfect exposure and white balance, editorial home and living magazine standard, high-end interior design showcase, 8k resolution',
    negativePrompt: 'cluttered, messy, poor lighting, dated décor, awkward arrangement, cheap-looking, unflattering angle, overexposed windows, color cast',
    aspectRatio: '4:3',
    tags: ['home', 'interior', 'styled', 'lifestyle', 'décor'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'home-product-detail',
    name: 'Home Product Close-Up Detail',
    category: 'home-living',
    description: 'Close-up showing textures and quality of home products',
    prompt: 'Macro product photography of [PRODUCT] showing exquisite detail, texture, and craftsmanship, shot in soft natural window light highlighting material quality, extreme close-up revealing weave of fabric, grain of wood, or surface finish, shallow depth of field creating dreamy bokeh in background, artisanal and high-quality appearance, professional commercial product photography, tactile and inviting, warm color grading suggesting comfort and quality, complementary props or setting elements softly blurred in background, shot with macro lens at wide aperture, every thread or texture detail visible, premium home goods aesthetic, editorial home magazine quality, intimate and detail-oriented composition, emphasizing craftsmanship and luxury, commercial product campaign standard, 6k ultra high resolution',
    negativePrompt: 'low quality, poor focus, harsh lighting, cheap appearance, boring composition, flat lighting, no depth, texture not visible, amateur',
    aspectRatio: '1:1',
    tags: ['home', 'close-up', 'detail', 'texture', 'craftsmanship'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== PLATFORM: TEMU STYLE ====================
  {
    id: 'temu-flash-sale',
    name: 'Temu Flash Sale Style',
    category: 'platform-temu',
    description: 'Vibrant, high-energy flash sale advertisement Temu-style',
    prompt: 'High-energy e-commerce product photography in Temu marketplace style, [PRODUCT] photographed against vibrant gradient background from bright yellow to red creating urgency, product shown from multiple angles in collage format within single image, large bold percentage discount graphics and price tags overlaid in yellow and red color scheme, starburst and badge elements suggesting mega deals and flash sales, multiple identical or variation products arranged showing quantity and options, bright and saturated colors maximizing visual impact, product clearly lit with studio lighting showing every detail, commercial online marketplace aesthetic, energetic and urgent feel encouraging immediate purchase, graphic elements suggesting limited time offer, text-ready areas for countdown timers and promotional copy, shot with even lighting, all products in sharp focus, affordable and deal-focused presentation, smartphone-optimized bright and punchy colors, ultra-commercial mega-sale advertising style, 4k resolution',
    negativePrompt: 'subtle, muted colors, minimal, elegant, single product, quiet composition, premium feel, understated, sophisticated',
    aspectRatio: '1:1',
    tags: ['temu', 'flash-sale', 'discount', 'vibrant', 'urgency'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'temu-value-pack',
    name: 'Temu Value Pack Bundle',
    category: 'platform-temu',
    description: 'Multiple products showing bundle value and variety',
    prompt: 'E-commerce bundle photography Temu style showing multiple [PRODUCT] items or variations arranged in organized grid or group, bright white or light pastel background keeping focus on products, studio lighting ensuring all items equally lit and visible, overhead or straight-on angle showing quantity and variety, products arranged by color or size showing options, clean product photography with slight shadows for depth, value and abundance messaging through composition, multiple units suggesting bulk purchase or set, professional online marketplace product photography, all products in sharp focus with no blur, colors vibrant and accurate, space for overlay graphics showing "set of X" or quantity messaging, commercial e-commerce photography optimized for mobile shopping, clean and organized presentation maximizing perceived value, affordable pricing aesthetic, 4k resolution for web optimization',
    negativePrompt: 'single product, messy arrangement, poor lighting, shadows obscuring products, confusing layout, premium boutique feel, artistic composition',
    aspectRatio: '1:1',
    tags: ['temu', 'bundle', 'value', 'multiple-products', 'quantity'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== PLATFORM: INSTAGRAM STYLE ====================
  {
    id: 'instagram-aesthetic-feed',
    name: 'Instagram Aesthetic Feed Style',
    category: 'platform-instagram',
    description: 'Clean, minimalist Instagram-worthy product photo',
    prompt: 'Instagram aesthetic product photography of [PRODUCT] with clean minimalist composition, neutral background in soft beige, white, or pastel tones, natural window light creating soft shadows and gentle highlights, product positioned using rule of thirds for pleasing composition, carefully curated lifestyle props like dried flowers, coffee cup, or linen fabric adding context without clutter, cohesive color palette staying within 2-3 complementary tones, shallow depth of field with creamy bokeh background, influencer-style content creation aesthetic, aspirational yet authentic feel, negative space allowing product to breathe, shot from flattering angle slightly overhead or 45-degrees, warm and inviting mood, modern and trendy but timeless, professional content creator quality, mobile-first vertical or square format, feed-cohesive styling, 4-6k resolution optimized for social media, grain or slight fade for authentic feel',
    negativePrompt: 'cluttered, harsh lighting, busy background, oversaturated, chaotic, no cohesion, dated aesthetic, amateur, poorly composed, unbalanced',
    aspectRatio: '4:5',
    tags: ['instagram', 'aesthetic', 'minimal', 'influencer', 'feed'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'instagram-ugc-authentic',
    name: 'Instagram UGC Authentic Style',
    category: 'platform-instagram',
    description: 'User-generated content style looking genuine and relatable',
    prompt: 'Authentic user-generated content style photography of [PRODUCT] appearing natural and unpolished yet appealing, shot in real-life environment like home, café, or outdoors, natural lighting without professional setup, product being used or displayed casually, relatable and genuine moment captured, slight imperfections making it feel real not staged, modern smartphone photography aesthetic, genuine lifestyle integration, candid moment with product featured prominently, authentic Instagram story or post vibe, accessible and achievable for average consumer, warm and friendly mood, natural colors without heavy editing, real person hands or environment visible, trust-building through authenticity, influencer unboxing or review style, relatable composition, social proof aesthetic, mobile photography quality, vertical format optimized for Instagram stories and reels, 4k resolution with natural grain',
    negativePrompt: 'overly polished, studio setup, professional lighting, staged, artificial, stock photo feel, too perfect, corporate, unrelatable, sterile',
    aspectRatio: '9:16',
    tags: ['instagram', 'ugc', 'authentic', 'relatable', 'candid'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== PLATFORM: TIKTOK STYLE ====================
  {
    id: 'tiktok-trending-hook',
    name: 'TikTok Trending Hook Frame',
    category: 'platform-tiktok',
    description: 'Attention-grabbing first frame for TikTok videos',
    prompt: 'TikTok-style product showcase photography designed as video thumbnail or first frame, [PRODUCT] prominently displayed with bold visual hook grabbing attention, dynamic composition with product at unexpected angle or in surprising context, vibrant and saturated colors optimized for mobile screens, text-ready negative space for captions or overlay, authentic and relatable aesthetic not overly polished, trend-aware styling incorporating current visual trends, vertical 9:16 format filling smartphone screen, product clearly visible and identifiable instantly, engaging and scroll-stopping composition, younger demographic appeal, casual and energetic vibe, natural or ring light creating even illumination, shot appearing achievable by average person, UGC-inspired but with clear product focus, entertainment-first mindset, fast-paced visual energy even in still image, mobile-native composition, 4k vertical resolution',
    negativePrompt: 'boring, static, corporate, overly professional, horizontal format, slow-paced feel, traditional advertising, stiff, formal, dated aesthetic',
    aspectRatio: '9:16',
    tags: ['tiktok', 'trending', 'hook', 'attention-grabbing', 'vertical'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'tiktok-before-after',
    name: 'TikTok Before/After Split',
    category: 'platform-tiktok',
    description: 'Before and after comparison style popular on TikTok',
    prompt: 'TikTok before-after split screen style photography showing [PRODUCT] results or transformation, image divided vertically or horizontally into two halves, clear contrast between before and after states, dramatic difference highlighting product benefit, both sides equally lit for fair comparison, clean split with or without dividing line, mobile-optimized vertical composition, product or result clearly visible in both frames, compelling transformation story, authentic and relatable styling, natural environment not studio setup, user-generated content aesthetic, trend-aware execution, text-ready space for labels like "BEFORE" and "AFTER", scroll-stopping contrast, proof of effectiveness, comparison creating intrigue and credibility, modern and engaging format, 9:16 vertical format for TikTok, 4k resolution',
    negativePrompt: 'unclear comparison, poorly matched lighting, confusing layout, subtle difference, overly professional, unrelatable, boring, no contrast',
    aspectRatio: '9:16',
    tags: ['tiktok', 'before-after', 'comparison', 'transformation', 'results'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== PLATFORM: SHOPEE STYLE ====================
  {
    id: 'shopee-orange-promo',
    name: 'Shopee Orange Promotional Style',
    category: 'platform-shopee',
    description: 'Shopee-style promotional image with orange branding',
    prompt: 'Shopee marketplace promotional photography of [PRODUCT] with vibrant orange and white color scheme, product centered on clean white or light background, bright and cheerful aesthetic, studio lighting creating slight shadow for depth, multiple product angles or variations shown in grid if applicable, space for orange promotional badges like "FREE SHIPPING", "LOWEST PRICE", discount percentages, Southeast Asian e-commerce marketplace style, energetic and deal-focused presentation, product clearly photographed showing details and features, commercial online shopping optimized composition, bright and saturated colors enhancing appeal, orange accent elements suggesting flash deals, clean professional product photography, mobile-shopping optimized framing, all features visible, promotional and sales-driven aesthetic, 1:1 square format perfect for marketplace thumbnail, 4k resolution',
    negativePrompt: 'muted colors, dark, minimal, subtle, premium boutique feel, artistic, complex composition, brand colors other than orange',
    aspectRatio: '1:1',
    tags: ['shopee', 'orange', 'promotional', 'marketplace', 'deals'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'shopee-lifestyle-value',
    name: 'Shopee Lifestyle Value Shot',
    category: 'platform-shopee',
    description: 'Affordable lifestyle product shot for Shopee marketplace',
    prompt: 'Shopee marketplace lifestyle photography showing [PRODUCT] in relatable home or daily use setting, clean and bright natural lighting making product appealing, accessible price point aesthetic not luxury feel, product as hero surrounded by complementary everyday items, Southeast Asian consumer-focused styling and context, warm and friendly mood encouraging trust, real-life usage scenario showing value and practicality, bright whites and vibrant colors, organized and neat composition, middle-class lifestyle aspiration, affordable quality presentation, honest product showcase with clear details visible, mobile-optimized composition for smartphone shopping, square or vertical format, approachable and inclusive feel, family-friendly and practical aesthetic, online marketplace commercial photography, 4k resolution',
    negativePrompt: 'luxury, expensive-looking, western-only aesthetic, dark moody, artistic, impractical, overly styled, boutique feel, complex',
    aspectRatio: '1:1',
    tags: ['shopee', 'lifestyle', 'value', 'affordable', 'practical'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== PLATFORM: AMAZON STYLE ====================
  {
    id: 'amazon-main-image',
    name: 'Amazon Main Image White BG',
    category: 'platform-amazon',
    description: 'Amazon-compliant main product image on pure white background',
    prompt: 'Amazon marketplace main image photography of [PRODUCT] on pure white RGB 255,255,255 background filling 85% of frame, professional studio lighting with no harsh shadows, product photographed straight-on or at slight angle showing primary use and features, sharp focus across entire product, color-accurate representation, clean and uncluttered, product only without props or lifestyle elements, professional catalog photography, all important features and details clearly visible, high resolution product shot, no text or graphics overlaid, no brand logos other than on product itself, commercial product photography meeting Amazon requirements, even lighting showing true product appearance, clean professional presentation, shot with proper white balance, neutral and accurate colors, standard product photography, 6k resolution suitable for zoom feature',
    negativePrompt: 'props, lifestyle elements, text overlay, graphics, colored background, shadows, models, hands, reflections, multiple products, artistic composition',
    aspectRatio: '1:1',
    tags: ['amazon', 'white-background', 'product-only', 'catalog', 'compliant'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'amazon-infographic-features',
    name: 'Amazon Infographic Feature Image',
    category: 'platform-amazon',
    description: 'Amazon lifestyle or infographic showing product features',
    prompt: 'Amazon secondary image photography showing [PRODUCT] with clear feature highlights and benefits, product in lifestyle context or with infographic-ready layout, clean professional photography allowing for text overlay areas, product benefits and dimensions clearly visible through composition, lifestyle setting if showing usage demonstrating key selling points, multiple angles or close-ups of important features arranged in organized layout, professional commercial photography with even lighting, white or neutral background sections allowing for callout text, product features highlighted through visual arrangement, usage scenarios demonstrated, comparison-ready composition, professional Amazon marketplace photography optimized for conversions, clear and informative visual storytelling, commercial product photography with marketing intent, space for bullet point overlays, 4k-6k resolution',
    negativePrompt: 'confusing, cluttered, poor feature visibility, dark, messy, unclear benefits, unprofessional, text already on image, low quality, blurry',
    aspectRatio: '1:1',
    tags: ['amazon', 'infographic', 'features', 'lifestyle', 'benefits'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },

  // ==================== PLATFORM: PINTEREST STYLE ====================
  {
    id: 'pinterest-inspirational-pin',
    name: 'Pinterest Inspirational Vertical Pin',
    category: 'platform-pinterest',
    description: 'Tall vertical pin with inspirational lifestyle aesthetic',
    prompt: 'Pinterest-style vertical pin photography featuring [PRODUCT] in beautifully styled inspirational scene, 2:3 tall vertical composition optimized for Pinterest feed, aspirational lifestyle aesthetic making viewer want to save and recreate, warm and inviting color palette, natural lighting creating dreamy atmosphere, carefully curated styling with complementary props and textures, DIY or achievable luxury feel, negative space at top or bottom for text overlay, Pinterest board-worthy composition, clean and organized visual hierarchy, feminine and elegant or rustic and cozy depending on product, professional content creation quality, highly saveable and shareable aesthetic, lifestyle magazine editorial feel, seasonal or timeless styling, inspiring real-life application, trend-aware but enduring appeal, mobile and desktop optimized vertical format, 4k resolution',
    negativePrompt: 'horizontal, square, messy, chaotic, dark, uninspiring, boring, commercial feel, hard to replicate, overly complex, masculine-only appeal',
    aspectRatio: '2:3',
    tags: ['pinterest', 'vertical', 'inspirational', 'saveable', 'lifestyle'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
  {
    id: 'pinterest-diy-tutorial',
    name: 'Pinterest DIY Tutorial Style',
    category: 'platform-pinterest',
    description: 'Step-by-step or how-to visual for Pinterest',
    prompt: 'Pinterest tutorial-style photography of [PRODUCT] arranged to suggest step-by-step process or how-to application, vertical 2:3 format with organized layout showing product and usage, clean overhead or flat lay composition perfect for tutorial pins, well-lit with natural or soft artificial light, all elements clearly visible and identifiable, instructional feel without actual text, numbered or sequential arrangement suggestion, crafting or DIY aesthetic, achievable project feel, Pinterest user-friendly presentation, ingredients or components laid out organizedly, negative space for overlay text or arrows, trustworthy and clear visual communication, lifestyle blogger or content creator quality, approachable and replicable, saves and clicks-optimized composition, educational and inspirational simultaneously, 4k vertical resolution',
    negativePrompt: 'chaotic, unclear steps, confusing layout, poor lighting, hard to understand, messy, unprofessional, square format, horizontal',
    aspectRatio: '2:3',
    tags: ['pinterest', 'diy', 'tutorial', 'how-to', 'step-by-step'],
    generationMode: 'text2img',
    defaultProvider: 'kie-nano-banana'
  },
];

// Video Templates
export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // ==================== FASHION & APPAREL VIDEO ====================
  {
    id: 'fashion-catwalk-reveal',
    name: 'Fashion Runway Reveal',
    category: 'fashion-apparel',
    description: 'Model walking showcasing clothing with movement',
    prompt: 'Professional fashion video of model confidently walking toward camera wearing [PRODUCT], shot in modern minimalist studio or urban environment, smooth camera movement following model or steady locked shot, clothing flowing and moving naturally showing drape and fit, professional hair and makeup, soft but adequate lighting highlighting garment details and textures, shallow depth of field keeping model in focus, editorial fashion campaign aesthetic, elegant and aspirational, model striking subtle pose at end of walk, music-video quality cinematography, slow motion optional for dramatic fabric movement, commercial fashion brand video quality, neutral or complementary background, 16:9 cinematic framing or 9:16 vertical for social media, color grading with fashion editorial look, 4-5 seconds of smooth motion',
    aspectRatio: '9:16',
    duration: 5,
    tags: ['fashion', 'runway', 'model', 'movement', 'editorial'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'fashion-360-spin',
    name: 'Fashion Product 360° Spin',
    category: 'fashion-apparel',
    description: '360-degree rotation showing clothing from all angles',
    prompt: 'Clean product video showcasing [PRODUCT] rotating 360 degrees on mannequin or model, smooth rotation revealing garment from all angles, studio lighting remaining constant throughout spin, white or neutral seamless background, camera locked in position while product rotates, all details of clothing visible during rotation including back design and side seams, professional e-commerce product video quality, even lighting with no harsh shadows, slow and steady rotation speed, catalog video aesthetic, 5-second complete rotation, commercial online retail video standard, sharp focus maintained throughout, 1:1 square format for versatility or 9:16 vertical for mobile shopping',
    aspectRatio: '1:1',
    duration: 5,
    tags: ['fashion', '360', 'rotation', 'product-video', 'ecommerce'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },

  // ==================== ELECTRONICS & TECH VIDEO ====================
  {
    id: 'tech-unboxing-reveal',
    name: 'Tech Product Unboxing',
    category: 'electronics-tech',
    description: 'First-person unboxing experience revealing tech product',
    prompt: 'Professional tech unboxing video showing hands opening package containing [PRODUCT], shot from overhead or over-shoulder perspective, smooth reveal of product from packaging, clean modern desk surface or neutral background, good overhead lighting showing product and packaging clearly, satisfying unboxing experience pacing, product lifted and rotated to show features, premium packaging presentation, first-person POV creating viewer connection, commercial tech brand quality, subtle camera movement following action, accessories and included items shown, 5-second concise unboxing experience, modern and clean aesthetic, vertical 9:16 format for social media or 16:9 cinematic, aspirational yet authentic feel',
    aspectRatio: '9:16',
    duration: 5,
    tags: ['tech', 'unboxing', 'reveal', 'first-person', 'premium'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'tech-feature-demo',
    name: 'Tech Feature Demonstration',
    category: 'electronics-tech',
    description: 'Quick demonstration of key product feature in use',
    prompt: 'Tech product demonstration video showing [PRODUCT] key feature in action, hands interacting with device in real-life usage scenario, modern environment with natural or well-lit setup, smooth camera movement or locked shot focusing on interaction, feature benefit clearly demonstrated through visual action, professional commercial video quality, screen or interface visible if applicable showing actual function, relatable usage context, benefit-focused showing what problem product solves, 3-4 seconds of clear demonstration, clean and modern aesthetic, lifestyle tech video quality, 9:16 vertical for social media optimized, authentic usage feel, marketing video storytelling',
    aspectRatio: '9:16',
    duration: 4,
    tags: ['tech', 'demonstration', 'features', 'usage', 'benefit'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },

  // ==================== FOOD & BEVERAGE VIDEO ====================
  {
    id: 'food-cooking-process',
    name: 'Food Cooking Process',
    category: 'food-beverage',
    description: 'Quick cooking or preparation process video',
    prompt: 'Professional food videography showing [PRODUCT] being prepared or cooked, overhead or side angle capturing process, ingredients being added, mixed, or cooked in appealing way, hands working with food naturally and skillfully, steam rising, sizzling, or other appetizing motion, warm kitchen lighting creating inviting atmosphere, close-up shots showing texture and freshness, editing pace matching cooking rhythm, rustic or modern kitchen aesthetic, final plated result at end, mouth-watering and engaging throughout, commercial food brand video quality, natural or professional kitchen lighting, 4-5 seconds of satisfying food preparation, color grading with warm tones, vertical 9:16 for social media or 16:9 cinematic',
    aspectRatio: '16:9',
    duration: 5,
    tags: ['food', 'cooking', 'preparation', 'process', 'appetizing'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'beverage-pour-cinemagraph',
    name: 'Beverage Pour & Fizz',
    category: 'food-beverage',
    description: 'Satisfying beverage pour with bubbles and movement',
    prompt: 'Professional beverage video showing [PRODUCT] being poured into glass, liquid flowing smoothly creating satisfying visual, bubbles rising and carbonation visible if applicable, ice clinking or splashing, condensation on glass catching light, dramatic close-up or medium shot, backlit or sidelit highlighting liquid transparency and color, slow motion optional for impact, refreshing and thirst-inducing presentation, clean background focusing on pour action, commercial drink advertising quality, perfect pour technique, glass filling to ideal level, 3-4 seconds of mesmerizing liquid motion, premium beverage campaign aesthetic, color-accurate liquid, 9:16 vertical for social or 1:1 square format',
    aspectRatio: '9:16',
    duration: 4,
    tags: ['beverage', 'pour', 'liquid', 'refreshing', 'commercial'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },

  // ==================== BEAUTY & COSMETICS VIDEO ====================
  {
    id: 'beauty-application-demo',
    name: 'Beauty Product Application',
    category: 'beauty-cosmetics',
    description: 'Close-up of makeup or skincare application',
    prompt: 'Professional beauty video showing [PRODUCT] being applied, extreme close-up of application on skin, brush or applicator movement smooth and skilled, product texture and pigmentation clearly visible, beautiful skin and natural makeup showcasing product, soft beauty lighting flattering and clear, satisfying application moment, before and after visible in short timeframe, commercial cosmetics video quality, genuine application technique not sped up unrealistically, skin looking flawless, color accurate to actual product, beauty influencer or brand campaign quality, 3-4 seconds of application with result, vertical 9:16 mobile-first format, warm color grading, realistic and aspirational simultaneously',
    aspectRatio: '9:16',
    duration: 4,
    tags: ['beauty', 'application', 'makeup', 'skincare', 'demo'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'beauty-transformation-quick',
    name: 'Beauty Quick Transformation',
    category: 'beauty-cosmetics',
    description: 'Fast before-after beauty transformation',
    prompt: 'Beauty transformation video showing quick before and after using [PRODUCT], starting with natural or before state and transitioning to result, smooth transition or quick cut, product application shown or implied in between, dramatic but believable difference, face well-lit with beauty ring light or natural window light, camera angle locked to show clear comparison, professional beauty content creator quality, genuine transformation feeling authentic, skin texture and product effect visible, makeup or skincare result looking polished, 4-5 seconds total with clear before and after moments, vertical 9:16 format optimized for social media, color grading consistent between before and after, commercial beauty brand video standard',
    aspectRatio: '9:16',
    duration: 5,
    tags: ['beauty', 'transformation', 'before-after', 'results', 'dramatic'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },

  // ==================== PLATFORM: TIKTOK VIDEO ====================
  {
    id: 'tiktok-fast-showcase',
    name: 'TikTok Fast Product Showcase',
    category: 'platform-tiktok',
    description: 'Fast-paced TikTok-style product showcase',
    prompt: 'TikTok-style fast-paced video showcasing [PRODUCT] with dynamic energy, multiple quick cuts showing product from different angles, hands holding and demonstrating product, authentic and relatable not overly polished, vertical 9:16 format filling phone screen, natural lighting or ring light, casual home or everyday environment, person or hands visible creating connection, fast-paced editing matching TikTok rhythm, product benefits shown quickly through action not words, engaging and entertaining not just informational, user-generated content aesthetic with commercial quality, trendy and current visual style, 3-4 seconds of energetic product showcase, mobile-first composition, genuine enthusiasm feeling authentic, Gen Z or millennial appeal',
    aspectRatio: '9:16',
    duration: 4,
    tags: ['tiktok', 'fast-paced', 'showcase', 'authentic', 'trending'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'tiktok-satisfying-moment',
    name: 'TikTok Satisfying Moment',
    category: 'platform-tiktok',
    description: 'Oddly satisfying product moment for TikTok',
    prompt: 'Oddly satisfying TikTok video featuring [PRODUCT] in mesmerizing way, close-up of product detail or action that is visually pleasing, smooth movement or perfect fit, ASMR-friendly visual, clean and simple composition focusing on satisfying element, good lighting highlighting the satisfying aspect, slow motion optional for emphasis, perfect execution of action, therapeutic and calming yet engaging, product benefit shown through satisfaction, vertical 9:16 format, minimal background distraction, 3 seconds of pure satisfying product moment, trend-aware aesthetic, scroll-stopping through satisfaction, commercial quality with viral potential, authentic and simple not over-produced',
    aspectRatio: '9:16',
    duration: 3,
    tags: ['tiktok', 'satisfying', 'asmr', 'mesmerizing', 'viral'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },

  // ==================== PLATFORM: INSTAGRAM VIDEO ====================
  {
    id: 'instagram-reel-aesthetic',
    name: 'Instagram Reel Aesthetic',
    category: 'platform-instagram',
    description: 'Aesthetic Instagram Reel-style product video',
    prompt: 'Instagram Reel aesthetic video of [PRODUCT] with trendy visual style, vertical 9:16 format optimized for Reels, smooth camera movement or transitions, modern and clean aesthetic with cohesive color palette, natural lighting or soft artificial light, lifestyle setting feeling aspirational yet achievable, product featured beautifully in scene, influencer content quality, trendy but timeless feel, negative space and clean composition, feed-cohesive visual style, subtle movement keeping viewer engaged, 4-5 seconds of aesthetically pleasing product showcase, color grading matching Instagram aesthetic trends, authentic and relatable not overly corporate, millennial and Gen Z appeal, music-video quality cinematography',
    aspectRatio: '9:16',
    duration: 5,
    tags: ['instagram', 'reel', 'aesthetic', 'trendy', 'influencer'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
  {
    id: 'instagram-boomerang-style',
    name: 'Instagram Boomerang Loop',
    category: 'platform-instagram',
    description: 'Short looping boomerang-style product video',
    prompt: 'Instagram boomerang-style looping video of [PRODUCT] with smooth back-and-forth motion, simple repeating action that looks good in loop, close-up or medium shot of product, hands interacting with product or product moving, clean background not distracting from product, good lighting making product look appealing, motion that works seamlessly in reverse, engaging and eye-catching, lifestyle or minimalist aesthetic, vertical or square format, 2-3 seconds of perfectly looping action, Instagram story or post optimized, playful and engaging feel, product clearly visible throughout loop, commercial social media content quality',
    aspectRatio: '1:1',
    duration: 3,
    tags: ['instagram', 'boomerang', 'loop', 'playful', 'engaging'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },

  // ==================== PLATFORM: SHOPEE VIDEO ====================
  {
    id: 'shopee-live-demo',
    name: 'Shopee Live Demo Style',
    category: 'platform-shopee',
    description: 'Live selling demo-style product video',
    prompt: 'Shopee live selling style video demonstrating [PRODUCT] features and benefits, person\'s hands showing product to camera as if explaining to buyer, product held up and rotated showing all angles, features pointed out through gesture, bright even lighting showing true product colors, clean background focusing on product, authentic and friendly demonstration pace, multiple product angles in quick succession, value and quality emphasized through presentation, Southeast Asian e-commerce live selling aesthetic, relatable and trustworthy presentation, 4-5 seconds of convincing product demonstration, vertical 9:16 format for mobile shoppers, genuine enthusiasm, affordable quality showcased, deal-focused energy',
    aspectRatio: '9:16',
    duration: 5,
    tags: ['shopee', 'live-selling', 'demo', 'features', 'value'],
    generationMode: 'text2vid',
    defaultProvider: 'kie-minimax-video-01'
  },
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
    'fashion-apparel',
    'electronics-tech',
    'food-beverage',
    'beauty-cosmetics',
    'home-living',
    'platform-temu',
    'platform-instagram',
    'platform-tiktok',
    'platform-shopee',
    'platform-amazon',
    'platform-pinterest'
  ];
};

export const getCategoryLabel = (category: TemplateCategory): string => {
  const labels: Record<TemplateCategory, string> = {
    'fashion-apparel': 'Fashion & Apparel',
    'electronics-tech': 'Electronics & Tech',
    'food-beverage': 'Food & Beverage',
    'beauty-cosmetics': 'Beauty & Cosmetics',
    'home-living': 'Home & Living',
    'platform-temu': 'Temu Style',
    'platform-instagram': 'Instagram Style',
    'platform-tiktok': 'TikTok Style',
    'platform-shopee': 'Shopee Style',
    'platform-amazon': 'Amazon Style',
    'platform-pinterest': 'Pinterest Style'
  };
  return labels[category];
};
