# 🧠 Conversation Memory System - n8n Integration Guide

## 📋 Overview

This system stores **WhatsApp conversation history** in your database so your AI Agent can:
- ✅ Remember previous conversations with each user
- ✅ Maintain context across multiple messages
- ✅ Provide personalized responses based on chat history
- ✅ Track conversations per phone number

---

## 🗄️ Database Setup

### Step 1: Create the Table

**Run this SQL in Supabase SQL Editor:**

📁 File: `supabase\migrations\20251006000000_create_conversations_table.sql`

This creates:
- ✅ `conversations` table with full message tracking
- ✅ Indexes for fast retrieval
- ✅ RLS policies for security
- ✅ Helper functions for getting conversation history

**Or paste directly:**

```sql
-- Copy the entire content of the migration file
```

---

## 🚀 API Endpoints

### Endpoint 1: Save Message (POST)

**Save user message OR assistant reply to database**

```
POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
x-api-key: pk_live_YOUR_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "+60123456789",
  "contact_name": "John Doe",
  "message_role": "user",
  "message_content": "Hey! How are you?",
  "message_type": "text",
  "platform": "whatsapp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message saved successfully",
  "data": {
    "id": "uuid-here",
    "timestamp": "2025-10-06T10:30:00Z"
  }
}
```

---

### Endpoint 2: Get Conversation History (GET)

**Retrieve previous conversation with a phone number**

```
GET https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations?avatar_id={id}&phone_number={number}&limit=20
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
x-api-key: pk_live_YOUR_KEY
Content-Type: application/json
```

**Query Parameters:**
- `avatar_id` - Your avatar UUID (required)
- `phone_number` - User's phone number with country code (required)
- `limit` - Number of recent messages (default: 20)

**Response:**
```json
{
  "success": true,
  "phone_number": "+60123456789",
  "message_count": 15,
  "messages": [
    {
      "role": "user",
      "content": "Hey! How are you?",
      "timestamp": "2025-10-06T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "Hi John! I'm great, thanks! How about you?",
      "timestamp": "2025-10-06T10:30:05Z"
    },
    {
      "role": "user",
      "content": "I'm good! Remember that Japanese dinner we talked about?",
      "timestamp": "2025-10-06T10:31:00Z"
    }
  ]
}
```

---

## 🤖 n8n Workflow Setup

### Complete WhatsApp Flow

```
┌─────────────────┐
│  WhatsApp       │
│  Trigger        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  1. Get         │
│  Conversation   │ ← GET /avatar-conversations
│  History        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Get Avatar  │
│  Config         │ ← GET /avatar-config
│  (Prompt +      │
│   Memories +    │
│   Knowledge)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Build       │
│  AI Context     │ ← Code Node (combine all)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Call        │
│  OpenAI/Chat    │ ← OpenAI Chat Node
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Save User   │
│  Message        │ ← POST /avatar-conversations (user)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. Save AI     │
│  Reply          │ ← POST /avatar-conversations (assistant)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send WhatsApp  │
│  Reply          │
└─────────────────┘
```

---

## 📝 n8n Node Configurations

### Node 1: Get Conversation History

**HTTP Request Node:**

```javascript
Method: GET
URL: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Query Parameters:
  - avatar_id: 9a567d58-cb5b-497d-869a-d6a8d61a8b4e
  - phone_number: ={{ $json.body.from }}  // From WhatsApp trigger
  - limit: 20

Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - x-api-key: pk_live_YOUR_KEY
  - Content-Type: application/json
```

---

### Node 2: Get Avatar Config

**HTTP Request Node:**

```javascript
Method: GET
URL: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config

Query Parameters:
  - avatar_id: 9a567d58-cb5b-497d-869a-d6a8d61a8b4e

Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - x-api-key: pk_live_YOUR_KEY
  - Content-Type: application/json
```

---

### Node 3: Build AI Context

**Code Node:**

