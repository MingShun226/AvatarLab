# 🧠 Simple Conversation Memory - n8n Guide

## 📋 Simple Schema

```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY,
  phone_number VARCHAR(15),
  conversation_content TEXT,  -- Full conversation transcript
  timestamp TIMESTAMP WITH TIME ZONE
);
```

**Example conversation_content:**
```
user: hey | assistant: 你好呀 🌸 || 很高兴再次见到你！有什么我可以为你提供的信息或帮助的吗？✨ || 如果需要了解我们的疗程、预订或其他设施，可以随时告诉我！
```

---

## 🚀 API Endpoints

### 1. GET Conversation History

**Get the latest conversation transcript for a phone number**

```
GET /avatar-conversations?phone_number=+60123456789
```

**Response:**
```json
{
  "success": true,
  "phone_number": "+60123456789",
  "has_history": true,
  "conversation": {
    "id": "uuid-here",
    "conversation_content": "user: hey | assistant: 你好呀 🌸 || 很高兴再次见到你！...",
    "timestamp": "2025-10-06T10:30:00Z"
  }
}
```

---

### 2. POST Save New Conversation

**Save updated conversation transcript (after new exchange)**

```
POST /avatar-conversations
```

**Request Body:**
```json
{
  "phone_number": "+60123456789",
  "conversation_content": "user: hey | assistant: 你好呀 🌸 || user: how are you | assistant: 我很好，谢谢！✨"
}
```

---

### 3. PUT Update Conversation

**Update existing conversation transcript**

```
PUT /avatar-conversations
```

**Request Body:**
```json
{
  "phone_number": "+60123456789",
  "conversation_content": "user: hey | assistant: 你好呀 🌸 || user: how are you | assistant: 我很好，谢谢！✨",
  "conversation_id": "optional-uuid-to-update-specific-record"
}
```

---

## 🤖 n8n Workflow

### Simplified Flow

```
WhatsApp Trigger
     ↓
Get Previous Conversation (GET)
     ↓
Get Avatar Config (GET)
     ↓
Build Context (Code)
     ↓
Call OpenAI
     ↓
Append to Conversation (Code)
     ↓
Save Updated Conversation (POST)
     ↓
Send WhatsApp Reply
```

---

## 📝 n8n Node Examples

### Node 1: Get Previous Conversation

**HTTP Request:**
```javascript
Method: GET
URL: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Query Parameters:
  - phone_number: ={{ $json.body.from }}

Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - x-api-key: pk_live_YOUR_KEY
```

---

### Node 2: Build Context with Conversation

**Code Node:**
```javascript
// Get data
const previousConv = $('Get Previous Conversation').all()[0].json;
const avatarConfig = $('Get Avatar Config').all()[0].json;
const whatsappMsg = $('WhatsApp Trigger').all()[0].json;

// Build system prompt
let systemPrompt = avatarConfig.active_prompt.system_prompt;

// Add conversation history to system prompt
if (previousConv.has_history) {
  systemPrompt += '\n\n=== PREVIOUS CONVERSATION ===\n';
  systemPrompt += previousConv.conversation.conversation_content;
  systemPrompt += '\n=== END PREVIOUS CONVERSATION ===\n';
}

// Add memories
if (avatarConfig.memories.items.length > 0) {
  systemPrompt += '\n\n=== YOUR MEMORIES ===\n';
  avatarConfig.memories.items.forEach(memory => {
    systemPrompt += `- ${memory.title}: ${memory.summary}\n`;
  });
}

// Build messages for OpenAI
const messages = [
  {
    role: 'system',
    content: systemPrompt
  },
  {
    role: 'user',
    content: whatsappMsg.body.message
  }
];

return {
  messages,
  phone_number: whatsappMsg.body.from,
  user_message: whatsappMsg.body.message,
  previous_conversation: previousConv.has_history ? previousConv.conversation.conversation_content : ''
};
```

---

### Node 3: Append New Exchange to Conversation

**Code Node (after OpenAI):**
```javascript
// Get data
const context = $('Build Context').all()[0].json;
const aiReply = $('Call OpenAI').all()[0].json;

// Format new exchange
const newExchange = `user: ${context.user_message} | assistant: ${aiReply.message.content}`;

// Append to previous conversation
let updatedConversation = '';
if (context.previous_conversation) {
  // Add to existing conversation
  updatedConversation = context.previous_conversation + ' || ' + newExchange;
} else {
  // First conversation
  updatedConversation = newExchange;
}

return {
  phone_number: context.phone_number,
  conversation_content: updatedConversation
};
```

---

### Node 4: Save Updated Conversation

**HTTP Request:**
```javascript
Method: POST
URL: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - x-api-key: pk_live_YOUR_KEY
  - Content-Type: application/json

Body:
{
  "phone_number": "={{ $json.phone_number }}",
  "conversation_content": "={{ $json.conversation_content }}"
}
```

---

## 📊 Example Flow

**Message 1:**
```
User: "hey"
AI: "你好呀 🌸 || 很高兴再次见到你！"

Saved as:
"user: hey | assistant: 你好呀 🌸 || 很高兴再次见到你！"
```

**Message 2:**
```
User: "how are you"
AI: "我很好，谢谢！✨"

Updated to:
"user: hey | assistant: 你好呀 🌸 || 很高兴再次见到你！ || user: how are you | assistant: 我很好，谢谢！✨"
```

**Message 3:**
```
User: "remember that Japanese dinner?"
AI: "Of course! 还记得那些美味的拉面和饺子吗？🍜"

Updated to:
"user: hey | assistant: 你好呀 🌸 || 很高兴再次见到你！ || user: how are you | assistant: 我很好，谢谢！✨ || user: remember that Japanese dinner? | assistant: Of course! 还记得那些美味的拉面和饺子吗？🍜"
```

---

## ✅ Benefits of Simple Format

1. **Easy to read** - Human-readable conversation transcript
2. **Simple to append** - Just concatenate with ` || `
3. **Works with any AI** - Paste entire transcript into system prompt
4. **Flexible** - Can include emojis, multilingual text
5. **Lightweight** - One TEXT field, simple schema

---

## 🚀 Deployment

### Step 1: Create Table
```sql
-- Run in Supabase SQL Editor
-- File: supabase\migrations\20251006000000_create_conversations_simple.sql
```

### Step 2: Deploy Edge Function
```
Deploy: supabase\functions\avatar-conversations\index.ts
```

### Step 3: Test
```powershell
# Save conversation
curl -X POST "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "phone_number": "+60123456789",
    "conversation_content": "user: hey | assistant: 你好呀 🌸"
  }'

# Get conversation
curl -X GET "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations?phone_number=%2B60123456789" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "x-api-key: pk_live_YOUR_KEY"
```

---

## 🎯 Perfect For

- ✅ WhatsApp conversations
- ✅ Simple transcript format
- ✅ Easy to debug (read the text directly)
- ✅ Multilingual support (emojis work!)
- ✅ Minimal database complexity

**Your AI Agent remembers everything in a simple text format!** 🎉
