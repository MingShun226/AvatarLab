# KIE.AI API Integration Guide for AvatarLab

## Table of Contents
1. [Overview](#overview)
2. [API Capabilities](#api-capabilities)
3. [Authentication](#authentication)
4. [Image Generation API](#image-generation-api)
5. [Video Generation API](#video-generation-api)
6. [Music Generation API](#music-generation-api)
7. [Pricing & Credits](#pricing--credits)
8. [Implementation Plan](#implementation-plan)
9. [Database Schema Changes](#database-schema-changes)
10. [UI/UX Design](#uiux-design)
11. [Code Integration Steps](#code-integration-steps)
12. [Error Handling & Best Practices](#error-handling--best-practices)

---

## Overview

**KIE.AI** is a unified AI API platform that provides access to multiple state-of-the-art AI models for image, video, and music generation. It offers:

- ✅ **99.9% Uptime** - Reliable and stable API performance
- ✅ **Affordable Pricing** - Flexible point-based pricing system
- ✅ **High Concurrency** - Scalable solutions for production
- ✅ **24/7 Support** - Professional technical assistance
- ✅ **Multi-Modal** - Image, Video, Music generation in one API

### Official Resources
- **Website**: https://kie.ai
- **Documentation**: https://docs.kie.ai
- **API Key Management**: https://kie.ai/api-key
- **Support**: support@kie.ai

---

## API Capabilities

### 1. Image Generation
- **Flux.1 Kontext API** - Context-aware image creation and editing
- **GPT-4O Image API** - Vision-based generation and editing
- **Midjourney API** - High-quality artistic image generation
  - Text-to-Image (mj_txt2img)
  - Image-to-Image (mj_img2img)
  - Image-to-Video (mj_video)

### 2. Video Generation
- **Veo 3.1 API** (Google) - Professional-quality video creation
  - Veo 3 Quality: 8s videos with audio ($2.00/video)
  - Veo 3 Fast: 8s videos with audio ($0.40/video)
- **Runway API** - Gen-3 Alpha Turbo for image-to-video
- **Runway Aleph API** - AI-powered video style transfer
- **Luma API** - Video modification capabilities

### 3. Music Generation
- **Suno API** - Text-to-music generation
  - Models: V3.5, V4, V4.5, V4.5 Plus, V5
  - Up to 8 minutes long tracks
  - Watermark-free, commercial-ready
  - Custom mode with style, vocals, instruments

---

## Authentication

### Base URL
```
https://api.kie.ai
```

### Authentication Method
All API requests use **Bearer Token** authentication.

### Header Format
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Getting Your API Key
1. Sign in at https://kie.ai
2. Navigate to https://kie.ai/api-key
3. Generate a new API key
4. Store securely (never expose in client-side code)

### Security Best Practices
- ✅ Store keys in environment variables
- ✅ Use separate keys for dev/production
- ✅ Rotate keys every 90-180 days
- ✅ Monitor for unusual activity
- ✅ Implement rate limiting
- ❌ Never commit keys to version control
- ❌ Never expose keys in frontend code

### Error Responses
- **401 Unauthorized**: Invalid or missing API key
- **429 Too Many Requests**: Rate limit exceeded (implement exponential backoff)

---

## Image Generation API

### Supported Models
1. **Flux.1 Kontext** - Context-aware image generation
2. **GPT-4O Image** - Vision-based generation
3. **Midjourney** - Artistic high-quality images

### Midjourney API

#### Generate Image (Text-to-Image)
**Endpoint**: `POST /api/v1/mj/generate`

**Request Body**:
```json
{
  "prompt": "A serene mountain landscape at sunset with golden light",
  "taskType": "mj_txt2img",
  "aspectRatio": "16:9",
  "stylization": 100,
  "speed": "fast",
  "model": "midjourney-6"
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | Text description of the image |
| taskType | string | Yes | "mj_txt2img", "mj_img2img", or "mj_video" |
| aspectRatio | string | No | "1:1", "16:9", "4:3", etc. Default: "1:1" |
| stylization | number | No | 0-1000, controls artistic style. Default: 100 |
| speed | string | No | "fast" or "quality". Default: "fast" |
| model | string | No | Model version. Default: "midjourney-6" |

**Response** (200 OK):
```json
{
  "taskId": "task_abc123xyz",
  "status": "pending",
  "message": "Task created successfully"
}
```

#### Get Task Status
**Endpoint**: `GET /api/v1/mj/record-info?taskId={taskId}`

**Response** (200 OK):
```json
{
  "taskId": "task_abc123xyz",
  "taskType": "mj_txt2img",
  "status": "completed",
  "paramJson": {
    "prompt": "A serene mountain landscape...",
    "aspectRatio": "16:9",
    "stylization": 100
  },
  "resultInfoJson": {
    "resultUrls": [
      "https://cdn.kie.ai/images/result1.png",
      "https://cdn.kie.ai/images/result2.png",
      "https://cdn.kie.ai/images/result3.png",
      "https://cdn.kie.ai/images/result4.png"
    ]
  },
  "createdAt": "2025-01-05T10:30:00Z",
  "completedAt": "2025-01-05T10:30:45Z"
}
```

**Status Values**:
- `pending`: Task queued
- `processing`: Generation in progress
- `completed`: Task finished successfully
- `failed`: Task failed (check error message)

#### Image-to-Image
**Endpoint**: `POST /api/v1/mj/generate`

**Request Body**:
```json
{
  "prompt": "Transform this into a cyberpunk cityscape at night",
  "taskType": "mj_img2img",
  "imageUrl": "https://example.com/input-image.jpg",
  "strength": 0.7
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| imageUrl | string | Yes | URL of the input image |
| strength | number | No | 0.1-1.0, transformation strength. Default: 0.8 |

### Pricing (Image)
- **Nano Banana**: 4 credits ($0.02 per image)
- **Seedream 4.0**: 3.5 credits ($0.0175 per image)
- **Midjourney**: ~8 credits ($0.04 per generation, produces 4 variants = $0.01 per image)

---

## Video Generation API

### Veo 3.1 API (Google)

#### Generate Video
**Endpoint**: `POST /api/v1/veo/generate`

**Request Body (Text-to-Video)**:
```json
{
  "prompt": "A drone shot flying over a futuristic city at sunset",
  "model": "veo3_fast",
  "aspectRatio": "16:9",
  "watermark": "MyBrand",
  "enableTranslation": true,
  "generationType": "TEXT_2_VIDEO"
}
```

**Request Body (Image-to-Video)**:
```json
{
  "prompt": "Animate this image with gentle camera movement",
  "model": "veo3",
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "aspectRatio": "16:9",
  "generationType": "FIRST_AND_LAST_FRAMES_2_VIDEO"
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | Text description of the video |
| model | string | Yes | "veo3" (quality) or "veo3_fast" (fast) |
| aspectRatio | string | No | "16:9", "9:16", "1:1". Default: "16:9" |
| imageUrls | array | No | For image-to-video (1-3 images) |
| watermark | string | No | Custom watermark text |
| enableTranslation | boolean | No | Auto-translate to English. Default: false |
| generationType | string | Yes | "TEXT_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO", or "REFERENCE_2_VIDEO" |
| seeds | number | No | Random seed for reproducibility |
| callBackUrl | string | No | Webhook URL for completion notification |

**Response** (200 OK):
```json
{
  "taskId": "veo_task_xyz789",
  "status": "pending",
  "estimatedTime": 120,
  "message": "Video generation started"
}
```

#### Check Video Status
**Endpoint**: `GET /api/v1/veo/record-info?taskId={taskId}`

**Response** (200 OK):
```json
{
  "taskId": "veo_task_xyz789",
  "status": "completed",
  "videoUrl": "https://cdn.kie.ai/videos/output.mp4",
  "thumbnailUrl": "https://cdn.kie.ai/videos/thumb.jpg",
  "duration": 8,
  "resolution": "720p",
  "createdAt": "2025-01-05T11:00:00Z",
  "completedAt": "2025-01-05T11:02:15Z"
}
```

#### Get 1080p Version
**Endpoint**: `GET /api/v1/veo/get-1080p-video?taskId={taskId}`

### Runway API

#### Generate Video
**Endpoint**: `POST /api/v1/runway/generate`

**Request Body**:
```json
{
  "prompt": "A person walking through a forest",
  "imageUrl": "https://example.com/start-frame.jpg",
  "duration": 5,
  "model": "gen3_alpha_turbo"
}
```

#### Extend Video
**Endpoint**: `POST /api/v1/runway/extend`

**Request Body**:
```json
{
  "taskId": "runway_task_123",
  "additionalSeconds": 5
}
```

### Pricing (Video)
- **Veo 3 Fast**: 80 credits ($0.40 per 8s video with audio)
- **Veo 3 Quality**: 400 credits ($2.00 per 8s video with audio)
- **Midjourney Video**: ~40 credits ($0.20 per generation, produces 4 variants = $0.05 per video)

---

## Music Generation API

### Suno API

#### Generate Music
**Endpoint**: `POST /api/v1/suno/generate`

**Request Body (Simple Mode)**:
```json
{
  "prompt": "A calm and relaxing piano track with soft melodies",
  "model": "V4_5",
  "instrumental": false
}
```

**Request Body (Custom Mode)**:
```json
{
  "prompt": "A calm and relaxing piano track with soft melodies",
  "style": "Classical, Ambient",
  "title": "Peaceful Piano Meditation",
  "customMode": true,
  "instrumental": true,
  "model": "V4_5",
  "vocalGender": "f",
  "negativeTags": "Heavy Metal, Upbeat Drums",
  "styleWeight": 0.65,
  "weirdnessConstraint": 0.65,
  "audioWeight": 0.65,
  "callBackUrl": "https://api.example.com/callback"
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | Description of the music |
| model | string | Yes | "V3_5", "V4", "V4_5", "V5" |
| customMode | boolean | No | Enable custom mode. Default: false |
| style | string | Required if customMode | Music style (e.g., "Classical, Jazz") |
| title | string | Required if customMode | Track title (max 80 chars) |
| instrumental | boolean | No | No vocals. Default: false |
| vocalGender | string | No | "m" or "f" for male/female vocals |
| negativeTags | string | No | Styles to avoid (e.g., "Rock, Pop") |
| styleWeight | number | No | 0-1, style adherence. Default: 0.65 |
| weirdnessConstraint | number | No | 0-1, creativity level. Default: 0.65 |
| audioWeight | number | No | 0-1, audio quality focus. Default: 0.65 |
| callBackUrl | string | No | Webhook URL |

**Response** (200 OK):
```json
{
  "taskId": "suno_task_456",
  "status": "pending",
  "estimatedTime": 60,
  "message": "Music generation started"
}
```

#### Check Music Status
**Endpoint**: `GET /api/v1/suno/record-info?taskId={taskId}`

**Response** (200 OK):
```json
{
  "taskId": "suno_task_456",
  "status": "completed",
  "tracks": [
    {
      "audioUrl": "https://cdn.kie.ai/music/track1.mp3",
      "title": "Peaceful Piano Meditation",
      "duration": 180,
      "style": "Classical, Ambient"
    },
    {
      "audioUrl": "https://cdn.kie.ai/music/track2.mp3",
      "title": "Peaceful Piano Meditation (Variation)",
      "duration": 185,
      "style": "Classical, Ambient"
    }
  ],
  "createdAt": "2025-01-05T12:00:00Z",
  "completedAt": "2025-01-05T12:01:30Z"
}
```

**Callback Stages**:
1. **text**: Text/lyrics generation complete
2. **first**: First track complete
3. **complete**: All tracks complete

### Pricing (Music)
- Variable based on model and duration
- Typically 20-50 credits per track
- Free trial: 300 credits upon signup

---

## Pricing & Credits

### Credit System
- **1 credit = $0.005** (half a cent)
- **Pay-as-you-go** - Only pay for what you use
- **Free Trial**: 300 credits upon signup

### Pricing Comparison
| Service | KIE.AI | Competitors |
|---------|--------|-------------|
| Veo 3 Quality Video (8s) | $2.00 | $6.00+ |
| Veo 3 Fast Video (8s) | $0.40 | $2.50+ |
| Midjourney Image | $0.01/img | $0.03+/img |
| Suno Music Track | ~$0.15 | $0.30+ |

**Savings**: 60-70% cheaper than Replicate, Fal.ai, AIMLAPI

### Cost Examples
- **100 images** (Midjourney): $1.00 (4 variants each = 400 images)
- **50 videos** (Veo 3 Fast): $20.00
- **20 music tracks** (Suno V4.5): ~$3.00
- **Total**: $24.00 for diverse content

---

## Implementation Plan

### Phase 1: API Key Management System

#### 1.1 Database Schema
Create a new table for storing user API keys:

```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'kie-ai', 'openai', 'google', etc.
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key
  api_key_name VARCHAR(100), -- User-friendly name
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, api_key_name)
);

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON user_api_keys(provider);
```

#### 1.2 RLS Policies
```sql
-- Users can only manage their own API keys
CREATE POLICY "Users can view own API keys"
ON user_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
ON user_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
ON user_api_keys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
ON user_api_keys FOR DELETE
USING (auth.uid() = user_id);
```

### Phase 2: Video Generation Support

#### 2.1 Database Schema Updates
Add video-specific columns to `generated_images` table (rename to `generated_content`):

```sql
-- Rename table
ALTER TABLE generated_images RENAME TO generated_content;

-- Add new columns
ALTER TABLE generated_content
ADD COLUMN content_type VARCHAR(20) DEFAULT 'image' CHECK (content_type IN ('image', 'video', 'music')),
ADD COLUMN video_url TEXT,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN duration INTEGER, -- seconds
ADD COLUMN resolution VARCHAR(10), -- '720p', '1080p', etc.
ADD COLUMN audio_url TEXT,
ADD COLUMN has_audio BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX idx_generated_content_type ON generated_content(content_type);
CREATE INDEX idx_generated_content_user_type ON generated_content(user_id, content_type);
```

#### 2.2 Video Generation Task Tracking
```sql
CREATE TABLE generation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  task_id VARCHAR(255) NOT NULL, -- Provider's task ID
  task_type VARCHAR(50) NOT NULL, -- 'text2img', 'text2video', 'text2music', etc.
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  prompt TEXT NOT NULL,
  parameters JSONB,
  result_url TEXT,
  error_message TEXT,
  estimated_time INTEGER, -- seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(provider, task_id)
);

CREATE INDEX idx_generation_tasks_user_status ON generation_tasks(user_id, status);
CREATE INDEX idx_generation_tasks_provider_task ON generation_tasks(provider, task_id);
```

### Phase 3: UI/UX Components

#### 3.1 Settings Page - API Management

**Location**: `/src/pages/Settings.tsx` or `/src/pages/APIManagement.tsx`

**Features**:
- List all configured API providers
- Add new API key per provider
- Edit/Delete API keys
- Test API key validity
- View usage statistics (if available)
- Set default provider per content type

**UI Design**:
```
┌─────────────────────────────────────────────────────────┐
│  API Management                                         │
├─────────────────────────────────────────────────────────┤
│  Manage your AI service provider API keys              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  KIE.AI                                  [Edit] │   │
│  │  Status: ● Active                               │   │
│  │  Last used: 2 hours ago                        │   │
│  │                                          [Test] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  OpenAI                                  [Edit] │   │
│  │  Status: ○ Inactive                            │   │
│  │  Last used: Never                              │   │
│  │                                          [Test] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ Add New Provider]                                  │
└─────────────────────────────────────────────────────────┘
```

#### 3.2 Images Studio - Add Video Tab

**Location**: `/src/pages/ImagesStudio.tsx` → Rename to `/src/pages/CreativeStudio.tsx`

**Tabs**:
1. Images (existing)
2. **Videos** (new)
3. **Music** (new)
4. Gallery (unified for all content types)

**Video Generation UI**:
```
┌─────────────────────────────────────────────────────────┐
│  AI Video Studio                                        │
├─────────────────────────────────────────────────────────┤
│  Generation Mode: ● Text-to-Video  ○ Image-to-Video    │
│                                                         │
│  Provider: [KIE.AI Veo 3 ▼]                            │
│  Quality:  ● Fast ($0.40)  ○ Quality ($2.00)           │
│                                                         │
│  Prompt:                                               │
│  ┌───────────────────────────────────────────────┐     │
│  │ A drone shot flying over...                   │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  [Upload Start Image] (optional for image-to-video)    │
│                                                         │
│  Aspect Ratio: [16:9 ▼]                                │
│  Watermark: [Optional watermark text]                  │
│                                                         │
│  [Generate Video ▶]                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⏳ Generating... 45% (Est. 1:30 remaining)     │   │
│  │  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Phase 4: Backend Implementation

#### 4.1 Edge Function: `generate-kie-content`

**Location**: `/supabase/functions/generate-kie-content/index.ts`

**Purpose**: Unified function for image/video/music generation via KIE.AI

**Flow**:
1. Validate user authentication
2. Get user's KIE.AI API key
3. Determine content type (image/video/music)
4. Call appropriate KIE.AI endpoint
5. Store task in `generation_tasks` table
6. Poll for completion (async)
7. Save result to `generated_content` table

#### 4.2 Edge Function: `check-kie-progress`

**Purpose**: Poll KIE.AI for task completion

**Flow**:
1. Accept taskId
2. Query KIE.AI status endpoint
3. Update `generation_tasks` table
4. Return status to frontend

#### 4.3 Frontend Service: `kieService.ts`

**Location**: `/src/services/kieService.ts`

**Functions**:
```typescript
// Image generation
export async function generateImage(params: {
  prompt: string;
  taskType: 'mj_txt2img' | 'mj_img2img';
  aspectRatio?: string;
  imageUrl?: string;
}): Promise<{ taskId: string }>;

// Video generation
export async function generateVideo(params: {
  prompt: string;
  model: 'veo3' | 'veo3_fast';
  generationType: 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO';
  imageUrls?: string[];
  aspectRatio?: string;
}): Promise<{ taskId: string }>;

// Music generation
export async function generateMusic(params: {
  prompt: string;
  model: 'V3_5' | 'V4' | 'V4_5' | 'V5';
  customMode?: boolean;
  style?: string;
  title?: string;
}): Promise<{ taskId: string }>;

// Poll for completion
export async function checkTaskStatus(
  taskId: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
}>;
```

---

## Database Schema Changes

### Migration 1: Create `user_api_keys` table
```sql
-- File: 20251105000002_create_user_api_keys.sql

CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_key_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_provider_name UNIQUE(user_id, provider, api_key_name)
);

CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON public.user_api_keys(provider);

-- RLS Policies
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
ON public.user_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
ON public.user_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
ON public.user_api_keys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
ON public.user_api_keys FOR DELETE
USING (auth.uid() = user_id);
```

### Migration 2: Extend `generated_images` for video/music
```sql
-- File: 20251105000003_extend_generated_content.sql

-- Rename table
ALTER TABLE public.generated_images RENAME TO generated_content;

-- Add new columns
ALTER TABLE public.generated_content
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'image',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS resolution VARCHAR(10),
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT false;

-- Add constraint
ALTER TABLE public.generated_content
ADD CONSTRAINT check_content_type
CHECK (content_type IN ('image', 'video', 'music'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_type
ON public.generated_content(content_type);

CREATE INDEX IF NOT EXISTS idx_generated_content_user_type
ON public.generated_content(user_id, content_type);

-- Update existing records
UPDATE public.generated_content
SET content_type = 'image'
WHERE content_type IS NULL;
```

### Migration 3: Create `generation_tasks` table
```sql
-- File: 20251105000004_create_generation_tasks.sql

CREATE TABLE public.generation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  task_id VARCHAR(255) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  prompt TEXT NOT NULL,
  parameters JSONB,
  result_url TEXT,
  error_message TEXT,
  estimated_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_provider_task UNIQUE(provider, task_id),
  CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT check_progress CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX idx_generation_tasks_user_status
ON public.generation_tasks(user_id, status);

CREATE INDEX idx_generation_tasks_provider_task
ON public.generation_tasks(provider, task_id);

-- RLS Policies
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
ON public.generation_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
ON public.generation_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
ON public.generation_tasks FOR UPDATE
USING (auth.uid() = user_id);
```

---

## UI/UX Design

### 1. API Management Page Component Structure

```
src/
├── pages/
│   └── Settings/
│       ├── APIManagement.tsx        # Main API management page
│       └── components/
│           ├── ProviderCard.tsx     # Individual provider card
│           ├── AddProviderDialog.tsx # Add/edit API key dialog
│           └── TestAPIKeyButton.tsx  # Test API key validity
```

### 2. Creative Studio (formerly Images Studio)

```
src/
├── pages/
│   └── CreativeStudio.tsx           # Main creative studio page
├── components/
│   └── creative-studio/
│       ├── ImageGeneration.tsx      # Image generation tab
│       ├── VideoGeneration.tsx      # Video generation tab (NEW)
│       ├── MusicGeneration.tsx      # Music generation tab (NEW)
│       ├── UnifiedGallery.tsx       # Gallery for all content types
│       └── components/
│           ├── VideoPlayer.tsx      # Video preview/player
│           ├── AudioPlayer.tsx      # Music player
│           └── ProgressTracker.tsx  # Generation progress display
```

---

## Code Integration Steps

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js crypto-js
```

### Step 2: Create KIE.AI Service
Create `/src/services/kieService.ts`

### Step 3: Create API Key Management UI
Create `/src/pages/Settings/APIManagement.tsx`

### Step 4: Extend Creative Studio
Update `/src/pages/ImagesStudio.tsx` → `/src/pages/CreativeStudio.tsx`

### Step 5: Create Edge Functions
- `/supabase/functions/generate-kie-content/`
- `/supabase/functions/check-kie-progress/`

### Step 6: Run Migrations
```bash
supabase db push
```

### Step 7: Test Integration
1. Add KIE.AI API key in settings
2. Generate test image
3. Generate test video
4. Generate test music
5. Verify gallery displays all content types

---

## Error Handling & Best Practices

### Error Handling
```typescript
try {
  const result = await generateVideo(params);
} catch (error: any) {
  if (error.status === 401) {
    // Invalid API key - prompt user to update
    toast.error('Invalid API key. Please update in settings.');
  } else if (error.status === 429) {
    // Rate limit - implement exponential backoff
    toast.error('Rate limit exceeded. Please try again later.');
  } else if (error.status === 402) {
    // Insufficient credits
    toast.error('Insufficient credits. Please add credits to your KIE.AI account.');
  } else {
    toast.error(error.message || 'Generation failed');
  }
}
```

### Best Practices

1. **Security**
   - ✅ Encrypt API keys in database (use crypto-js)
   - ✅ Never expose API keys in frontend
   - ✅ Use edge functions for API calls
   - ✅ Implement rate limiting per user

2. **User Experience**
   - ✅ Show real-time progress for async tasks
   - ✅ Estimate completion time
   - ✅ Allow cancellation of pending tasks
   - ✅ Cache results in database
   - ✅ Provide cost estimates before generation

3. **Performance**
   - ✅ Implement polling with exponential backoff
   - ✅ Cache task status to reduce API calls
   - ✅ Use webhooks (callBackUrl) when possible
   - ✅ Lazy load gallery content
   - ✅ Compress videos/images for preview

4. **Cost Management**
   - ✅ Display credit cost before generation
   - ✅ Set monthly spending limits per user
   - ✅ Track usage statistics
   - ✅ Alert users when credits are low

---

## Next Steps

### Immediate Actions
1. ✅ Review this documentation
2. ✅ Create KIE.AI account and get API key
3. ✅ Test API endpoints in Postman/Insomnia
4. ✅ Approve database schema changes
5. ✅ Approve UI/UX design

### Implementation Priority
1. **Phase 1** (Week 1): API Key Management System
2. **Phase 2** (Week 2): Video Generation Backend
3. **Phase 3** (Week 3): Video Generation UI
4. **Phase 4** (Week 4): Music Generation
5. **Phase 5** (Week 5): Testing & Optimization

### Questions to Answer Before Implementation
1. Should users be able to add multiple API keys per provider?
2. Should we set default spending limits for new users?
3. Should we show cost estimates before generation?
4. Should we cache generated content indefinitely or auto-delete after X days?
5. Should we support webhooks for async notifications?

---

## Conclusion

KIE.AI provides a powerful, affordable, and unified API for image, video, and music generation. Integration into AvatarLab will:

- ✅ **Enhance User Experience**: One-stop shop for creative AI content
- ✅ **Reduce Costs**: 60-70% cheaper than competitors
- ✅ **Increase Reliability**: 99.9% uptime guarantee
- ✅ **Simplify Management**: Unified API for multiple content types
- ✅ **Scale Effortlessly**: High concurrency support

**Estimated Development Time**: 4-5 weeks
**Estimated Cost to Test**: $5-10 (using free trial + minimal credits)

**Ready to proceed?** Review this documentation and approve to begin implementation!

---

*Document Version: 1.0*
*Last Updated: 2025-01-05*
*Author: AI Assistant*
