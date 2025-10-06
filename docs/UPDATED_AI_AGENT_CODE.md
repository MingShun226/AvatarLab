# 🔧 Updated AI Agent Code - Full Context Integration

## 🎯 Problem with Current Workflow

Your AI Agent only gets:
- ✅ System prompt from `active_prompt.system_prompt`
- ❌ NO conversation history context
- ❌ NO memories information
- ❌ NO knowledge base chunks

## ✅ Solution: New Code Node "Build Complete Context"

Add this Code node **BETWEEN** "get_config" and "AI Agent":

---

## 📝 New Code Node: "Build Complete Context"

**Node Name:** `Build Complete Context`
**Position:** Between `get_config` and `AI Agent`

### Code:

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

## 🔄 Updated Workflow Connections

### Current Flow:
```
get_config → AI Agent
```

### Updated Flow:
```
get_config → Build Complete Context → AI Agent
```

---

## 🔧 Update AI Agent Node

Change the **AI Agent** node settings:

**OLD Settings:**
```
Text: ={{ $('Conversation Summarizer').item.json.currentMessage }}
System Message: ={{ $json.active_prompt.system_prompt }}
```

**NEW Settings:**
```
Text: ={{ $('Build Complete Context').item.json.userMessage }}
System Message: ={{ $('Build Complete Context').item.json.fullSystemPrompt }}
```

---

## 📝 Update "Store Conversation" Node

Update the **conversation_content** parameter to build the proper format:

**Change this Code Node between AI Agent and Store Conversation:**

**New Node Name:** `Format Conversation for Storage`

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

## 🔧 Update "Store Conversation" Node Body

**Change the body parameters to use dynamic values:**

**OLD:**
```json
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "+60123456789",
  "conversation_content": "user: hey | assistant: hello || user: how are you | assistant: great!"
}
```

**NEW:**
```json
{
  "avatar_id": "={{ $json.avatar_id }}",
  "phone_number": "={{ $json.phone_number }}",
  "conversation_content": "={{ $json.conversation_content }}"
}
```

---

## ✅ Complete Updated Workflow

```
1. When chat message received
2. Code5 (media URL processor)
3. If (audio check)
4. Get Audio (if audio)
5. Transcribe a recording (if audio)
6. Format Output
7. Message Processor
8. Get Conversation Memory (GET request)
9. Conversation Summarizer
10. get_config (GET avatar config)
11. **Build Complete Context** ← NEW NODE
12. AI Agent (uses full context)
13. **Format Conversation for Storage** ← NEW NODE
14. Store Conversation (POST request)
15. Final Response
```

---

## 🎯 What Your AI Agent Now Gets:

✅ **System Prompt** - Avatar personality and instructions
✅ **Conversation History** - All previous messages with this user
✅ **Knowledge Base** - All PDF chunks with page numbers
✅ **Memories** - All memories with food, location, people, dates
✅ **Current Context** - User phone and current message

---

## 📊 Example System Prompt Output:

```
You are Nada, a friendly AI assistant for a wellness center...

=== YOUR IDENTITY ===
Name: Nada
Personality: friendly, helpful, professional

=== PREVIOUS CONVERSATION HISTORY ===
user: hey | assistant: 你好呀 🌸 很高兴见到你！ || user: how are you | assistant: 我很好，谢谢！✨

=== END CONVERSATION HISTORY ===
Continue the conversation naturally based on this history.

=== KNOWLEDGE BASE ===

[Section: Services - Page 1]
Our wellness center offers massage therapy, spa treatments, and holistic healing...

=== END KNOWLEDGE BASE ===

=== YOUR MEMORIES ===
📅 2025-10-06 - Dinner at Japanese Restaurant
Summary: Had amazing ramen and gyoza with the user
Location: Japanese restaurant
Food/Drinks: Shiro Chashu Ramen, Deep Fried Gyoza, Refillable Green Tea
How to reference: "Remember that big dinner at the Japanese place?"

=== END MEMORIES ===

=== CURRENT CONVERSATION ===
User phone: +60123456789
Current message: remember that Japanese dinner?
=== RESPOND NATURALLY ===
```

---

## 🚀 Result:

Your AI Agent will:
- Remember all previous conversations ✅
- Use knowledge base to answer questions accurately ✅
- Reference memories naturally ✅
- Maintain personality and context ✅
- Store updated conversations ✅

**Perfect intelligent conversations!** 🎉
