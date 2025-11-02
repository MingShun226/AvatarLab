# Multi-Image Combination Feature

## Overview

The Images Studio now supports uploading and combining multiple images using AI. This feature allows you to blend multiple photos together based on a text prompt, perfect for creating advertisements, composite images, and creative combinations.

## How It Works

### 1. **UI Changes**
- New `MultiImageUploadBox` component that supports up to 5 images
- Drag & drop interface for adding multiple images
- Image preview grid showing all uploaded images with remove buttons
- Order indicator (1, 2, 3...) showing the sequence of images

### 2. **Backend Support**
- Updated `generateWithGemini` function to accept multiple images
- Images are processed in order and sent to Google Gemini API
- The AI combines all images based on the prompt provided

### 3. **Use Cases**

#### Advertisement Creation
```
Upload:
- Photo of a person
- Photo of a product

Prompt: "Create an advertisement with the person holding the product in a modern studio setting with professional lighting"
```

#### Composite Scenes
```
Upload:
- Background landscape
- Character portrait
- Object/prop image

Prompt: "Combine these images into a fantasy scene with the character in the landscape holding the magical object"
```

#### Style Transfer Combination
```
Upload:
- Original photo
- Style reference image

Prompt: "Apply the artistic style from the second image to the first image while maintaining the original composition"
```

## Features

### Multi-Image Upload
- **Max Images**: 5 images per generation
- **Max Size**: 4MB per image
- **Supported Formats**: JPG, PNG, WebP
- **Drag & Drop**: Upload multiple images at once
- **Individual Control**: Remove individual images or clear all

### Smart UI
- **Dynamic Placeholders**: Prompt suggestions change based on number of images
- **Helper Text**: Context-specific guidance for single vs. multiple images
- **Visual Feedback**: Image order indicators and hover states

### AI Provider
- **Google Gemini (Nano Banana)**: Best for multi-image combination
  - Supports multiple input images natively
  - Fast processing
  - Affordable pricing
  - Excellent at understanding image context

## Technical Details

### Component: `MultiImageUploadBox`
Location: `src/components/ui/multi-image-upload-box.tsx`

**Props:**
- `onImagesChange`: Callback with array of base64 images
- `currentImages`: Array of current base64 images
- `maxImages`: Maximum number of images (default: 5)
- `maxSizeMB`: Maximum size per image in MB (default: 4)

**Features:**
- Drag & drop support
- Multiple file selection
- Individual image removal
- Remove all button
- Visual grid layout with numbering
- Error handling for file size and type

### API Changes

#### Frontend Service (`imageGeneration.ts`)
```typescript
interface GenerateImageParams {
  // ... other params
  inputImages?: string[]; // Multiple Base64 images for img2img combination
}
```

#### Edge Function (`generate-image-unified/index.ts`)
```typescript
async function generateWithGemini(
  prompt: string,
  parameters: any,
  apiKey: string,
  inputImage?: string,      // Single image (backward compatible)
  inputImages?: string[]    // Multiple images (new)
)
```

**Processing Logic:**
1. Checks for `inputImages` array first
2. Falls back to single `inputImage` for backward compatibility
3. Processes all images in order
4. Sends to Gemini API with proper formatting

### Request Flow
```
User uploads images
  ↓
Images stored as base64 in state
  ↓
User enters prompt describing combination
  ↓
Frontend sends all images + prompt to edge function
  ↓
Edge function formats request for Gemini API
  ↓
Gemini processes all images with prompt
  ↓
Generated image returned and saved
```

## Usage Instructions

### For Users

1. **Navigate to Images Studio**
   - Go to "Images Studio" from the sidebar

2. **Switch to Image-to-Image Mode**
   - Click on "Image-to-Image" tab

3. **Upload Images**
   - Click the upload area or drag & drop images
   - Add 1-5 images that you want to combine
   - Images are numbered in order of upload

4. **Write a Combination Prompt**
   - Describe how you want the images combined
   - Example: "Combine these images into an advertisement showing the person with the product in a professional setting"

5. **Adjust Settings** (Optional)
   - Transformation Strength: Control how much the AI transforms the images
   - Lower = More faithful to originals
   - Higher = More creative freedom

6. **Generate**
   - Click "Generate Image"
   - Wait for AI to process
   - Result will appear in your gallery

### Example Prompts

**Advertisement Creation:**
```
"Create a professional advertisement with [person] showcasing [product] in a modern minimalist setting with soft lighting"
```

**Product Mockup:**
```
"Place the product on the styled background, maintaining photorealistic quality and professional lighting"
```

**Creative Composition:**
```
"Blend these images seamlessly into a surreal artistic composition with vibrant colors and smooth transitions"
```

**Scene Assembly:**
```
"Combine these elements into a cohesive scene: the character in the foreground, the environment as background, maintaining realistic lighting and perspective"
```

## Tips for Best Results

1. **Image Order Matters**: Upload in logical order (e.g., subject first, then background)
2. **Be Specific**: Detailed prompts yield better results
3. **Similar Lighting**: Images with similar lighting combine more naturally
4. **Resolution**: Use high-quality images for best output
5. **Clear Intent**: Specify roles for each image in the prompt
6. **Strength Slider**: Start with 0.7-0.8 for balanced results

## Limitations

- Maximum 5 images per generation
- Only Google Gemini supports multiple images currently
- Each image must be under 4MB
- Processing time increases with more images
- Quality depends on input image quality and compatibility

## Future Enhancements

Possible future improvements:
- Support for more AI providers (Stability AI, Midjourney)
- Advanced blending controls (masks, regions)
- Template-based combinations
- Batch processing multiple combinations
- Image alignment and positioning controls
- Layer-based composition tools

## Troubleshooting

**Images not combining well:**
- Try adjusting the transformation strength
- Use more specific prompts
- Ensure images have compatible resolutions
- Check that images have similar lighting/style

**Upload errors:**
- Verify file size is under 4MB
- Check file format (JPG, PNG, WebP only)
- Try uploading images one at a time
- Clear browser cache if issues persist

**Generation fails:**
- Ensure Google Gemini API key is configured
- Check API quota/billing
- Verify internet connection
- Try with fewer images first

## Code References

- UI Component: `src/components/ui/multi-image-upload-box.tsx`
- Main Section: `src/components/dashboard/sections/ImagesSection.tsx:381-391`
- Service: `src/services/imageGeneration.ts:15`
- Edge Function: `supabase/functions/generate-image-unified/index.ts:169-204`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in the browser console
3. Verify API key configuration in Settings
4. Check Supabase logs for edge function errors
