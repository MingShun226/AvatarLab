# 🚀 AvatarLab API Integration - Deployment Checklist

This checklist will guide you through deploying the complete API integration system for n8n and external services.

---

## ✅ Pre-Deployment Checklist

### Database Migrations

- [ ] **Run Migration 1**: Create platform API keys tables
  - File: `supabase/migrations/20251005000000_create_platform_api_keys.sql`
  - Location: Supabase Dashboard > SQL Editor
  - Creates: `platform_api_keys`, `api_request_logs`, `n8n_integrations` tables

- [ ] **Run Migration 2**: Add RAG search function
  - File: `supabase/migrations/20251005000001_add_rag_search_function.sql`
  - Location: Supabase Dashboard > SQL Editor
  - Creates: `search_knowledge_chunks()` and `verify_platform_api_key()` functions

- [ ] **Verify Tables Exist**
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('platform_api_keys', 'api_request_logs', 'n8n_integrations');
  ```
  Should return 3 rows

---

## 🚀 Supabase Edge Functions Deployment

### Prerequisites

- [ ] **Install Supabase CLI**
  ```bash
  npm install -g supabase
  ```

- [ ] **Login to Supabase**
  ```bash
  supabase login
  ```

- [ ] **Link Your Project**
  ```bash
  supabase link --project-ref YOUR_PROJECT_ID
  ```

### Deploy Functions

- [ ] **Deploy avatar-chat function**
  ```bash
  supabase functions deploy avatar-chat
  ```
  - Endpoint: `POST /avatar-chat`
  - Purpose: Send messages to avatars

- [ ] **Deploy avatar-config function**
  ```bash
  supabase functions deploy avatar-config
  ```
  - Endpoint: `GET /avatar-config`
  - Purpose: Get avatar configuration

### Verify Deployment

- [ ] **Test avatar-chat endpoint**
  ```bash
  curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-chat
  ```
  Should return: `{"error":"Missing API key..."}`

- [ ] **Test avatar-config endpoint**
  ```bash
  curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-config
  ```
  Should return: `{"error":"Missing API key..."}`

---

## 🎨 Frontend Integration

### Update App Routes

- [✅] **Import APIKeys page** in `src/App.tsx` (Already done)
- [✅] **Add route** `/api-keys` (Already done)

### Test API Keys Page

- [ ] **Navigate to `/api-keys`**
- [ ] **Verify page loads** without errors
- [ ] **Check UI elements**:
  - [ ] "Create API Key" button visible
  - [ ] Empty state message if no keys
  - [ ] Back to Dashboard button works

---

## 🔑 Create Your First API Key

- [ ] **Login to your AvatarLab account**

- [ ] **Navigate to API Keys page** (`/api-keys`)

- [ ] **Click "Create API Key"**

- [ ] **Fill in details**:
  - Name: "Test Key" or "n8n WhatsApp Bot"
  - Avatar Scope: Select an avatar or "All Avatars"
  - Permissions: Check `chat`, `config`, `knowledge`
  - Description: Optional

- [ ] **Copy the API key** (save it securely!)
  - Format: `pk_live_xxxxxxxxxxxxxxxxx`
  - ⚠️ You can only see it once!

- [ ] **Verify key appears in table**
  - Status should be "active"
  - Request count should be 0

---

## 🧪 Test the API

### Test 1: Chat Endpoint

```bash
curl -X POST https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-chat \
  -H "x-api-key: pk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar_id": "YOUR_AVATAR_ID",
    "message": "Hello! Tell me about yourself"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hi! I'm [Avatar Name]...",
  "metadata": {
    "knowledge_chunks_used": 0,
    "memories_accessed": 0
  }
}
```

- [ ] **Test passes** ✅
- [ ] **Response contains avatar reply** ✅
- [ ] **No errors in response** ✅

### Test 2: Config Endpoint

```bash
curl -X GET "https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-config?avatar_id=YOUR_AVATAR_ID" \
  -H "x-api-key: pk_live_YOUR_API_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "avatar": {
    "id": "...",
    "name": "..."
  }
}
```

- [ ] **Test passes** ✅
- [ ] **Avatar data returned** ✅
- [ ] **No errors** ✅

### Test 3: Check Request Logs

```sql
-- In Supabase SQL Editor
SELECT * FROM api_request_logs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

- [ ] **Logs show your test requests** ✅
- [ ] **Status codes are 200** ✅

