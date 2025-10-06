// Supabase Edge Function for Avatar Chat API
// Endpoint: POST /avatar-chat
// This allows n8n and other services to send messages to avatars

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface ChatRequest {
  avatar_id: string
  message: string
  conversation_history?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  model?: string
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

    // Check if 'chat' scope is granted
    if (!keyData.scopes.includes('chat')) {
      return new Response(
        JSON.stringify({ error: 'API key does not have chat permission' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: ChatRequest = await req.json()
    const { avatar_id, message, conversation_history = [], model = 'gpt-3.5-turbo' } = requestBody

    if (!avatar_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: avatar_id and message' }),
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

    // Get knowledge base (RAG chunks)
    const { data: ragChunks } = await supabase
      .rpc('search_knowledge_chunks', {
        p_user_id: userId,
        p_avatar_id: avatar_id,
        p_query: message,
        p_limit: 5,
        p_threshold: 0.7
      })

    // Get recent memories
    const { data: memories } = await supabase
      .from('avatar_memories')
      .select(`
        *,
        memory_images (*)
      `)
      .eq('avatar_id', avatar_id)
      .eq('user_id', userId)
      .order('memory_date', { ascending: false })
      .limit(10)

    // Build system prompt
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
    }

    // Add RAG context if available
    if (ragChunks && ragChunks.length > 0) {
      systemPrompt += '\n\n=== RELEVANT KNOWLEDGE BASE CONTENT ===\n'
      ragChunks.forEach((chunk: any, index: number) => {
        systemPrompt += `\n--- Section ${index + 1} ---\n${chunk.chunk_text}\n`
      })
      systemPrompt += '\n=== END RELEVANT CONTENT ===\n'
    }

    // Add memory context if available
    if (memories && memories.length > 0) {
      systemPrompt += '\n\n=== YOUR MEMORIES ===\n'
      memories.forEach((memory: any) => {
        systemPrompt += `\n- ${memory.title} (${memory.memory_date}): ${memory.memory_summary}\n`
      })
      systemPrompt += '\n=== END MEMORIES ===\n'
    }

    systemPrompt += `\n\nUser's current question: "${message}"\n\nStay in character and respond as ${avatar.name} would.`

    // Get OpenAI API key
    const { data: apiKeyData } = await supabase
      .from('user_api_keys')
      .select('api_key_encrypted')
      .eq('user_id', userId)
      .eq('service', 'OpenAI')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'No OpenAI API key found for user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decrypt API key (simple base64 decode - match your encryption)
    const openaiApiKey = atob(apiKeyData.api_key_encrypted)

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.slice(-30),
      { role: 'user', content: message }
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: avatar.fine_tuned_model_id || model,
        messages,
        max_tokens: model.includes('gpt-4o-mini') ? 2000 : 1000,
        temperature: 0.7
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(errorData.error?.message || 'OpenAI API error')
    }

    const openaiData = await openaiResponse.json()
    const assistantMessage = openaiData.choices[0].message.content

    // Log the request
    await supabase.from('api_request_logs').insert({
      api_key_id: keyData.key_id,
      user_id: userId,
      endpoint: '/avatar-chat',
      method: 'POST',
      status_code: 200
    })

    // Update API key usage
    await supabase.rpc('increment_api_key_usage', {
      p_key_id: keyData.key_id
    })

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        avatar_id,
        message: assistantMessage,
        metadata: {
          model: avatar.fine_tuned_model_id || model,
          knowledge_chunks_used: ragChunks?.length || 0,
          memories_accessed: memories?.length || 0
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error in avatar-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
