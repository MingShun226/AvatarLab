import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('manage-images function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey 
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { action, imageId, isFavorite } = requestBody;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authenticated user:', user.id);
    let result;

    switch (action) {
      case 'get_images':
        const { data: images, error: getError } = await supabase
          .from('generated_images')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (getError) {
          console.error('Get images error:', getError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch images', details: getError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { images: images || [] };
        break;

      case 'toggle_favorite':
        if (!imageId) {
          return new Response(
            JSON.stringify({ error: 'Image ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: updatedImage, error: favoriteError } = await supabase
          .from('generated_images')
          .update({ is_favorite: isFavorite })
          .eq('id', imageId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (favoriteError) {
          console.error('Toggle favorite error:', favoriteError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to update favorite status', 
              details: favoriteError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { image: updatedImage };
        break;

      case 'delete_image':
        if (!imageId) {
          return new Response(
            JSON.stringify({ error: 'Image ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // First remove from all collections
        await supabase
          .from('image_collection_items')
          .delete()
          .eq('image_id', imageId)
          .eq('user_id', user.id);

        // Then delete the image record
        const { error: deleteError } = await supabase
          .from('generated_images')
          .delete()
          .eq('id', imageId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Delete image error:', deleteError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to delete image', 
              details: deleteError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { success: true };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    console.log('Returning successful result:', result);
    return new Response(
      JSON.stringify({ success: true, ...result }),
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