# 🚀 Complete n8n Setup Guide - AvatarLab API Integration

This guide shows you **exactly** how to connect your AvatarLab avatar to n8n and WhatsApp.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [How the API Works](#how-the-api-works)
3. [Get Your API Key & Avatar ID](#get-your-api-key--avatar-id)
4. [Set Up n8n Workflow](#set-up-n8n-workflow)
5. [Connect to WhatsApp](#connect-to-whatsapp)
6. [Test Everything](#test-everything)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before starting, make sure you have:

- ✅ AvatarLab account with avatar created
- ✅ SQL migration run (tables created)
- ✅ Edge functions deployed (avatar-chat & avatar-config)
- ✅ n8n account (free tier works: https://n8n.io)
- ✅ API key created with all permissions

---

## 🔄 How the API Works

Here's the complete flow:

```
┌─────────────┐      ┌─────────┐      ┌──────────────┐      ┌──────────┐
│   WhatsApp  │─────→│   n8n   │─────→│  AvatarLab   │─────→│  OpenAI  │
│    User     │      │ Workflow│      │     API      │      │   API    │
└─────────────┘      └─────────┘      └──────────────┘      └──────────┘
                          ↓                    ↓                   ↓
                     Receives            Fetches avatar       Generates
                     message             data & knowledge      response
                          ↓                                       ↓
                     ┌─────────────────────────────────────────────┐
                     │        Response sent back to WhatsApp       │
                     └─────────────────────────────────────────────┘
```

**Step-by-step:**
1. User sends WhatsApp message → n8n receives it
2. n8n calls your AvatarLab API with the message
3. API fetches:
   - Avatar personality & training
   - Knowledge base (RAG)
   - Memories
   - Active prompt version
4. API calls OpenAI with enriched context
5. OpenAI generates response in avatar's personality
6. n8n sends response back to WhatsApp

---

## 🔑 Get Your API Key & Avatar ID

### Step 1: Get Your API Key

1. **Open AvatarLab** → Click "🔑 API Keys" in sidebar
2. **Click "Create API Key"**
3. **Fill in:**
   - Name: `n8n WhatsApp Bot`
   - Avatar: Select your avatar (or "All Avatars")
   - Permissions: ✅ Check ALL (chat, config, knowledge, memories)
   - Description: `WhatsApp integration via n8n`
4. **Click "Create API Key"**
5. **⚠️ COPY THE KEY NOW!** (You'll only see it once)
   - Format: `pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Save it somewhere safe

### Step 2: Get Your Avatar ID

**Method 1: From Supabase**
1. Go to Supabase Dashboard → SQL Editor
2. Run:
   ```sql
   SELECT id, name FROM avatars WHERE user_id = auth.uid();
   ```
3. Copy the `id` (UUID format: `123e4567-e89b-12d3-a456-426614174000`)

**Method 2: From Browser**
1. Go to your avatar in AvatarLab
2. Look at the URL: `/avatar/YOUR_AVATAR_ID`
3. Copy the UUID from the URL

---

## 🛠️ Set Up n8n Workflow

### Option A: Import Pre-built Template (Easiest)

1. **Download template:**
   - File: `docs/n8n-workflow-template.json`

2. **In n8n:**
   - Click "Workflows" → "Import from File"
   - Select the template
   - Click "Import"

3. **Skip to Step 3 below** to configure

### Option B: Build from Scratch

#### Step 1: Create New Workflow

1. **Log in to n8n** (https://app.n8n.io or your instance)
2. **Click "New Workflow"**
3. **Name it:** `AvatarLab WhatsApp Chatbot`

#### Step 2: Add Webhook Trigger (for WhatsApp)

1. **Click "+"** to add node
2. **Search:** `Webhook`
3. **Select:** "Webhook" node
4. **Configure:**
   - **HTTP Method:** POST
   - **Path:** `whatsapp-webhook` (or any name)
   - **Response Mode:** "Respond to Webhook"
5. **Click "Execute Node"** to get webhook URL
6. **Copy the webhook URL** - you'll need this later

#### Step 3: Add HTTP Request Node (Call AvatarLab API)

1. **Click "+"** after webhook node
2. **Search:** `HTTP Request`
3. **Select:** "HTTP Request" node
4. **Configure:**

   **Method:**
   ```
   POST
   ```

   **URL:**
   ```
   https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat
   ```

   **Authentication:**
   ```
   None (we'll use headers instead)
   ```

   **Headers:**
   Click "Add Option" → "Headers"
   - Header 1:
     - Name: `x-api-key`
     - Value: `pk_live_YOUR_API_KEY_HERE` (paste your actual key)
   - Header 2:
     - Name: `Content-Type`
     - Value: `application/json`

   **Body Content Type:**
   ```
   JSON
   ```

   **Body (JSON):**
   ```json
   {
     "avatar_id": "YOUR_AVATAR_ID_HERE",
     "message": "={{ $json.body.message }}",
     "conversation_history": [],
     "model": "gpt-4o-mini"
   }
   ```

   **Replace:**
   - `YOUR_API_KEY_HERE` → Your actual API key
   - `YOUR_AVATAR_ID_HERE` → Your avatar UUID

#### Step 4: Add Response Node

1. **Click "+"** after HTTP Request node
2. **Search:** `Respond to Webhook`
3. **Select:** "Respond to Webhook" node
4. **Configure:**
   - **Response Body:** `={{ $json.message }}`

#### Step 5: Save Workflow

1. **Click "Save"** button (top right)
2. **Name:** `AvatarLab WhatsApp Chatbot`

---

## 📱 Connect to WhatsApp

You have several options:

### Option 1: Using Twilio (Recommended for Testing)

1. **Sign up for Twilio:**
   - Go to https://www.twilio.com
   - Create free account
   - Get WhatsApp sandbox number

2. **Configure Twilio Webhook:**
   - In Twilio Console → WhatsApp Sandbox Settings
   - **When a message comes in:**
     - URL: `YOUR_N8N_WEBHOOK_URL` (from Step 2)
     - Method: POST

3. **Test:**
   - Send WhatsApp message to Twilio sandbox number
   - Join sandbox: `join [sandbox-name]`
   - Send a message
   - Avatar should respond!

### Option 2: Using WhatsApp Business API

1. **Get WhatsApp Business API access:**
   - Apply at https://business.whatsapp.com

2. **Configure webhook:**
   - Point to your n8n webhook URL
   - Enable message events

### Option 3: Using Third-Party Services

- **360Dialog:** https://www.360dialog.com
- **MessageBird:** https://www.messagebird.com
- **Vonage:** https://www.vonage.com

All work the same way - configure their webhook to point to your n8n webhook URL.

---

## 🧪 Test Everything

### Test 1: Test n8n Workflow (Without WhatsApp)

1. **In n8n workflow:**
   - Click on Webhook node
   - Click "Execute Node"
   - You'll see a URL

2. **Test with curl:**
   ```powershell
   curl -X POST "YOUR_N8N_WEBHOOK_URL" `
     -H "Content-Type: application/json" `
     -d '{"body": {"message": "Hello! Tell me about yourself"}}'
   ```

3. **Expected:**
   - n8n shows execution successful
   - You see avatar's response in output

### Test 2: Test API Directly

```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "avatar_id": "YOUR_AVATAR_ID",
    "message": "Hello! Who are you?"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hi! I'm [Avatar Name]...",
  "metadata": {
    "model": "gpt-4o-mini",
    "knowledge_chunks_used": 0,
    "memories_accessed": 0
  }
}
```

### Test 3: Test WhatsApp Integration

1. **Send WhatsApp message** to your number/sandbox
2. **Check n8n executions:**
   - Go to n8n → Executions
   - See if it ran
   - Check for errors

3. **Receive response** in WhatsApp

---

## 📊 What Happens Behind the Scenes

### When You Send a Message:

1. **WhatsApp → n8n:**
   ```json
   {
     "body": {
       "message": "Hello!",
       "from": "+1234567890"
     }
   }
   ```

2. **n8n → AvatarLab API:**
   ```json
   {
     "avatar_id": "abc-123-def",
     "message": "Hello!",
     "conversation_history": []
   }
   ```

3. **AvatarLab API processes:**
   - Authenticates API key ✅
   - Fetches avatar config from database
   - Gets active prompt version
   - Searches knowledge base (RAG)
   - Gets recent memories
   - Builds enriched system prompt

4. **AvatarLab → OpenAI:**
   ```json
   {
     "model": "gpt-4o-mini",
     "messages": [
       {
         "role": "system",
         "content": "You are Sarah, a friendly AI...[full context]"
       },
       {
         "role": "user",
         "content": "Hello!"
       }
     ]
   }
   ```

5. **OpenAI generates response**
6. **AvatarLab → n8n:**
   ```json
   {
     "success": true,
     "message": "Hi! I'm Sarah, nice to meet you!"
   }
   ```

7. **n8n → WhatsApp:**
   - Sends avatar's response to user

---

## 🔧 Advanced Configuration

### Add Conversation Memory

To maintain context across messages:

1. **Add Set Node:**
   - Store conversation history in n8n global variable
   - Or use external database (Redis, PostgreSQL)

2. **Modify HTTP Request Body:**
   ```json
   {
     "avatar_id": "YOUR_AVATAR_ID",
     "message": "={{ $json.body.message }}",
     "conversation_history": "={{ $workflow.global.conversations[from] || [] }}",
     "model": "gpt-4o-mini"
   }
   ```

3. **Update global variable** after each message

### Use Different Models

Change the `model` parameter:
- `gpt-3.5-turbo` - Fast, cheap
- `gpt-4` - Smarter, slower
- `gpt-4o-mini` - **Recommended** (fast + smart)
- `gpt-4-turbo` - Latest, most capable

### Multiple Avatars

Create different workflows for each avatar, or use a switch node:

```json
{
  "avatar_id": "={{ $json.body.avatar_selection }}",
  "message": "={{ $json.body.message }}"
}
```

---

## 🐛 Troubleshooting

### Error: "Missing API key"

**Cause:** Header not set correctly

**Fix:**
- Check header name is `x-api-key` (lowercase, with dash)
- Verify API key is pasted correctly
- No extra spaces in the key

### Error: "Invalid or inactive API key"

**Cause:** API key is wrong or deactivated

**Fix:**
1. Go to AvatarLab → API Keys page
2. Check status is "active" (green)
3. Create new key if needed

### Error: "Avatar not found"

**Cause:** Avatar ID is incorrect

**Fix:**
1. Verify UUID format (36 characters with dashes)
2. Run SQL: `SELECT id, name FROM avatars`
3. Use correct avatar ID

### Error: "No OpenAI API key found for user"

**Cause:** User hasn't added OpenAI API key in Settings

**Fix:**
1. Go to AvatarLab → Settings → API Management
2. Add OpenAI API key
3. Mark as "active"

### n8n Workflow Not Triggering

**Fix:**
1. Check webhook is "active" in n8n
2. Verify webhook URL is correct in WhatsApp provider
3. Check n8n execution logs for errors

### Response is Slow

**Normal:** First message may take 3-5 seconds
- API fetches data
- RAG search runs
- OpenAI processes

**Too slow (>10 seconds):**
- Check knowledge base size (too many chunks?)
- Use faster model (gpt-4o-mini)
- Reduce conversation history length

---

## ✅ Complete Checklist

- [ ] SQL migration run in Supabase
- [ ] Edge functions deployed (avatar-chat, avatar-config)
- [ ] API key created with all permissions
- [ ] Avatar ID copied
- [ ] n8n workflow created
- [ ] HTTP Request node configured with:
  - [ ] Correct URL
  - [ ] x-api-key header
  - [ ] avatar_id in body
- [ ] Workflow saved and activated
- [ ] WhatsApp provider webhook configured
- [ ] Test message sent successfully
- [ ] Avatar responded correctly

---

## 📚 Quick Reference

**Your API Endpoints:**
```
Chat:   https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat
Config: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-config
```

**Required Headers:**
```
x-api-key: pk_live_your_key_here
Content-Type: application/json
```

**Minimum Request Body:**
```json
{
  "avatar_id": "uuid-here",
  "message": "user message here"
}
```

**n8n Workflow Structure:**
```
Webhook → HTTP Request (AvatarLab API) → Respond to Webhook
```

---

## 🎉 You're Done!

Once everything is set up:
1. ✅ Users can message your WhatsApp number
2. ✅ n8n receives and processes messages
3. ✅ Your avatar responds with personality + knowledge
4. ✅ Responses go back to WhatsApp automatically

**Your avatar is now live on WhatsApp! 🚀**

---

## 💡 Next Steps

- Add conversation memory for context
- Create multiple workflows for different avatars
- Add commands (e.g., "/help", "/reset")
- Track analytics (message count, user engagement)
- Scale to Telegram, Discord, Slack, etc.

**Need help? Check the API Documentation tab in your dashboard!** 📚
