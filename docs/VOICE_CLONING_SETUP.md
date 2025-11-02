# Voice Cloning Setup Guide - ElevenLabs Integration

This guide will help you complete the setup for voice cloning functionality in your AvatarLab application.

## What's Been Implemented

✅ **Database Schema** - Tables for voice_clones, voice_samples, and tts_generations
✅ **Storage Bucket** - Supabase storage for voice sample files
✅ **Edge Functions** - Two Supabase edge functions for voice cloning and TTS generation
✅ **Frontend UI** - Complete TTS Studio with voice cloning, testing, and management
✅ **Service Layer** - Voice clone service for API interactions

## Setup Steps

### Step 1: Run the Storage Bucket SQL

1. Open your Supabase Dashboard → SQL Editor
2. Run the file: `setup_voice_storage_bucket.sql`
3. This will create the `voice-samples` storage bucket with proper policies

### Step 2: Get Your ElevenLabs API Key

#### Free Tier (Good for Testing)
- Go to https://elevenlabs.io/
- Click "Get Started" or "Sign Up"
- Create an account (you can use your email or Google)
- After logging in, click on your profile icon (top right)
- Select **"Profile + API Key"** from the dropdown
- You'll see your API key displayed - click "Copy"

**Free Tier Includes:**
- 10,000 characters/month
- 3 custom voices
- Instant voice cloning

#### Paid Plans (For Production)
For voice cloning, you'll need at least the **Starter plan** ($5/month):
- 30,000 characters/month
- Instant voice cloning (1-3 audio samples)
- Professional voice cloning available on higher tiers

### Step 3: Add API Key to Your Application

You have two options:

#### Option A: Add as Platform Key (Recommended for Testing)
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add a new secret:
   - Name: `ELEVENLABS_API_KEY`
   - Value: Your ElevenLabs API key
3. Click "Add Secret"

#### Option B: Add as User Key (Recommended for Production)
1. Go to your app → Settings → API Management
2. Add a new API key:
   - Service: `elevenlabs`
   - API Key: Your ElevenLabs API key
   - Status: Active
3. Save

**Note:** User keys take precedence over platform keys, allowing each user to use their own ElevenLabs account.

### Step 4: Deploy Edge Functions

Deploy the two edge functions to Supabase:

```bash
# Deploy voice cloning function
npx supabase functions deploy clone-voice

# Deploy TTS generation function
npx supabase functions deploy generate-tts
```

If you encounter any errors, make sure:
- You're logged in to Supabase CLI: `npx supabase login`
- Your project is linked: `npx supabase link --project-ref YOUR_PROJECT_REF`

### Step 5: Test the Integration

1. **Navigate to TTS Studio** in your app
2. **Clone Voice Tab:**
   - Enter a voice name (e.g., "My Voice")
   - Add an optional description
   - Click "Upload Voice Samples" and select audio files
   - Recommended: 1-3 audio files, each 1-5 minutes long
   - Audio should be clear, with minimal background noise
   - Click "Create Voice Clone"
   - Wait for the process to complete (usually 30-60 seconds)

3. **Test Voice Tab:**
   - Select your newly created voice from the dropdown
   - Adjust stability (0.5 = balanced) and similarity boost (0.75 = recommended)
   - Enter text to convert to speech
   - Click "Generate Speech"
   - The audio will play automatically

4. **My Voices Tab:**
   - View all your voice clones
   - Select or delete voices
   - See clone details (samples, creation date, status)

## Tips for Best Results

### Audio Sample Quality
- **Format:** MP3, WAV, or FLAC
- **Duration:** 1-5 minutes per sample (instant cloning) or 10+ minutes (professional cloning)
- **Quality:** Clear speech, minimal background noise
- **Content:** Natural conversation or reading works best
- **Speaker:** Single speaker only (no multiple voices in the same audio)

### Voice Cloning Tips
- Use 1-3 samples for instant cloning
- Samples should capture different emotions/tones if possible
- Avoid music, sound effects, or overlapping voices
- Higher quality audio = better voice clone

### TTS Generation Settings
- **Stability (0-1):**
  - Low (0.3-0.5): More expressive, varied
  - High (0.6-1.0): More consistent, stable
- **Similarity Boost (0-1):**
  - Low (0.3-0.5): More creative interpretation
  - High (0.6-1.0): Closer to original voice

## API Costs & Limits

### Free Tier
- 10,000 characters/month
- ~8 minutes of audio
- 3 custom voices

### Starter Plan ($5/month)
- 30,000 characters/month
- ~24 minutes of audio
- Instant voice cloning

### Creator Plan ($22/month)
- 100,000 characters/month
- ~80 minutes of audio
- Professional voice cloning

**Character Counting:**
- Spaces and punctuation count
- Example: "Hello, world!" = 13 characters

## Troubleshooting

### "No API key configured" Error
- Make sure you've added your ElevenLabs API key (Step 3)
- If using user key, verify it's marked as "Active" in the database
- If using platform key, check it's correctly added in Supabase Edge Function secrets

### "Failed to create voice clone" Error
- Check your audio file format (MP3, WAV, FLAC only)
- Ensure audio is clear and has speech
- Verify your ElevenLabs plan supports voice cloning
- Check your ElevenLabs dashboard for quota limits

### "Failed to generate TTS" Error
- Verify you have available characters in your ElevenLabs quota
- Check that the selected voice exists
- Ensure your text isn't empty
- Try shorter text (under 1000 characters) for testing

### Edge Function Deployment Issues
- Run: `npx supabase functions deploy clone-voice --no-verify-jwt` for testing
- Check logs: `npx supabase functions logs clone-voice`
- Verify environment variables are set correctly

## Architecture Overview

```
┌─────────────────┐
│   TTS Studio    │ (Frontend - React)
│   (UI)          │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐ ┌─────▼──────────┐
│ Voice Clone     │ │ Generate TTS   │ (Edge Functions)
│ Service         │ │ Service        │
└────────┬────────┘ └─────┬──────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  ElevenLabs API │ (External API)
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Supabase       │
         │  - Database     │
         │  - Storage      │
         └─────────────────┘
```

## Features Implemented

### Voice Cloning
- ✅ Upload multiple voice samples
- ✅ Create custom voice clones
- ✅ View clone status and details
- ✅ Delete voice clones
- ✅ Automatic sample management

### TTS Generation
- ✅ Generate speech from text
- ✅ Use custom cloned voices
- ✅ Adjust voice parameters (stability, similarity)
- ✅ Play generated audio
- ✅ View generation history

### Voice Management
- ✅ List all voice clones
- ✅ Select active voice
- ✅ View clone metadata
- ✅ Delete unwanted clones

## Next Steps

1. Complete the setup steps above
2. Test with a small audio sample first
3. Create your first voice clone
4. Generate test speech
5. Fine-tune stability and similarity settings
6. Use in your avatar conversations!

## Support

- ElevenLabs Documentation: https://docs.elevenlabs.io/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Your app's API Management: `/settings` → API Management tab

---

**Note:** This implementation uses ElevenLabs' instant voice cloning, which works with 1-3 audio samples. For professional voice cloning (requires 10+ minutes), you'll need a Creator plan or higher.
