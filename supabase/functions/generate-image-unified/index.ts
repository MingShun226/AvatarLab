import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Helper: Upload base64 image to Supabase Storage
async function uploadToStorage(
  supabase: any,
  userId: string,
  base64Image: string,
  imageId: string
): Promise<string> {
  // Extract image data from base64
  const base64Data = base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image;

  // Convert base64 to binary
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Generate filename with timestamp
  const timestamp = Date.now();
  const filename = `${userId}/${imageId}_${timestamp}.png`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('generated-images')
    .upload(filename, binaryData, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('generated-images')
    .getPublicUrl(filename);

  console.log('Image uploaded to storage:', publicUrl);
  return publicUrl;
}

// Helper function to get API key (user's key or platform key)
async function getApiKey(
  supabase: any,
  userId: string,
  provider: string,
  platformKey: string | undefined
): Promise<string> {
  console.log(`Getting API key for provider: ${provider}, user: ${userId}`);

  // Try to get user's personal API key first
  const { data: userKey, error } = await supabase
    .from('user_api_keys')
    .select('api_key_encrypted')
    .eq('user_id', userId)
    .eq('service', provider)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!error && userKey?.api_key_encrypted) {
    console.log(`Using user's personal ${provider} API key`);

    // Update last_used_at
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('service', provider)
      .eq('status', 'active');

    // Decrypt user's key (simple base64 for now)
    try {
      return atob(userKey.api_key_encrypted);
    } catch (e) {
      console.error('Failed to decrypt user API key:', e);
    }
  }

  // Fallback to platform key
  if (platformKey) {
    console.log(`Using platform ${provider} API key`);
    return platformKey;
  }

  throw new Error(`No API key configured for ${provider}. Please add your API key in Settings > API Management.`);
}

// Provider adapters
async function generateWithOpenAI(prompt: string, parameters: any, apiKey: string) {
  console.log('Generating with OpenAI DALL-E 3:', { prompt, parameters });

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: `${parameters.width || 1024}x${parameters.height || 1024}`,
      quality: parameters.quality || 'standard',
      style: parameters.style || 'vivid',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const result = await response.json();
  console.log('OpenAI response:', result);

  return {
    imageUrl: result.data[0].url,
    model: 'dall-e-3',
    status: 'completed',
  };
}

async function generateWithStability(prompt: string, parameters: any, apiKey: string) {
  console.log('Generating with Stability AI:', { prompt, parameters });

  const formData = new FormData();
  formData.append('prompt', prompt);
  if (parameters.negative_prompt) {
    formData.append('negative_prompt', parameters.negative_prompt);
  }
  formData.append('output_format', 'png');
  formData.append('aspect_ratio', '1:1');

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'image/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Stability API error:', response.status, errorText);
    throw new Error(`Stability API error: ${errorText}`);
  }

  // Stability returns the image directly
  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const imageUrl = `data:image/png;base64,${base64}`;

  return {
    imageUrl,
    model: 'stable-diffusion-core',
    status: 'completed',
  };
}

async function generateWithKieAI(prompt: string, parameters: any, apiKey: string) {
  console.log('Generating with KIE AI:', { prompt, parameters });

  const response = await fetch('https://api.kie.ai/api/v1/flux/kontext/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspectRatio: '1:1',
      model: 'flux-kontext-pro',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('KIE AI API error:', response.status, errorText);
    throw new Error(`KIE AI API error: ${errorText}`);
  }

  const result = await response.json();
  console.log('KIE AI response:', result);

  if (result.code !== 200 || !result.data?.taskId) {
    throw new Error('Invalid response from KIE AI API');
  }

  return {
    taskId: result.data.taskId,
    model: 'flux-kontext-pro',
    status: 'processing',
  };
}

async function generateWithGemini(prompt: string, parameters: any, apiKey: string, inputImage?: string, inputImages?: string[]) {
  console.log('Generating with Google Gemini (Nano Banana):', {
    prompt,
    hasImage: !!inputImage,
    numImages: inputImages?.length || 0
  });

  const parts: any[] = [];

  // Support multiple images for combination
  const imagesToProcess = inputImages && inputImages.length > 0 ? inputImages : (inputImage ? [inputImage] : []);

  // For img2img, add the input images first, then the prompt
  if (imagesToProcess.length > 0) {
    console.log(`Adding ${imagesToProcess.length} input image(s) to request`);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const img = imagesToProcess[i];
      // Extract mime type from data URL
      const mimeTypeMatch = img.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      const base64Data = img.replace(/^data:image\/\w+;base64,/, '');

      console.log(`Adding image ${i + 1}:`, { mimeType, dataLength: base64Data.length });

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }
  }

  // Add prompt after the images (for img2img) or as the only part (for text2img)
  parts.push({ text: prompt });

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      temperature: parameters.temperature || 1,
      topP: parameters.top_p || 0.95,
      topK: parameters.top_k || 40,
      maxOutputTokens: 8192,
      responseModalities: ["IMAGE"],
    }
  };

  console.log('Gemini API request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);

    // Parse error for better user message
    let errorMessage = `Gemini API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch (e) {
      errorMessage = errorText;
    }

    // Check for quota/billing issues
    if (response.status === 429) {
      throw new Error('Gemini API quota exceeded. Please check your billing settings at https://aistudio.google.com/billing');
    } else if (response.status === 403) {
      throw new Error('Gemini API access forbidden. Please verify your API key has the correct permissions and billing is enabled.');
    }

    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  const result = await response.json();
  console.log('Gemini response received:', JSON.stringify(result, null, 2));

  // Extract base64 image from response
  if (!result.candidates || !result.candidates[0]?.content?.parts?.[0]?.inlineData) {
    console.error('Invalid Gemini response structure:', result);

    // Check for safety filters or other issues
    if (result.candidates && result.candidates[0]?.finishReason) {
      throw new Error(`Gemini blocked the request: ${result.candidates[0].finishReason}`);
    }

    throw new Error('Invalid response from Gemini API - no image data found');
  }

  const imageData = result.candidates[0].content.parts[0].inlineData.data;
  const imageUrl = `data:image/png;base64,${imageData}`;

  return {
    imageUrl,
    model: 'gemini-2.5-flash-image',
    status: 'completed',
  };
}

async function checkKieAIProgress(taskId: string, apiKey: string) {
  const response = await fetch(`https://api.kie.ai/api/v1/flux/kontext/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    return {
      status: 'processing',
      progress: 50,
    };
  }

  const result = await response.json();

  if (result.code === 200 && result.data?.status === 'completed') {
    return {
      status: 'completed',
      progress: 100,
      imageUrl: result.data.images?.[0],
    };
  }

  return {
    status: 'processing',
    progress: result.data?.progress || 50,
  };
}

