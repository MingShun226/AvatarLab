# 🖼️ Memory Images - How URLs Work

## ✅ Yes, Your AI Agent CAN Fetch Images!

The updated `avatar-config` function returns **working image URLs** that your AI Agent can directly access.

---

## 🔍 How Memory Images Are Stored

### When You Upload a Memory Image:

1. **Frontend uploads to Supabase Storage:**
   ```typescript
   // File uploaded to: avatar-memories/user123/avatar456/timestamp-random.jpg
   path: "user123/avatar456/1234567890-abc123.jpg"
   ```

2. **Frontend gets PUBLIC URL:**
   ```typescript
   url: "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/user123/avatar456/1234567890-abc123.jpg"
   ```

3. **Stored in database:**
   ```sql
   INSERT INTO memory_images (
     image_url,  -- The full public URL
     image_path  -- The storage path
   )
   ```

---

## 🎯 What the API Returns

### Option 1: If Image URL is Already Public

The database stores: `image_url = "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/..."`

**The API returns it as-is:**
```json
{
  "memories": {
    "items": [
      {
        "images": [
          {
            "url": "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/user123/avatar456/photo.jpg"
          }
        ]
      }
    ]
  }
}
```

✅ **Your AI Agent can directly fetch this URL!**

---

### Option 2: If Image URL is a Storage Path

The database stores: `image_url = "user123/avatar456/photo.jpg"` (just the path)

**The API converts it to a public URL:**
```json
{
  "memories": {
    "items": [
      {
        "images": [
          {
            "url": "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/user123/avatar456/photo.jpg"
          }
        ]
      }
    ]
  }
}
```

✅ **Still accessible by your AI Agent!**

---

### Option 3: If Bucket is Private (Fallback)

If the `avatar-memories` bucket is set to **private**, the API generates a **signed URL** (valid for 1 hour):

```json
{
  "memories": {
    "items": [
      {
        "images": [
          {
            "url": "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/sign/avatar-memories/user123/avatar456/photo.jpg?token=eyJhbGc..."
          }
        ]
      }
    ]
  }
}
```

✅ **AI Agent can access for 1 hour, then needs to call API again for fresh URL**

---

## 🧪 How to Verify Images Work

### Step 1: Call the API

```powershell
curl -X GET "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config?avatar_id=YOUR_AVATAR_ID" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." `
  -H "x-api-key: pk_live_YOUR_KEY"
```

### Step 2: Extract Image URL from Response

```json
{
  "memories": {
    "items": [
      {
        "title": "Dinner at Italian Restaurant",
        "images": [
          {
            "url": "https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/..."
          }
        ]
      }
    ]
  }
}
```

### Step 3: Test the URL

**Copy the URL and:**
1. Paste in browser → Should show the image ✅
2. Use in n8n HTTP Request node → Should download ✅
3. Pass to AI vision model → Should analyze ✅

---

## 🤖 Use in n8n AI Agent

### Example 1: Get All Memory Images

```javascript
// In n8n Code node, after calling avatar-config
const config = $input.all()[0].json;

// Extract all image URLs
const allImages = config.memories.items.flatMap(memory =>
  memory.images.map(img => ({
    memory_title: memory.title,
    memory_date: memory.date,
    image_url: img.url,
    caption: img.caption,
    is_primary: img.is_primary
  }))
);

console.log(`Found ${allImages.length} memory images`);

return { images: allImages };
```

### Example 2: Download an Image

```javascript
// In n8n HTTP Request node
const imageUrl = $json.images[0].image_url;

// Configure HTTP Request:
// Method: GET
// URL: {{ $json.images[0].image_url }}
// Response Format: File
```

### Example 3: Send Image to GPT-4 Vision

```javascript
// In n8n OpenAI node (Chat Model)
const config = $input.all()[0].json;
const firstMemory = config.memories.items[0];
const primaryImage = firstMemory.images.find(img => img.is_primary);

// Build vision message
const messages = [
  {
    role: "user",
    content: [
      {
        type: "text",
        text: `What's in this memory from ${firstMemory.date}?`
      },
      {
        type: "image_url",
        image_url: {
          url: primaryImage.url
        }
      }
    ]
  }
];
```

---

## 🔒 Security Considerations

### Public URLs (Recommended for AI Agents)

**Pros:**
- ✅ No expiration
- ✅ No need to refresh URLs
- ✅ Simpler to use in n8n workflows

**Cons:**
- ⚠️ Anyone with the URL can view the image
- ⚠️ URLs are long and random (hard to guess)

**Best for:** Internal AI agents, personal memories

---

### Signed URLs (Maximum Security)

**Pros:**
- ✅ Expires after 1 hour
- ✅ More secure (time-limited access)

**Cons:**
- ⚠️ Need to refresh URLs every hour
- ⚠️ AI Agent workflow needs to call API before each use

**Best for:** Sensitive images, shared avatars

---

## ✅ Current Implementation

The Edge Function **automatically handles both cases**:

1. **If image URL starts with "http"** → Uses it directly (already public)
2. **If image URL is a path** → Converts to public URL
3. **If public URL fails** → Falls back to signed URL (1 hour)

This means **images will work regardless of your storage bucket settings**! 🎉

---

## 🎯 Testing Checklist

After deploying the updated `avatar-config` function:

- [ ] Call the API and check response has `memories.items[].images[].url`
- [ ] Copy an image URL from response
- [ ] Paste URL in browser → Should display image
- [ ] Test in n8n HTTP Request → Should download successfully
- [ ] Check URL format:
  - [ ] Public: `...object/public/avatar-memories/...`
  - [ ] Signed: `...object/sign/avatar-memories/...?token=...`

---

## 📝 Summary

**Q: Can my AI Agent fetch memory images?**
**A: ✅ YES!** The API returns working URLs that are:

1. 🌐 **Directly accessible** (no additional authentication needed)
2. 🔗 **Fully qualified URLs** (ready to use in HTTP requests)
3. 🖼️ **Viewable in browsers** (you can test them yourself)
4. 🤖 **Compatible with AI vision models** (GPT-4 Vision, Claude Vision, etc.)

**Your AI Agent has FULL access to view and analyze memory images!** 🚀
