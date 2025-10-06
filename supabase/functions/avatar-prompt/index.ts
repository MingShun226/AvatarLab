// Supabase Edge Function for Avatar Prompt Retrieval
// Endpoint: POST /avatar-prompt
// Returns the full enriched prompt that would be sent to OpenAI (without actually calling OpenAI)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface PromptRequest {
  avatar_id: string
  user_query?: string // Optional: to see how RAG would search
  include_rag?: boolean // Default true
  include_memories?: boolean // Default true
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

    // Verify API key and get permissions
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

    // Parse request body
    const requestBody: PromptRequest = await req.json()
    const {
      avatar_id,
      user_query = '',
      include_rag = true,
      include_memories = true
    } = requestBody

    if (!avatar_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: avatar_id' }),
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

    // Get avatar configuration
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('*')
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
    const { data: promptVersion } = await supabase
      .from('avatar_prompt_versions')
      .select('*')
      .eq('avatar_id', avatar_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    // Build base system prompt
    let systemPrompt = `You are ${avatar.name}, an AI avatar with a unique personality.`

    if (promptVersion) {
      systemPrompt = promptVersion.system_prompt

      if (promptVersion.personality_traits?.length > 0) {
        systemPrompt += `\n\nYour personality traits: ${promptVersion.personality_traits.join(', ')}`
      }

      if (promptVersion.behavior_rules?.length > 0) {
        systemPrompt += `\n\nBehavior guidelines: ${promptVersion.behavior_rules.join(' ')}`
      }
    } else {
      if (avatar.backstory) {
        systemPrompt += `\n\nYour backstory: ${avatar.backstory}`
      }
      if (avatar.personality_traits?.length > 0) {
        systemPrompt += `\n\nYour personality traits: ${avatar.personality_traits.join(', ')}`
      }
      if (avatar.mbti_type) {
        systemPrompt += `\n\nYour MBTI type: ${avatar.mbti_type}`
      }
      if (avatar.hidden_rules) {
        systemPrompt += `\n\nImportant behavioral guidelines: ${avatar.hidden_rules}`
      }
    }

    let ragChunks = []
    let knowledgeFiles = []

    // Get RAG knowledge if requested
    if (include_rag && user_query) {
      // Get knowledge base chunks (simplified - actual RAG would require embeddings)
      const { data: chunks } = await supabase
        .from('document_chunks')
        .select('chunk_text, chunk_index, page_number, section_title')
        .eq('user_id', userId)
        .eq('avatar_id', avatar_id)
        .limit(5)

      ragChunks = chunks || []

      if (ragChunks.length > 0) {
        systemPrompt += '\n\n=== RELEVANT KNOWLEDGE BASE CONTENT ==='
        systemPrompt += '\nBased on the query, here are relevant sections from your knowledge base:\n'
        ragChunks.forEach((chunk, index) => {
          systemPrompt += `\n--- Section ${index + 1} ---\n`
          if (chunk.section_title) {
            systemPrompt += `Section: ${chunk.section_title}\n`
          }
          if (chunk.page_number) {
            systemPrompt += `Page: ${chunk.page_number}\n`
          }
          systemPrompt += `${chunk.chunk_text}\n`
        })
        systemPrompt += '\n=== END RELEVANT CONTENT ===\n'
      }
    }

    // Get knowledge files list
    const { data: kbFiles } = await supabase
      .from('avatar_knowledge_files')
      .select('id, file_name, original_name, content_type, processing_status')
      .eq('user_id', userId)
      .eq('avatar_id', avatar_id)
      .eq('is_linked', true)

    knowledgeFiles = kbFiles || []

    let memories = []

    // Get memories if requested
    if (include_memories) {
      const { data: memoryData } = await supabase
        .from('avatar_memories')
        .select(`
          *,
          memory_images (
            id,
            image_url,
            caption,
            is_primary
          )
        `)
        .eq('avatar_id', avatar_id)
        .eq('user_id', userId)
        .order('memory_date', { ascending: false })
        .limit(10)

      memories = memoryData || []

      if (memories.length > 0) {
        systemPrompt += '\n\n=== YOUR MEMORIES ==='
        systemPrompt += '\nYou have these memories to draw from:\n'
        memories.forEach((memory) => {
          systemPrompt += `\n- ${memory.title} (${memory.memory_date}): ${memory.memory_summary}`
          if (memory.memory_images && memory.memory_images.length > 0) {
            systemPrompt += ` [${memory.memory_images.length} photo(s) available]`
          }
        })
        systemPrompt += '\n=== END MEMORIES ===\n'
      }
    }

    if (user_query) {
      systemPrompt += `\n\nUser's current question: "${user_query}"\n`
      systemPrompt += `\nStay in character and respond as ${avatar.name} would, based on your personality, background, and available knowledge.`
    }

    // Log the request
    await supabase.from('api_request_logs').insert({
      api_key_id: keyData.key_id,
      user_id: userId,
      endpoint: '/avatar-prompt',
      method: 'POST',
      status_code: 200
    })

    // Update API key usage
    await supabase.rpc('increment_api_key_usage', {
      p_key_id: keyData.key_id
    })

    // Return the enriched prompt
    return new Response(
      JSON.stringify({
        success: true,
        avatar_id,
        avatar_name: avatar.name,
        system_prompt: systemPrompt,
        components: {
          base_prompt: promptVersion ? 'trained_version' : 'default',
          prompt_version: promptVersion ? promptVersion.version_number : null,
          rag_chunks_included: ragChunks.length,
          memories_included: memories.length,
          knowledge_files_available: knowledgeFiles.length
        },
        knowledge_base: {
          files: knowledgeFiles.map(f => ({
            name: f.original_name || f.file_name,
            type: f.content_type,
            status: f.processing_status
          })),
          chunks_retrieved: ragChunks.length
        },
        memories: memories.map(m => ({
          id: m.id,
          title: m.title,
          date: m.memory_date,
          summary: m.memory_summary,
          images_count: m.memory_images?.length || 0
        })),
        user_query: user_query || null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error in avatar-prompt function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
