# 🚀 Quick Reference - n8n Setup

## 📋 What You Need

```
✅ API Key:     pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✅ Avatar ID:   123e4567-e89b-12d3-a456-426614174000
✅ API URL:     https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat
```

---

## ⚡ n8n Configuration (Copy-Paste Ready)

### HTTP Request Node Settings:

**Method:** `POST`

**URL:**
```
https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat
```

**Headers:**
| Name | Value |
|------|-------|
| `x-api-key` | `pk_live_YOUR_ACTUAL_KEY_HERE` |
| `Content-Type` | `application/json` |

**Body (JSON):**
```json
{
  "avatar_id": "YOUR_AVATAR_ID_HERE",
  "message": "={{ $json.body.message }}",
  "model": "gpt-4o-mini"
}
```

**Response Node:**
```
={{ $json.message }}
```

---

## 🔍 How to Get Your Info

### Get API Key:
1. AvatarLab → Click "🔑 API Keys" in sidebar
2. Click "Create API Key"
3. Name: `n8n Bot`
4. Permissions: ✅ Check ALL
5. Copy key (starts with `pk_live_`)

### Get Avatar ID:
```sql
-- Run in Supabase SQL Editor:
SELECT id, name FROM avatars WHERE user_id = auth.uid();
```

---

## 🧪 Test Commands

### Test API Directly:
```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{"avatar_id":"YOUR_AVATAR_ID","message":"Hello!"}'
```

### Test n8n Webhook:
```powershell
curl -X POST "YOUR_N8N_WEBHOOK_URL" `
  -H "Content-Type: application/json" `
  -d '{"body":{"message":"Hello!"}}'
```

---

## 📱 WhatsApp Connection

### Using Twilio:
1. Sign up: https://www.twilio.com
2. Get sandbox number
3. Configure webhook: `YOUR_N8N_WEBHOOK_URL`
4. Test: Send WhatsApp to sandbox number

---

## ❌ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `Missing API key` | Check header is `x-api-key` (lowercase) |
| `Invalid API key` | Verify key is active in AvatarLab |
| `Avatar not found` | Check Avatar ID is correct UUID |
| `No OpenAI key` | Add OpenAI key in AvatarLab → Settings |

---

## 📊 What Each Part Does

```
WhatsApp → n8n → AvatarLab API → OpenAI → n8n → WhatsApp
           ↓           ↓           ↓
        Webhook    Gets avatar   Generates
                   data + KB     response
```

---

## ✅ Setup Checklist

- [ ] API key created
- [ ] Avatar ID copied
- [ ] n8n workflow created
- [ ] HTTP Request configured:
  - [ ] URL correct
  - [ ] x-api-key header added
  - [ ] avatar_id in body
- [ ] WhatsApp webhook configured
- [ ] Test message works

---

**Need detailed help? See:** `N8N_SETUP_COMPLETE_GUIDE.md`
**Understand the flow? See:** `HOW_IT_WORKS_SIMPLE.md`
