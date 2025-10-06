# 🔧 Fix Final Response Node

## ❌ Problem

The **Store Conversation** node returns:
```json
{
  "success": true,
  "message": "Message saved successfully",
  "data": { ... }
}
```

So the Final Response node can't access the AI message and images.

---

## ✅ Solution

Reference the **Extract Images from AI Response** node instead of the previous node.

---

## 📝 Updated Final Response Node

**Node Type:** Code
**Node Name:** `Final Response`
**Position:** After "Store Conversation"

### Updated Code:

```javascript
// Final Response - Reference Extract Images node
const data = $('Extract Images from AI Response').first().json;

// Get clean text (without markdown)
const textMessage = data.assistant_message_clean || data.ai_response || '';

// Get images
const images = data.images || [];

// Build output
let output = textMessage;

// Add image URLs if present
if (images.length > 0) {
  output += '\n\n';
  images.forEach(img => {
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

## 🔑 Key Change

**Before:**
```javascript
const data = $input.first().json;  // ❌ Gets Store Conversation response
```

**After:**
```javascript
const data = $('Extract Images from AI Response').first().json;  // ✅ Gets correct data
```

---

## 📊 Expected Output

With your example data, the output will be:

```
Sure, I can send you the receipt from that dinner at the Japanese place! || We had such a good time and so much delicious food, remember? 😄 || Here's the receipt for our group dining experience:

Let me know if you need anything else!

https://xatrtqdgghanwdujyhkq.supabase.co/storage/v1/object/public/avatar-memories/9248b32f-2015-4afb-a0a3-25aa8755dc35/9a567d58-cb5b-497d-869a-d6a8d61a8b4e/1759726293070-lwe9f9.jpg
```

WhatsApp will auto-preview the image URL! 🎉

---

## 🎨 Optional: Clean Up Extra Whitespace

Your `assistant_message_clean` has extra spaces where the markdown was removed. Update the "Extract Images from AI Response" node:

### Updated Extract Images Node:

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
    alt: match[1],
    url: match[2],
    markdown: match[0]
  });
}

// Remove Markdown image syntax from text
let cleanText = aiResponse;
images.forEach(img => {
  cleanText = cleanText.replace(img.markdown, '');
});

// Clean up extra whitespace and newlines (IMPROVED)
cleanText = cleanText
  .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2
  .replace(/\n\s+\n/g, '\n\n')  // Remove whitespace-only lines
  .trim();

// Return data
return {
  json: {
    avatar_id: data.avatar_id,
    phone_number: data.phone_number,
    user_message: data.user_message,
    assistant_message: aiResponse,
    assistant_message_clean: cleanText,
    images: images,
    has_images: images.length > 0,
    ai_response: cleanText
  }
};
```

**This will clean:**
```
Here's the receipt:



Let me know!
```

**To:**
```
Here's the receipt:

Let me know!
```

---

## 📊 Complete Workflow Reference

```
1. AI Agent
2. Format Conversation for Storage
3. Extract Images from AI Response  ← Contains: assistant_message_clean, images, has_images
4. Store Conversation  ← Contains: success, message, data (not useful for response)
5. Final Response  ← References node 3, not node 4
```

---

## ✅ Summary

**Change in Final Response node:**

**Old:**
```javascript
const data = $input.first().json;  // Gets wrong data
```

**New:**
```javascript
const data = $('Extract Images from AI Response').first().json;  // Gets correct data
```

That's it! Copy the updated code and paste it into your Final Response node. 🚀
