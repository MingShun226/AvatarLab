# 🤖 AvatarLab API Integration Guide

Complete guide to integrate your AvatarLab avatars with n8n, WhatsApp, and other external services.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [Supabase Edge Functions Deployment](#supabase-edge-functions-deployment)
4. [API Key Management](#api-key-management)
5. [n8n Integration](#n8n-integration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- ✅ AvatarLab account with at least one avatar created
- ✅ Avatar has training data, knowledge base, or memories configured
- ✅ Supabase project set up
- ✅ n8n instance (cloud or self-hosted)

### Overview

The AvatarLab API allows you to:
- ✨ Send messages to your avatars via API
- 📚 Access avatar configuration, knowledge base, and memories
- 🔄 Integrate with n8n, Make, Zapier, or custom apps
- 💬 Build WhatsApp bots, Telegram bots, or any chat interface

---

## 🗄️ Database Setup

### Step 1: Run Database Migrations

Execute the following SQL files in your Supabase SQL Editor:

#### Migration 1: Platform API Keys Table

```sql
-- File: supabase/migrations/20251005000000_create_platform_api_keys.sql
-- Creates tables for API key management, request logging, and n8n integrations
```

Run this migration in **Supabase Dashboard > SQL Editor**:
1. Copy contents of `supabase/migrations/20251005000000_create_platform_api_keys.sql`
2. Paste into SQL Editor
3. Click "Run"

#### Migration 2: RAG Search Function

```sql
-- File: supabase/migrations/20251005000001_add_rag_search_function.sql
-- Creates helper function for knowledge base search
```

Run this migration the same way.

### Step 2: Verify Tables Created

Check that these tables exist:
- ✅ `platform_api_keys` - Stores API keys
- ✅ `api_request_logs` - Logs all API requests
- ✅ `n8n_integrations` - Optional n8n settings

---

## 🚀 Supabase Edge Functions Deployment

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### Step 4: Deploy Edge Functions

Deploy the chat endpoint:

```bash
supabase functions deploy avatar-chat
```

Deploy the config endpoint:

```bash
supabase functions deploy avatar-config
```

### Step 5: Verify Deployment

Check your functions at:
- `https://YOUR_PROJECT_ID.supabase.co/functions/v1/avatar-chat`
- `https://YOUR_PROJECT_ID.supabase.co/functions/v1/avatar-config`

---

## 🔑 API Key Management

### Creating an API Key

1. **Navigate to API Keys Page**
   - Login to AvatarLab
   - Go to `/api-keys` or click "API Keys" in the menu

2. **Create New Key**
   - Click "Create API Key"
   - Fill in details:
     - **Name**: e.g., "n8n WhatsApp Bot"
     - **Avatar Scope**: Select specific avatar or "All Avatars"
     - **Permissions**: Check `chat`, `config`, `knowledge`
     - **Description**: Optional notes

3. **Save Your Key**
   - **⚠️ IMPORTANT**: Copy your API key immediately!
   - You won't be able to see it again
   - Store it securely (use environment variables)

### API Key Format

```
pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Managing Keys

- **View Usage**: See request count and last used date
- **Activate/Deactivate**: Toggle key status
- **Delete**: Permanently revoke access

---

## 🔗 n8n Integration

### Option 1: Import Pre-built Workflow

1. **Download Template**
   - Get `docs/n8n-workflow-template.json`

2. **Import to n8n**
   - Open n8n
   - Click "Import from File"
   - Select the template JSON

3. **Configure**
   - Replace `YOUR_AVATARLAB_API_KEY`
   - Replace `YOUR_AVATAR_ID`
   - Replace `YOUR-PROJECT-ID.supabase.co`

### Option 2: Manual Setup

#### Node 1: Webhook Trigger (WhatsApp)

- **Type**: Webhook
- **Path**: `/whatsapp-webhook`
- **Method**: POST

#### Node 2: HTTP Request to AvatarLab

- **Method**: POST
- **URL**: `https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-chat`
- **Headers**:
  ```json
  {
    "x-api-key": "pk_live_your_key_here",
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "avatar_id": "your-avatar-uuid",
    "message": "{{ $json.body.message }}",
    "conversation_history": [],
    "model": "gpt-4o-mini"
  }
  ```

#### Node 3: Response

- **Type**: Respond to Webhook
- **Response Body**: `{{ $json.message }}`

### Advanced: Conversation Memory

To maintain context across messages, store conversation history:

#### Add Database Node

- **Type**: PostgreSQL / Redis / MongoDB
- **Action**: Store conversation
- **Key**: `conversation_{{user_phone_number}}`
- **Value**: Array of messages

#### Modify HTTP Request Body

```json
{
  "avatar_id": "your-avatar-uuid",
  "message": "{{ $json.body.message }}",
  "conversation_history": "={{ $node['Get Conversation'].json.history || [] }}",
  "model": "gpt-4o-mini"
}
```

---

## 🧪 Testing

### Test with cURL

#### Test Chat Endpoint

```bash
curl -X POST https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-chat \
  -H "x-api-key: pk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar_id": "your-avatar-uuid",
    "message": "Hello! Tell me about yourself",
    "model": "gpt-4o-mini"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "avatar_id": "your-avatar-uuid",
  "message": "Hi! I'm Sarah, an AI assistant...",
  "metadata": {
    "model": "gpt-4o-mini",
    "knowledge_chunks_used": 3,
    "memories_accessed": 5
  }
}
```

#### Test Config Endpoint

```bash
curl -X GET "https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-config?avatar_id=your-avatar-uuid" \
  -H "x-api-key: pk_live_your_key_here"
```

**Expected Response:**

```json
{
  "success": true,
  "avatar": {
    "id": "...",
    "name": "Sarah",
    "personality_traits": ["friendly", "helpful"]
  },
  "active_prompt": {
    "version_number": 3,
    "system_prompt": "You are Sarah..."
  },
  "knowledge_base": {
    "files_count": 5
  }
}
```

### Test in n8n

1. **Manual Trigger**: Click "Execute Workflow" in n8n
2. **Send Test Data**: Use n8n's test webhook feature
3. **Check Logs**: View execution logs for errors

---

## 🐛 Troubleshooting

### Common Errors

#### Error: "Missing API key"

**Cause**: Header `x-api-key` not included

**Solution**:
```bash
# Add header to request
-H "x-api-key: pk_live_your_key_here"
```

#### Error: "Invalid or inactive API key"

**Causes**:
1. API key is incorrect
2. API key is deactivated
3. API key was deleted

**Solution**:
- Verify key in AvatarLab dashboard
- Check key status (should be "active")
- Create a new key if needed

#### Error: "API key does not have chat permission"

**Cause**: Key doesn't have required scope

**Solution**:
- Go to API Keys page
- Create new key with `chat` permission checked

#### Error: "Avatar not found"

**Causes**:
1. Avatar ID is incorrect
2. Avatar belongs to different user
3. API key is scoped to different avatar

**Solution**:
- Verify avatar ID in AvatarLab dashboard
- Check API key's avatar scope

#### Error: "No OpenAI API key found for user"

**Cause**: User hasn't added OpenAI API key

**Solution**:
- Go to Settings > API Keys
- Add OpenAI API key
- Make sure it's marked as "active"

### Edge Function Issues

#### Functions not deploying

```bash
# Re-deploy with verbose output
supabase functions deploy avatar-chat --debug
```

#### Function returns 500 error

**Check Supabase Logs**:
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click on function name
4. View "Logs" tab

#### CORS errors

**Cause**: CORS headers not configured

**Solution**: Edge functions already include CORS headers. If issue persists:
- Check browser console for exact error
- Verify API key is in headers, not query params

### Database Issues

#### RLS Policy Blocking Access

**Check Policies**:
```sql
-- Verify RLS policies
SELECT * FROM platform_api_keys WHERE user_id = 'YOUR_USER_ID';
```

**If empty**: Check that user is authenticated

#### Missing Tables

**Re-run Migrations**:
```sql
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'platform_api_keys';
```

**If not found**: Re-run migration SQL

---

## 📊 Monitoring & Analytics

### View API Usage

```sql
-- Total requests per API key
SELECT
    pak.key_name,
    pak.request_count,
    COUNT(arl.id) as logged_requests,
    pak.last_used_at
FROM platform_api_keys pak
LEFT JOIN api_request_logs arl ON arl.api_key_id = pak.id
WHERE pak.user_id = 'YOUR_USER_ID'
GROUP BY pak.id;
```

### View Recent Requests

```sql
-- Last 100 API requests
SELECT
    pak.key_name,
    arl.endpoint,
    arl.method,
    arl.status_code,
    arl.created_at
FROM api_request_logs arl
JOIN platform_api_keys pak ON pak.id = arl.api_key_id
WHERE arl.user_id = 'YOUR_USER_ID'
ORDER BY arl.created_at DESC
LIMIT 100;
```

---

## 🔐 Security Best Practices

1. **Never Commit API Keys**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Rotate Keys Regularly**
   - Create new key
   - Update integrations
   - Delete old key

3. **Use Scoped Keys**
   - Limit to specific avatar when possible
   - Only grant required permissions

4. **Monitor Usage**
   - Check request logs regularly
   - Set up alerts for unusual activity

5. **Use HTTPS Only**
   - Never send API keys over HTTP
   - Verify SSL certificates

---

## 📚 Additional Resources

- [API Documentation](../public/api-docs.html) - Full API reference
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [n8n Documentation](https://docs.n8n.io/)

---

## 💬 Support

Need help? Create an issue on GitHub or contact support.

**Happy Building! 🚀**
