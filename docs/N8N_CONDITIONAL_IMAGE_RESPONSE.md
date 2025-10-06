# 🔀 Conditional Image Response Workflow

## 📊 Updated Workflow Structure

```
AI Agent
  ↓
Format Conversation for Storage
  ↓
Extract Images from AI Response
  ↓
Store Conversation
  ↓
IF Node (has_images = true?)
  ├─ TRUE → Send Response with Images
  └─ FALSE → Send Response (Text Only)
```

---

## 🔧 Complete Node Setup

### Node: IF (Check for Images)

**Node Type:** IF

**Condition 1:**
```
Field: {{ $json.has_images }}
Operation: Equal
Value: true
```

---

### TRUE Branch: Send Response with Images

**Node Type:** Code
**Node Name:** `Send Response with Images`

```javascript
// Send Response with Images
const data = $input.first().json;

// Get clean text message (without markdown)
const textMessage = data.assistant_message_clean || data.ai_response || '';

// Get all image URLs
const images = data.images || [];

// Build response with images as separate URLs
let output = textMessage;

// Add images as plain URLs (WhatsApp will auto-preview)
if (images.length > 0) {
  output += '\n\n';
  images.forEach((img, index) => {
    output += `${img.url}\n`;
  });
}

// Return formatted response
return {
  json: {
    output: output.trim()
  }
};
```

**Output Example:**
```
Here's the receipt from that dinner!

Let me know if you need anything else!

https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/.../receipt.jpg
```

---

### FALSE Branch: Send Response (Text Only)

**Node Type:** Code
**Node Name:** `Send Response Text Only`

```javascript
// Send Response - Text Only
const data = $input.first().json;

// Get AI response (no images to worry about)
const message = data.assistant_message || data.ai_response || '';

// Return simple format
return {
  json: {
    output: message
  }
};
```

**Output Example:**
```
I'm doing great! How can I help you today?
```

---

## 🎨 Alternative: Single Response Node (Simpler)

Instead of IF branch, use **one Code node** that handles both cases:

### Node: Send Response (Unified)

**Node Type:** Code
**Node Name:** `Send Response`
**Position:** After "Store Conversation"

```javascript
// Unified Response Handler
const data = $input.first().json;

// Get clean text (without markdown syntax)
const textMessage = data.assistant_message_clean || data.ai_response || '';

// Get images
const images = data.images || [];
const hasImages = images.length > 0;

// Build output
let output = textMessage;

// If there are images, add URLs
if (hasImages) {
  output += '\n\n';

  // Add all image URLs
  images.forEach((img, index) => {
    // Option 1: Just URL
    output += `${img.url}\n`;

    // Option 2: With caption (commented out)
    // output += `📸 ${img.alt}:\n${img.url}\n\n`;
  });
}

// Return formatted response
return {
  json: {
    output: output.trim()
  }
};
```

---

## 📊 Complete Flow Comparison

### Option 1: With IF Branch

```
Store Conversation
  ↓
IF (has_images = true?)
  ├─ TRUE → Send Response with Images (Code)
  └─ FALSE → Send Response Text Only (Code)
```

**Pros:**
- Clear separation of logic
- Easier to debug

**Cons:**
- 2 separate nodes to maintain

---

### Option 2: Single Unified Node (Recommended)

```
Store Conversation
  ↓
Send Response (Code - handles both cases)
```

**Pros:**
- Simpler workflow
- Less nodes to maintain
- One place to update

**Cons:**
- Slightly more complex code

---

## 🧪 Test Cases

### Test 1: Text Only Message

**AI Response:**
```
I'm doing great! How can I help you today?
```

**Extract Images Node Output:**
```json
{
  "assistant_message_clean": "I'm doing great! How can I help you today?",
  "images": [],
  "has_images": false
}
```

**Send Response Output:**
```
I'm doing great! How can I help you today?
```

---

### Test 2: Message with One Image

**AI Response:**
```
Here's the receipt!

![Dinner Receipt](https://example.com/receipt.jpg)

Let me know if you need anything else!
```

**Extract Images Node Output:**
```json
{
  "assistant_message_clean": "Here's the receipt!\n\nLet me know if you need anything else!",
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

**Send Response Output:**
```
Here's the receipt!

Let me know if you need anything else!

https://example.com/receipt.jpg
```

---

### Test 3: Message with Multiple Images

**AI Response:**
```
Here are the photos from that day!

![Photo 1](https://example.com/photo1.jpg)

![Photo 2](https://example.com/photo2.jpg)

Great memories! 🎉
```

**Extract Images Node Output:**
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

**Send Response Output:**
```
Here are the photos from that day!

Great memories! 🎉

https://example.com/photo1.jpg
https://example.com/photo2.jpg
```

---

## ✅ Recommended Implementation

### Use Single Unified Node (Simpler)

**Complete Workflow:**
```
1. WhatsApp Trigger
2. Message Processor
3. Get Conversation Memory
4. Conversation Summarizer
5. Get Avatar Config
6. Build Complete Context
7. AI Agent
8. Format Conversation for Storage
9. Extract Images from AI Response  ← NEW
10. Store Conversation
11. Send Response (Unified)  ← NEW (replaces old response node)
```

**Node 11: Send Response (Complete Code):**

```javascript
// Unified Response Handler
const data = $input.first().json;

// Get clean text (without markdown syntax)
const textMessage = data.assistant_message_clean || data.ai_response || '';

// Get images
const images = data.images || [];
const hasImages = images.length > 0;

// Build output
let output = textMessage;

// If there are images, add URLs at the end
if (hasImages) {
  output += '\n\n';

  images.forEach((img) => {
    output += `${img.url}\n`;
  });
}

// Return formatted response
return {
  json: {
    output: output.trim()
  }
};
```

---

## 🎯 Summary

**Before:**
```
AI Response: "Here's the receipt!\n\n![Receipt](url)\n\nLet me know!"
WhatsApp sees: "Here's the receipt!\n\n![Receipt](url)\n\nLet me know!"
```

**After:**
```
AI Response: "Here's the receipt!\n\n![Receipt](url)\n\nLet me know!"
Extract Images: Removes ![Receipt](url), saves url separately
Send Response: "Here's the receipt!\n\nLet me know!\n\nhttps://url"
WhatsApp sees: Text + Auto-previewed image from URL
```

WhatsApp will automatically show image previews for any URLs you send! 🎉

---

## 💡 Pro Tip: Add Image Labels (Optional)

If you want nicer formatting:

```javascript
// If there are images, add URLs with labels
if (hasImages) {
  output += '\n\n';

  if (images.length === 1) {
    output += `📸 Image:\n${images[0].url}\n`;
  } else {
    output += `📸 Images:\n`;
    images.forEach((img, index) => {
      output += `${index + 1}. ${img.url}\n`;
    });
  }
}
```

**Result:**
```
Here are the photos from that day!

Great memories! 🎉

📸 Images:
1. https://example.com/photo1.jpg
2. https://example.com/photo2.jpg
```

Choose the format you prefer! 🚀
