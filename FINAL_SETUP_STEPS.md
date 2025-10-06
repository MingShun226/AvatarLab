# ✅ Final Setup Steps - API Keys in Your Dashboard

I've successfully added **API Keys** to your sidebar! Here's how to complete the setup:

---

## 🎯 What I Just Did

✅ **Added "API Keys" menu item** to your dashboard sidebar
- Icon: 🔑 Key icon
- Position: Between "My Avatar" and "Billing & Plans"
- Route: `/api-keys`

---

## 📋 Complete Setup (3 Steps - 5 minutes total)

### **Step 1: Run SQL Migration** (2 minutes)

This creates the database tables for API keys.

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `xatrtqdgghanwdujyhkq`

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Open file: `PASTE_THIS_IN_SUPABASE.sql`
   - Copy ALL contents (entire file)
   - Paste in SQL Editor
   - Click "Run"

4. **Verify Success**
   - Look for output at bottom showing:
     - ✅ Tables created: `platform_api_keys`, `api_request_logs`, `n8n_integrations`
     - ✅ Functions created: `verify_platform_api_key`, `search_knowledge_chunks`
     - ✅ RLS enabled

---

### **Step 2: Start Your App** (1 minute)

```powershell
npm run dev
```

**Your app will start at:** `http://localhost:5173`

---

### **Step 3: Access API Keys Page** (2 minutes)

1. **Login to your AvatarLab dashboard**

2. **Look at the sidebar - you'll see:**
   ```
   📊 Dashboard
   🛍️ Avatar Marketplace
   💬 AI Chatbot
   🎤 TTS Voice
   🖼️ AI Images
   👤 AI Avatar
   🌿 Learning Path
   👥 My Avatar
   🔑 API Keys          ← NEW! Click here!
   💳 Billing & Plans
   ```

3. **Click "🔑 API Keys"** in the sidebar

4. **You'll see the API Keys page:**
   - Beautiful management interface
   - "Create API Key" button
   - Table showing your API keys (empty at first)

---

## 🔑 Create Your First API Key for n8n

On the API Keys page:

1. **Click "Create API Key" button**

2. **Fill in the form:**

   **Key Name:** (required)
   ```
   n8n WhatsApp Bot
   ```

   **Avatar Scope:** (dropdown)
   ```
   Select your avatar OR choose "All Avatars"
   ```

   **Permissions:** (checkboxes)
   ```
   ☑️ chat       - Allow sending messages
   ☑️ config     - Allow reading avatar config
   ☑️ knowledge  - Allow accessing knowledge base
   ☑️ memories   - Allow accessing memories
   ```

   **Description:** (optional)
   ```
   API key for n8n WhatsApp integration
   ```

3. **Click "Create API Key"**

4. **🚨 COPY YOUR API KEY NOW!**
   - A popup will show your key
   - Format: `pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **THIS IS THE ONLY TIME YOU'LL SEE IT!**
   - Save it in a safe place (password manager, .env file)

5. **Click "I've Saved My Key"**

6. **Your key now appears in the table:**
   - Name: n8n WhatsApp Bot
   - Key: `pk_live_abc123...` (masked)
   - Avatar: Your avatar name
   - Scopes: chat, config, knowledge, memories
   - Status: 🟢 active
   - Usage: 0 requests
   - Last Used: Never

---

## 🧪 Test Your API Key

### Get Your Avatar ID

Run this in Supabase SQL Editor:

```sql
SELECT id, name FROM avatars WHERE user_id = auth.uid();
```

Copy the `id` value (UUID format)

### Test with curl

Replace these values:
- `YOUR_API_KEY` → Your `pk_live_...` key
- `YOUR_AVATAR_ID` → The UUID from above

```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat `
  -H "x-api-key: YOUR_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{\"avatar_id\":\"YOUR_AVATAR_ID\",\"message\":\"Hello! Tell me about yourself\"}'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Hi! I'm [Avatar Name]...",
  "metadata": {
    "model": "gpt-3.5-turbo",
    "knowledge_chunks_used": 0,
    "memories_accessed": 0
  }
}
```

✅ If you get this response, **everything is working perfectly!**

---

## 🔗 Use in n8n

### Import Workflow

1. **Open n8n**
2. **Import** `docs/n8n-workflow-template.json`
3. **Configure the HTTP Request node:**
   - URL: `https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat`
   - Header `x-api-key`: Your API key
   - Body `avatar_id`: Your avatar ID

4. **Test the workflow**
5. **Connect to WhatsApp/Telegram/etc!**

---

## 📸 What Your Sidebar Will Look Like

```
┌─────────────────────────────┐
│  🤖 AvatarHub               │
│  Your AI Avatar Station     │
├─────────────────────────────┤
│  📊 Dashboard               │
│  🛍️ Avatar Marketplace      │
│  💬 AI Chatbot              │
│  🎤 TTS Voice               │
│  🖼️ AI Images               │
│  👤 AI Avatar               │
│  🌿 Learning Path           │
│  👥 My Avatar               │
│  🔑 API Keys    ← NEW! ✨   │
│  💳 Billing & Plans         │
├─────────────────────────────┤
│  ⚙️ Settings                │
│  🚪 Logout                  │
└─────────────────────────────┘
```

---

## ✅ Checklist

Complete these in order:

- [ ] **Run SQL migration** in Supabase
  - File: `PASTE_THIS_IN_SUPABASE.sql`
  - Location: Supabase Dashboard → SQL Editor

- [ ] **Start your app**
  - Command: `npm run dev`

- [ ] **Click "🔑 API Keys"** in sidebar

- [ ] **Create API key**
  - Name: "n8n WhatsApp Bot"
  - Permissions: All checkboxes
  - **Copy the key!**

- [ ] **Test with curl**
  - Replace placeholders
  - Should get success response

- [ ] **Import n8n workflow**
  - File: `docs/n8n-workflow-template.json`
  - Configure with your API key

- [ ] **Connect to WhatsApp** (optional)

---

## 🎉 You're Done!

Your AvatarLab dashboard now has:

✅ **API Keys page** in the sidebar
✅ **Create/manage API keys** for n8n
✅ **Working API endpoints** for chat and config
✅ **Full documentation** and examples

**Next:** Run the SQL migration, then check your sidebar - you'll see the API Keys menu! 🚀

---

## 💡 Quick Reference

**Your API Endpoints:**
- Chat: `https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat`
- Config: `https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config`

**Authentication Header:**
```
x-api-key: pk_live_your_key_here
```

**Documentation:**
- Full guide: `docs/API_INTEGRATION_GUIDE.md`
- Quick start: `QUICK_START.md`
- API reference: `public/api-docs.html`

---

**Need help? All the documentation is ready. Just follow this file step by step!** ✅
