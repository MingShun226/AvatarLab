/**
 * KIE.AI Service Configuration
 *
 * This file defines all available KIE.AI services and models
 * that users can access with their KIE.AI API key
 */

export const KIE_AI_BASE_URL = 'https://api.kie.ai';

export type KIEServiceType = 'image' | 'video' | 'music';

export interface KIEService {
  id: string;
  name: string;
  description: string;
  type: KIEServiceType;
  endpoint: string;
  costPerGeneration: number; // in credits
  costInUSD: number; // approximate USD cost
  estimatedTime: number; // in seconds
  features: string[];
  limitations?: string[];
  supportsText2Vid?: boolean; // for video: supports text-to-video generation
  supportsImg2Img?: boolean; // for video: supports image-to-video generation
  supportedAspectRatios?: string[];
  maxDuration?: number; // for video/music in seconds
}

/**
 * Image Generation Services
 *
 * Note: KIE.AI uses a unified jobs API where all models use the same endpoints:
 * - Create: POST /api/v1/jobs/createTask
 * - Status: GET /api/v1/jobs/recordInfo?taskId={id}
 * The model is specified via the "model" parameter in the request body.
 *
 * Based on official documentation at https://kie.ai/market
 */
export const KIE_IMAGE_SERVICES: KIEService[] = [
  {
    id: 'kie-nano-banana',
    name: 'Nano Banana',
    description: 'Fast and affordable image generation by Google',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 4,
    costInUSD: 0.02,
    estimatedTime: 10,
    features: [
      'Very fast generation',
      'Most affordable',
      'Good quality',
      'Text-to-Image',
      'Multiple aspect ratios'
    ],
    supportsImg2Img: false,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '21:9'],
  },
  {
    id: 'kie-qwen-text2img',
    name: 'Qwen Text-to-Image',
    description: 'Multilingual text rendering with English and Chinese support',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 5,
    costInUSD: 0.0125,
    estimatedTime: 15,
    features: [
      'Multilingual text rendering',
      'English and Chinese text',
      'Artistic versatility',
      '8-step processing',
      'Very fast'
    ],
    supportsImg2Img: false,
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
  },
  {
    id: 'kie-imagen4-ultra',
    name: 'Imagen 4 Ultra',
    description: 'Ultra-fast photorealistic generation, up to 10× faster, 2K resolution',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 12,
    costInUSD: 0.06,
    estimatedTime: 5,
    features: [
      'Up to 10× faster',
      'Photorealistic quality',
      '2K resolution support',
      'Fine-grained details',
      'Typography accuracy'
    ],
    supportsImg2Img: false,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
  },
  {
    id: 'kie-imagen4',
    name: 'Imagen 4 Standard',
    description: 'Balanced quality and performance with excellent photorealism',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 8,
    costInUSD: 0.04,
    estimatedTime: 10,
    features: [
      'Photorealistic quality',
      'Improved color control',
      'Artistic styles',
      'Text rendering',
      'Fine details'
    ],
    supportsImg2Img: false,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
  },
  {
    id: 'kie-imagen4-fast',
    name: 'Imagen 4 Fast',
    description: 'Most economical option for rapid iterations',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 4,
    costInUSD: 0.02,
    estimatedTime: 8,
    features: [
      'Most affordable',
      'Fast generation',
      'Good quality',
      'Rapid iterations',
      'Photorealistic'
    ],
    supportsImg2Img: false,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
  },
  {
    id: 'kie-grok-imagine',
    name: 'Grok Imagine',
    description: 'Generate 6 images per request, diverse creative outputs',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 4,
    costInUSD: 0.02,
    estimatedTime: 12,
    features: [
      '6 images per generation',
      'Standard/fun/spicy modes',
      'Coherent motion',
      'Multiple aspect ratios',
      'Creative variations'
    ],
    supportsImg2Img: false,
    supportedAspectRatios: ['1:1', '2:3', '3:2'],
  },
  {
    id: 'kie-gpt4o-image',
    name: 'GPT-4O Image',
    description: 'Advanced ChatGPT 4O image generation with text rendering',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 6,
    costInUSD: 0.03,
    estimatedTime: 15,
    features: [
      'Text understanding',
      'Precise instructions',
      'Text rendering in images',
      'Style consistency',
      'Photorealistic to anime'
    ],
    supportsImg2Img: false,
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
  },
];

/**
 * Image-to-Image (Editing) Services
 */
