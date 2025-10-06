# 🚀 Deploy Edge Functions - Updated Guide (2024)

The Supabase Dashboard interface has changed. Here's the **current** way to deploy Edge Functions.

---

## ✅ Method 1: Deploy via Supabase Dashboard (Updated Steps)

### Step 1: Go to Edge Functions

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click **"Edge Functions"** in the left sidebar
   - You'll see a page with either:
     - "Create your first function" button, OR
     - A list of existing functions with "+ New Edge Function" button

### Step 2: Create avatar-chat Function

1. **Click the Create/New Function button**
   - Look for "Create your first function" OR "+ New Edge Function"

2. **You'll see one of these options:**

   **Option A: If you see a form:**
   - Function Name: `avatar-chat`
   - Click "Create function" or "Continue"

   **Option B: If you see templates:**
   - Skip templates or select "Blank function"
   - Function Name: `avatar-chat`

3. **You should now see a code editor**
   - Delete any existing code
   - Copy the ENTIRE contents from: `supabase/functions/avatar-chat/index.ts`
   - Paste into the editor

4. **Deploy the function**
   - Click "Deploy" or "Save & Deploy" button
   - Wait for deployment to complete (usually 10-30 seconds)

5. **Verify**
   - You should see: ✅ "Successfully deployed"
   - Note the URL shown: `https://[your-project].supabase.co/functions/v1/avatar-chat`

### Step 3: Create avatar-config Function

1. **Click "+ New Edge Function"** (or similar button)

2. **Create the function:**
   - Function Name: `avatar-config`
   - Click Create/Continue

3. **Paste the code:**
   - Delete existing code
   - Copy from: `supabase/functions/avatar-config/index.ts`
   - Paste into editor

4. **Deploy:**
   - Click "Deploy" or "Save & Deploy"
   - Wait for success message

5. **Verify:**
   - URL: `https://[your-project].supabase.co/functions/v1/avatar-config`

---

## ✅ Method 2: Deploy Using VS Code & Supabase Extension (Easiest!)

If the dashboard is confusing, use VS Code instead:

### Step 1: Install Supabase Extension

1. **Open VS Code**
2. **Go to Extensions** (Ctrl+Shift+X)
3. **Search for**: "Supabase"
4. **Install**: "Supabase" by Supabase (official extension)

### Step 2: Connect to Your Project

1. **Open Command Palette** (Ctrl+Shift+P)
2. **Type**: `Supabase: Start`
3. **Login** when prompted
4. **Select your project**

### Step 3: Deploy Functions

1. **Right-click** on `supabase/functions/avatar-chat` folder
2. **Select**: "Deploy to Supabase"
3. **Repeat** for `supabase/functions/avatar-config`

---

## ✅ Method 3: Manual API Deployment (Works Always)

If UI is confusing, deploy using the Supabase Management API:

### Get Your Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Copy the token

### Deploy avatar-chat

Open PowerShell and run:

```powershell
$token = "YOUR_ACCESS_TOKEN"
$projectRef = "YOUR_PROJECT_REF"

# Read the function code
$code = Get-Content "supabase/functions/avatar-chat/index.ts" -Raw

# Create function
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "avatar-chat"
    verify_jwt = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$projectRef/functions" -Method POST -Headers $headers -Body $body
```

---

## 🎯 Simplest Method: Use Supabase CLI (Already Installed via Scoop)

Since Scoop is now installed, let's use the CLI:

### Step 1: Open NEW PowerShell Window

**Important**: Close your current PowerShell and open a NEW one so Scoop is in PATH.

### Step 2: Install Supabase CLI

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 3: Login

```powershell
supabase login
```

This will open a browser. Login and authorize.

### Step 4: Link Project

```powershell
cd C:\Users\USER\OneDrive\Desktop\AvatarLab
supabase link --project-ref YOUR_PROJECT_REF
```

**To get your project ref:**
- Go to Supabase Dashboard
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Copy the part after `/project/`

### Step 5: Deploy Functions

```powershell
supabase functions deploy avatar-chat
supabase functions deploy avatar-config
```

**Expected output:**
```
Deploying Function avatar-chat (project ref: xxx)
...
Deployed Function avatar-chat successfully
```

### Step 6: Verify

```powershell
supabase functions list
```

Should show both functions as deployed.

---

## ✅ Test Deployment

Once deployed, test with curl:

```powershell
# Test avatar-chat (should return error about missing API key - this is correct!)
curl https://YOUR-PROJECT-REF.supabase.co/functions/v1/avatar-chat
```

**Expected response:**
```json
{"error":"Missing API key. Include x-api-key header."}
```

If you see this error, **it means the function is deployed correctly!** ✅

---

## 🐛 Troubleshooting

### "Function not found" when testing

**Cause**: Function didn't deploy properly

**Solution**:
1. Check Supabase Dashboard → Edge Functions
2. Verify function appears in list
3. Check status is "Active" or "Deployed"

### CLI says "not logged in"

**Solution**:
```powershell
supabase login
```
Browser will open for authentication

### CLI says "project not linked"

**Solution**:
```powershell
supabase link --project-ref YOUR_PROJECT_REF
```

### Can't find project ref

**Solution**:
1. Go to Supabase Dashboard
2. Look at browser URL
3. Copy the ID after `/project/`

Example URL:
```
https://supabase.com/dashboard/project/abcdefghijklmnop
                                         ^^^^^^^^^^^^^^^^
                                         This is your project ref
```

---

## 📌 Recommended Approach

**I recommend using the CLI method** since Scoop is now installed:

1. ✅ Open NEW PowerShell window
2. ✅ Run: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git`
3. ✅ Run: `scoop install supabase`
4. ✅ Run: `supabase login`
5. ✅ Run: `supabase link --project-ref YOUR_REF`
6. ✅ Run: `supabase functions deploy avatar-chat`
7. ✅ Run: `supabase functions deploy avatar-config`

**Total time: 3-5 minutes** 🚀

---

## 🎯 What to Do Next

Once functions are deployed:

1. ✅ **Run SQL Migration**
   - Open `PASTE_THIS_IN_SUPABASE.sql`
   - Copy all contents
   - Paste in Supabase Dashboard → SQL Editor
   - Click "Run"

2. ✅ **Create API Key**
   - Navigate to `/api-keys` in your app
   - Click "Create API Key"
   - Copy the key (shown only once!)

3. ✅ **Test the API**
   ```powershell
   curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/avatar-chat `
     -H "x-api-key: pk_live_YOUR_KEY" `
     -H "Content-Type: application/json" `
     -d '{"avatar_id":"YOUR_AVATAR_ID","message":"Hello"}'
   ```

---

**Need help? The CLI method is most reliable. Just open a fresh PowerShell window and follow the CLI steps above!** ✅
