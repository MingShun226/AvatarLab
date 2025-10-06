# 🧠 n8n Conversation Setup with Avatar ID

## ✅ Updated Schema (With Avatar ID)

```sql
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  phone_number VARCHAR(15) NOT NULL,
  conversation_content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW()
);
```

**Why avatar_id?**
- Different avatars can chat with the same phone number
- Each avatar has its own conversation history per contact
- Example: Avatar "Sarah" and Avatar "John" both chat with +60123456789

---

## 🔵 GET Conversation (n8n HTTP Request)

```
Method: GET

URL:
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations?avatar_id=9a567d58-cb5b-497d-869a-d6a8d61a8b4e&phone_number={{ $json.body.from }}

Headers:
┌─────────────────┬──────────────────────────────────────────┐
│ Authorization   │ Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA │
│ x-api-key       │ pk_live_YOUR_API_KEY                     │
│ Content-Type    │ application/json                         │
└─────────────────┴──────────────────────────────────────────┘
```

**Query Parameters:**
- `avatar_id`: `9a567d58-cb5b-497d-869a-d6a8d61a8b4e` (your avatar UUID)
- `phone_number`: `={{ $json.body.from }}` (from WhatsApp trigger)

---

## 🔴 POST Save Conversation (n8n HTTP Request)

```
Method: POST

URL:
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Headers:
┌─────────────────┬──────────────────────────────────────────┐
│ Authorization   │ Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA │
│ x-api-key       │ pk_live_YOUR_API_KEY                     │
│ Content-Type    │ application/json                         │
└─────────────────┴──────────────────────────────────────────┘

Body (JSON):
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "={{ $json.phone_number }}",
  "conversation_content": "={{ $json.conversation_content }}"
}
```

---

## 🔧 Code Node: Build Updated Conversation

```javascript
// Get all the data
const previousConv = $('Get Conversation').all()[0].json;
const whatsappMsg = $('WhatsApp Trigger').all()[0].json;
const aiReply = $('Call OpenAI').all()[0].json;

// Avatar ID (your avatar UUID)
const avatarId = '9a567d58-cb5b-497d-869a-d6a8d61a8b4e';

// Get phone number
const phoneNumber = whatsappMsg.body.from;

// Get user message
const userMessage = whatsappMsg.body.message;

// Get AI response
const aiResponse = aiReply.message.content;

// Format new exchange
const newExchange = `user: ${userMessage} | assistant: ${aiResponse}`;

// Build updated conversation
let updatedConversation = '';

if (previousConv.has_history && previousConv.conversation) {
  // Append to existing conversation
  updatedConversation = previousConv.conversation.conversation_content + ' || ' + newExchange;
} else {
  // First conversation
  updatedConversation = newExchange;
}

// Return data for POST request
return {
  avatar_id: avatarId,
  phone_number: phoneNumber,
  conversation_content: updatedConversation
};
```

---

## 📊 Complete SQL to Paste

```sql
-- Simple Conversation Memory System for WhatsApp Integration
-- Stores conversation history as continuous text transcript

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Avatar tracking (which avatar is chatting)
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,

  -- Contact Information
  phone_number VARCHAR(15) NOT NULL,

  -- Conversation Transcript (entire conversation as text)
  conversation_content TEXT NOT NULL,

  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW()
) TABLESPACE pg_default;

-- Index for fast retrieval by avatar + phone number (UNIQUE conversation per avatar-phone pair)
CREATE INDEX IF NOT EXISTS idx_conversations_avatar_phone
ON public.conversations USING btree (avatar_id, phone_number) TABLESPACE pg_default;

-- Index for fast retrieval by phone number
CREATE INDEX IF NOT EXISTS idx_conversations_phone
ON public.conversations USING btree (phone_number) TABLESPACE pg_default;

-- Index for retrieving latest conversations
CREATE INDEX IF NOT EXISTS idx_conversations_avatar_phone_timestamp
ON public.conversations USING btree (avatar_id, phone_number, timestamp DESC) TABLESPACE pg_default;

COMMENT ON TABLE public.conversations IS 'Stores WhatsApp conversation history as text transcripts';
COMMENT ON COLUMN public.conversations.conversation_content IS 'Full conversation text: user: message | assistant: reply || user: next message | assistant: next reply';
```

---

## 🎯 Example: Different Avatars, Same Contact

**Avatar Sarah (+60123456789):**
```
user: hey | assistant: Hi there! 😊
```

**Avatar John (+60123456789):**
```
user: hey | assistant: Hello! How can I help?
```

Both stored separately because of different `avatar_id`!

---

## ✅ Quick Reference

**GET:**
- Needs: `avatar_id` + `phone_number`
- Returns: Conversation for THAT avatar with THAT contact

**POST:**
- Needs: `avatar_id` + `phone_number` + `conversation_content`
- Saves: Updated conversation for THAT avatar

**Key Point:** Each avatar maintains separate conversation history with each contact! 🎯
