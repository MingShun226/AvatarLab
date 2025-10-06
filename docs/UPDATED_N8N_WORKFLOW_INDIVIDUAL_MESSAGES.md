# 🔄 Updated n8n Workflow - Individual Message Storage

## 📋 What Changed?

### Old System (Concatenated Text):
- Stored entire conversation as one text string
- Format: `"user: hey | assistant: hi || user: how are you | assistant: great"`
- One row per conversation thread
- Had to parse and rebuild the entire string

### New System (Individual Messages):
- Each message exchange stored as separate row
- Format per row: `"user: hey | assistant: hi"`
- Includes timestamp and order number
- Easy to retrieve latest N messages

---

## 🆕 Updated Database Schema

**Run this migration first:**

```sql
-- supabase/migrations/20251006000001_update_conversations_individual_messages.sql

DROP TABLE IF EXISTS public.conversations CASCADE;

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  phone_number VARCHAR(15) NOT NULL,
  text TEXT NOT NULL,
  message_order INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

CREATE INDEX idx_conversations_avatar_phone_order
ON public.conversations USING btree (avatar_id, phone_number, message_order DESC);

CREATE INDEX idx_conversations_avatar_phone_timestamp
ON public.conversations USING btree (avatar_id, phone_number, timestamp DESC);

CREATE UNIQUE INDEX idx_conversations_avatar_phone_order_unique
ON public.conversations USING btree (avatar_id, phone_number, message_order);
```

---

## 📊 Example Data

### Database Table:
| id | avatar_id | phone_number | text | message_order | timestamp |
|----|-----------|--------------|------|---------------|-----------|
| ... | 9a567... | 60165230268 | user: 有没有人气推荐 \| assistant: 可以的 🌸 ... | 1 | 2025-09-22T13:55:53 |
| ... | 9a567... | 60165230268 | user: 问一下怎么预约 \| assistant: 预约非常简单 🌸 ... | 2 | 2025-09-22T13:56:55 |
| ... | 9a567... | 60165230268 | user: halo \| assistant: 你好 🌸 ... | 3 | 2025-10-01T12:34:15 |

---

## 🔄 Updated Edge Function

The Edge Function now:
- **GET**: Returns latest N messages as array (default 30)
- **POST**: Saves individual message with auto-incrementing order

### GET Response Format:
```json
{
  "phone": "60165230268",
  "conversationHistory": [
    {
      "text": "user: 有没有人气推荐 | assistant: 可以的 🌸 || ...",
      "timestamp": "2025-09-22T13:55:53.502117+00:00",
      "order": 1
    },
    {
      "text": "user: 问一下怎么预约 | assistant: 预约非常简单 🌸 || ...",
      "timestamp": "2025-09-22T13:56:55.154841+00:00",
      "order": 2
    }
  ],
  "totalConversations": 11,
  "currentMessage": ""
}
```

### POST Request Format:
```json
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "60165230268",
  "user_message": "can you speak in English",
  "assistant_message": "Of course! I can speak in English from now on 🌸"
}
```

---

## 🔧 Updated n8n Nodes

### Node 6: Get Conversation Memory

**No changes needed** - Still uses GET request with same parameters

**URL:**
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations
```

**Query Parameters:**
| Name | Value |
|------|-------|
| avatar_id | `9a567d58-cb5b-497d-869a-d6a8d61a8b4e` |
| phone_number | `={{ $('Message Processor').item.json.phone }}` |
| limit | `30` |

**Response now includes array of messages instead of single concatenated string**

---

### 🆕 Node 7: Conversation Summarizer (UPDATED CODE)

**Type:** Code
**Name:** Conversation Summarizer

**NEW Code:**
```javascript
// Conversation Summarizer - Updated for Individual Messages
const messageProcessor = $('Message Processor').first().json;
const conversationData = $('Get Conversation Memory').first().json;

// Extract current message
const currentMessage = messageProcessor.currentMessage || '';
const phone = messageProcessor.phone || '';

// Get conversation history array
const conversationHistory = conversationData.conversationHistory || [];

// Add current user message to history for context
const currentMessageObj = {
  text: `user: ${currentMessage}`,
  timestamp: new Date().toISOString(),
  order: conversationHistory.length + 1
};

// Combine existing history + current message
const fullHistory = [...conversationHistory, currentMessageObj];

// Return formatted data
return {
  json: {
    phone: phone,
    currentMessage: currentMessage,
    conversationHistory: fullHistory,
    totalConversations: fullHistory.length
  }
};
```

---

### 🆕 Node 11: Format Conversation for Storage (UPDATED CODE)

**Type:** Code
**Name:** Format Conversation for Storage

**NEW Code:**
```javascript
// Format Conversation for Storage - Individual Message
const context = $('Build Complete Context').first().json;
const aiResponse = $('AI Agent').first().json;

