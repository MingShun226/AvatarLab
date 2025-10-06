# 🚀 Complete n8n Integration Guide - AvatarLab WhatsApp Chatbot

## 📋 Overview

This guide provides everything you need to set up a fully functional WhatsApp chatbot that:
- ✅ Remembers all previous conversations
- ✅ Uses your avatar's personality and system prompt
- ✅ References memories naturally in conversation
- ✅ Answers questions from your knowledge base (PDFs)
- ✅ Maintains context across multiple messages

---

## 🔑 Prerequisites

Before starting, ensure you have:

1. **API Key**: Generated from AvatarLab Dashboard → API Keys section
2. **Avatar ID**: Your avatar UUID (e.g., `9a567d58-cb5b-497d-869a-d6a8d61a8b4e`)
3. **n8n Instance**: Running and accessible
4. **WhatsApp Business API**: Connected to n8n

**Important Constants:**
```javascript
SUPABASE_URL = 'https://xatrtqdgghanwdujyhkq.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA'
YOUR_API_KEY = 'pk_live_xxxxxxxxxxxxx' // Get from dashboard
YOUR_AVATAR_ID = '9a567d58-cb5b-497d-869a-d6a8d61a8b4e' // Your avatar UUID
```

---

## 📊 Complete Workflow Structure

```
1. When chat message received (WhatsApp Trigger)
   ↓
2. Code5 - Media URL Processor
   ↓
3. If - Check if audio message
   ↓
4. Get Audio (if audio) → Transcribe → Format Output
   ↓
5. Message Processor (Code)
   ↓
6. Get Conversation Memory (HTTP GET)
   ↓
7. Conversation Summarizer (Code)
   ↓
8. get_config (HTTP GET - avatar config)
   ↓
9. 🆕 Build Complete Context (Code) ← NEW NODE
   ↓
10. AI Agent (OpenAI/Claude)
   ↓
11. 🆕 Format Conversation for Storage (Code) ← NEW NODE
   ↓
12. Store Conversation (HTTP POST)
   ↓
13. Final Response (WhatsApp Send)
```

---

## 🔧 Node Configurations

### Node 6: Get Conversation Memory

**Type**: HTTP Request
**Method**: GET

**URL**:
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations
```

**Query Parameters**:
| Name | Value |
|------|-------|
| avatar_id | `9a567d58-cb5b-497d-869a-d6a8d61a8b4e` |
| phone_number | `={{ $('Message Processor').item.json.phone }}` |

**Headers**:
| Name | Value |
|------|-------|
| Authorization | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA` |
| x-api-key | `pk_live_YOUR_API_KEY` |
| Content-Type | `application/json` |

**Response Format**: JSON

---

### Node 8: get_config

**Type**: HTTP Request
**Method**: GET

**URL**:
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config
```

**Query Parameters**:
| Name | Value |
|------|-------|
| avatar_id | `9a567d58-cb5b-497d-869a-d6a8d61a8b4e` |

**Headers**:
| Name | Value |
|------|-------|
| Authorization | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA` |
| x-api-key | `pk_live_YOUR_API_KEY` |
| Content-Type | `application/json` |

**Response Format**: JSON

---

### 🆕 Node 9: Build Complete Context

**Type**: Code
**Language**: JavaScript

**Purpose**: Combines system prompt + conversation history + memories + knowledge base into one comprehensive context for the AI Agent.