---

## 🔗 n8n Integration Setup

### Import Workflow Template

- [ ] **Download template**
  - File: `docs/n8n-workflow-template.json`

- [ ] **Import to n8n**
  - Open n8n
  - Click "Import from File"
  - Select template JSON

- [ ] **Configure workflow**
  - Replace `YOUR_AVATARLAB_API_KEY` with your actual key
  - Replace `YOUR_AVATAR_ID` with your avatar's UUID
  - Replace `YOUR-PROJECT-ID.supabase.co` with your Supabase URL

### Test n8n Workflow

- [ ] **Activate workflow** in n8n

- [ ] **Test with manual trigger**
  - Input: `{"body": {"message": "Hello"}}`
  - Expected: Avatar response in output

- [ ] **Verify execution logs** show success

---

## 📱 WhatsApp Integration (Optional)

### Prerequisites

- [ ] **WhatsApp Business API access** or
- [ ] **Third-party service** (Twilio, MessageBird, etc.)

### Setup

- [ ] **Get WhatsApp webhook URL** from n8n
  - Format: `https://your-n8n.com/webhook/whatsapp-incoming`

- [ ] **Configure WhatsApp provider** to send messages to n8n webhook

- [ ] **Test end-to-end**:
  - Send WhatsApp message
  - Verify n8n receives it
  - Verify avatar responds
  - Verify response sent to WhatsApp

---

## 🔒 Security Checks

- [ ] **API keys are not committed to Git**
  ```bash
  git grep "pk_live_" # Should return no results
  ```

- [ ] **Environment variables configured**
  - Add API keys to `.env` (not `.env.example`)
  - Verify `.env` is in `.gitignore`

- [ ] **Supabase RLS policies active**
  ```sql
  SELECT tablename, policyname FROM pg_policies
  WHERE tablename = 'platform_api_keys';
  ```
  Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

- [ ] **Test unauthorized access fails**
  ```bash
  # Test without API key
  curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-chat
  # Should return 401 error
  ```

---

## 📊 Monitor & Maintain

### Daily Checks

- [ ] **Check API usage**
  - Go to `/api-keys` page
  - Review request counts

- [ ] **Check for errors**
  - Supabase Dashboard > Edge Functions > Logs
  - Look for 500 errors

### Weekly Checks

- [ ] **Review request logs**
  ```sql
  SELECT endpoint, status_code, COUNT(*)
  FROM api_request_logs
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY endpoint, status_code;
  ```

- [ ] **Check for unusual activity**
  - High request counts
  - Failed authentication attempts

### Monthly Maintenance

- [ ] **Rotate API keys** (recommended every 3 months)
  - Create new key
  - Update n8n workflow
  - Delete old key

- [ ] **Clean up old request logs** (optional)
  ```sql
  DELETE FROM api_request_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  ```

---

## 📚 Documentation Links

- **API Documentation**: `/public/api-docs.html`
- **Integration Guide**: `/docs/API_INTEGRATION_GUIDE.md`
- **n8n Template**: `/docs/n8n-workflow-template.json`

---

## 🐛 Troubleshooting

### Issue: "Missing API key" error

**Solution**:
- Verify header is `x-api-key` (lowercase, with hyphen)
- Check API key is copied correctly (no extra spaces)

### Issue: "Avatar not found"

**Solution**:
- Verify avatar ID is correct (UUID format)
- Check avatar belongs to same user as API key
- If API key is scoped to specific avatar, use that avatar ID

### Issue: Edge functions return 500

**Solution**:
- Check Supabase logs for error details
- Verify OpenAI API key is added in Settings
- Test database functions work:
  ```sql
  SELECT verify_platform_api_key('test_key');
  ```

### Issue: n8n workflow fails

**Solution**:
- Check execution logs in n8n
- Verify API key has `chat` permission
- Test API directly with curl first

---

## ✅ Deployment Complete!

Once all items are checked:

- ✅ Database migrations applied
- ✅ Edge functions deployed
- ✅ API key created and tested
- ✅ n8n workflow configured
- ✅ Security checks passed

**You're ready to integrate your avatars with external services! 🎉**

---

## 📞 Need Help?

- Check the full guide: `docs/API_INTEGRATION_GUIDE.md`
- Review API docs: `public/api-docs.html`
- Create a GitHub issue for bugs

**Happy building! 🚀**
