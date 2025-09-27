import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('manage-collections function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
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

    const { action, collectionId, imageId, name, description } = requestBody;

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

    let result;

    switch (action) {
      case 'create_collection':
        if (!name) {
          return new Response(
            JSON.stringify({ error: 'Collection name is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: newCollection, error: createError } = await supabase
          .from('image_collections')
          .insert({
            user_id: user.id,
            name,
            description: description || null,
          })
          .select()
          .single();

        if (createError) {
          console.error('Create collection error:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create collection', details: createError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { collection: newCollection };
        break;

      case 'add_to_collection':
        if (!collectionId || !imageId) {
          return new Response(
            JSON.stringify({ error: 'Collection ID and Image ID are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: collectionItem, error: addError } = await supabase
          .from('image_collection_items')
          .insert({
            user_id: user.id,
            collection_id: collectionId,
            image_id: imageId,
          })
          .select()
          .single();

        if (addError) {
          console.error('Add to collection error:', addError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to add image to collection', 
              details: addError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { collectionItem };
        break;

      case 'remove_from_collection':
        if (!collectionId || !imageId) {
          return new Response(
            JSON.stringify({ error: 'Collection ID and Image ID are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { error: removeError } = await supabase
          .from('image_collection_items')
          .delete()
          .eq('collection_id', collectionId)
          .eq('image_id', imageId)
          .eq('user_id', user.id);

        if (removeError) {
          console.error('Remove from collection error:', removeError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to remove image from collection', 
              details: removeError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { success: true };
        break;

      case 'get_collections':
        const { data: collections, error: getError } = await supabase
          .from('image_collections')
          .select(`
            *,
            image_collection_items(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (getError) {
          console.error('Get collections error:', getError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch collections', details: getError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { collections: collections || [] };
        break;

      case 'get_collection_images':
        if (!collectionId) {
          return new Response(
            JSON.stringify({ error: 'Collection ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: collectionImages, error: getImagesError } = await supabase
          .from('image_collection_items')
          .select(`
            *,
            generated_images(*)
          `)
          .eq('collection_id', collectionId)
          .eq('user_id', user.id)
          .order('added_at', { ascending: false });

        if (getImagesError) {
          console.error('Get collection images error:', getImagesError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch collection images', 
              details: getImagesError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        result = { images: collectionImages || [] };
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