**Code**:
```javascript
// Build Complete Context for AI Agent
// Combines: System Prompt + Conversation History + Memories + Knowledge Base

const avatarConfig = $('get_config').first().json;
const conversationSummary = $('Conversation Summarizer').first().json;
const messageProcessor = $('Message Processor').first().json;

// Start with base system prompt
let fullSystemPrompt = avatarConfig.active_prompt.system_prompt || 'You are a helpful AI assistant.';

// Add avatar personality details
if (avatarConfig.avatar) {
  fullSystemPrompt += '\n\n=== YOUR IDENTITY ===\n';
  fullSystemPrompt += `Name: ${avatarConfig.avatar.name}\n`;
  if (avatarConfig.avatar.description) {
    fullSystemPrompt += `Description: ${avatarConfig.avatar.description}\n`;
  }
  if (avatarConfig.avatar.personality_traits && avatarConfig.avatar.personality_traits.length > 0) {
    fullSystemPrompt += `Personality: ${avatarConfig.avatar.personality_traits.join(', ')}\n`;
  }
}

// Add conversation history
if (conversationSummary.conversationHistory && conversationSummary.conversationHistory.length > 0) {
  fullSystemPrompt += '\n\n=== PREVIOUS CONVERSATION HISTORY ===\n';
  fullSystemPrompt += 'This is your conversation history with this user. Reference it naturally:\n\n';

  conversationSummary.conversationHistory.forEach((conv, index) => {
    fullSystemPrompt += `${conv.text}\n`;
    if (index < conversationSummary.conversationHistory.length - 1) {
      fullSystemPrompt += ' || ';
    }
  });

  fullSystemPrompt += '\n\n=== END CONVERSATION HISTORY ===\n';
  fullSystemPrompt += 'Continue the conversation naturally based on this history. Maintain context and consistency.\n';
}

// Add knowledge base chunks
if (avatarConfig.knowledge_base && avatarConfig.knowledge_base.chunks && avatarConfig.knowledge_base.chunks.length > 0) {
  fullSystemPrompt += '\n\n=== KNOWLEDGE BASE ===\n';
  fullSystemPrompt += 'You have access to the following information. Use it to answer questions accurately:\n\n';

  avatarConfig.knowledge_base.chunks.forEach((chunk, index) => {
    if (chunk.section_title) {
      fullSystemPrompt += `\n[Section: ${chunk.section_title}`;
      if (chunk.page_number) {
        fullSystemPrompt += ` - Page ${chunk.page_number}`;
      }
      fullSystemPrompt += ']\n';
    }
    fullSystemPrompt += `${chunk.content}\n\n`;
  });

  fullSystemPrompt += '=== END KNOWLEDGE BASE ===\n';
  fullSystemPrompt += 'Use this knowledge base to provide accurate, specific answers.\n';
}

// Add memories
if (avatarConfig.memories && avatarConfig.memories.items && avatarConfig.memories.items.length > 0) {
  fullSystemPrompt += '\n\n=== YOUR MEMORIES ===\n';
  fullSystemPrompt += 'You have these memories about past experiences. Reference them naturally in conversation:\n\n';

  avatarConfig.memories.items.forEach((memory, index) => {
    fullSystemPrompt += `📅 ${memory.date} - ${memory.title}\n`;
    fullSystemPrompt += `Summary: ${memory.summary}\n`;

    if (memory.location) {
      fullSystemPrompt += `Location: ${memory.location}\n`;
    }

    if (memory.food_items && memory.food_items.length > 0) {
      fullSystemPrompt += `Food/Drinks: ${memory.food_items.join(', ')}\n`;
    }

    if (memory.activities && memory.activities.length > 0) {
      fullSystemPrompt += `Activities: ${memory.activities.join(', ')}\n`;
    }

    if (memory.people_present && memory.people_present.length > 0) {
      fullSystemPrompt += `People: ${memory.people_present.join(', ')}\n`;
    }

    if (memory.conversational_hooks && memory.conversational_hooks.length > 0) {
      fullSystemPrompt += `How to reference: "${memory.conversational_hooks[0]}"\n`;
    }

    fullSystemPrompt += '\n';
  });

  fullSystemPrompt += '=== END MEMORIES ===\n';
  fullSystemPrompt += 'Bring up these memories naturally when the conversation is relevant. Don\'t force them.\n';
}

// Add current context
fullSystemPrompt += '\n\n=== CURRENT CONVERSATION ===\n';
fullSystemPrompt += `User phone: ${conversationSummary.phone || 'Unknown'}\n`;
fullSystemPrompt += `Current message: ${conversationSummary.currentMessage}\n`;
fullSystemPrompt += '=== RESPOND NATURALLY ===\n';

// Return everything needed for AI Agent
return {
  json: {
    fullSystemPrompt: fullSystemPrompt,
    userMessage: conversationSummary.currentMessage,
    userPhone: conversationSummary.phone,

    // Context stats for debugging
    contextStats: {
      hasConversationHistory: conversationSummary.conversationHistory?.length > 0,
      conversationCount: conversationSummary.conversationHistory?.length || 0,
      hasKnowledgeBase: avatarConfig.knowledge_base?.chunks?.length > 0,
      knowledgeChunks: avatarConfig.knowledge_base?.chunks?.length || 0,
      hasMemories: avatarConfig.memories?.items?.length > 0,
      memoriesCount: avatarConfig.memories?.items?.length || 0
    },

    // For storing conversation later
    avatarId: '9a567d58-cb5b-497d-869a-d6a8d61a8b4e',
    phone: conversationSummary.phone
  }
};
```

---

### Node 10: AI Agent

**Type**: AI Agent (OpenAI Chat Model / Claude)

**UPDATED Settings**:

**OLD Settings** (WRONG):
```
Text: ={{ $('Conversation Summarizer').item.json.currentMessage }}
System Message: ={{ $json.active_prompt.system_prompt }}
```

**NEW Settings** (CORRECT):
```
Text: ={{ $('Build Complete Context').item.json.userMessage }}
System Message: ={{ $('Build Complete Context').item.json.fullSystemPrompt }}
```

**Model**: `gpt-4o-mini` or `claude-3-5-sonnet-20241022`
**Temperature**: `0.7`
**Max Tokens**: `500`

---

### 🆕 Node 11: Format Conversation for Storage

**Type**: Code
**Language**: JavaScript

**Purpose**: Formats the conversation exchange properly for database storage in the simple transcript format.

**Code**:
```javascript
// Format conversation for storage
const context = $('Build Complete Context').first().json;
const aiResponse = $('AI Agent').first().json;
const conversationSummary = $('Conversation Summarizer').first().json;

// Get user message and AI response
const userMessage = context.userMessage;
const assistantMessage = aiResponse.output || aiResponse.text || aiResponse.response || '';

// Get previous conversation history
const previousHistory = conversationSummary.conversationHistory || [];

// Build new exchange
const newExchange = `user: ${userMessage} | assistant: ${assistantMessage}`;

// Build complete conversation content
let conversationContent = '';

// Get previous conversations (excluding current message)
const pastConversations = previousHistory.filter((conv, index) =>
  index < previousHistory.length - 1 // Exclude the last one (current user message)
);

if (pastConversations.length > 0) {
  conversationContent = pastConversations.map(conv => conv.text).join(' || ');
  conversationContent += ' || ' + newExchange;
} else {
  conversationContent = newExchange;
}

// Return data for Store Conversation node
return {
  json: {
    avatar_id: context.avatarId,
    phone_number: context.phone,
    conversation_content: conversationContent,
    ai_response: assistantMessage // For Final Response
  }
};
```

---

### Node 12: Store Conversation

**Type**: HTTP Request
**Method**: POST

**URL**:
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations
```

**Headers**:
| Name | Value |
|------|-------|
| Authorization | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA` |
| x-api-key | `pk_live_YOUR_API_KEY` |
| Content-Type | `application/json` |

**Body Content Type**: JSON

**UPDATED Body** (use dynamic values):

**OLD Body** (WRONG):
```json
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "+60123456789",
  "conversation_content": "user: hey | assistant: hello || user: how are you | assistant: great!"
}
```

**NEW Body** (CORRECT):
```json
{
  "avatar_id": "={{ $('Format Conversation for Storage').item.json.avatar_id }}",
  "phone_number": "={{ $('Format Conversation for Storage').item.json.phone_number }}",
  "conversation_content": "={{ $('Format Conversation for Storage').item.json.conversation_content }}"
}
```

**Response Format**: JSON

---

### Node 13: Final Response

**Type**: WhatsApp Business Send Message

**Settings**:
```
To: ={{ $('Format Conversation for Storage').item.json.phone_number }}
Message: ={{ $('Format Conversation for Storage').item.json.ai_response }}
```

---

## 🎯 What Changed?

### Before (Limited Context):
```
AI Agent receives:
✅ System prompt only
❌ No conversation history
❌ No memories
❌ No knowledge base
```

### After (Full Context):
```
AI Agent receives:
✅ System prompt
✅ Full conversation history
✅ All memories (with food, locations, people, hooks)
✅ All knowledge base chunks (with page numbers)
✅ Avatar personality and identity
```

---

## 📊 Example System Prompt Output

When you build the complete context, your AI Agent will receive something like this:

```
You are Nada, a friendly AI assistant for a wellness center...

=== YOUR IDENTITY ===
Name: Nada
Description: Friendly wellness center assistant
Personality: friendly, helpful, professional

=== PREVIOUS CONVERSATION HISTORY ===
This is your conversation history with this user. Reference it naturally:

user: hey | assistant: 你好呀 🌸 很高兴见到你！ || user: how are you | assistant: 我很好，谢谢！✨

=== END CONVERSATION HISTORY ===
Continue the conversation naturally based on this history. Maintain context and consistency.

=== KNOWLEDGE BASE ===
You have access to the following information. Use it to answer questions accurately:

[Section: Services - Page 1]
Our wellness center offers massage therapy, spa treatments, and holistic healing...

[Section: Pricing - Page 2]
Standard massage: $80/hour
Premium spa package: $150/session

=== END KNOWLEDGE BASE ===
Use this knowledge base to provide accurate, specific answers.

=== YOUR MEMORIES ===
You have these memories about past experiences. Reference them naturally in conversation:

📅 2025-10-06 - Dinner at Japanese Restaurant
Summary: Had amazing ramen and gyoza with the user
Location: Japanese restaurant
Food/Drinks: Shiro Chashu Ramen, Deep Fried Gyoza, Refillable Green Tea
Activities: Trying new foods, chatting
People: Just us two
How to reference: "Remember that big dinner at the Japanese place?"

=== END MEMORIES ===
Bring up these memories naturally when the conversation is relevant. Don't force them.

=== CURRENT CONVERSATION ===
User phone: +60123456789
Current message: remember that Japanese dinner?
=== RESPOND NATURALLY ===
```

---

## 🧪 Testing Your Workflow

### Test 1: First Conversation
**Send**: "Hey!"
**Expected**: AI responds with greeting
**Check**: Database should have `"user: Hey! | assistant: [greeting]"`

### Test 2: Conversation Memory
**Send**: "How are you?"
**Expected**: AI responds naturally, remembering previous message
**Check**: Database should have `"user: Hey! | assistant: [greeting] || user: How are you? | assistant: [response]"`

### Test 3: Memory Reference
**Send**: "Remember that Japanese dinner?"
**Expected**: AI mentions Shiro Chashu Ramen, gyoza, green tea, location
**Check**: Response includes specific details from memory

### Test 4: Knowledge Base
**Upload PDF** → Process it in dashboard
**Send**: "What services do you offer?"
**Expected**: AI answers using knowledge base content with specific details

---

## 🔍 Debugging

### Check Context Stats
The "Build Complete Context" node returns `contextStats` for debugging:

```json
{
  "contextStats": {
    "hasConversationHistory": true,
    "conversationCount": 3,
    "hasKnowledgeBase": true,
    "knowledgeChunks": 5,
    "hasMemories": true,
    "memoriesCount": 1
  }
}
```

### Common Issues

**Issue**: AI doesn't remember previous messages
**Solution**: Check "Get Conversation Memory" node returns `has_history: true`

**Issue**: AI doesn't use knowledge base
**Solution**: Process PDFs in dashboard first (Knowledge Base section)

**Issue**: AI doesn't reference memories
**Solution**: Verify memories exist in dashboard and have conversational_hooks

**Issue**: Conversation not saving
**Solution**: Check "Format Conversation for Storage" node outputs correct format

---

## ✅ Implementation Checklist

- [ ] Replace `YOUR_API_KEY` with your actual API key
- [ ] Replace `YOUR_AVATAR_ID` with your avatar UUID
- [ ] Add "Build Complete Context" Code node (Node 9)
- [ ] Update AI Agent settings to use new context
- [ ] Add "Format Conversation for Storage" Code node (Node 11)
- [ ] Update Store Conversation body to use dynamic values
- [ ] Test first conversation (should save to database)
- [ ] Test conversation memory (should append with ||)
- [ ] Add memories in dashboard
- [ ] Test memory references in chat
- [ ] Upload and process PDF
- [ ] Test knowledge base questions

---

## 🎉 Result

Your AI Agent will now:
- ✅ Remember all previous conversations
- ✅ Use knowledge base to answer questions accurately
- ✅ Reference memories naturally when relevant
- ✅ Maintain personality and context
- ✅ Store updated conversations in database
- ✅ Provide intelligent, context-aware responses

**Perfect intelligent conversations!** 🚀
