// Supabase Edge Function for Conversation Management
// Simplified: Store individual messages, order by timestamp
// Endpoints:
// - GET /avatar-conversations?avatar_id={id}&phone_number={number}&limit=30 - Get latest N messages
// - POST /avatar-conversations - Save new message exchange

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface SaveMessageRequest {
  avatar_id: string
  phone_number: string
  user_message: string
  assistant_message: string
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

    // Check if 'chat' scope is granted
    if (!keyData.scopes.includes('chat')) {
      return new Response(
        JSON.stringify({ error: 'API key does not have chat permission' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // GET: Retrieve Conversation History
    // ===================================
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const avatar_id = url.searchParams.get('avatar_id')
      const phone_number = url.searchParams.get('phone_number')
      const limit = parseInt(url.searchParams.get('limit') || '30')

      if (!avatar_id || !phone_number) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: avatar_id and phone_number' }),
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

      // Get latest N messages for this avatar + phone number, ordered by timestamp DESC
      const { data: messages, error: fetchError } = await supabase
        .from('conversations')
        .select('id, text, timestamp')
        .eq('avatar_id', avatar_id)
        .eq('phone_number', phone_number)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (fetchError) {
        console.error('Error fetching conversations:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch conversation history' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Reverse to get chronological order (oldest first)
      const conversationHistory = messages ? messages.reverse() : []

      // Format response
      const response = {
        phone: phone_number,
        conversationHistory: conversationHistory.map((msg, index) => ({
          text: msg.text,
          timestamp: msg.timestamp,
          order: index + 1 // Virtual order number for display
        })),
        totalConversations: conversationHistory.length
      }

      // Log the request
      await supabase.from('api_request_logs').insert({
        api_key_id: keyData.key_id,
        user_id: keyData.user_id,
        endpoint: '/avatar-conversations',
        method: 'GET',
        status_code: 200
      })

      // Update API key usage
      await supabase.rpc('increment_api_key_usage', {
        p_key_id: keyData.key_id
      })

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // ===================================
    // POST: Save New Message Exchange
    // ===================================
    if (req.method === 'POST') {
      const requestBody: SaveMessageRequest = await req.json()
      const { avatar_id, phone_number, user_message, assistant_message } = requestBody

      if (!avatar_id || !phone_number || !user_message || !assistant_message) {
        return new Response(
          JSON.stringify({
            error: 'Missing required fields: avatar_id, phone_number, user_message, assistant_message'
          }),
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

      // Format message text
      const messageText = `user: ${user_message} | assistant: ${assistant_message}`

      // Insert new message (timestamp auto-generated)
      const { data: savedMessage, error: insertError } = await supabase
        .from('conversations')
        .insert({
          avatar_id,
          phone_number,
          text: messageText
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error saving message:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save message' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the request
      await supabase.from('api_request_logs').insert({
        api_key_id: keyData.key_id,
        user_id: keyData.user_id,
        endpoint: '/avatar-conversations',
        method: 'POST',
        status_code: 200
      })

      // Update API key usage
      await supabase.rpc('increment_api_key_usage', {
        p_key_id: keyData.key_id
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message saved successfully',
          data: {
            id: savedMessage.id,
            text: savedMessage.text,
            timestamp: savedMessage.timestamp
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Unsupported method
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use GET or POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in avatar-conversations function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