serve(async (req) => {
  console.log('generate-image-unified function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', {
      provider: requestBody.provider,
      hasPrompt: !!requestBody.prompt,
      hasInputImage: !!requestBody.inputImage,
      hasInputImages: !!requestBody.inputImages,
      numInputImages: requestBody.inputImages?.length || 0,
      checkProgress: requestBody.checkProgress
    });

    const { prompt, provider = 'openai', parameters = {}, checkProgress = false, taskId, inputImage, inputImages } = requestBody;

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle progress check for async providers
    if (checkProgress && taskId) {
      console.log('Checking progress for task:', taskId);

      if (provider === 'kie-ai') {
        const kieApiKey = await getApiKey(
          supabase,
          user.id,
          'kie-ai',
          Deno.env.get('KIE_AI_API_KEY')
        );

        const progress = await checkKieAIProgress(taskId, kieApiKey);

        return new Response(
          JSON.stringify(progress),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ status: 'processing', progress: 50 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate prompt
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating image with provider: ${provider}`);

    let result;

    // Route to appropriate provider
    switch (provider) {
      case 'openai': {
        const openaiKey = await getApiKey(
          supabase,
          user.id,
          'openai',
          Deno.env.get('OPENAI_API_KEY')
        );
        result = await generateWithOpenAI(prompt, parameters, openaiKey);
        break;
      }

      case 'stability': {
        const stabilityKey = await getApiKey(
          supabase,
          user.id,
          'stability',
          Deno.env.get('STABILITY_API_KEY')
        );
        result = await generateWithStability(prompt, parameters, stabilityKey);
        break;
      }

      case 'kie-ai': {
        const kieKey = await getApiKey(
          supabase,
          user.id,
          'kie-ai',
          Deno.env.get('KIE_AI_API_KEY')
        );
        result = await generateWithKieAI(prompt, parameters, kieKey);
        break;
      }

      case 'google': {
        const googleKey = await getApiKey(
          supabase,
          user.id,
          'google',
          Deno.env.get('GOOGLE_AI_API_KEY')
        );
        result = await generateWithGemini(prompt, parameters, googleKey, inputImage, inputImages);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported provider: ${provider}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // For sync providers, upload to storage but DON'T save to DB yet
    // Let the frontend show preview first, then save on user confirmation
    if (result.status === 'completed' && result.imageUrl) {
      // Generate image ID before uploading
      const imageId = crypto.randomUUID();

      // Upload to storage if it's a base64 image
      let finalImageUrl = result.imageUrl;
      if (result.imageUrl.startsWith('data:image')) {
        console.log('Uploading base64 image to storage...');
        finalImageUrl = await uploadToStorage(supabase, user.id, result.imageUrl, imageId);
      }

      // Return the storage URL without saving to DB
      // Frontend will show preview and save on user confirmation
      result.imageUrl = finalImageUrl;

      // Also upload original input images to storage if present
      const originalImageUrls: string[] = [];
      if (inputImages && inputImages.length > 0) {
        console.log(`Uploading ${inputImages.length} original images to storage...`);
        for (let i = 0; i < inputImages.length; i++) {
          const inputImage = inputImages[i];
          if (inputImage.startsWith('data:image')) {
            const originalId = `${imageId}_original_${i}`;
            const originalUrl = await uploadToStorage(supabase, user.id, inputImage, originalId);
            originalImageUrls.push(originalUrl);
          } else {
            // Already a URL, just store it
            originalImageUrls.push(inputImage);
          }
        }
      } else if (inputImage && inputImage.startsWith('data:image')) {
        // Legacy single image support
        const originalId = `${imageId}_original_0`;
        const originalUrl = await uploadToStorage(supabase, user.id, inputImage, originalId);
        originalImageUrls.push(originalUrl);
      }

      result.originalImageUrls = originalImageUrls.length > 0 ? originalImageUrls : undefined;
    }

    // Return result (with taskId for async or imageUrl for sync)
    return new Response(
      JSON.stringify({
        success: true,
        provider,
        taskId: result.taskId || result.imageUrl, // For sync providers, imageUrl is the "taskId"
        status: result.status,
        imageUrl: result.imageUrl,
        originalImageUrls: result.originalImageUrls,
        model: result.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
