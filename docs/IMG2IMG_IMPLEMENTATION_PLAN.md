# Image-to-Image (img2img) Implementation Plan

## 🎯 Goal

Add functionality for users to:
1. Upload their own images
2. Modify images with AI (change background, style transfer, etc.)
3. Support multiple AI providers

---

## 🤖 Available Providers for img2img

### 1. **OpenAI DALL-E 2** (Edit & Variations)
- ✅ **Edit**: Modify specific parts with mask + prompt
- ✅ **Variations**: Create variations of an image
- ❌ DALL-E 3 doesn't support img2img (text-to-image only)
- **Cost**: $0.02 per image (1024x1024)
- **API**: `https://api.openai.com/v1/images/edits`

### 2. **Stability AI** (img2img)
- ✅ **img2img**: Modify images with prompts
- ✅ **Inpainting**: Edit specific areas
- ✅ **Outpainting**: Extend image borders
- **Cost**: $0.003-0.01 per image
- **API**: `https://api.stability.ai/v2beta/stable-image/generate/sd3`

### 3. **Replicate** (Multiple Models)
- ✅ **SDXL img2img**: High quality modifications
- ✅ **InstantID**: Face-consistent generation
- ✅ **ControlNet**: Guided generation
- **Cost**: Variable by model (~$0.001-0.01)
- **API**: `https://api.replicate.com/v1/predictions`

### 4. **Fal.ai** (Fast Generation)
- ✅ **FLUX img2img**: Fast, high quality
- ✅ **Background removal**: Remove/replace backgrounds
- **Cost**: ~$0.003-0.01
- **API**: `https://fal.run/fal-ai/flux/dev/image-to-image`

### 5. **Leonardo.ai** (Game Assets)
- ✅ **img2img**: Great for game art
- ✅ **Canvas editing**: Advanced editing
- **Cost**: Credit-based
- **API**: Available with API key

---

## 📝 Note: "Banana" / "Nanobanana"

I couldn't find an AI provider called "nanobanana" or "banana" for image generation. You might be thinking of:
- **Banana.dev** - Hosting platform for ML models (not a provider)
- **Together.ai** - Another hosting platform

**Recommendation**: Use **Replicate** or **Fal.ai** - they offer similar fast/cheap img2img generation.

---

## 🏗️ Implementation Architecture

### Phase 1: Upload & Storage
```
User uploads image
  ↓
Convert to Base64 or upload to temp storage
  ↓
Send to AI provider with prompt
  ↓
Receive modified image
  ↓
Save to gallery
```

### Phase 2: Provider Support

**Text-to-Image (Current):**
- OpenAI DALL-E 3 ✅
- Stability AI ✅
- KIE AI ✅

**Image-to-Image (New):**
- OpenAI DALL-E 2 (edits/variations)
- Stability AI img2img
- Replicate SDXL img2img
- Fal.ai FLUX img2img

---

## 🎨 UI Design

### Generation Mode Tabs
```
┌─────────────────────────────────────┐
│ [Text-to-Image] [Image-to-Image]   │
└─────────────────────────────────────┘
```

### Text-to-Image Mode (Current)
```
Provider: [OpenAI DALL-E 3 ▼]
Prompt: [_____________________]
Negative: [___________________]
[Generate Image]
```

### Image-to-Image Mode (New)
```
Provider: [Stability AI img2img ▼]

Upload Image:
┌─────────────────────┐
│   [📁 Upload]       │
│   or drag & drop    │
└─────────────────────┘

Prompt: [Change background to beach scene...]
Strength: [████████░░] 0.8

[Generate Modified Image]
```

---

## 🔧 Implementation Steps

### Step 1: Add Image Upload Component

Create upload component with:
- File input (drag & drop)
- Image preview
- Base64 conversion
- Size validation (max 4MB)

### Step 2: Update Edge Function

Add img2img support to `generate-image-unified`:
- Handle base64 image input
- Route to appropriate provider
- Support different generation modes

### Step 3: Add New Providers