// Get user message and AI response
const userMessage = context.userMessage;
const assistantMessage = aiResponse.output || aiResponse.text || aiResponse.response || '';

// Return data for POST request - NO MORE CONCATENATION
return {
  json: {
    avatar_id: context.avatarId,
    phone_number: context.phone,
    user_message: userMessage,
    assistant_message: assistantMessage,
    ai_response: assistantMessage // For WhatsApp reply
  }
};
```

---

### Node 12: Store Conversation (UPDATED BODY)

**Type:** HTTP Request
**Method:** POST

**URL:**
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations
```

**Headers:** (Same as before)
| Name | Value |
|------|-------|
| Authorization | `Bearer eyJhbGciOi...` |
| x-api-key | `pk_live_YOUR_API_KEY` |
| Content-Type | `application/json` |

**UPDATED Body:**
```json
{
  "avatar_id": "={{ $('Format Conversation for Storage').item.json.avatar_id }}",
  "phone_number": "="{{ $('Format Conversation for Storage').item.json.phone_number }}",
  "user_message": "={{ $('Format Conversation for Storage').item.json.user_message }}",
  "assistant_message": "={{ $('Format Conversation for Storage').item.json.assistant_message }}"
}
```

**OLD Body (Don't use):**
```json
{
  "avatar_id": "...",
  "phone_number": "...",
  "conversation_content": "..." ❌ REMOVED
}
```

---

## ✅ Benefits of New System

1. **Easy History Retrieval**: Get latest 30 messages with one query
2. **Timestamp Tracking**: Each message has exact timestamp
3. **Ordered Messages**: Sequential order numbers for sorting
4. **Scalable**: No need to parse/rebuild long text strings
5. **Flexible Limits**: Change `limit` parameter to get more/fewer messages
6. **Performance**: Indexed queries are faster
7. **Analytics Ready**: Easy to count messages, analyze patterns

---

## 🧪 Testing

### Test 1: First Message
**Send:** "Hello"

**Expected Database:**
| text | message_order | timestamp |
|------|---------------|-----------|
| user: Hello \| assistant: Hi there! 🌸 | 1 | 2025-10-06T... |

### Test 2: Second Message
**Send:** "How are you?"

**Expected Database:**
| text | message_order | timestamp |
|------|---------------|-----------|
| user: Hello \| assistant: Hi there! 🌸 | 1 | 2025-10-06T... |
| user: How are you? \| assistant: I'm great! ✨ | 2 | 2025-10-06T... |

### Test 3: GET Request
**Call:** `/avatar-conversations?avatar_id=xxx&phone_number=xxx&limit=30`

**Expected Response:**
```json
{
  "phone": "60165230268",
  "conversationHistory": [
    {
      "text": "user: Hello | assistant: Hi there! 🌸",
      "timestamp": "2025-10-06T...",
      "order": 1
    },
    {
      "text": "user: How are you? | assistant: I'm great! ✨",
      "timestamp": "2025-10-06T...",
      "order": 2
    }
  ],
  "totalConversations": 2,
  "currentMessage": ""
}
```

---

## 📝 Deployment Steps

1. **Run Migration:**
   - Paste `20251006000001_update_conversations_individual_messages.sql` into Supabase SQL Editor
   - This will drop old table and create new schema

2. **Deploy Updated Edge Function:**
   ```bash
   supabase functions deploy avatar-conversations
   ```

3. **Update n8n Workflow:**
   - Update "Conversation Summarizer" code (Node 7)
   - Update "Format Conversation for Storage" code (Node 11)
   - Update "Store Conversation" body (Node 12)

4. **Test:**
   - Send WhatsApp message
   - Check database for new row
   - Send another message
   - Verify conversation history includes both messages

---

## 🎯 Quick Reference

### GET Conversation History
```bash
curl -X GET "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations?avatar_id=9a567d58-cb5b-497d-869a-d6a8d61a8b4e&phone_number=60165230268&limit=30" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "x-api-key: pk_live_YOUR_KEY"
```

### POST New Message
```bash
curl -X POST "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "x-api-key: pk_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
    "phone_number": "60165230268",
    "user_message": "Hello",
    "assistant_message": "Hi there! 🌸"
  }'
```

---

## 🚀 Done!

Your conversation system now:
- ✅ Stores individual messages as separate rows
- ✅ Retrieves latest N messages (default 30)
- ✅ Includes timestamps and order numbers
- ✅ Auto-increments message order
- ✅ Faster queries with proper indexing
- ✅ Easier to manage and analyze

Perfect for WhatsApp chatbot integration! 🎉
