# Nano Banana (Google Gemini 2.5 Flash Image) Setup Guide

## 🍌 What is Nano Banana?

**Nano Banana** is Google's latest AI image generation model:
- **Official Name**: Gemini 2.5 Flash Image Preview
- **Nickname**: Nano Banana 🍌
- **Released**: January 2025
- **Best For**: Fast, high-quality image generation & editing

### Key Features:
✅ **Text-to-Image**: Generate images from text prompts
✅ **Image-to-Image**: Edit and modify existing images
✅ **Character Consistency**: Excellent at preserving faces/characters
✅ **Multi-Image**: Combine up to 3 images
✅ **Fast**: Very quick generation
✅ **Affordable**: ~$0.04 per image (cheaper than DALL-E 3!)

---

## 🆚 Comparison with Other Providers

| Feature | Nano Banana | DALL-E 3 | Stability AI |
|---------|-------------|----------|--------------|
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡ Medium | ⚡⚡⚡ Fast |
| **Cost** | 💰 $0.04 | 💰💰 $0.08 | 💰 $0.01 |
| **img2img** | ✅ Yes | ❌ No | ✅ Yes |
| **Character Consistency** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Face Preservation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Winner**: Nano Banana for **img2img and character consistency**!

---

## 🔑 Getting API Key

### Step 1: Go to Google AI Studio

Visit: https://aistudio.google.com/

### Step 2: Create API Key

1. Click **"Get API key"** in top right
2. Select or create a Google Cloud project
3. Click **"Create API key"**
4. Copy your key (format: `AIza...`)

### Step 3: Add to AvatarLab

1. Go to **Settings** → **API Management**
2. Add New API Key:
   - **Key Name**: `Google Gemini (Nano Banana)`
   - **Service**: Select `google` from dropdown
   - **API Key**: Paste your `AIza...` key
3. Click "Add API Key"

---

## 💰 Pricing

**Cost per Image:**
- 1 image = 1,290 tokens
- $30 per 1 million tokens
- **= ~$0.039 per image** (1024x1024)

**Comparison:**
- Nano Banana: **$0.039** ✅ Cheapest!
- Stability AI: $0.003-0.01
- DALL-E 3: $0.04-0.08

---

## 🎨 Capabilities

### 1. Text-to-Image
```
Prompt: "A serene mountain landscape at sunset"
→ Generates beautiful landscape
```

### 2. Image-to-Image (Best Feature!)
```
Upload: Photo of person
Prompt: "Change background to tropical beach"
→ Keeps person, changes background perfectly
```

### 3. Image Editing
```
Upload: Product photo
Prompt: "Remove background, make it white"
→ Clean product shot
```

### 4. Style Transfer
```
Upload: Regular photo
Prompt: "Convert to anime style"
→ Anime version with same composition
```

### 5. Multi-Image Composition
```
Upload: Person photo + Background photo
Prompt: "Place person in this background naturally"
→ Combines both images
```

---

## 📐 API Details

### Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent
```

### Request Format (Text-to-Image)
```json
{
  "contents": [{
    "parts": [{
      "text": "A serene mountain landscape at sunset, photorealistic, 4k"
    }]
  }],
  "generationConfig": {
    "temperature": 1,
    "topP": 0.95,
    "topK": 40,
    "maxOutputTokens": 8192,
    "responseMimeType": "application/json"
  }
}
```

### Request Format (Image-to-Image)
```json
{
  "contents": [{
    "parts": [
      {
        "text": "Change the background to a tropical beach"
      },
      {
        "inlineData": {
          "mimeType": "image/jpeg",
          "data": "base64_encoded_image_here"
        }
      }
    ]
  }]
}
```

### Response Format
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64_encoded_result"
        }
      }],
      "role": "model"
    }
  }]
}
```

---

## 🚀 Implementation in AvatarLab

### Edge Function Implementation

```typescript
async function generateWithGemini(
  prompt: string,
  parameters: any,
  apiKey: string,
  inputImage?: string
) {
  console.log('Generating with Google Gemini (Nano Banana)');

  const parts: any[] = [{ text: prompt }];

  // Add input image for img2img
  if (inputImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: inputImage.replace(/^data:image\/\w+;base64,/, '')
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: parameters.temperature || 1,
          topP: parameters.top_p || 0.95,
          maxOutputTokens: 8192,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const result = await response.json();

  // Extract base64 image from response
  const imageData = result.candidates[0].content.parts[0].inlineData.data;
  const imageUrl = `data:image/png;base64,${imageData}`;

  return {
    imageUrl,
    model: 'gemini-2.5-flash-image',
    status: 'completed',
  };
}
```

---

## 🎯 Use Cases

### Perfect For:

1. **Character-Consistent Edits**
   - Change clothing on person
   - Modify hairstyles
   - Age progression/regression

2. **Background Replacement**
   - Product photography
   - Professional headshots
   - Travel photos

3. **Style Transfer**
   - Convert to different art styles
   - Maintain subject consistency

4. **Face Completion**
   - Fill in partially visible faces
   - Repair damaged photos

5. **Object Placement**
   - Add objects naturally
   - Remove unwanted elements

---

## ⚠️ Limitations

1. **SynthID Watermark**: All images include invisible watermark
2. **Language**: Best performance in English
3. **No Video**: Images only (no video generation)
4. **Size**: Up to 1024x1024px optimal

---

## 🔒 Best Practices

### For Best Results:

1. **Be Specific**
   ```
   ❌ "A cat"
   ✅ "A fluffy orange tabby cat sitting on a windowsill, soft natural lighting, photorealistic"
   ```

2. **Provide Context**
   ```
   ✅ "For a children's book illustration"
   ✅ "Professional product photo style"
   ```

3. **Use img2img for Consistency**
   - Upload reference image
   - Describe specific changes
   - Model preserves important details

4. **Iterate**
   - Generate multiple variations
   - Refine prompts based on results

---

## 📊 When to Use Each Provider

| Task | Best Provider | Why |
|------|---------------|-----|
| **img2img with faces** | Nano Banana 🍌 | Best face preservation |
| **Text-to-Image only** | DALL-E 3 | Highest quality |
| **Bulk generation** | Stability AI | Cheapest |
| **Character consistency** | Nano Banana 🍌 | Maintains identity |
| **Background changes** | Nano Banana 🍌 | Natural blending |
| **Artistic styles** | Stability AI | More creative |
| **Product photos** | Nano Banana 🍌 | Clean results |

---

## 🎉 Why Add Nano Banana?

✅ **Better than DALL-E 3** for img2img (DALL-E 3 doesn't support it!)
✅ **Cheaper** than DALL-E 3
✅ **Best character consistency** - preserves faces perfectly
✅ **Fast** generation
✅ **Multi-image support** - combine images
✅ **Latest technology** from Google

---

## 🚀 Implementation Checklist

- [ ] Get Google Gemini API key
- [ ] Add key to Settings > API Management (service: `google`)
- [ ] I'll implement Gemini provider in edge function
- [ ] Add image upload for img2img
- [ ] Test text-to-image
- [ ] Test img2img
- [ ] Deploy and enjoy! 🍌

---

## 📚 Resources

- **API Docs**: https://ai.google.dev/gemini-api/docs/image-generation
- **Get API Key**: https://aistudio.google.com/
- **Pricing**: https://ai.google.dev/pricing
- **Examples**: https://www.freecodecamp.org/news/nano-banana-for-image-generation/

---

**Ready to implement? Get your API key and I'll add Nano Banana support!** 🍌🚀
