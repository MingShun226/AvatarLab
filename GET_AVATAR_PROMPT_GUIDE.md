# 🎯 Get Avatar Prompt - API Guide

## What This Does

The **`/avatar-prompt`** endpoint returns the **FULL enriched system prompt** that would be sent to OpenAI, **WITHOUT actually calling OpenAI**.

Perfect for:
- 🔍 Debugging prompts
- 📊 Analyzing context
- 🧪 Testing prompt versions
- 📝 Building custom integrations
- 🎨 Prompt engineering

---

## 🚀 Quick Start

### Deploy the Function

**Option A: Via CLI**
```powershell
supabase functions deploy avatar-prompt
```

**Option B: Via Dashboard**
1. Supabase → Edge Functions → Create Function
2. Name: `avatar-prompt`
3. Paste code from: `supabase/functions/avatar-prompt/index.ts`
4. Deploy

---

## 📋 API Reference

### Endpoint

```
POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-prompt
```

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer [supabase-anon-key]` | ✅ Yes |
| `x-api-key` | `pk_live_[your-key]` | ✅ Yes |
| `Content-Type` | `application/json` | ✅ Yes |

### Request Body

```json
{
  "avatar_id": "your-avatar-uuid",
  "user_query": "Hello!",           // Optional: see how RAG responds
  "include_rag": true,               // Optional: default true
  "include_memories": true           // Optional: default true
}
```

### Response

```json
{
  "success": true,
  "avatar_id": "uuid-here",
  "avatar_name": "Sarah",
  "system_prompt": "You are Sarah, a friendly AI...\n\n=== KNOWLEDGE BASE ===\n...\n=== MEMORIES ===\n...",
  "components": {
    "base_prompt": "trained_version",
    "prompt_version": 3,
    "rag_chunks_included": 3,
    "memories_included": 5,
    "knowledge_files_available": 2
  },
  "knowledge_base": {
    "files": [
      {
        "name": "company_handbook.pdf",
        "type": "application/pdf",
        "status": "processed"
      }
    ],
    "chunks_retrieved": 3
  },
  "memories": [
    {
      "id": "memory-uuid",
      "title": "First Meeting",
      "date": "2024-01-15",
      "summary": "Met the user for the first time...",
      "images_count": 2
    }
  ],
  "user_query": "Hello!"
}
```

---

## 🧪 Examples

### Example 1: Get Full Prompt with Context

```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-prompt `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA" `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
    "user_query": "Tell me about yourself",
    "include_rag": true,
    "include_memories": true
  }'
```

### Example 2: Get Just Base Prompt (No RAG/Memories)

```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-prompt `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
    "include_rag": false,
    "include_memories": false
  }'
```

### Example 3: In n8n

**HTTP Request Node:**
- Method: `POST`
- URL: `https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-prompt`
- Headers: (same 3 as before)
- Body:
  ```json
  {
    "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
    "user_query": "={{ $json.body.message }}",
    "include_rag": true,
    "include_memories": true
  }
  ```

---

## 🎯 Use Cases

### 1. **Debug Prompts**
See exactly what context is being sent to OpenAI:
- What knowledge chunks were retrieved?
- Which memories are included?
- How is the prompt structured?

### 2. **Build Custom Integrations**
Get the prompt and use it with:
- Different AI models (Claude, Gemini, etc.)
- Custom processing
- Prompt analytics

### 3. **Compare Prompt Versions**
Call this endpoint with different avatar prompt versions to compare:
```json
{
  "avatar_id": "avatar-1",
  "user_query": "Same question"
}
```

### 4. **Prompt Engineering**
Test how different queries affect RAG retrieval:
```json
{
  "avatar_id": "9a567d58...",
  "user_query": "Question A"
}

{
  "avatar_id": "9a567d58...",
  "user_query": "Question B"
}
```

---

## 📊 What You Get

### `system_prompt` (string)
The complete enriched prompt text that would be sent to OpenAI as the system message.

Includes:
- ✅ Avatar personality & backstory
- ✅ Active prompt version (trained)
- ✅ Knowledge base chunks (RAG)
- ✅ Memories
- ✅ User query context

### `components` (object)
Breakdown of what's included:
- `base_prompt`: "trained_version" or "default"
- `prompt_version`: Version number if using trained prompt
- `rag_chunks_included`: Number of KB chunks
- `memories_included`: Number of memories
- `knowledge_files_available`: Total KB files

### `knowledge_base` (object)
Details about knowledge base:
- `files`: Array of KB files
- `chunks_retrieved`: How many chunks for this query

### `memories` (array)
List of memories included with:
- `id`, `title`, `date`, `summary`, `images_count`

---

## 🔄 Comparison: 3 Endpoints

| Endpoint | Purpose | Returns | Calls OpenAI? |
|----------|---------|---------|---------------|
| **`/avatar-chat`** | Send message, get response | Avatar reply | ✅ Yes |
| **`/avatar-config`** | Get avatar settings | Config + file lists | ❌ No |
| **`/avatar-prompt`** | Get full enriched prompt | Complete system prompt | ❌ No |

---

## 📝 Response Fields Explained

```json
{
  "success": true,

  // Basic Info
  "avatar_id": "uuid",
  "avatar_name": "Sarah",

  // THE MAIN THING: Full enriched prompt
  "system_prompt": "You are Sarah...\n\n[full context here]",

  // What's included
  "components": {
    "base_prompt": "trained_version",     // or "default"
    "prompt_version": 3,                   // null if default
    "rag_chunks_included": 3,              // KB chunks
    "memories_included": 5,                // Memories
    "knowledge_files_available": 2         // Total KB files
  },

  // Knowledge base details
  "knowledge_base": {
    "files": [...],                        // KB files info
    "chunks_retrieved": 3                  // Chunks for query
  },

  // Memories details
  "memories": [...],                       // Array of memories

  // Your query
  "user_query": "Hello!"                   // What you asked
}
```

---

## 🚀 Deploy & Test

### Step 1: Deploy
```powershell
supabase functions deploy avatar-prompt
```

### Step 2: Test
```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-prompt `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA" `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{"avatar_id":"9a567d58-cb5b-497d-869a-d6a8d61a8b4e","user_query":"Hello!"}'
```

### Step 3: Check Response
You should see the full system prompt with all context!

---

## 🎯 Perfect For

- ✅ Debugging avatar responses
- ✅ Understanding what context AI sees
- ✅ Testing prompt versions
- ✅ Building custom workflows
- ✅ Prompt optimization
- ✅ Integration with other AI models

---

**Now you can see EXACTLY what context your avatar uses without calling OpenAI! 🎉**
