# 🎯 Avatar Config - Full Access Guide

## ✅ What Your AI Agent Can Now Access

The **updated avatar-config** endpoint now provides **FULL ACCESS** to:

### 1. 📄 **PDF Files (Knowledge Base)**
- ✅ **Direct download URLs** (signed, valid for 1 hour)
- ✅ **Full extracted text** (all chunks from the PDF)
- ✅ File metadata (name, size, type, status)

### 2. 🖼️ **Memory Images**
- ✅ **Direct image URLs** (signed, valid for 1 hour)
- ✅ Image captions and metadata
- ✅ Associated memory details

### 3. 📝 **Complete Content**
- ✅ Full system prompt
- ✅ All personality traits and behavior rules
- ✅ Complete memory details with emotional context
- ✅ Every knowledge chunk with page numbers

---

## 🚀 How It Works

### PDF Files (Knowledge Base)

When you call `/avatar-config`, you get:

```json
{
  "knowledge_base": {
    "files_count": 2,
    "files": [
      {
        "id": "uuid-here",
        "name": "company_handbook.pdf",
        "type": "application/pdf",
        "status": "processed",
        "size": 1024000,
        "uploaded_at": "2024-01-10T10:00:00Z",
        "file_url": "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/sign/avatar-files/user123/avatar456/company_handbook.pdf?token=...",
        "file_path": "user123/avatar456/company_handbook.pdf"
      }
    ],
    "chunks_count": 45,
    "chunks": [
      {
        "file_id": "uuid-here",
        "chunk_index": 0,
        "page_number": 1,
        "section_title": "Company Values",
        "content": "Our company believes in innovation, integrity, and excellence. We strive to create products that make a difference..."
      },
      {
        "file_id": "uuid-here",
        "chunk_index": 1,
        "page_number": 1,
        "section_title": "Company Values",
        "content": "Each employee is empowered to make decisions and take ownership of their work..."
      }
      // ... all 45 chunks
    ]
  }
}
```

**Your AI Agent can:**
1. ✅ **Read the full text** from `chunks[].content` (already extracted and split)
2. ✅ **Download the PDF** using `files[].file_url` (if needed)
3. ✅ **Reference page numbers** from `chunks[].page_number`

---

### Memory Images

```json
{
  "memories": {
    "count": 5,
    "items": [
      {
        "id": "memory-uuid",
        "title": "First Meeting with Client",
        "date": "2024-01-15",
        "summary": "Met John from ABC Corp to discuss the new project",
        "details": "John mentioned they need a solution for their inventory management. They currently use spreadsheets and it's becoming unmanageable. Budget is around $50k. Timeline is 3 months.",
        "emotional_context": "excited, professional, optimistic",
        "images": [
          {
            "id": "img-uuid",
            "url": "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/sign/avatar-memories/user123/memory456/meeting_photo.jpg?token=...",
            "caption": "John and the team at ABC Corp office",
            "is_primary": true,
            "display_order": 1
          },
          {
            "id": "img-uuid-2",
            "url": "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/sign/avatar-memories/user123/memory456/whiteboard.jpg?token=...",
            "caption": "Whiteboard sketch of the proposed solution",
            "is_primary": false,
            "display_order": 2
          }
        ],
        "created_at": "2024-01-15T14:30:00Z",
        "updated_at": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

**Your AI Agent can:**
1. ✅ **View/download images** using `memories[].items[].images[].url`
2. ✅ **Read full memory details** from `details` field
3. ✅ **Understand context** from `emotional_context`
4. ✅ **See image descriptions** from `caption`

---

## 🔐 Security: Signed URLs

All file/image URLs are **signed** with:
- ✅ **1 hour expiration** (secure, temporary access)
- ✅ **User-specific** (only accessible by authorized API key)
- ✅ **Auto-generated** on each request

If your AI Agent needs access for longer than 1 hour, simply call the endpoint again to get fresh URLs.

---

## 📋 Deployment Steps

### Step 1: Deploy Updated Function

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/xatrtqdgghanwdujyhkq/functions

2. **Click on "avatar-config"**

3. **Replace ALL code** with the updated version from:
   ```
   C:\Users\USER\OneDrive\Desktop\AvatarLab\supabase\functions\avatar-config\index.ts
   ```

4. **Click "Deploy"**

### Step 2: Test

```powershell
curl -X GET "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config?avatar_id=9a567d58-cb5b-497d-869a-d6a8d61a8b4e" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA" `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json"
```

**Check the response for:**
- ✅ `knowledge_base.files[].file_url` - Should have a signed URL
- ✅ `knowledge_base.chunks[]` - Should have all text chunks
- ✅ `memories.items[].images[].url` - Should have signed URLs

---

## 🎯 Use in n8n

Your n8n AI Agent can now:

### 1. **Get Avatar Config** (HTTP Request Node)
```
GET /avatar-config?avatar_id=xxx
```

### 2. **Process the Response**

**Example: Access PDF Content**
```javascript
// In n8n Code node
const config = $input.all()[0].json;

// Get all knowledge chunks
const allKnowledge = config.knowledge_base.chunks
  .map(chunk => `[Page ${chunk.page_number}] ${chunk.content}`)
  .join('\n\n');

// Use in AI prompt
return {
  systemPrompt: config.active_prompt.system_prompt,
  knowledgeContext: allKnowledge
};
```

**Example: Access Memory Images**
```javascript
// In n8n Code node
const config = $input.all()[0].json;

// Get all memory images
const memoryImages = config.memories.items.flatMap(memory =>
  memory.images.map(img => ({
    memory_title: memory.title,
    image_url: img.url,
    caption: img.caption,
    date: memory.date
  }))
);

// Pass to AI Agent
return {
  memories: config.memories.items,
  images: memoryImages
};
```

**Example: Download PDF File**
```javascript
// In n8n HTTP Request node
const config = $input.all()[0].json;
const pdfUrl = config.knowledge_base.files[0].file_url;

// Make another HTTP request to download PDF
return {
  method: 'GET',
  url: pdfUrl
};
```

---

## 🧪 Testing Checklist

After deployment, verify:

- [ ] PDF file URLs are present in response
- [ ] PDF file URLs are downloadable (test in browser)
- [ ] All PDF chunks are in the response
- [ ] Memory images have URLs
- [ ] Memory image URLs are viewable (test in browser)
- [ ] All memory details are present
- [ ] URLs expire after 1 hour (security test)

---

## 🎉 Summary

**Before:**
- ❌ Only file names and counts
- ❌ No way to access actual PDFs
- ❌ No way to view memory images

**After:**
- ✅ Direct PDF download URLs
- ✅ Full extracted PDF text (all chunks)
- ✅ Direct memory image URLs
- ✅ Complete memory details
- ✅ Secure, time-limited access
- ✅ AI Agent has FULL access to avatar data

**Your AI Agent can now truly see and understand everything about your avatar!** 🚀
