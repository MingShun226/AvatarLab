# AI Images Module - Quick Start Guide

## 🚀 3 Simple Steps to Get Started

### Step 1: Run Database Migration (2 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this file: `supabase/migrations/20251007000001_create_user_api_keys_and_update_images.sql`
3. Click **Run**
4. ✅ Done! Your database is ready

**What this does:**
- Creates `user_api_keys` table (for storing user's API keys from Settings)
- Adds provider tracking to `generated_images` table

---

### Step 2: Add Your API Key (3 minutes)

**Option A: Add as User (Recommended for Testing)**

1. Open your app → **Settings** → **API Management** tab
2. Click "Add New API Key"
3. Fill in:
   - **Key Name**: `My OpenAI Key`
   - **Service**: `openai`
   - **API Key**: `sk-proj-your-actual-key-here`
4. Click "Add API Key"
5. ✅ Your key is saved!

**Option B: Add as Platform Key (Optional - For Providing Free Credits)**

1. Go to Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. Add: `OPENAI_API_KEY` = `sk-proj-your-platform-key`
3. ✅ Platform key configured (users without their own key will use this)

**Get OpenAI API Key:**
- Visit: https://platform.openai.com/api-keys
- Create new key
- **Important**: Add credits at https://platform.openai.com/settings/organization/billing

---

### Step 3: Deploy & Test (2 minutes)

**Deploy Edge Function:**
```bash
supabase functions deploy generate-image-unified
```

**Or if using Git:** Just push your code (auto-deploys)

**Test It:**
1. Open your app → **Images Studio**
2. Select "OpenAI DALL-E 3"
3. Enter prompt: `a cat wearing sunglasses, photorealistic`
4. Click "Generate Image"
5. ✅ Image appears in 5-10 seconds!

---

## 🎯 How It Works

### User's API Key (User Pays)
```
User adds key in Settings
  ↓
Generates image
  ↓
Uses user's API key
  ↓
User pays OpenAI/Stability
```

### Platform's API Key (You Pay)
```
User has no API key
  ↓
Generates image
  ↓
Uses platform API key (from Supabase secrets)
  ↓
You pay OpenAI/Stability
```

### No Key Available
```
User has no key + No platform key
  ↓
Shows error: "Please add API key in Settings"
  ↓
User adds their key
```

---

## 📋 What's Included

✅ **3 AI Providers:**
- OpenAI DALL-E 3 (best quality)
- Stability AI (great for art)
- KIE AI Flux (budget option)

✅ **Full Features:**
- Generate images with AI
- Download images as PNG
- Mark favorites
- Delete images
- Gallery with history
- Provider selection
- Progress tracking

✅ **User-Friendly:**
- No technical setup needed
- Works on all devices
- Real-time progress
- Auto-save to gallery

---

## 🔍 Troubleshooting

### "No API key configured" error
**Fix:** Add your OpenAI API key in Settings > API Management

### "Insufficient credits" error
**Fix:** Add credits to your OpenAI account: https://platform.openai.com/settings/organization/billing

### Image not appearing
**Fix:** Check browser console for errors, verify migration was applied

### Can't download image
**Fix:** Check browser allows downloads, or right-click > Save Image As

---

## 📊 Cost Per Image

| Provider | Cost | Speed | Quality |
|----------|------|-------|---------|
| OpenAI DALL-E 3 | $0.04-0.08 | 5-10s | ⭐⭐⭐⭐⭐ |
| Stability AI | $0.003-0.01 | 3-7s | ⭐⭐⭐⭐ |
| KIE AI | Varies | 20-60s | ⭐⭐⭐ |

---

## 📚 Documentation

For more details, see:
- `docs/STEP_BY_STEP_IMPLEMENTATION.md` - Full implementation guide
- `docs/API_KEYS_QUICK_SETUP.md` - API key setup
- `docs/DEPLOYMENT_CHECKLIST.md` - Pre-launch checklist

---

## ✅ Done!

That's it! You now have a fully functional AI image generation system.

**Next Steps:**
1. Run migration ✓
2. Add API key ✓
3. Deploy function ✓
4. Generate your first image! 🎨

---

**Need help?** Check the docs folder or review function logs in Supabase Dashboard.
