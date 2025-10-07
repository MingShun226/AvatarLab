# Fix: Images Generated but Not Showing in Gallery

## 🔍 Problem

Image generation succeeds and shows "Image generated!" toast, but:
- ❌ Gallery remains empty
- ❌ `generated_images` table is empty
- ❌ No errors shown to user

## 🎯 Root Causes

### Issue 1: Schema Mismatch ⚠️
**Edge function tries to insert:**
```javascript
generation_type: 'text-to-image'  // ✗ Wrong format
```

**But your table expects:**
```sql
generation_type CHECK (generation_type IN ('text2img', 'img2img', 'inpaint'))
```

### Issue 2: Foreign Key Mismatch ⚠️
**Your table has:**
```sql
FOREIGN KEY (user_id) REFERENCES profiles(id)
```

**But edge function uses:**
```javascript
user_id: user.id  // from auth.users
```

**If `profiles` table doesn't have matching records, insert fails!**

---

## ✅ Solutions

### Solution 1: Deploy Fixed Edge Function (Required)

I've already updated the code. Now you need to deploy it:

```bash
# Deploy the fixed function
supabase functions deploy generate-image-unified
```

**Or if using Git:** Push your code (auto-deploys)

**What changed:**
- ✅ Now uses `generation_type: 'text2img'` (correct format)
- ✅ Includes `negative_prompt`, `width`, `height`
- ✅ Returns error if database insert fails (for debugging)

---

### Solution 2: Fix Foreign Key Issue

Run this in **Supabase SQL Editor**:

```sql
-- Option A: Check if profiles exist for your user
SELECT
    u.id as user_id,
    p.id as profile_id,
    CASE
        WHEN u.id = p.id THEN 'MATCH ✓'
        ELSE 'MISSING ✗'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = auth.uid();
```

**If profile is MISSING:**

```sql
-- Create profile for your user
INSERT INTO profiles (id)
SELECT id FROM auth.users
WHERE id = auth.uid()
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid());
```

**Or change foreign key to auth.users:**

```sql
-- Drop old constraint
ALTER TABLE generated_images
DROP CONSTRAINT generated_images_user_id_fkey;

-- Add new constraint to auth.users
ALTER TABLE generated_images
ADD CONSTRAINT generated_images_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

### Solution 3: Test Database Insert Manually

Run this to test if insert works:

```sql
-- Test insert
INSERT INTO generated_images (
    user_id,
    prompt,
    image_url,
    generation_type,
    provider,
    width,
    height
) VALUES (
    auth.uid(),
    'Test prompt',
    'https://example.com/test.png',
    'text2img',
    'openai',
    1024,
    1024
);

-- Check if it worked
SELECT * FROM generated_images WHERE user_id = auth.uid();

-- Clean up test
DELETE FROM generated_images WHERE prompt = 'Test prompt';
```

**If this fails, you'll see the exact error!**

---

## 🔧 Step-by-Step Fix

### Step 1: Deploy Fixed Function

```bash
supabase functions deploy generate-image-unified
```

### Step 2: Fix Foreign Key

Choose one:

**Option A: Create Profile**
```sql
INSERT INTO profiles (id)
SELECT id FROM auth.users
WHERE id = auth.uid()
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid());
```

**Option B: Change FK to auth.users**
```sql
ALTER TABLE generated_images DROP CONSTRAINT generated_images_user_id_fkey;
ALTER TABLE generated_images ADD CONSTRAINT generated_images_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Step 3: Test

1. Refresh your app (Ctrl+Shift+R)
2. Go to **Images Studio**
3. Generate a new image
4. Should see it in gallery! ✅

---

## 🔍 How to Debug

### Check Edge Function Logs

1. **Supabase Dashboard** → **Edge Functions**
2. Click **generate-image-unified**
3. Go to **Logs** tab
4. Generate an image
5. Look for errors

**Common errors you might see:**

```
❌ insert or update on table "generated_images" violates foreign key constraint
→ Profile doesn't exist, run Solution 2

❌ new row for relation "generated_images" violates check constraint "generated_images_generation_type_check"
→ Wrong generation_type, deploy fixed function (Solution 1)

❌ null value in column "width" violates not-null constraint
→ Deploy fixed function (Solution 1)
```

---

### Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Generate image
4. Look for errors

**Good response:**
```javascript
{
  success: true,
  provider: "openai",
  imageUrl: "https://...",
  status: "completed"
}
```

**Bad response (shows the issue):**
```javascript
{
  error: "Failed to save image to database",
  details: "foreign key constraint violation",
  code: "23503"
}
```

---

### Check Network Tab

1. DevTools → **Network** tab
2. Generate image
3. Click `generate-image-unified` request
4. Check **Response** tab

Should see exact error from edge function.

---

## 📋 Verification Checklist

After applying fixes:

- [ ] Edge function deployed (check deployment logs)
- [ ] Foreign key issue resolved (test insert works)
- [ ] Generate new image
- [ ] Image appears in gallery immediately
- [ ] Can download image
- [ ] Can favorite image
- [ ] Can delete image
- [ ] Gallery persists on page refresh

---

## 💡 Why Images Aren't Stored in Supabase Storage

**You don't need Supabase Storage!** The images are stored at the AI provider's URL:

- **OpenAI:** Images stored on OpenAI's servers (temporary, ~1 hour)
- **Stability AI:** Base64 encoded in response (stored in database)
- **KIE AI:** Images stored on KIE's servers

**The `image_url` column stores the URL**, not the actual file.

### Optional: Download and Store in Supabase Storage

If you want permanent storage:

1. Download image from provider URL
2. Upload to Supabase Storage
3. Update `image_url` to Supabase Storage URL

**But for now, just storing the URL works fine!**

---

## 🎯 Quick Test

After fixes, run this to verify everything:

```sql
-- 1. Check foreign key is correct
SELECT constraint_name, table_name FROM information_schema.table_constraints
WHERE table_name = 'generated_images' AND constraint_type = 'FOREIGN KEY';

-- 2. Test insert
INSERT INTO generated_images (user_id, prompt, image_url, generation_type, provider, width, height)
VALUES (auth.uid(), 'Test', 'https://example.com/test.png', 'text2img', 'openai', 1024, 1024);

-- 3. Check it's there
SELECT * FROM generated_images WHERE user_id = auth.uid();

-- 4. Clean up
DELETE FROM generated_images WHERE prompt = 'Test';
```

All should work without errors! ✅

---

## 🚀 After Fix

1. Deploy function
2. Fix foreign key
3. Test generation
4. Images show in gallery
5. Everything works! 🎉

---

**Files to check:**
- `FIX_DATABASE_SCHEMA.sql` - Detailed SQL fixes
- Edge function already updated in code
- Service layer already updated in code

**Just deploy and test!** 🚀
