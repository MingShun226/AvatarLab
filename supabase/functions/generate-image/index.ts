import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('generate-image function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { prompt, imageUrls, generationType = 'text-to-image', checkProgress = false, taskId } = requestBody;
    
    // Handle progress check request
    if (checkProgress && taskId) {
      console.log('Checking progress for task:', taskId);
      
      const kieApiKey = Deno.env.get('KIE_AI_API_KEY');
      if (!kieApiKey) {
        return new Response(
          JSON.stringify({ error: 'API key not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      try {
        const statusResponse = await fetch(`https://api.kie.ai/api/v1/flux/kontext/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${kieApiKey}`,
          },
        });

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          console.log('Progress check result:', statusResult);
          
          if (statusResult.code === 200) {
            const status = statusResult.data?.status || 'processing';
            const progress = statusResult.data?.progress || Math.random() * 40 + 50; // Simulate progress
            
            return new Response(
              JSON.stringify({
                status,
                progress,
                imageUrl: statusResult.data?.images?.[0] || null,
                taskId
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        return new Response(
          JSON.stringify({ status: 'processing', progress: Math.random() * 40 + 50, taskId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Progress check error:', error);
        return new Response(
          JSON.stringify({ status: 'processing', progress: Math.random() * 40 + 50, taskId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate prompt for new generation
    if (!prompt) {
      console.error('No prompt provided');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Generating image with prompt:', prompt);

    const kieApiKey = Deno.env.get('KIE_AI_API_KEY');
    if (!kieApiKey) {
      console.error('KIE_AI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare API request for KIE AI Flux API
    const apiUrl = 'https://api.kie.ai/api/v1/flux/kontext/generate';
    const kieRequestBody: any = { 
      prompt,
      aspectRatio: '1:1',
      model: 'flux-kontext-pro'
    };

    // Add input image for image-to-image generation
    if (generationType === 'image-to-image' && imageUrls && imageUrls.length > 0) {
      kieRequestBody.inputImage = imageUrls[0];
    }

    console.log('Making request to Kie AI:', { apiUrl, kieRequestBody });

    // Call Kie AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(kieRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kie AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate image', 
          details: errorText,
          status: response.status 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.json();
    console.log('Kie AI API response:', result);

    // Handle task-based response from Kie AI
    if (result.code !== 200 || !result.data?.taskId) {
      console.error('Invalid response from Kie AI:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from Kie AI API',
          details: result.msg || 'Unknown error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const receivedTaskId = result.data.taskId;
    console.log('Task ID received:', receivedTaskId);

    // Return task ID immediately for progress tracking
    return new Response(
      JSON.stringify({ 
        success: true,
        taskId: receivedTaskId,
        status: 'processing'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});