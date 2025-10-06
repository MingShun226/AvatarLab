# 📸 Extract and Send Images from AI Response

## 🎯 Problem

AI Agent returns Markdown image syntax:
```
![Dinner Receipt](https://example.com/image.jpg)
```

But WhatsApp sends it as plain text instead of showing the image.

---

## ✅ Solution: Extract Images and Send Separately

Add a new Code node **between** "Format Conversation for Storage" and "Store Conversation" to:
1. Extract image URLs from AI response
2. Remove Markdown syntax from text
3. Send images separately via WhatsApp

---

## 🔧 New Node: Extract Images from AI Response

**Node Type:** Code
**Node Name:** `Extract Images from AI Response`
**Position:** After "Format Conversation for Storage", before "Store Conversation"

### Code:

```javascript
// Extract Images from AI Response
const data = $input.first().json;

const aiResponse = data.assistant_message || '';

// Regex to find Markdown images: ![alt](url)
const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

// Extract all images
const images = [];
let match;

while ((match = imageRegex.exec(aiResponse)) !== null) {
  images.push({
    alt: match[1],      // Alt text
    url: match[2],      // Image URL
    markdown: match[0]  // Full markdown syntax
  });
}

// Remove Markdown image syntax from text
let cleanText = aiResponse;
images.forEach(img => {
  cleanText = cleanText.replace(img.markdown, '');
});

// Clean up extra whitespace and newlines
cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

// Return data
return {
  json: {
    avatar_id: data.avatar_id,
    phone_number: data.phone_number,
    user_message: data.user_message,
    assistant_message: aiResponse,  // Original with markdown (for storage)
    assistant_message_clean: cleanText,  // Clean text (for WhatsApp)
    images: images,
    has_images: images.length > 0,
    ai_response: cleanText  // For backward compatibility
  }
};
```

---

## 🔄 Updated Workflow

### Old Flow:
```
AI Agent → Format Conversation for Storage → Store Conversation → Send WhatsApp Reply
```

### New Flow:
```
AI Agent
  ↓
Format Conversation for Storage
  ↓
Extract Images from AI Response  ← NEW NODE
  ↓
Store Conversation
  ↓
IF (has_images = true)
  ├─ Send WhatsApp Text (clean message)
  └─ Send WhatsApp Image (each image URL)
ELSE
  └─ Send WhatsApp Text (normal message)
```

---

## 📱 Updated WhatsApp Send Nodes

### Option 1: Simple - Send URL as Text

**Node:** Send WhatsApp Reply

**Message:**
```
={{ $json.assistant_message_clean }}

{{ $json.images.length > 0 ? '\n\n📸 Image: ' + $json.images[0].url : '' }}
```

**Result:**
```
Sure, I can send you the receipt from that dinner!

📸 Image: https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/.../image.jpg
```

WhatsApp will auto-preview the image URL.

---

### Option 2: Advanced - Send Image Media (If n8n supports)

#### Node 1: Send Text Message

**To:** `={{ $json.phone_number }}`

**Message:** `={{ $json.assistant_message_clean }}`

#### Node 2: Send Image Message (Loop for each image)

**Trigger:** IF `{{ $json.has_images }}` = true

**To:** `={{ $json.phone_number }}`

**Media Type:** `Image`

**Media URL:** `={{ $json.images[0].url }}`

**Caption:** `={{ $json.images[0].alt }}`

---

## 🧪 Testing

### Test Message 1: Text Only

**AI Response:**
```
I'm doing great! How can I help you today?
```

**Output:**
```json
{
  "assistant_message_clean": "I'm doing great! How can I help you today?",
  "images": [],
  "has_images": false
}
```

**WhatsApp:** Text only

---

### Test Message 2: With Image

**AI Response:**
```
Here's the receipt from that dinner!

![Dinner Receipt](https://example.com/receipt.jpg)

Let me know if you need anything else!
```

**Output:**
```json
{
  "assistant_message_clean": "Here's the receipt from that dinner!\n\nLet me know if you need anything else!",
  "images": [
    {
      "alt": "Dinner Receipt",
      "url": "https://example.com/receipt.jpg",
      "markdown": "![Dinner Receipt](https://example.com/receipt.jpg)"
    }
  ],
  "has_images": true
}
```

**WhatsApp:**
1. Text: "Here's the receipt from that dinner! Let me know if you need anything else!"
2. Image: Shows receipt.jpg

---

### Test Message 3: Multiple Images

**AI Response:**
```
Here are the photos from that day!

![Photo 1](https://example.com/photo1.jpg)

![Photo 2](https://example.com/photo2.jpg)

Great memories! 🎉
```

**Output:**
```json
{
  "assistant_message_clean": "Here are the photos from that day!\n\nGreat memories! 🎉",
  "images": [
    {
      "alt": "Photo 1",
      "url": "https://example.com/photo1.jpg",
      "markdown": "![Photo 1](https://example.com/photo1.jpg)"
    },
    {
      "alt": "Photo 2",
      "url": "https://example.com/photo2.jpg",
      "markdown": "![Photo 2](https://example.com/photo2.jpg)"
    }
  ],
  "has_images": true
}
```

---

## 🎨 Alternative: Update AI Agent System Prompt

Add this to your system prompt to prevent Markdown image syntax:

```
=== IMAGE SENDING INSTRUCTIONS ===
When sharing images, DO NOT use Markdown syntax like ![alt](url).
Instead, simply include the full image URL on its own line.

Example:
❌ Wrong: ![Receipt](https://example.com/receipt.jpg)
✅ Correct:
Here's the receipt!

https://example.com/receipt.jpg

Let me know if you need anything else!
===
```

Then WhatsApp will auto-preview URLs naturally without parsing Markdown.

---

## ✅ Quick Fix (Simplest Solution)

### Option A: Update System Prompt

Add to `Build Complete Context` node system prompt:

```javascript
fullSystemPrompt += '\n\n=== IMAGE SHARING ===\n';
fullSystemPrompt += 'When sharing image URLs, send them as plain URLs, NOT Markdown.\n';
fullSystemPrompt += 'Just paste the URL directly in your message.\n';
```

### Option B: Extract URLs in "Send WhatsApp Reply" Node

**Message:**
```
={{ $json.ai_response.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$2') }}
```

This regex removes the Markdown syntax and keeps only the URL.

---

## 📊 Comparison

| Solution | Pros | Cons |
|----------|------|------|
| Update System Prompt | Simple, no code changes | AI might still use Markdown |
| Extract Images Node | Clean separation, flexible | More complex workflow |
| Regex in Send Node | Quick fix | Less control over formatting |

**Recommendation:** Use **Option B (Regex in Send Node)** for quick fix, or add the **Extract Images Node** for better control.

---

## 🚀 Implementation Steps

### Quick Fix (2 minutes):

1. Go to **"Send WhatsApp Reply"** node
2. Update message field:
```
={{ $json.ai_response.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '\n\n$2\n\n') }}
```

This will convert:
```
![Receipt](https://example.com/image.jpg)
```

To:
```
https://example.com/image.jpg
```

WhatsApp will auto-preview the URL!

---

### Complete Solution (5 minutes):

1. Add "Extract Images from AI Response" Code node
2. Update "Send WhatsApp Reply" to use `assistant_message_clean`
3. Optionally add separate image sending logic

Done! 🎉
