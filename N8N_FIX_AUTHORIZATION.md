# 🔧 Fix: n8n Authorization Error

## ❌ The Problem

You're getting: `Missing authorization header`

This is because Supabase Edge Functions require BOTH:
1. `Authorization` header (Supabase anon key)
2. `x-api-key` header (Your platform API key)

---

## ✅ Solution: Add Authorization Header

### Step 1: Get Your Supabase Anon Key

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Go to Settings → API**
   - Copy the **"anon public"** key
   - It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Update n8n HTTP Request Headers

In your n8n HTTP Request node, add **THREE** headers:

| Name | Value |
|------|-------|
| `Authorization` | `Bearer YOUR_SUPABASE_ANON_KEY` |
| `x-api-key` | `pk_live_YOUR_API_KEY` |
| `Content-Type` | `application/json` |

**Important:** For `Authorization`, add `Bearer ` (with space) before the key!

---

## 📋 Complete n8n Configuration

### HTTP Request Node Settings:

**Method:** `POST`

**URL:**
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat
```

**Headers (Add 3 headers):**

1. **Authorization:**
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA
   ```
   *(This is YOUR actual anon key from the curl example you showed earlier)*

2. **x-api-key:**
   ```
   pk_live_YOUR_PLATFORM_API_KEY
   ```

3. **Content-Type:**
   ```
   application/json
   ```

**Body (JSON):**
```json
{
  "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
  "message": "={{ $json.body.message }}",
  "model": "gpt-4o-mini"
}
```

---

## 🧪 Test with curl (to verify it works)

```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA" `
  -H "x-api-key: pk_live_YOUR_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "avatar_id": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e",
    "message": "Hello!"
  }'
```

---

## 📝 Why Two Keys?

**Authorization (Supabase Anon Key):**
- Allows access to Supabase Edge Function
- Public key, safe to expose
- Everyone uses the same one

**x-api-key (Your Platform API Key):**
- Identifies YOUR account
- Private key, keep secret
- Unique to you
- Controls permissions (chat, config, etc.)

**Think of it like:**
- `Authorization` = Building access card (gets you in)
- `x-api-key` = Your apartment key (your specific access)

---

## ✅ Updated n8n Workflow

Here's the corrected configuration:

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-webhook"
      }
    },
    {
      "name": "Call AvatarLab API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat",
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA"
            },
            {
              "name": "x-api-key",
              "value": "YOUR_PLATFORM_API_KEY"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "bodyParameters": {
          "parameters": [
            {
              "name": "avatar_id",
              "value": "9a567d58-cb5b-497d-869a-d6a8d61a8b4e"
            },
            {
              "name": "message",
              "value": "={{ $json.body.message }}"
            },
            {
              "name": "model",
              "value": "gpt-4o-mini"
            }
          ]
        }
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "responseBody": "={{ $json.message }}"
      }
    }
  ]
}
```

---

## 🔍 How to Find Your Supabase Anon Key

### Method 1: From Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/xatrtqdgghanwdujyhkq/settings/api
2. Copy the **"anon public"** key

### Method 2: From Your Code
Check your `.env` file or Supabase config:
```
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Method 3: You Already Have It!
From the curl command Supabase gave you:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA
```

---

## ⚠️ Important Notes

1. **Supabase Anon Key is PUBLIC**
   - Safe to use in n8n
   - Can be exposed in frontend code
   - Not a security risk

2. **Platform API Key is PRIVATE**
   - Keep it secret
   - This is what controls access to YOUR avatars
   - Don't commit to git

3. **Both keys are needed**
   - Anon key: Supabase access
   - API key: Your account/avatar access

---

## ✅ Final Checklist

- [ ] Get Supabase anon key
- [ ] Add 3 headers to n8n HTTP Request:
  - [ ] Authorization: Bearer [anon-key]
  - [ ] x-api-key: pk_live_[your-key]
  - [ ] Content-Type: application/json
- [ ] Test with curl
- [ ] Test in n8n
- [ ] Should work! ✅

---

## 🎯 Quick Fix Summary

**Add this header to your n8n HTTP Request:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA
```

**That's it! The error will be fixed.** 🎉
