# 🔍 Debug: POST Error - Missing Fields

## ❌ Error Message
```
Bad request - please check your parameters
Missing required fields: avatar_id, phone_number, user_message, assistant_message
```

---

## 🔎 Root Cause

The Edge Function is expecting these 4 fields:
```json
{
  "avatar_id": "...",
  "phone_number": "...",
  "user_message": "...",
  "assistant_message": "..."
}
```

But the n8n node is likely sending the **old format**:
```json
{
  "avatar_id": "...",
  "phone_number": "...",
  "conversation_content": "..."  ❌ OLD FORMAT
}
```

---

## ✅ Fix: Update n8n "Store Conversation" Node

### Step 1: Check "Format Conversation for Storage" Code Node

Make sure this Code node (Node 11) outputs the correct fields:

```javascript
// Format Conversation for Storage - Individual Message
const context = $('Build Complete Context').first().json;
const aiResponse = $('AI Agent').first().json;

// Get user message and AI response
const userMessage = context.userMessage;
const assistantMessage = aiResponse.output || aiResponse.text || aiResponse.response || '';

// Return data for POST request
return {
  json: {
    avatar_id: context.avatarId,
    phone_number: context.phone,
    user_message: userMessage,        // ✅ NEW
    assistant_message: assistantMessage, // ✅ NEW
    ai_response: assistantMessage // For WhatsApp reply
  }
};
```

**IMPORTANT**: Make sure you're using `user_message` and `assistant_message` (with underscore), NOT `userMessage` or `assistantMessage`.

---

### Step 2: Update "Store Conversation" HTTP Request Body

In the **Store Conversation** node (Node 12), update the Body:

**Method:** POST

**Body Content Type:** JSON

**Body:**
```json
{
  "avatar_id": "={{ $('Format Conversation for Storage').item.json.avatar_id }}",
  "phone_number": "={{ $('Format Conversation for Storage').item.json.phone_number }}",
  "user_message": "={{ $('Format Conversation for Storage').item.json.user_message }}",
  "assistant_message": "={{ $('Format Conversation for Storage').item.json.assistant_message }}"
}
```

---

## 🧪 Test with curl

To verify the Edge Function works, test with curl:

```bash
curl -X POST "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA" \
  -H "x-api-key: pk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
    "phone_number": "60165230268",
    "user_message": "Hello test",
    "assistant_message": "Hi there! This is a test response."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Message saved successfully",
  "data": {
    "id": "...",
    "text": "user: Hello test | assistant: Hi there! This is a test response.",
    "order": 1,
    "timestamp": "2025-10-06T..."
  }
}
```

---

## 🔍 Debug n8n Workflow

### Method 1: Check Node Output

1. In n8n, click on **"Format Conversation for Storage"** node
2. Click **"Execute Node"**
3. Check the output - it should show:
```json
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "phone_number": "60165230268",
  "user_message": "your message here",    ✅
  "assistant_message": "AI response here", ✅
  "ai_response": "AI response here"
}
```

If it shows `conversation_content` instead, the Code node wasn't updated.

---

### Method 2: Check AI Agent Output

The issue might also be in how you're extracting the AI response. Try different variations:

```javascript
// Try different fields depending on your AI Agent node type
const aiResponse = $('AI Agent').first().json;

// For OpenAI Chat Model:
const assistantMessage = aiResponse.message?.content || aiResponse.output || aiResponse.text || '';

// For Claude:
const assistantMessage = aiResponse.content || aiResponse.output || aiResponse.text || '';

// Debug: Log what fields are available
console.log('AI Response fields:', Object.keys(aiResponse));
```

---

## 📊 Complete Updated Workflow

Here's the complete flow with correct field names:

### Node 11: Format Conversation for Storage

```javascript
// Format Conversation for Storage
const context = $('Build Complete Context').first().json;
const aiResponseNode = $('AI Agent').first().json;

// Extract user message
const userMessage = context.userMessage;

// Extract AI response (try multiple fields)
let assistantMessage = '';

if (aiResponseNode.message && aiResponseNode.message.content) {
  // OpenAI format
  assistantMessage = aiResponseNode.message.content;
} else if (aiResponseNode.output) {
  assistantMessage = aiResponseNode.output;
} else if (aiResponseNode.text) {
  assistantMessage = aiResponseNode.text;
} else if (aiResponseNode.content) {
  assistantMessage = aiResponseNode.content;
} else {
  // Fallback: stringify the whole response
  assistantMessage = JSON.stringify(aiResponseNode);
}

// Return with correct field names
return {
  json: {
    avatar_id: context.avatarId,
    phone_number: context.phone,
    user_message: userMessage,
    assistant_message: assistantMessage,
    ai_response: assistantMessage
  }
};
```

### Node 12: Store Conversation (HTTP POST)

**URL:**
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-conversations
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA

x-api-key: pk_live_YOUR_KEY

Content-Type: application/json
```

**Body (JSON):**
```json
{
  "avatar_id": "={{ $json.avatar_id }}",
  "phone_number": "={{ $json.phone_number }}",
  "user_message": "={{ $json.user_message }}",
  "assistant_message": "={{ $json.assistant_message }}"
}
```

**OR** (if using explicit node reference):
```json
{
  "avatar_id": "={{ $('Format Conversation for Storage').item.json.avatar_id }}",
  "phone_number": "={{ $('Format Conversation for Storage').item.json.phone_number }}",
  "user_message": "={{ $('Format Conversation for Storage').item.json.user_message }}",
  "assistant_message": "={{ $('Format Conversation for Storage').item.json.assistant_message }}"
}
```

---

## ✅ Checklist

- [ ] Updated "Format Conversation for Storage" Code node with new field names
- [ ] Updated "Store Conversation" HTTP POST body to use 4 new fields
- [ ] Removed `conversation_content` field completely
- [ ] Tested "Format Conversation for Storage" node output shows correct fields
- [ ] Tested with curl command (optional)
- [ ] Sent WhatsApp message and verified it saves to database

---

## 🎯 Expected Database Result

After successful POST, check your `conversations` table:

| id | avatar_id | phone_number | text | message_order | timestamp |
|----|-----------|--------------|------|---------------|-----------|
| ... | 9a567d... | 60165230268 | user: Hello test \| assistant: Hi there! This is a test response. | 1 | 2025-10-06T... |

---

## 💡 Quick Fix Summary

**Old Body (Wrong):**
```json
{
  "avatar_id": "...",
  "phone_number": "...",
  "conversation_content": "user: hey | assistant: hi"  ❌
}
```

**New Body (Correct):**
```json
{
  "avatar_id": "...",
  "phone_number": "...",
  "user_message": "hey",           ✅
  "assistant_message": "hi"        ✅
}
```

The Edge Function will automatically format it as `"user: hey | assistant: hi"` when storing in the database.
