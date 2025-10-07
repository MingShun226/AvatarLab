# Quick Fix - Service Name Case Sensitivity Issue

## 🔧 Problem Identified

Your API key was saved with service name `"OpenAI"` (capital O) but the system expects `"openai"` (lowercase).

**Your current key:**
- Service: `OpenAI` ❌
- Expected: `openai` ✅

---

## ✅ Solution (Choose One)

### Option 1: Fix Existing Key (SQL - 30 seconds)

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Copy and run this:**

```sql
-- Fix the service name to lowercase
UPDATE user_api_keys
SET service = 'openai'
WHERE service = 'OpenAI' AND user_id = auth.uid();

-- Verify it's fixed
SELECT id, name, service, status FROM user_api_keys WHERE user_id = auth.uid();
```

3. **Refresh your app** (Ctrl+Shift+R)
4. **Try generating an image** - Should work now! ✅

---

### Option 2: Delete and Re-add (UI - 1 minute)

1. **Go to Settings** → **API Management**
2. **Delete the existing** "OpenAI API Key"
3. **Add new API key:**
   - Key Name: `My OpenAI Key`
   - Service: Select **"OpenAI (DALL-E, GPT, etc.)"** from dropdown
   - API Key: `sk-proj-your-key`
4. Click "Add API Key"
5. **Try generating** - Should work now! ✅

---

## 🎯 What Changed

I've updated the Settings UI to use a **dropdown menu** with standardized service names:

✅ **Before:** Text input (users could type anything)
```
Service: [OpenAI]  ← User typed "OpenAI" (wrong case)
```

✅ **After:** Dropdown with exact values
```
Service: [Select... ▼]
  - openai (OpenAI - DALL-E, GPT, etc.)
  - stability (Stability AI)
  - kie-ai (KIE AI)
  - elevenlabs (ElevenLabs)
  - etc.
```

Now it's **impossible to enter wrong case** - the dropdown ensures correct values!

---

## 📋 Correct Service Names

Use these **exact** values (case-sensitive):

| Service | Value | Used For |
|---------|-------|----------|
| OpenAI | `openai` | DALL-E, GPT, Whisper |
| Stability AI | `stability` | Image generation |
| KIE AI | `kie-ai` | Flux models |
| ElevenLabs | `elevenlabs` | Voice synthesis |
| Replicate | `replicate` | Various models |
| Anthropic | `anthropic` | Claude |
| Google | `google` | Gemini |

---

## 🧪 Test It

After fixing:

1. **Go to Images Studio**
2. **Select "OpenAI DALL-E 3"**
3. **Enter prompt:** `a cute cat wearing sunglasses`
4. **Click Generate**
5. **Should work!** 🎉

---

## 🔍 How to Check It Worked

**Check your API key in database:**

```sql
-- Run in Supabase SQL Editor
SELECT
  id,
  name,
  service,  -- Should be 'openai' (lowercase)
  status,
  created_at
FROM user_api_keys
WHERE user_id = auth.uid();
```

Should show:
- service: `openai` ✅ (not `OpenAI`)

---

## 💡 Pro Tip

The new dropdown UI prevents this issue from happening again. Just select from the dropdown instead of typing!

---

**Files updated:**
- ✅ Settings UI now uses dropdown (prevents typos)
- ✅ Service names are standardized
- ✅ No more case sensitivity issues!

**Next time:** Just use the dropdown and you're guaranteed to get the right format! 🚀
