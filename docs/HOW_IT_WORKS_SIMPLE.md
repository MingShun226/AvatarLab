# 🤖 How AvatarLab API Works with n8n - Simple Explanation

## 📱 The Complete Flow

```
USER (WhatsApp)
    ↓
    📱 Sends message: "Hello!"
    ↓
┌────────────────────────────────────────┐
│  WHATSAPP PROVIDER (Twilio/360Dialog)  │
│  Receives message                      │
└────────────────────────────────────────┘
    ↓
    📤 Forwards to n8n webhook
    ↓
┌────────────────────────────────────────┐
│           N8N WORKFLOW                 │
│                                        │
│  1. Webhook receives message           │
│  2. HTTP Request to AvatarLab API      │
│  3. Get response                       │
│  4. Send back to WhatsApp              │
└────────────────────────────────────────┘
    ↓
    🔗 Calls AvatarLab API with:
    - API Key: pk_live_xxx
    - Avatar ID: abc-123
    - Message: "Hello!"
    ↓
┌────────────────────────────────────────┐
│        AVATARLAB API (Edge Function)   │
│                                        │
│  1. ✅ Verify API key                  │
│  2. 📊 Get avatar from database        │
│  3. 🧠 Get active prompt version       │
│  4. 📚 Search knowledge base (RAG)     │
│  5. 💭 Get memories                    │
│  6. 🎨 Build enriched prompt           │
└────────────────────────────────────────┘
    ↓
    🤖 Calls OpenAI with enriched context
    ↓
┌────────────────────────────────────────┐
│            OPENAI API                  │
│                                        │
│  Receives:                             │
│  - System: "You are Sarah, a friendly  │
│    AI with [personality]...            │
│    Knowledge: [RAG chunks]...          │
│    Memories: [recent events]..."       │
│  - User: "Hello!"                      │
│                                        │
│  Generates response in avatar style    │
└────────────────────────────────────────┘
    ↓
    💬 Response: "Hi! I'm Sarah, nice to meet you!"
    ↓
┌────────────────────────────────────────┐
│        AVATARLAB API                   │
│  Returns to n8n:                       │
│  {                                     │
│    "success": true,                    │
│    "message": "Hi! I'm Sarah..."       │
│  }                                     │
└────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────┐
│           N8N WORKFLOW                 │
│  Extracts message from response        │
└────────────────────────────────────────┘
    ↓
    📤 Sends to WhatsApp Provider
    ↓
┌────────────────────────────────────────┐
│      WHATSAPP PROVIDER                 │
│  Sends message to user                 │
└────────────────────────────────────────┘
    ↓
    📱 User sees: "Hi! I'm Sarah, nice to meet you!"
```

---

## 🔑 Key Components

### 1. **Your API Key** (`pk_live_xxx`)
- Like a password for n8n to access your avatar
- Created in AvatarLab dashboard
- Sent with every request in header

### 2. **Your Avatar ID** (UUID)
- Unique identifier for your avatar
- Tells API which avatar to use
- Format: `123e4567-e89b-12d3-a456-426614174000`

### 3. **AvatarLab API Endpoints**
- **Chat:** `POST /avatar-chat` - Send message, get response
- **Config:** `GET /avatar-config` - Get avatar settings

### 4. **n8n Workflow**
- Connects WhatsApp to your API
- Just passes messages back and forth
- No AI logic - just a messenger

---

## 📋 What n8n Does (Step by Step)

### When User Sends "Hello!"

**Step 1: n8n Receives**
```json
{
  "body": {
    "message": "Hello!",
    "from": "+1234567890"
  }
}
```

**Step 2: n8n Calls Your API**
```bash
POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat

Headers:
  x-api-key: pk_live_your_key_here
  Content-Type: application/json

Body:
{
  "avatar_id": "your-avatar-id",
  "message": "Hello!"
}
```

**Step 3: n8n Gets Response**
```json
{
  "success": true,
  "message": "Hi! I'm Sarah, nice to meet you!"
}
```

**Step 4: n8n Sends to WhatsApp**
```
Text: "Hi! I'm Sarah, nice to meet you!"
To: +1234567890
```

---

## 🧠 What AvatarLab API Does (Step by Step)

### When API Receives Request:

**1. Authenticate** ✅
```
Check: Is pk_live_xxx valid?
Check: Is it active?
Check: Does it have 'chat' permission?
```

**2. Get Avatar Data** 📊
```sql
SELECT * FROM avatars WHERE id = 'avatar-id'
```
Gets: name, personality, backstory, etc.

**3. Get Active Prompt** 🎯
```sql
SELECT * FROM avatar_prompt_versions
WHERE avatar_id = 'avatar-id' AND is_active = true
```
Gets: trained system prompt, behavior rules

