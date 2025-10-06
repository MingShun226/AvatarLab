# 🚀 Complete n8n Workflow Setup with Conversation Memory

## 📋 Prerequisites

✅ Database table `conversations` created
✅ Edge Function `avatar-conversations` deployed
✅ Edge Function `avatar-config` deployed
✅ Edge Function `avatar-chat` deployed (optional, we'll build manually)
✅ API Key created in AvatarLab dashboard

---

## 🔧 Step-by-Step Workflow Setup

### Workflow Overview

```
1. WhatsApp Trigger (when message received)
   ↓
2. Get Previous Conversation (HTTP GET)
   ↓
3. Get Avatar Config (HTTP GET - prompt, memories, knowledge)
   ↓
4. Build Complete Context (Code Node - combine everything)
   ↓
5. Call OpenAI (OpenAI Chat Node)
   ↓
6. Update Conversation (Code Node - append new exchange)
   ↓
7. Save to Database (HTTP POST)
   ↓
8. Send WhatsApp Reply
```

---

## 📱 Node 1: WhatsApp Trigger

**Node Type:** Webhook or WhatsApp Business Trigger

**What it receives:**
```json
{
  "body": {
    "from": "+60123456789",
    "message": "Hey! How are you?",
    "name": "John"
  }
}
```

---

## 🔵 Node 2: Get Previous Conversation

**Node Type:** HTTP Request
**Node Name:** `Get Conversation`

### Settings:

```
Method: GET

URL:
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Query Parameters:
┌──────────────┬──────────────────────────────────────────┐
│ Name         │ Value                                    │
├──────────────┼──────────────────────────────────────────┤
│ avatar_id    │ 9a567d58-cb5b-497d-869a-d6a8d61a8b4e     │
│ phone_number │ ={{ $json.body.from }}                   │
└──────────────┴──────────────────────────────────────────┘

Headers:
┌─────────────────┬──────────────────────────────────────────┐
│ Authorization   │ Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA │
│ x-api-key       │ pk_live_YOUR_API_KEY_HERE                │
│ Content-Type    │ application/json                         │
└─────────────────┴──────────────────────────────────────────┘

Response Format: JSON
```

**Response Example:**
```json
{
  "success": true,
  "has_history": true,
  "conversation": {
    "conversation_content": "user: hey | assistant: 你好呀 🌸"
  }
}
```

---

## 🔵 Node 3: Get Avatar Config

**Node Type:** HTTP Request
**Node Name:** `Get Avatar Config`

### Settings:

```
Method: GET

URL:
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config

Query Parameters:
┌──────────────┬──────────────────────────────────────────┐
│ Name         │ Value                                    │
├──────────────┼──────────────────────────────────────────┤
│ avatar_id    │ 9a567d58-cb5b-497d-869a-d6a8d61a8b4e     │
└──────────────┴──────────────────────────────────────────┘

Headers:
┌─────────────────┬──────────────────────────────────────────┐
│ Authorization   │ Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA │
│ x-api-key       │ pk_live_YOUR_API_KEY_HERE                │
│ Content-Type    │ application/json                         │
└─────────────────┴──────────────────────────────────────────┘

Response Format: JSON
```

**Response Example:**
```json
{
  "success": true,
  "active_prompt": {
    "system_prompt": "You are Nada, a friendly AI assistant..."
  },
  "knowledge_base": {
    "chunks": [...]
  },
  "memories": {
    "items": [...]
  }
}
```

---

## 💻 Node 4: Build Complete Context

**Node Type:** Code
**Node Name:** `Build Complete Context`

### Code:

```javascript
// Get data from previous nodes
const whatsappMsg = $('WhatsApp Trigger').first().json;
const previousConv = $('Get Conversation').first().json;
const avatarConfig = $('Get Avatar Config').first().json;

// Constants
const AVATAR_ID = '9a567d58-cb5b-497d-869a-d6a8d61a8b4e'; // Your avatar UUID

// Extract WhatsApp data
const phoneNumber = whatsappMsg.body.from;
const userName = whatsappMsg.body.name || 'User';
const userMessage = whatsappMsg.body.message;

// Build system prompt from avatar config
let systemPrompt = avatarConfig.active_prompt.system_prompt;

// Add previous conversation history
if (previousConv.has_history && previousConv.conversation) {
  systemPrompt += '\n\n=== PREVIOUS CONVERSATION ===\n';
  systemPrompt += previousConv.conversation.conversation_content;
  systemPrompt += '\n=== END PREVIOUS CONVERSATION ===\n\n';
  systemPrompt += 'Continue the conversation naturally based on the history above.';
}

// Add knowledge base chunks
if (avatarConfig.knowledge_base.chunks && avatarConfig.knowledge_base.chunks.length > 0) {
  systemPrompt += '\n\n=== KNOWLEDGE BASE ===\n';
  avatarConfig.knowledge_base.chunks.forEach(chunk => {
    systemPrompt += `${chunk.content}\n\n`;
  });
  systemPrompt += '=== END KNOWLEDGE BASE ===\n';
}

// Add memories
if (avatarConfig.memories.items && avatarConfig.memories.items.length > 0) {
  systemPrompt += '\n\n=== YOUR MEMORIES ===\n';
  avatarConfig.memories.items.forEach(memory => {
    systemPrompt += `📅 ${memory.date} - ${memory.title}\n`;
    systemPrompt += `Summary: ${memory.summary}\n`;

    if (memory.location) {
      systemPrompt += `Location: ${memory.location}\n`;
    }

    if (memory.food_items && memory.food_items.length > 0) {
      systemPrompt += `Food: ${memory.food_items.join(', ')}\n`;
    }

    if (memory.conversational_hooks && memory.conversational_hooks.length > 0) {
      systemPrompt += `Reference naturally: "${memory.conversational_hooks[0]}"\n`;
    }

    systemPrompt += '\n';
  });
  systemPrompt += '=== END MEMORIES ===\n\n';
  systemPrompt += 'Use these memories naturally in conversation when relevant.';
}

// Build messages array for OpenAI
const messages = [
  {
    role: 'system',
    content: systemPrompt
  },
  {
    role: 'user',
    content: userMessage
  }
];

// Return everything needed for next nodes
return {
  avatar_id: AVATAR_ID,
  phone_number: phoneNumber,
  user_name: userName,
  user_message: userMessage,
  messages: messages,
  previous_conversation: previousConv.has_history ? previousConv.conversation.conversation_content : ''
};
```

---

## 🤖 Node 5: Call OpenAI

**Node Type:** OpenAI Chat Model
**Node Name:** `Call OpenAI`

### Settings:

```
Model: gpt-4o-mini

Messages:
={{ $json.messages }}

Temperature: 0.7

Max Tokens: 500
```

**Response Example:**
```json
{
  "message": {
    "role": "assistant",
    "content": "你好呀！我很好，谢谢！✨ 你呢？"
  }
}
```

---

## 💻 Node 6: Update Conversation

**Node Type:** Code
**Node Name:** `Update Conversation`

### Code:

```javascript
// Get data from previous nodes
const context = $('Build Complete Context').first().json;
const aiReply = $('Call OpenAI').first().json;

// Extract data
const avatarId = context.avatar_id;
const phoneNumber = context.phone_number;
const userMessage = context.user_message;
const previousConversation = context.previous_conversation;

// Get AI response
const aiResponse = aiReply.message.content;

// Format new exchange
const newExchange = `user: ${userMessage} | assistant: ${aiResponse}`;

// Build updated conversation
let updatedConversation = '';

if (previousConversation && previousConversation.length > 0) {
  // Append to existing conversation with separator
  updatedConversation = previousConversation + ' || ' + newExchange;
} else {
  // First conversation
  updatedConversation = newExchange;
}

// Return data for saving to database
return {
  avatar_id: avatarId,
  phone_number: phoneNumber,
  conversation_content: updatedConversation,
  ai_response: aiResponse // For WhatsApp reply
};
```

---

## 🔴 Node 7: Save to Database

**Node Type:** HTTP Request
**Node Name:** `Save Conversation`

### Settings:

```
Method: POST

URL:
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations

Headers:
┌─────────────────┬──────────────────────────────────────────┐
│ Authorization   │ Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA │
│ x-api-key       │ pk_live_YOUR_API_KEY_HERE                │
│ Content-Type    │ application/json                         │
└─────────────────┴──────────────────────────────────────────┘

Body Content Type: JSON

Body:
{
  "avatar_id": "={{ $json.avatar_id }}",
  "phone_number": "={{ $json.phone_number }}",
  "conversation_content": "={{ $json.conversation_content }}"
}

Response Format: JSON
```

---

## 📱 Node 8: Send WhatsApp Reply

**Node Type:** WhatsApp Business Send Message
**Node Name:** `Send WhatsApp Reply`

### Settings:

```
To: ={{ $('Update Conversation').first().json.phone_number }}

Message: ={{ $('Update Conversation').first().json.ai_response }}
```

---

## 🎯 Complete Workflow Visual

```
┌─────────────────────┐
│ WhatsApp Trigger    │
│ Message received    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Get Conversation    │ ← GET /avatar-conversations
│ (HTTP GET)          │   ?avatar_id=xxx&phone_number=xxx
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Get Avatar Config   │ ← GET /avatar-config
│ (HTTP GET)          │   ?avatar_id=xxx
│ - Prompt            │
│ - Memories          │
│ - Knowledge Base    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Build Complete      │
│ Context (Code)      │ ← Combine:
│                     │   - Previous conversation
│                     │   - Avatar prompt
│                     │   - Memories
│                     │   - Knowledge base
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Call OpenAI         │ ← Send complete context
│ (OpenAI Node)       │   Get AI response
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Update Conversation │
│ (Code)              │ ← Append:
│                     │   "user: msg | assistant: reply"
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Save Conversation   │ ← POST /avatar-conversations
│ (HTTP POST)         │   Save updated conversation
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Send WhatsApp Reply │
│ (WhatsApp Node)     │
└─────────────────────┘
```

---

## ✅ Testing Checklist

### 1. Test GET Conversation (First Time)
- [ ] Send test message to WhatsApp
- [ ] Check n8n execution: "has_history" should be `false`
- [ ] Verify conversation continues without errors

### 2. Test Conversation Memory
- [ ] Send: "Hey!"
- [ ] AI responds: "你好呀 🌸"
- [ ] Check database: Should see `"user: Hey! | assistant: 你好呀 🌸"`
- [ ] Send: "How are you?"
- [ ] Check database: Should append with ` || user: How are you? | assistant: ...`

### 3. Test Memory Integration
- [ ] Create a memory (e.g., Japanese dinner)
- [ ] Send: "Remember that Japanese dinner?"
- [ ] AI should reference the memory with details

### 4. Test Knowledge Base
- [ ] Upload a PDF to knowledge base
- [ ] Process it
- [ ] Ask question about PDF content
- [ ] AI should use knowledge chunks

---

## 🔑 Important Variables to Replace

```javascript
// In all nodes, replace these:

AVATAR_ID = '9a567d58-cb5b-497d-869a-d6a8d61a8b4e'  // Your avatar UUID

SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Your Supabase anon key

API_KEY = 'pk_live_YOUR_API_KEY'  // Your AvatarLab API key
```

---

## 📊 Example Conversation Flow

**Message 1:**
```
User: "hey"
AI: "你好呀 🌸 很高兴见到你！"

Database:
"user: hey | assistant: 你好呀 🌸 很高兴见到你！"
```

**Message 2:**
```
User: "how are you"
AI: "我很好，谢谢！✨ 你呢？"

Database:
"user: hey | assistant: 你好呀 🌸 很高兴见到你！ || user: how are you | assistant: 我很好，谢谢！✨ 你呢？"
```

**Message 3 (with memory):**
```
User: "remember that japanese dinner?"
AI: "Of course! 还记得那个日本餐厅吗？我们吃了很多拉面和饺子！🍜 Shiro Chashu Ramen 特别好吃！"

Database:
"user: hey | assistant: 你好呀 🌸 || user: how are you | assistant: 我很好，谢谢！✨ || user: remember that japanese dinner? | assistant: Of course! 还记得那个日本餐厅吗..."
```

---

## 🎉 Done!

Your AI Agent now:
- ✅ Remembers all previous conversations
- ✅ Uses memories naturally
- ✅ References knowledge base
- ✅ Maintains context across messages
- ✅ Works perfectly with WhatsApp!

**Next Steps:**
1. Copy workflow to n8n
2. Replace avatar_id and API keys
3. Test with WhatsApp
4. Enjoy smart conversations! 🚀
