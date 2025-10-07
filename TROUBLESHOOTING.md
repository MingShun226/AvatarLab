# Troubleshooting - 500 Internal Server Error

## Error You're Seeing

```
POST https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/generate-image-unified 500 (Internal Server Error)
Error: Edge Function returned a non-2xx status code
```

## 🔍 Root Cause

The error is happening because one (or more) of these issues:

### Issue 1: `user_api_keys` Table Doesn't Exist ❌
The edge function is trying to query `user_api_keys` table, but it doesn't exist yet.

**Solution:** Run the migration!

### Issue 2: Edge Function Not Deployed ❌
The `generate-image-unified` function hasn't been deployed to Supabase.

**Solution:** Deploy the function!

### Issue 3: No API Key Available ❌
Neither user API key nor platform API key is configured.

**Solution:** Add an API key!

---

## ✅ Step-by-Step Fix

### Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the migration SQL**
   - Open: `supabase/migrations/20251007000001_create_user_api_keys_and_update_images.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success message

5. **Verify Table Exists**
   Run this query:
   ```sql
   SELECT * FROM user_api_keys LIMIT 1;
   ```
   Should return: "No rows" (that's OK, means table exists!)

---

### Step 2: Deploy Edge Function

**Option A: Deploy via Supabase Dashboard (Easiest)**

1. Go to **Edge Functions** in Supabase Dashboard
2. Check if `generate-image-unified` exists
3. If not, you need to deploy it

**Option B: Deploy via Git (If using GitHub integration)**

1. Push your code to GitHub
2. Supabase will auto-deploy

**Option C: Manual Upload**

1. Copy contents of `supabase/functions/generate-image-unified/index.ts`
2. In Supabase Dashboard → Edge Functions
3. Create new function: `generate-image-unified`
4. Paste the code
5. Deploy

---

### Step 3: Add Your API Key

**Add via Settings (User API Key):**

1. Open your app → **Settings** → **API Management** tab
2. Click "Add New API Key"
3. Fill in:
   - **Key Name**: `My OpenAI Key`
   - **Service**: `openai` (exactly like this, lowercase!)
   - **API Key**: `sk-proj-your-actual-openai-key`
4. Click "Add API Key"

**Or Add via Supabase Secrets (Platform Key):**

1. Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. Click "New Secret"
3. Name: `OPENAI_API_KEY`
4. Value: `sk-proj-your-openai-key`
5. Click "Save"

---

### Step 4: Test Again

1. Refresh your app (hard refresh: Ctrl+Shift+R)
2. Go to **Images Studio**
3. Select "OpenAI DALL-E 3"
4. Enter prompt: `a cute cat`
5. Click "Generate Image"

---

## 🔍 How to Check Edge Function Logs

To see the actual error from the edge function:

### Option A: Supabase Dashboard
1. Go to **Edge Functions** in dashboard
2. Click on `generate-image-unified`
3. Click on **Logs** tab
4. Look for recent errors

### Option B: Browser Console
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try generating an image
4. Click on the failed `generate-image-unified` request
5. Click "Response" tab to see error details

---

## 🎯 Most Likely Issues & Quick Fixes

### "relation 'user_api_keys' does not exist"
```
❌ Error: relation "public.user_api_keys" does not exist
```
**Fix:** Run the migration (Step 1 above)

### "No API key configured for openai"
```
❌ Error: No API key configured for openai. Please add your API key in Settings > API Management.
```
**Fix:** Add your OpenAI API key (Step 3 above)

### "Invalid API key"
```
❌ Error: OpenAI API error: 401 Unauthorized
```
**Fix:**
- Check your OpenAI API key is correct
- Make sure you added credits to your OpenAI account
- Get a new key from https://platform.openai.com/api-keys

### "Insufficient credits"
```
❌ Error: You exceeded your current quota
```
**Fix:** Add credits at https://platform.openai.com/settings/organization/billing

---

## 📋 Quick Verification Checklist

Run these checks to diagnose:

### ✅ Check 1: Table Exists
```sql
-- Run in Supabase SQL Editor
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_api_keys';
```
Should return: `id, user_id, name, service, api_key_encrypted, status, last_used_at, created_at, updated_at`

### ✅ Check 2: Edge Function Deployed
Go to: https://xatrtqdgghanwdujyhkq.supabase.co/functions/v1/generate-image-unified

Should return: `{"error":"Authentication required"}` (that's good!)

If returns 404: Function not deployed

### ✅ Check 3: API Key Added
```sql
-- Run in Supabase SQL Editor (only if logged in to Supabase)
SELECT id, name, service, status FROM user_api_keys WHERE user_id = auth.uid();
```
Should show your API key if added via Settings

---

## 🚀 Complete Fix Sequence

If you haven't done ANY setup yet:

1. ✅ Run migration → `user_api_keys` table created
2. ✅ Deploy function → `generate-image-unified` is live
3. ✅ Add API key → Either in Settings or Supabase secrets
4. ✅ Refresh app → Try generating image
5. ✅ Success! 🎉

---

## 💬 Still Getting Errors?

If you've done all the above and still getting errors:

1. **Check browser console** - Look for the exact error message
2. **Check Supabase logs** - Edge Functions → generate-image-unified → Logs
3. **Share the error** - Copy the exact error message from logs

---

## 📞 Need More Help?

Check these files:
- `AI_IMAGES_QUICK_START.md` - Quick setup guide
- `docs/STEP_BY_STEP_IMPLEMENTATION.md` - Detailed implementation
- `docs/DEPLOYMENT_CHECKLIST.md` - Pre-launch checklist

---

**Most Common Fix:** Run the migration first! 90% of 500 errors are because `user_api_keys` table doesn't exist yet.