export const KIE_IMG2IMG_SERVICES: KIEService[] = [
  {
    id: 'kie-nano-banana-edit',
    name: 'Nano Banana Edit',
    description: 'Natural language image editing with pixel-level accuracy',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 4,
    costInUSD: 0.02,
    estimatedTime: 10,
    features: [
      'Object replacement',
      'Background modification',
      'Style transfers',
      'Facial refinement',
      'Consistency maintenance'
    ],
    supportsImg2Img: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '21:9'],
  },
  {
    id: 'kie-qwen-img2img',
    name: 'Qwen Image-to-Image',
    description: 'Dual-mode editing: semantic changes and appearance edits',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 5,
    costInUSD: 0.0125,
    estimatedTime: 15,
    features: [
      'Image-to-Image editing',
      'Style transfer',
      'Pose modification',
      'Object insertion/removal',
      'Fast processing'
    ],
    supportsImg2Img: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
  },
  {
    id: 'kie-seedream-v4-edit',
    name: 'Seedream V4 Edit',
    description: 'Precise instruction editing with identity preservation',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 8,
    costInUSD: 0.04,
    estimatedTime: 20,
    features: [
      'Add/remove/replace objects',
      'Identity preservation',
      'Style consistency',
      'Up to 4K resolution',
      'Natural language editing'
    ],
    supportsImg2Img: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
  },
  {
    id: 'kie-recraft-remove-bg',
    name: 'Recraft Remove Background',
    description: 'Automatic background removal with transparent PNG output',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 2,
    costInUSD: 0.01,
    estimatedTime: 5,
    features: [
      'Automatic background removal',
      'Transparent PNG output',
      'Complex edge handling',
      'Hair & fur accurate',
      'Very fast'
    ],
    supportsImg2Img: true,
    supportedAspectRatios: ['1:1'], // Maintains original aspect ratio
  },
  {
    id: 'kie-imagen4-edit',
    name: 'Imagen 4 Edit',
    description: 'High-quality photorealistic image editing',
    type: 'image',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 8,
    costInUSD: 0.04,
    estimatedTime: 10,
    features: [
      'Photorealistic editing',
      'Fine-grained control',
      'High quality',
      'Fast processing',
      'Professional results'
    ],
    supportsImg2Img: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
  },
];

/**
 * Video Generation Services
 */
export const KIE_VIDEO_SERVICES: KIEService[] = [
  {
    id: 'kie-sora-2-pro-text2vid',
    name: 'Sora 2 Pro (Text)',
    description: 'OpenAI Sora 2 Pro - Text-to-video with photorealistic quality',
    type: 'video',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 500,
    costInUSD: 2.50,
    estimatedTime: 180, // 3 minutes
    features: [
      'Text-to-Video only',
      'Photorealistic quality',
      '10s or 15s duration',
      'Professional grade',
      'Complex scenes',
      'High quality output',
      'Watermark removal'
    ],
    supportsText2Vid: true,
    supportsImg2Img: false,
    supportedAspectRatios: ['16:9', '9:16'], // landscape or portrait only
    maxDuration: 15,
  },
  {
    id: 'kie-sora-2-pro-img2vid',
    name: 'Sora 2 Pro (Image)',
    description: 'OpenAI Sora 2 Pro - Image-to-video with multiple images support',
    type: 'video',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 500,
    costInUSD: 2.50,
    estimatedTime: 180, // 3 minutes
    features: [
      'Image-to-Video only',
      'Multiple images support',
      'Photorealistic quality',
      '10s or 15s duration',
      'Professional grade',
      'High quality output',
      'Watermark removal'
    ],
    supportsText2Vid: false,
    supportsImg2Img: true,
    supportedAspectRatios: ['16:9', '9:16'], // landscape or portrait only
    maxDuration: 15,
  },
  {
    id: 'kie-veo3-fast',
    name: 'Veo 3.1 Fast',
    description: 'Google Veo 3.1 - Fast video generation (8s with audio)',
    type: 'video',
    endpoint: '/api/v1/veo/generate',
    costPerGeneration: 80,
    costInUSD: 0.40,
    estimatedTime: 120, // 2 minutes
    features: [
      'Text-to-Video',
      'Image-to-Video',
      '8 seconds duration',
      'Includes audio',
      'Fast generation',
      '720p resolution',
      'Upgrade to 1080p available'
    ],
    supportsText2Vid: true,
    supportsImg2Img: true,
    supportedAspectRatios: ['16:9', '9:16'], // Veo only supports 16:9 and 9:16
    maxDuration: 8,
  },
  {
    id: 'kie-veo3-quality',
    name: 'Veo 3.1 Quality',
    description: 'Google Veo 3.1 - High quality video generation (8s with audio)',
    type: 'video',
    endpoint: '/api/v1/veo/generate',
    costPerGeneration: 400,
    costInUSD: 2.00,
    estimatedTime: 180, // 3 minutes
    features: [
      'Text-to-Video',
      'Image-to-Video',
      '8 seconds duration',
      'Includes audio',
      'Professional quality',
      '720p resolution',
      'Upgrade to 1080p available',
      'Best quality'
    ],
    supportsText2Vid: true,
    supportsImg2Img: true,
    supportedAspectRatios: ['16:9', '9:16'], // Veo only supports 16:9 and 9:16
    maxDuration: 8,
  },
  {
    id: 'kie-hailuo-standard-img2vid',
    name: 'Hailuo 2.3 Standard',
    description: 'Hailuo 2.3 Standard - Enhanced image-to-video with better motion',
    type: 'video',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 60,
    costInUSD: 0.30,
    estimatedTime: 100,
    features: [
      'Image-to-Video only',
      '6 seconds duration',
      'Standard quality',
      'Good motion control',
      'Affordable pricing'
    ],
    supportsText2Vid: false,
    supportsImg2Img: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 6,
  },
  {
    id: 'kie-hailuo-pro-img2vid',
    name: 'Hailuo 2.3 Pro',
    description: 'Hailuo 2.3 Pro - Premium image-to-video with highest quality',
    type: 'video',
    endpoint: '/api/v1/jobs/createTask',
    costPerGeneration: 120,
    costInUSD: 0.60,
    estimatedTime: 120,
    features: [
      'Image-to-Video only',
      '6 seconds duration',
      'Premium quality',
      'Best motion control',
      'Superior consistency',
      'Enhanced details'
    ],
    supportsText2Vid: false,
    supportsImg2Img: true,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 6,
  },
];