**4. Search Knowledge Base** 📚
```
- Generate embedding for "Hello!"
- Search document_chunks for similar content
- Get top 5 most relevant chunks
```

**5. Get Memories** 💭
```sql
SELECT * FROM avatar_memories
WHERE avatar_id = 'avatar-id'
ORDER BY memory_date DESC LIMIT 10
```

**6. Build Enriched Prompt** 🎨
```
System: You are Sarah, a friendly AI assistant.

Your personality: [from training]
Your backstory: [from avatar]

=== KNOWLEDGE BASE ===
[Top 5 relevant chunks from RAG search]
===

=== YOUR MEMORIES ===
[Recent 10 memories]
===

User's question: "Hello!"

Stay in character as Sarah.
```

**7. Call OpenAI** 🤖
```
Send enriched prompt to OpenAI
Get response in Sarah's personality
```

**8. Return Response** 📤
```json
{
  "success": true,
  "message": "Hi! I'm Sarah, nice to meet you!",
  "metadata": {
    "knowledge_chunks_used": 0,
    "memories_accessed": 5
  }
}
```

---

## 🔧 n8n Configuration (The Actual Settings)

### Node 1: Webhook
```
Type: Webhook
Method: POST
Path: whatsapp-webhook
Response: Respond to Webhook
```

### Node 2: HTTP Request
```
Method: POST
URL: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat

Headers:
  x-api-key: pk_live_abc123def456...
  Content-Type: application/json

Body (JSON):
{
  "avatar_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "={{ $json.body.message }}",
  "model": "gpt-4o-mini"
}
```

**Explanation:**
- `={{ $json.body.message }}` = Takes message from webhook
- `pk_live_abc123...` = Your actual API key
- `123e4567...` = Your actual avatar ID

### Node 3: Respond to Webhook
```
Response Body: ={{ $json.message }}
```

**Explanation:**
- Takes `message` field from API response
- Sends it back to WhatsApp

---

## 📊 Data Flow Example

### Example Conversation:

**User:** "What's in your knowledge base?"

**1. n8n → AvatarLab API:**
```json
{
  "avatar_id": "123-abc",
  "message": "What's in your knowledge base?"
}
```

**2. AvatarLab API:**
- ✅ Verifies API key
- 📊 Gets avatar "Sarah"
- 📚 Searches knowledge base for "knowledge base"
- 💡 Finds 3 relevant documents
- 🎨 Builds prompt:
  ```
  You are Sarah...

  Knowledge Base:
  - Document 1: Company policies...
  - Document 2: Product specs...
  - Document 3: FAQ answers...

  User asks: "What's in your knowledge base?"
  ```
- 🤖 Sends to OpenAI
- 💬 Gets: "I have access to company policies, product specs, and FAQs!"

**3. AvatarLab API → n8n:**
```json
{
  "success": true,
  "message": "I have access to company policies, product specs, and FAQs!",
  "metadata": {
    "knowledge_chunks_used": 3
  }
}
```

**4. n8n → WhatsApp:**
```
"I have access to company policies, product specs, and FAQs!"
```

**5. User sees:**
```
Sarah: I have access to company policies,
product specs, and FAQs!
```

---

## ✅ Simple Setup Checklist

1. **Create API Key in AvatarLab** ✅
   - Go to API Keys page
   - Click Create
   - Copy: `pk_live_xxx`

2. **Get Avatar ID** ✅
   - SQL: `SELECT id FROM avatars`
   - Copy UUID

3. **Create n8n Workflow** ✅
   - Add Webhook node
   - Add HTTP Request node
   - Add Respond node

4. **Configure HTTP Request** ✅
   - URL: Your Supabase function URL
   - Header: `x-api-key` with your key
   - Body: Avatar ID + message

5. **Connect to WhatsApp** ✅
   - Get n8n webhook URL
   - Add to Twilio/WhatsApp provider
   - Done!

---

## 🎯 That's It!

**The whole system is just:**
1. User sends message via WhatsApp
2. n8n forwards to AvatarLab API (with API key)
3. API gets avatar data + knowledge + memories
4. API calls OpenAI with enriched context
5. Response goes back through n8n to WhatsApp

**Your API key is the bridge that connects everything!** 🔑

---

## 💡 Common Questions

**Q: Where is the AI logic?**
A: In your AvatarLab API (Edge Function). n8n just passes messages.

**Q: Can I use multiple avatars?**
A: Yes! Just change `avatar_id` in the request.

**Q: Do I need to code?**
A: No! Just configure n8n nodes with your API key and avatar ID.

**Q: What if API key is stolen?**
A: Deactivate it in AvatarLab → API Keys page. Create a new one.

**Q: Can I see API usage?**
A: Yes! AvatarLab → API Keys page shows request count.

---

**Now you understand exactly how it works! Time to set it up! 🚀**
