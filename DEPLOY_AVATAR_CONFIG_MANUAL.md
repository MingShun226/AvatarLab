# 📋 Manual Deployment Guide: Updated avatar-config

## ✅ What Changed

The `avatar-config` endpoint now returns **FULL information** including:
- ✅ Full avatar configuration
- ✅ **ALL prompt versions** (not just active one)
- ✅ **FULL knowledge base content** (all chunks, not just file list)
- ✅ **FULL memories** (with details, images, emotional context)
- ❌ No need for user_query (just gets everything)

---

## 🚀 Deploy via Supabase Dashboard (Recommended)

### Step 1: Open Edge Functions
1. Go to: https://supabase.com/dashboard/project/xatrtqdgghanwdujyhkq/functions
2. Find the **avatar-config** function in the list
3. Click on it to open

### Step 2: Replace Code
1. Click **"Edit"** or the code editor area
2. **Delete all existing code**
3. Open this file on your computer:
   ```
   C:\Users\USER\OneDrive\Desktop\AvatarLab\supabase\functions\avatar-config\index.ts
   ```
4. **Copy ALL the code** (Ctrl+A, Ctrl+C)
5. **Paste into Supabase Dashboard** (Ctrl+V)

### Step 3: Deploy
1. Click the **"Deploy"** button
2. Wait for "Deployed successfully" message
3. Done! ✅

---

## 🧪 Test the Updated Endpoint

### Using curl (PowerShell):

```powershell
curl -X GET "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config?avatar_id=9a567d58-cb5b-497d-869a-d6a8d61a8b4e" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA" `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json"
```

### Expected Response:

```json
{
  "success": true,
  "avatar": {
    "id": "...",
    "name": "Sarah",
    "backstory": "...",
    "personality_traits": [...],
    ...
  },
  "active_prompt": {
    "version_number": 3,
    "system_prompt": "Full prompt text here...",
    "personality_traits": [...],
    "behavior_rules": [...],
    "response_style": {...}
  },
  "all_prompt_versions": [
    {
      "version_number": 3,
      "system_prompt": "...",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "version_number": 2,
      "system_prompt": "...",
      "is_active": false,
      "created_at": "2024-01-14T10:00:00Z"
    }
  ],
  "knowledge_base": {
    "files_count": 2,
    "files": [
      {
        "id": "...",
        "name": "company_handbook.pdf",
        "type": "application/pdf",
        "status": "processed",
        "size": 1024000,
        "uploaded_at": "2024-01-10T10:00:00Z"
      }
    ],
    "chunks_count": 45,
    "chunks": [
      {
        "file_id": "...",
        "chunk_index": 0,
        "page_number": 1,
        "section_title": "Introduction",
        "content": "Full text of this chunk..."
      },
      {
        "file_id": "...",
        "chunk_index": 1,
        "page_number": 1,
        "section_title": "Introduction",
        "content": "Full text of next chunk..."
      }
      // ... all 45 chunks
    ]
  },
  "memories": {
    "count": 5,
    "items": [
      {
        "id": "...",
        "title": "First Meeting",
        "date": "2024-01-15",
        "summary": "Met the user for the first time...",
        "details": "Full detailed memory text here...",
        "emotional_context": "excited, curious",
        "images": [
          {
            "id": "...",
            "url": "https://...",
            "caption": "Photo from first meeting",
            "is_primary": true,
            "display_order": 1
          }
        ],
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      }
      // ... all 5 memories
    ]
  }
}
```

---

## 🎯 Use in n8n

### HTTP Request Node Settings:

| Setting | Value |
|---------|-------|
| **Method** | `GET` |
| **URL** | `https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config` |
| **Query Parameters** | Name: `avatar_id`, Value: `9a567d58-cb5b-497d-869a-d6a8d61a8b4e` |
| **Header 1** | `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **Header 2** | `x-api-key: pk_live_YOUR_KEY` |
| **Header 3** | `Content-Type: application/json` |

### What Your AI Agent Gets:

Your AI Agent in n8n will receive ALL:
- ✅ Full avatar personality and backstory
- ✅ Complete system prompt (trained version)
- ✅ ALL knowledge base content (every chunk)
- ✅ ALL memories with full details and images
- ✅ All prompt versions (history)

No need to send `user_query` - this just dumps everything for your AI Agent to use!

---

## 📊 Comparison: Before vs After

### Before (Old avatar-config):
```json
{
  "knowledge_base": {
    "files_count": 2,
    "files": [{"name": "file.pdf", "status": "processed"}]
  },
  "memories": {
    "count": 5
  }
}
```

### After (New avatar-config):
```json
{
  "knowledge_base": {
    "files_count": 2,
    "files": [...],
    "chunks_count": 45,
    "chunks": [
      {"content": "Full text chunk 1..."},
      {"content": "Full text chunk 2..."},
      // ALL chunks
    ]
  },
  "memories": {
    "count": 5,
    "items": [
      {
        "title": "...",
        "summary": "...",
        "details": "Full memory text...",
        "images": [...]
      }
      // ALL memories
    ]
  }
}
```

---

## ✅ After Deployment

1. **Delete the avatar-prompt function** (no longer needed)
   - Go to: https://supabase.com/dashboard/project/xatrtqdgghanwdujyhkq/functions
   - Find `avatar-prompt`
   - Click "Delete" (optional, doesn't hurt to keep it)

2. **Use only 2 endpoints in n8n:**
   - `GET /avatar-config` - Get full avatar info
   - `POST /avatar-chat` - Send message and get reply

---

## 🎉 Done!

Now your `avatar-config` endpoint returns **everything** your AI Agent needs without requiring a user query!
