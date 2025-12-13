/**
 * HeyGen Service Configuration
 *
 * This file defines all available HeyGen services
 * that users can access with their HeyGen API key
 */

export const HEYGEN_BASE_URL = 'https://api.heygen.com';

export type HeyGenServiceType = 'video-translation' | 'avatar-video' | 'photo-avatar';

export interface HeyGenService {
  id: string;
  name: string;
  description: string;
  type: HeyGenServiceType;
  endpoint: string;
  features: string[];
  limitations?: string[];
  requiresProduction?: boolean;
}

/**
 * Video Translation Services
 */
export const HEYGEN_TRANSLATION_SERVICE: HeyGenService = {
  id: 'heygen-video-translate',
  name: 'Video Translation',
  description: 'Translate videos to 175+ languages with lip-sync and natural voicing',
  type: 'video-translation',
  endpoint: '/v2/video_translate',
  features: [
    '175+ target languages',
    'Automatic lip-sync',
    'Natural voice cloning',
    'Multi-speaker support',
    'Dynamic duration adjustment',
    'Audio-only option',
    'Brand voice support',
  ],
  limitations: [
    'Requires production API access (no trial)',
    'Cannot test without production account'
  ],
  requiresProduction: true,
};

/**
 * Avatar Video Generation Services
 */
export const HEYGEN_AVATAR_SERVICES: HeyGenService[] = [
  {
    id: 'heygen-avatar-video',
    name: 'Avatar Video Generation',
    description: 'Create videos with AI avatars speaking custom scripts',
    type: 'avatar-video',
    endpoint: '/v2/video/generate',
    features: [
      'AI avatar selection',
      'Custom script input',
      'Voice selection',
      'Multiple avatar styles (circle, normal, closeUp)',
      'Emotion control (Excited, Friendly, Serious, Soothing)',
      'Speech control (speed: 0.5-1.5x, pitch: -50 to +50)',
      'Multi-scene support (1-50 scenes)',
      'Custom backgrounds',
      'Caption support',
      'Avatar scaling and positioning',
    ],
  },
  {
    id: 'heygen-photo-avatar',
    name: 'Photo Avatar Video',
    description: 'Generate videos from your photos with AI animation',
    type: 'photo-avatar',
    endpoint: '/v2/video/generate',
    features: [
      'Upload your own photo',
      'AI-animated talking avatar',
      'Two talking styles (stable, expressive)',
      'Emotion selection (default, happy)',
      'Super resolution option',
      'Custom script input',
      'Voice selection',
    ],
  },
];

/**
 * All HeyGen Services
 */
export const ALL_HEYGEN_SERVICES = [
  HEYGEN_TRANSLATION_SERVICE,
  ...HEYGEN_AVATAR_SERVICES,
];

/**
 * Get service by ID
 */
export function getHeyGenService(serviceId: string): HeyGenService | undefined {
  return ALL_HEYGEN_SERVICES.find(s => s.id === serviceId);
}

/**
 * Get services by type
 */
export function getHeyGenServicesByType(type: HeyGenServiceType): HeyGenService[] {
  return ALL_HEYGEN_SERVICES.filter(s => s.type === type);
}

/**
 * Available avatar styles
 */
export const AVATAR_STYLES = ['circle', 'normal', 'closeUp'] as const;
export type AvatarStyle = typeof AVATAR_STYLES[number];

/**
 * Available emotions for avatar speech
 */
export const AVATAR_EMOTIONS = ['Excited', 'Friendly', 'Serious', 'Soothing', 'Broadcaster'] as const;
export type AvatarEmotion = typeof AVATAR_EMOTIONS[number];

/**
 * Available talking styles for photo avatars
 */
export const TALKING_STYLES = ['stable', 'expressive'] as const;
export type TalkingStyle = typeof TALKING_STYLES[number];

/**
 * Available expressions for photo avatars
 */
export const PHOTO_EXPRESSIONS = ['default', 'happy'] as const;
export type PhotoExpression = typeof PHOTO_EXPRESSIONS[number];

/**
 * Supported languages for video translation (175+ languages)
 * This is a subset of most common languages
 */
export const COMMON_TRANSLATION_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
];

/**
 * Video dimension options
 */
export interface VideoDimension {
  width: number;
  height: number;
  label: string;
}

export const VIDEO_DIMENSIONS: VideoDimension[] = [
  { width: 1920, height: 1080, label: '1080p (16:9)' },
  { width: 1080, height: 1920, label: '1080p (9:16) Vertical' },
  { width: 1280, height: 720, label: '720p (16:9)' },
  { width: 720, height: 1280, label: '720p (9:16) Vertical' },
  { width: 1080, height: 1080, label: '1080p (1:1) Square' },
  { width: 640, height: 640, label: '640p (1:1) Square' },
];
