# 🔧 Complete Fix for n8n Integration

## ✅ Step-by-Step Fix

### Issue 1: Missing Authorization Header ✅ FIXED
### Issue 2: Missing Database Function ⬅️ FIX THIS NOW

---

## 🚀 Quick Fix (2 Steps)

### Step 1: Add Missing Database Function

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy this SQL:**

```sql
CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE platform_api_keys
    SET
        request_count = request_count + 1,
        last_used_at = NOW()
    WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. **Paste and Click "Run"**
4. **Verify:** Should say "Success"

**OR use the file:** `FIX_API_FUNCTION.sql`

### Step 2: Redeploy Edge Functions

Since we fixed the code, you need to redeploy:

**Option A: Via Dashboard (Easiest)**
1. Go to Supabase Dashboard → Edge Functions
2. Click on `avatar-chat`
3. Replace code with updated version from: `supabase/functions/avatar-chat/index.ts`
4. Click "Deploy"
5. Repeat for `avatar-config`

**Option B: Via CLI**
```powershell
supabase functions deploy avatar-chat
supabase functions deploy avatar-config
```

---

## ✅ After Fix - Test Again

Your n8n should now work with these **3 headers**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA

x-api-key: pk_live_YOUR_API_KEY

Content-Type: application/json
```

---

## 🧪 Test Command

```powershell
curl -X POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdHJ0cWRnZ2hhbndkdWp5aGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjE1MzEsImV4cCI6MjA3NDUzNzUzMX0.sniz2dGyadAa3BvZJ2Omi6thtVWuqMjTFFdM1H_zWAA" `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{"avatar_id":"9a567d58-cb5b-497d-869a-d6a8d61a8b4e","message":"Hello!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hi! I'm [Your Avatar]...",
  "metadata": {
    "model": "gpt-4o-mini",
    "knowledge_chunks_used": 0,
    "memories_accessed": 0
  }
}
```

---

## 📝 What We Fixed

### Problem 1: Missing Authorization ✅
- **Issue:** Supabase requires `Authorization: Bearer [anon-key]`
- **Fix:** Added to n8n headers

### Problem 2: SQL Function Error ✅
- **Issue:** `supabase.sql` template tag doesn't exist
- **Fix:** Created `increment_api_key_usage()` function
- **Fix:** Updated Edge Functions to use the function

---

## ✅ Final Checklist

- [ ] Run SQL: `CREATE OR REPLACE FUNCTION increment_api_key_usage...`
- [ ] Redeploy `avatar-chat` function
- [ ] Redeploy `avatar-config` function
- [ ] Test with curl (should work!)
- [ ] Test in n8n (should work!)
- [ ] Connect to WhatsApp 🎉

---

## 🎯 Summary

**What you need in n8n HTTP Request:**

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/avatar-chat` |
| Header 1 | `Authorization: Bearer [supabase-anon-key]` |
| Header 2 | `x-api-key: pk_live_[your-key]` |
| Header 3 | `Content-Type: application/json` |
| Body | `{"avatar_id":"...","message":"={{ $json.body.message }}"}` |

**That's it!** 🚀
