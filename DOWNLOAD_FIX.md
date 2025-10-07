# Fix: Image Download CORS Error

## 🔍 Problem

When clicking download button:
```
❌ Access to fetch has been blocked by CORS policy
❌ No 'Access-Control-Allow-Origin' header is present
```

**Why?** OpenAI images are hosted on Azure Blob Storage with strict CORS policies. Browsers can't download them directly.

---

## ✅ Solution: Download Proxy

I've created a backend proxy that downloads the image for you.

### Files Created:
- ✅ `supabase/functions/download-image/index.ts` - Proxy function
- ✅ Updated `imageGeneration.ts` - Uses proxy for downloads
- ✅ Updated `ImagesSection.tsx` - Fallback instructions

---

## 🚀 How to Fix

### Step 1: Deploy Download Proxy Function

```bash
supabase functions deploy download-image
```

Or push to Git if auto-deploy is enabled.

### Step 2: Test Download

1. Refresh your app (Ctrl+Shift+R)
2. Go to **Images Studio** → **Gallery**
3. Hover over an image
4. Click **Download** button (💾)
5. Should download! ✅

---

## 🔄 How It Works

**Before (Failed):**
```
Browser → OpenAI URL (CORS blocked ❌)
```

**After (Works):**
```
Browser → Supabase Proxy → OpenAI URL → Download ✅
```

The proxy function:
1. Receives image URL from frontend
2. Fetches image from OpenAI (server-side, no CORS)
3. Returns image to browser with download headers
4. Browser saves file

---

## 📋 Alternative: Right-Click Download

If proxy fails, users can always:
1. Right-click on image
2. Select **"Save Image As..."**
3. Save manually

The UI now shows this as fallback instructions if proxy download fails.

---

## ⚠️ Important Note: OpenAI Image Expiration

**OpenAI DALL-E images expire after ~1 hour!**

After expiration:
- ❌ Image URL returns 404
- ❌ Can't download anymore
- ✅ Image still visible if cached in browser

### Optional: Save to Supabase Storage

If you want permanent storage:

1. **After generation, download and upload to Supabase Storage:**

```typescript
// In edge function, after image generation
const imageData = await fetch(result.imageUrl);
const imageBlob = await imageData.blob();

// Upload to Supabase Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('generated-images')
  .upload(`${user.id}/${Date.now()}.png`, imageBlob, {
    contentType: 'image/png',
    upsert: false
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('generated-images')
  .getPublicUrl(uploadData.path);

// Save publicUrl instead of OpenAI URL
```

2. **Create storage bucket:**

```sql
-- In Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

-- Set RLS policies
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🧪 Test Scenarios

### Test 1: Fresh Image (Should work)
1. Generate new image
2. Immediately click download
3. ✅ Should download successfully

### Test 2: Old Image (May fail)
1. Use image generated 2+ hours ago
2. Click download
3. ❌ May fail (OpenAI URL expired)
4. ✅ Fallback instructions shown

### Test 3: Right-Click Fallback
1. Right-click any image
2. Select "Save Image As..."
3. ✅ Always works (while cached)

---

## 🔍 Debug Download Issues

### Check Edge Function Logs

```bash
supabase functions logs download-image --tail
```

Or in **Supabase Dashboard** → **Edge Functions** → **download-image** → **Logs**

### Common Errors:

```
❌ Failed to fetch image from provider
→ OpenAI URL expired (> 1 hour old)

❌ Download via proxy failed
→ Function not deployed or network issue

✅ 200 OK
→ Download successful
```

---

## 📦 Deployment Checklist

- [ ] Deploy download-image function
- [ ] Test download on fresh image
- [ ] Test right-click fallback
- [ ] (Optional) Set up Supabase Storage for permanent images

---

## 💡 Recommendations

### For Production:

**Option 1: Use Proxy (Current solution)**
- ✅ Easy to implement
- ✅ Works for fresh images
- ❌ Fails after OpenAI URL expires

**Option 2: Save to Supabase Storage**
- ✅ Permanent storage
- ✅ No expiration
- ✅ Full control
- ❌ Uses your storage quota
- ❌ Extra implementation

**Option 3: Hybrid Approach**
- Generate → Save OpenAI URL temporarily
- On first download → Upload to Supabase Storage
- Update database with permanent URL
- Future downloads use permanent URL

---

## 🚀 Quick Deploy

```bash
# Deploy proxy function
supabase functions deploy download-image

# Test it
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/download-image \
  -H "Authorization: Bearer YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://openai-image-url", "filename": "test.png"}'
```

---

**Files Updated:**
- ✅ `supabase/functions/download-image/index.ts` - New proxy function
- ✅ `src/services/imageGeneration.ts` - Uses proxy
- ✅ `src/components/dashboard/sections/ImagesSection.tsx` - Fallback UI

**Just deploy and test!** 🚀