```javascript
// Get data from previous nodes
const conversationHistory = $('Get Conversation History').all()[0].json;
const avatarConfig = $('Get Avatar Config').all()[0].json;
const whatsappMessage = $('WhatsApp Trigger').all()[0].json;

// Build system prompt with full context
let systemPrompt = avatarConfig.active_prompt.system_prompt;

// Add knowledge base chunks
if (avatarConfig.knowledge_base.chunks.length > 0) {
  systemPrompt += '\n\n=== KNOWLEDGE BASE ===\n';
  avatarConfig.knowledge_base.chunks.forEach(chunk => {
    systemPrompt += `${chunk.content}\n\n`;
  });
}

// Add memories
if (avatarConfig.memories.items.length > 0) {
  systemPrompt += '\n\n=== YOUR MEMORIES ===\n';
  avatarConfig.memories.items.forEach(memory => {
    systemPrompt += `- ${memory.title} (${memory.date}): ${memory.summary}\n`;
    if (memory.food_items && memory.food_items.length > 0) {
      systemPrompt += `  Food: ${memory.food_items.join(', ')}\n`;
    }
  });
}

// Build messages array for OpenAI
const messages = [
  {
    role: 'system',
    content: systemPrompt
  }
];

// Add conversation history
if (conversationHistory.messages && conversationHistory.messages.length > 0) {
  messages.push(...conversationHistory.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  })));
}

// Add current user message
messages.push({
  role: 'user',
  content: whatsappMessage.body.message
});

return {
  messages,
  phone_number: whatsappMessage.body.from,
  contact_name: whatsappMessage.body.name || 'User',
  user_message: whatsappMessage.body.message
};
```

---

### Node 4: Call OpenAI

**OpenAI Chat Node:**

```javascript
Model: gpt-4o-mini
Messages: ={{ $json.messages }}
```

---

### Node 5: Save User Message

**HTTP Request Node:**

```javascript
Method: POST
URL: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - x-api-key: pk_live_YOUR_KEY
  - Content-Type: application/json

Body:
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "={{ $('Build AI Context').all()[0].json.phone_number }}",
  "contact_name": "={{ $('Build AI Context').all()[0].json.contact_name }}",
  "message_role": "user",
  "message_content": "={{ $('Build AI Context').all()[0].json.user_message }}",
  "platform": "whatsapp"
}
```

---

### Node 6: Save AI Reply

**HTTP Request Node:**

```javascript
Method: POST
URL: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - x-api-key: pk_live_YOUR_KEY
  - Content-Type: application/json

Body:
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "={{ $('Build AI Context').all()[0].json.phone_number }}",
  "contact_name": "={{ $('Build AI Context').all()[0].json.contact_name }}",
  "message_role": "assistant",
  "message_content": "={{ $('Call OpenAI').all()[0].json.message.content }}",
  "platform": "whatsapp"
}
```

---

## 🎯 Field Descriptions

### message_role
- `user` - Message from WhatsApp user
- `assistant` - Reply from your AI avatar
- `system` - System messages (optional)

### message_type
- `text` - Regular text message (default)
- `image` - Image attachment
- `audio` - Voice message
- `video` - Video message
- `document` - PDF/Doc attachment
- `location` - Location sharing

### platform
- `whatsapp` - WhatsApp messages (default)
- `telegram` - Telegram (future)
- `slack` - Slack (future)
- `web` - Web chat (future)

---

## ✅ Testing

### Test 1: Save a Message

```powershell
curl -X POST "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
    "phone_number": "+60123456789",
    "contact_name": "John",
    "message_role": "user",
    "message_content": "Hello!"
  }'
```

### Test 2: Get Conversation History

```powershell
curl -X GET "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations?avatar_id=9a567d58-cb5b-497d-869a-d6a8d61a8b4e&phone_number=%2B60123456789&limit=20" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." `
  -H "x-api-key: pk_live_YOUR_KEY"
```

---

## 🎉 Benefits

Your AI Agent will now:

1. **Remember conversations** - "As we discussed earlier..."
2. **Maintain context** - Understands what "it" or "that" refers to
3. **Personalized responses** - Knows user's preferences from previous chats
4. **Multi-turn conversations** - Can have natural back-and-forth dialogue
5. **Per-user tracking** - Different conversation for each phone number

---

## 📊 Example Conversation Flow

**User:** "Hey! How are you?"
→ Saved as: `role: user, content: "Hey! How are you?"`

**AI:** "Hi John! I'm great, thanks!"
→ Saved as: `role: assistant, content: "Hi John! I'm great, thanks!"`

**User:** "Remember that Japanese dinner?"
→ AI retrieves history + memories + config
→ AI sees memory: "dinner ate, this is the receipt" with food items
→ AI responds: "Of course! The one with all that amazing ramen and gyoza? That was such a great night!"

**Perfect context-aware conversation!** 🎉

---

## 🚀 Deployment Steps

1. **Create table**: Run migration SQL in Supabase
2. **Deploy function**: Deploy `avatar-conversations` Edge Function
3. **Update n8n**: Add conversation history nodes to workflow
4. **Test**: Send test messages and verify history is saved
5. **Go live**: Connect to WhatsApp and enjoy smart conversations!
