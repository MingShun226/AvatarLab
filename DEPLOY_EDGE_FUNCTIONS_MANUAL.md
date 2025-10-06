# 🚀 Deploy Edge Functions - Manual Method (No CLI Required)

Since Supabase CLI installation is tricky on Windows, here's how to deploy the Edge Functions **directly through Supabase Dashboard**.

---

## Method 1: Deploy via Supabase Dashboard (Recommended)

### Step 1: Prepare Function Code

**avatar-chat function:**

1. Open file: `supabase/functions/avatar-chat/index.ts`
2. Copy the entire contents

**avatar-config function:**

1. Open file: `supabase/functions/avatar-config/index.ts`
2. Copy the entire contents

### Step 2: Create Functions in Supabase Dashboard

#### Deploy avatar-chat:

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click "Edge Functions" in left sidebar
   - Click "Create a new function"

3. **Create the Function**
   - **Function name**: `avatar-chat`
   - **Template**: Choose "HTTP endpoint"
   - Click "Create function"

4. **Paste the Code**
   - Delete the template code
   - Paste the contents from `supabase/functions/avatar-chat/index.ts`
   - Click "Deploy"

5. **Verify**
   - Check that status shows "Deployed"
   - Note the URL: `https://your-project.supabase.co/functions/v1/avatar-chat`

#### Deploy avatar-config:

1. **Create Second Function**
   - Click "Create a new function"
   - **Function name**: `avatar-config`
   - Template: "HTTP endpoint"

2. **Paste the Code**
   - Delete template
   - Paste contents from `supabase/functions/avatar-config/index.ts`
   - Click "Deploy"

3. **Verify**
   - Status: "Deployed"
   - URL: `https://your-project.supabase.co/functions/v1/avatar-config`

---

## Method 2: Install Supabase CLI via Scoop (Alternative)

If you want to use CLI, install via Scoop (Windows package manager):

### Install Scoop (if not already installed)

Open PowerShell and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Install Supabase CLI

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify Installation

```powershell
supabase --version
```

### Then Deploy Functions

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy avatar-chat
supabase functions deploy avatar-config
```

---

## Method 3: Manual Download (Last Resort)

1. **Download Supabase CLI Binary**
   - Go to: https://github.com/supabase/cli/releases
   - Download the latest Windows binary (.exe)

2. **Add to PATH**
   - Move the .exe to `C:\Program Files\Supabase\`
   - Add to Windows PATH environment variable

3. **Use CLI**
   - Open new PowerShell window
   - Run `supabase login`
   - Deploy functions

---

## ✅ Verify Deployment

Test both endpoints with curl:

### Test avatar-chat:

```powershell
curl -X POST https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-chat `
  -H "Content-Type: application/json" `
  -d '{"test":"test"}'
```

**Expected**: Error about missing API key (this is correct!)

```json
{"error":"Missing API key. Include x-api-key header."}
```

### Test avatar-config:

```powershell
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-config
```

**Expected**: Same error about missing API key

```json
{"error":"Missing API key. Include x-api-key header."}
```

---

## 🎯 Next Steps

Once functions are deployed:

1. ✅ Run the SQL migration (`PASTE_THIS_IN_SUPABASE.sql`)
2. ✅ Navigate to `/api-keys` page in your app
3. ✅ Create an API key
4. ✅ Test with real API key:

```powershell
curl -X POST https://YOUR-PROJECT-ID.supabase.co/functions/v1/avatar-chat `
  -H "x-api-key: pk_live_YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{\"avatar_id\":\"YOUR_AVATAR_ID\",\"message\":\"Hello\"}'
```

---

## 🐛 Troubleshooting

### Functions not showing in dashboard

- Refresh the page
- Check "Edge Functions" section in left sidebar
- Ensure you're in the correct project

### Deploy button grayed out

- Check for syntax errors in code
- Ensure function name is valid (lowercase, no spaces)

### Function returns 500 error

- Check function logs in Supabase Dashboard
- Verify environment variables are set
- Test SQL functions work first

---

## 📝 Which Method Should I Use?

- **New to Supabase**: Use **Method 1** (Dashboard)
- **Comfortable with CLI**: Use **Method 2** (Scoop)
- **Need offline binary**: Use **Method 3** (Manual download)

---

**Recommendation: Start with Method 1 (Dashboard) - it's the easiest!** 🚀