**Replicate** (Recommended - easiest):
```typescript
// Replicate SDXL img2img
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${replicateKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    version: 'sdxl-img2img-version-id',
    input: {
      image: base64Image,
      prompt: prompt,
      negative_prompt: negativePrompt,
      strength: 0.8
    }
  })
});
```

### Step 4: Update UI

Add mode toggle:
- Text-to-Image (existing)
- Image-to-Image (new)

---

## 🚀 Quick Start Implementation

### Option A: Use Stability AI (Already integrated!)

Stability AI already supports img2img! Just need to:
1. Add upload component
2. Send image as base64
3. Use different endpoint

**Already works with your existing Stability AI key!**

### Option B: Add Replicate (More models)

1. Get API key from https://replicate.com
2. Add to Settings > API Management
3. Select from multiple models:
   - SDXL img2img
   - Flux img2img
   - ControlNet
   - InstantID

---

## 📊 Provider Comparison for img2img

| Provider | Quality | Speed | Cost | Ease |
|----------|---------|-------|------|------|
| **Stability AI** | ⭐⭐⭐⭐ | Fast | $ | Easy |
| **Replicate SDXL** | ⭐⭐⭐⭐⭐ | Medium | $$ | Easy |
| **Fal.ai FLUX** | ⭐⭐⭐⭐⭐ | Fast | $$ | Medium |
| **OpenAI DALL-E 2** | ⭐⭐⭐ | Fast | $$$ | Easy |

**Recommendation**: Start with **Stability AI** (you already have the key!)

---

## 🔑 API Keys Needed

### For Stability AI img2img (Already have!)
- Service: `stability`
- Key: Your existing Stability AI key
- **No new key needed!**

### For Replicate (Optional)
- Get from: https://replicate.com/account/api-tokens
- Service: `replicate`
- Format: `r8_...`

### For Fal.ai (Optional)
- Get from: https://fal.ai/dashboard/keys
- Service: `fal-ai`
- Format: `fal_...`

---

## 💡 Use Cases

### 1. Background Replacement
```
Upload: Photo of person
Prompt: "Same person on a tropical beach at sunset"
→ Changes background, keeps person
```

### 2. Style Transfer
```
Upload: Regular photo
Prompt: "Convert to anime style illustration"
→ Changes artistic style
```

### 3. Object Removal/Addition
```
Upload: Room photo
Prompt: "Add a modern fireplace on the empty wall"
→ Adds new elements
```

### 4. Enhancement
```
Upload: Low quality image
Prompt: "Enhance quality, add more details, photorealistic"
→ Improves quality
```

---

## 📋 Implementation Checklist

### Phase 1: Basic Upload (Day 1)
- [ ] Add file upload component
- [ ] Image preview
- [ ] Base64 conversion
- [ ] File size validation

### Phase 2: Stability AI img2img (Day 2)
- [ ] Update edge function for img2img
- [ ] Add img2img endpoint support
- [ ] Test with Stability AI
- [ ] UI for upload + prompt

### Phase 3: Additional Providers (Day 3-4)
- [ ] Add Replicate support
- [ ] Add Fal.ai support (optional)
- [ ] Model selection dropdown
- [ ] Test all providers

### Phase 4: Advanced Features (Day 5+)
- [ ] Strength slider (how much to change)
- [ ] Inpainting (mask editing)
- [ ] ControlNet support
- [ ] Batch processing

---

## 🎯 Recommended Implementation Order

1. ✅ **Start with Stability AI img2img** (easiest, you have key)
2. ➕ **Add Replicate** (more models, flexible)
3. ➕ **Add Fal.ai** (if need faster generation)
4. ➕ **Add advanced features** (inpainting, controlnet)

---

## 📝 Next Steps

1. I'll implement image upload component
2. Add img2img mode to UI
3. Update edge function for Stability AI img2img
4. Add Replicate as optional provider
5. Test and deploy

**Want me to start implementing now?** 🚀

---

**Files to create:**
- `src/components/ui/image-upload-advanced.tsx` - Upload component
- Update `generate-image-unified` - Add img2img support
- Update `ImagesSection.tsx` - Add mode toggle
- Create `REPLICATE_SETUP.md` - Replicate guide
