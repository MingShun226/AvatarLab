// Supabase Edge Function for Avatar Configuration API
// Endpoint: GET /avatar-config?avatar_id={id}
// Returns avatar configuration, prompt versions, and settings

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from header
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key. Include x-api-key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify API key
    const { data: keyData, error: keyError } = await supabase
      .rpc('verify_platform_api_key', { p_api_key: apiKey })
      .single()

    if (keyError || !keyData || !keyData.is_valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if 'config' scope is granted
    if (!keyData.scopes.includes('config')) {
      return new Response(
        JSON.stringify({ error: 'API key does not have config permission' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get avatar_id from query params
    const url = new URL(req.url)
    const avatar_id = url.searchParams.get('avatar_id')

    if (!avatar_id) {
      return new Response(
        JSON.stringify({ error: 'Missing avatar_id query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if API key is restricted to specific avatar
    if (keyData.avatar_id && keyData.avatar_id !== avatar_id) {
      return new Response(
        JSON.stringify({ error: 'API key does not have access to this avatar' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = keyData.user_id

    // Get avatar data including fine-tuning fields
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('*, active_fine_tuned_model, use_fine_tuned_model, base_model')
      .eq('id', avatar_id)
      .eq('user_id', userId)
      .single()

    if (avatarError || !avatar) {
      return new Response(
        JSON.stringify({ error: 'Avatar not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active prompt version
    const { data: activePrompt } = await supabase
      .from('avatar_prompt_versions')
      .select('*')
      .eq('avatar_id', avatar_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    // NO LONGER FETCHING ALL PROMPT VERSIONS - only active one is returned

    // Get knowledge files with FULL details including file_path
    const { data: knowledgeFiles } = await supabase
      .from('avatar_knowledge_files')
      .select('id, file_name, original_name, file_path, content_type, processing_status, file_size, uploaded_at')
      .eq('avatar_id', avatar_id)
      .eq('user_id', userId)
      .eq('is_linked', true)

    // Get ALL knowledge base chunks (full content) - only from PROCESSED files
    const { data: knowledgeChunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('chunk_text, chunk_index, page_number, section_title, knowledge_file_id')
      .eq('avatar_id', avatar_id)
      .eq('user_id', userId)
      .order('knowledge_file_id', { ascending: true })
      .order('chunk_index', { ascending: true })

    // Log if chunks query fails
    if (chunksError) {
      console.error('Error fetching chunks:', chunksError)
    }

    // Get FULL memories with all details (only fields that exist in DB)
    const { data: memories, error: memoriesError } = await supabase
      .from('avatar_memories')
      .select(`
        id,
        title,
        memory_date,
        memory_summary,
        memory_description,
        location,
        people_present,
        activities,
        food_items,
        mood,
        conversational_hooks,
        is_favorite,
        is_private,
        created_at,
        updated_at,
        memory_images (
          id,
          image_url,
          image_path,
          caption,
          is_primary,
          image_order
        )
      `)
      .eq('avatar_id', avatar_id)
      .eq('user_id', userId)
      .order('memory_date', { ascending: false })

    // Log if memories query fails
    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError)
    }

    console.log(`Found ${memories?.length || 0} memories for avatar ${avatar_id}`)

    // Log the request
    await supabase.from('api_request_logs').insert({
      api_key_id: keyData.key_id,
      user_id: userId,
      endpoint: '/avatar-config',
      method: 'GET',
      status_code: 200
    })

    // Update API key usage
    await supabase.rpc('increment_api_key_usage', {
      p_key_id: keyData.key_id
    })

    // Generate PUBLIC or SIGNED URLs for knowledge base files
    const knowledgeFilesWithUrls = await Promise.all(
      (knowledgeFiles || []).map(async (file) => {
        let fileUrl = null
        if (file.file_path) {
          // Try public URL first
          const { data: publicUrlData } = supabase.storage
            .from('avatar-files')
            .getPublicUrl(file.file_path)

          if (publicUrlData?.publicUrl) {
            fileUrl = publicUrlData.publicUrl
          } else {
            // Fallback to signed URL (1 hour expiry)
            const { data: signedUrlData } = await supabase.storage
              .from('avatar-files')
              .createSignedUrl(file.file_path, 3600)
            fileUrl = signedUrlData?.signedUrl || null
          }
        }
        return {
          id: file.id,
          name: file.original_name || file.file_name,
          type: file.content_type,
          status: file.processing_status,
          size: file.file_size,
          uploaded_at: file.uploaded_at,
          file_url: fileUrl, // Direct download/access URL
          file_path: file.file_path
        }
      })
    )

    // Process memory images - ensure accessible URLs
    const memoriesWithUrls = await Promise.all(
      (memories || []).map(async (m) => {
        const imagesWithUrls = await Promise.all(
          (m.memory_images || []).map(async (img) => {
            let imageUrl = img.image_url

            // If image_url is already a full URL (starts with http), use it directly
            if (imageUrl && imageUrl.startsWith('http')) {
              // Already a public/accessible URL, no need to modify
              return {
                id: img.id,
                url: imageUrl,
                caption: img.caption,
                is_primary: img.is_primary,
                display_order: img.display_order
              }
            }

            // If it's a storage path, try to get public URL first
            if (imageUrl && !imageUrl.startsWith('http')) {
              // Try public URL first (if bucket is public)
              const { data: publicUrlData } = supabase.storage
                .from('avatar-memories')
                .getPublicUrl(imageUrl)

              if (publicUrlData?.publicUrl) {
                imageUrl = publicUrlData.publicUrl
              } else {
                // Fallback to signed URL if public URL fails
                const { data: signedUrlData } = await supabase.storage
                  .from('avatar-memories')
                  .createSignedUrl(imageUrl, 3600)
                imageUrl = signedUrlData?.signedUrl || imageUrl
              }
            }

            return {
              id: img.id,
              url: imageUrl,
              caption: img.caption,
              is_primary: img.is_primary,
              display_order: img.display_order
            }
          })
        )
        return {
          id: m.id,
          title: m.title,
          date: m.memory_date,
          summary: m.memory_summary,
          description: m.memory_description,
          location: m.location,
          people_present: m.people_present,
          activities: m.activities,
          food_items: m.food_items,
          mood: m.mood,
          conversational_hooks: m.conversational_hooks,
          is_favorite: m.is_favorite,
          is_private: m.is_private,
          images: imagesWithUrls,
          created_at: m.created_at,
          updated_at: m.updated_at
        }
      })
    )

    // Return FULL configuration with all data
    return new Response(
      JSON.stringify({
        success: true,
        avatar: {
          id: avatar.id,
          name: avatar.name,
          description: avatar.description,
          age: avatar.age,
          gender: avatar.gender,
          origin_country: avatar.origin_country,
          primary_language: avatar.primary_language,
          secondary_languages: avatar.secondary_languages,
          backstory: avatar.backstory,
          personality_traits: avatar.personality_traits,
          mbti_type: avatar.mbti_type,
          hidden_rules: avatar.hidden_rules,
          fine_tuned_model_id: avatar.active_fine_tuned_model,
          use_fine_tuned_model: avatar.use_fine_tuned_model,
          base_model: avatar.base_model
        },
        active_prompt: activePrompt ? {
          version_number: activePrompt.version_number,
          system_prompt: activePrompt.system_prompt,
          personality_traits: activePrompt.personality_traits,
          behavior_rules: activePrompt.behavior_rules,
          response_style: activePrompt.response_style,
          is_active: activePrompt.is_active,
          training_examples_count: activePrompt.training_examples?.length || 0
        } : null,
        knowledge_base: {
          files_count: knowledgeFilesWithUrls.length,
          files: knowledgeFilesWithUrls,
          chunks_count: knowledgeChunks?.length || 0,
          chunks: knowledgeChunks?.map(chunk => ({
            file_id: chunk.knowledge_file_id,
            chunk_index: chunk.chunk_index,
            page_number: chunk.page_number,
            section_title: chunk.section_title,
            content: chunk.chunk_text
          })) || []
        },
        memories: {
          count: memoriesWithUrls.length,
          items: memoriesWithUrls
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error in avatar-config function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
