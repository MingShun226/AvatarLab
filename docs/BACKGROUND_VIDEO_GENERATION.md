# Background Video Generation System

## Overview

Your video generation system now works in the background! Users can submit video requests and navigate away - videos will be generated automatically and appear in the Gallery when complete.

## How It Works

### 1. User Submits Video Generation
- User fills out the form (prompt, service, settings)
- Clicks "Generate Video"
- Video is immediately saved to database with status `processing`
- User gets instant feedback and can navigate away

### 2. Background Processing
- Video record is stored with `task_id` from KIE.AI
- Status is set to `processing` with progress 0%
- User can see the video in Gallery tab immediately

### 3. Status Polling
- Background edge function (`poll-video-status`) checks processing videos
- Runs every time gallery is refreshed or auto-every 10 seconds
- Updates video status and URL when complete

### 4. Video Completion
- When video is ready, status changes to `completed`
- Video URL is saved to database
- User can watch/download from Gallery

## Database Schema

### `generated_videos` Table

```sql
CREATE TABLE generated_videos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,           -- KIE.AI task ID
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL,            -- e.g., 'kie-veo3-fast'
  model TEXT,
  generation_type TEXT,              -- 'text2vid' or 'img2vid'
  status TEXT DEFAULT 'processing',  -- 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0,        -- 0-100
  video_url TEXT,                    -- Set when completed
  thumbnail_url TEXT,
  error_message TEXT,
  parameters JSONB,
  aspect_ratio TEXT,
  duration INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

## Components

### 1. `poll-video-status` Edge Function
**Purpose:** Background polling to update video statuses

**Location:** `supabase/functions/poll-video-status/index.ts`

**How it works:**
- Queries all videos with status `processing`
- Checks each video's status with KIE.AI API
- Updates database when video completes or fails
- Handles both Veo and Sora/Hailuo providers

**Invoked by:**
- Gallery auto-refresh (every 10 seconds if processing videos exist)
- Manual refresh button in Gallery

### 2. `VideoGallery` Component
**Purpose:** Display all videos with their current status

**Location:** `src/components/dashboard/sections/VideoGallery.tsx`

**Features:**
- Shows processing videos with spinner
- Shows completed videos with video player
- Shows failed videos with error message
- Auto-refreshes when processing videos exist
- Download and delete actions

### 3. Updated `generateVideo()` Function
**Purpose:** Start generation and save immediately

**Location:** `src/services/videoGeneration.ts`

**Changes:**
- Saves video to database immediately after getting taskId
- Returns `videoId` along with `taskId`
- No longer polls for completion (background does this)

### 4. Updated `VideosSection`
**Purpose:** Simplified generation flow

**Location:** `src/components/dashboard/sections/VideosSection.tsx`

**Changes:**
- Removed `pollForVideoCompletion` call
- Removed `saveGeneratedVideo` call (happens immediately now)
- Shows success message directing user to Gallery
- No longer waits for video to complete

## Setup Instructions

### 1. Apply Database Migration

Run the migration to create the `generated_videos` table:

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Open: supabase/migrations/20251113000000_create_generated_videos_table.sql
# 3. Run the SQL

# Option 2: Via CLI (if other migrations are fixed)
npx supabase db push
```

### 2. Deploy Edge Functions

The poll-video-status function is already deployed, but if you need to redeploy:

```bash
npx supabase functions deploy poll-video-status
```

### 3. Test the Flow

1. **Generate a video:**
   - Go to Video Studio > Generate tab
   - Fill out the form and click "Generate Video"
   - You should see: "Video generation started! Check the Gallery tab to see progress."

2. **Check Gallery:**
   - Go to Gallery tab
   - You should see your video with status "processing"
   - Spinner shows it's generating

3. **Wait for completion:**
   - Gallery auto-refreshes every 10 seconds
   - When ready, video player appears
   - You can watch or download

## User Experience

### Before (Synchronous)
1. User clicks "Generate Video"
2. ⏳ **Must wait 2-3 minutes on page**
3. ⏳ Progress bar shows status
4. ⏳ Cannot navigate away
5. ✅ Video opens in new tab when done

### After (Background)
1. User clicks "Generate Video"
2. ✅ **Instant confirmation - can navigate away**
3. ✅ Video appears in Gallery with "processing" status
4. ✅ Can submit more videos or do other tasks
5. ✅ Gallery auto-updates when video is ready
6. ✅ Watch/download from Gallery anytime

## API Endpoints

### Generate Video
`POST /functions/v1/generate-video-unified`
- Starts video generation
- Saves to database immediately
- Returns `videoId` and `taskId`

### Poll Video Status
`POST /functions/v1/poll-video-status`
- Checks all processing videos
- Updates database with current status
- Called by Gallery automatically

### Get User Videos
`SELECT * FROM generated_videos WHERE user_id = ...`
- RLS policies ensure users only see their own videos
- Ordered by most recent first

## Status Flow

```
┌─────────────┐
│  User       │
│  Submits    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Save to DB  │
│ status:     │
│ processing  │
└─────┬───────┘
      │
      ▼
┌─────────────────────┐
│ Background Polling  │
│ (every 10s)         │
└─────┬───────────────┘
      │
      ├──► Still processing → Continue polling
      │
      ├──► Completed → Update DB with video_url
      │
      └──► Failed → Update DB with error_message
```

## Troubleshooting

### Videos stuck in "processing"
- Check if `poll-video-status` edge function is working
- Manually call the edge function:
  ```bash
  curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/poll-video-status \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
- Check Supabase logs for errors

### Gallery not auto-refreshing
- Check browser console for errors
- Ensure `useEffect` dependency array includes `videos`
- Verify interval is running (should trigger every 10s)

### Videos not appearing in Gallery
- Check RLS policies on `generated_videos` table
- Verify user is authenticated
- Check Supabase logs for query errors

## Future Enhancements

1. **Push Notifications:** Notify users when video is ready
2. **Email Notifications:** Send email when video completes
3. **Progress Percentage:** Show actual progress from KIE.AI API
4. **Batch Operations:** Delete multiple videos at once
5. **Favorites:** Mark videos as favorites
6. **Search/Filter:** Search videos by prompt or provider
7. **Thumbnails:** Generate thumbnails for completed videos