/**
 * Music Generation Services
 */
export const KIE_MUSIC_SERVICES: KIEService[] = [
  {
    id: 'kie-suno-v5',
    name: 'Suno V5',
    description: 'Latest Suno model - Premium music generation',
    type: 'music',
    endpoint: '/api/v1/suno/generate',
    costPerGeneration: 50,
    costInUSD: 0.25,
    estimatedTime: 60,
    features: [
      'Enhanced vocals',
      'Richer sound',
      'Better song structure',
      'Smart prompts',
      'Up to 8 minutes',
      'Commercial use',
      'No watermark'
    ],
    maxDuration: 480, // 8 minutes
  },
  {
    id: 'kie-suno-v4-5',
    name: 'Suno V4.5',
    description: 'Advanced music generation with custom mode',
    type: 'music',
    endpoint: '/api/v1/suno/generate',
    costPerGeneration: 40,
    costInUSD: 0.20,
    estimatedTime: 60,
    features: [
      'Custom mode',
      'Style selection',
      'Vocal gender control',
      'Instrumental option',
      'Up to 8 minutes',
      'Commercial use'
    ],
    maxDuration: 480,
  },
  {
    id: 'kie-suno-v3-5',
    name: 'Suno V3.5',
    description: 'Affordable music generation',
    type: 'music',
    endpoint: '/api/v1/suno/generate',
    costPerGeneration: 30,
    costInUSD: 0.15,
    estimatedTime: 50,
    features: [
      'Good quality',
      'Affordable',
      'Fast generation',
      'Up to 4 minutes',
      'Commercial use'
    ],
    maxDuration: 240, // 4 minutes
  },
];

/**
 * All KIE.AI Services
 */
export const ALL_KIE_SERVICES = [
  ...KIE_IMAGE_SERVICES,
  ...KIE_VIDEO_SERVICES,
  ...KIE_MUSIC_SERVICES,
];

/**
 * Get service by ID
 */
export function getKIEService(serviceId: string): KIEService | undefined {
  return ALL_KIE_SERVICES.find(s => s.id === serviceId);
}

/**
 * Get services by type
 */
export function getKIEServicesByType(type: KIEServiceType): KIEService[] {
  return ALL_KIE_SERVICES.filter(s => s.type === type);
}

/**
 * Calculate total cost
 */
export function calculateKIECost(serviceId: string, quantity: number = 1): {
  credits: number;
  usd: number;
  service: KIEService | undefined;
} {
  const service = getKIEService(serviceId);
  if (!service) {
    return { credits: 0, usd: 0, service: undefined };
  }

  return {
    credits: service.costPerGeneration * quantity,
    usd: service.costInUSD * quantity,
    service,
  };
}

/**
 * Format cost display
 */
export function formatKIECost(credits: number, usd: number): string {
  return `${credits} credits (~$${usd.toFixed(2)})`;
}

/**
 * Credit to USD conversion
 */
export const CREDIT_TO_USD = 0.005; // 1 credit = $0.005

/**
 * Convert credits to USD
 */
export function creditsToUSD(credits: number): number {
  return credits * CREDIT_TO_USD;
}

/**
 * Convert USD to credits
 */
export function usdToCredits(usd: number): number {
  return Math.ceil(usd / CREDIT_TO_USD);
}
