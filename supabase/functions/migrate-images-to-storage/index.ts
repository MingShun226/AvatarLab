import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Migrating images for user: ${user.id}`);

    // Get all images with base64 data
    const { data: images, error: fetchError } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', user.id)
      .like('image_url', 'data:image%');

    if (fetchError) {
      throw new Error(`Failed to fetch images: ${fetchError.message}`);
    }

    console.log(`Found ${images?.length || 0} base64 images to migrate`);

    const results = [];

    for (const image of images || []) {
      try {
        console.log(`Migrating image ${image.id}...`);

        // Extract base64 data
        const base64Data = image.image_url.includes('base64,')
          ? image.image_url.split('base64,')[1]
          : image.image_url;

        // Convert to binary
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage
        const filename = `${user.id}/${image.id}_${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('generated-images')
          .upload(filename, binaryData, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error(`Upload failed for ${image.id}:`, uploadError);
          results.push({ id: image.id, status: 'failed', error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('generated-images')
          .getPublicUrl(filename);

        // Update database record
        const { error: updateError } = await supabase
          .from('generated_images')
          .update({ image_url: publicUrl })
          .eq('id', image.id);

        if (updateError) {
          console.error(`Update failed for ${image.id}:`, updateError);
          results.push({ id: image.id, status: 'failed', error: updateError.message });
          continue;
        }

        console.log(`✓ Migrated ${image.id} to ${publicUrl}`);
        results.push({ id: image.id, status: 'success', url: publicUrl });

      } catch (error) {
        console.error(`Error migrating ${image.id}:`, error);
        results.push({ id: image.id, status: 'failed', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migration complete: ${successCount} succeeded, ${failCount} failed`,
        total: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
