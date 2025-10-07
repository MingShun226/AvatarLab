# API Keys Quick Setup Guide

## 🔑 Required API Keys

### 1. OpenAI API Key (Recommended - Highest Quality)

**Get Your Key:**
1. Visit: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-` or `sk-`)
5. **IMPORTANT**: Add credits to your account at https://platform.openai.com/settings/organization/billing

**Add to Supabase:**
```
Name: OPENAI_API_KEY
Value: sk-proj-your-key-here
```

**Pricing**: ~$0.04-0.08 per image (1024x1024)

---

### 2. Stability AI API Key (Optional - Great for Art)

**Get Your Key:**
1. Visit: https://platform.stability.ai/account/keys
2. Sign up or log in
3. Click "Create API Key"
4. Copy the key (starts with `sk-`)
5. **IMPORTANT**: Add credits to your account

**Add to Supabase:**
```
Name: STABILITY_API_KEY
Value: sk-your-stability-key-here
```

**Pricing**: ~$0.003-0.01 per image

---

### 3. KIE AI API Key (Optional - Already Configured?)

**Get Your Key:**
1. Visit: https://kie.ai (if you don't have it)
2. You may already have this from previous setup

**Add to Supabase:**
```
Name: KIE_AI_API_KEY
Value: your-kie-key-here
```

---

## 🚀 How to Add Keys to Supabase

### Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on **Project Settings** (gear icon in sidebar)
3. Navigate to **Edge Functions** section
4. Click on **Secrets** tab
5. Click **"New Secret"** button
6. Enter the name and value for each key:
   - `OPENAI_API_KEY` = your OpenAI key
   - `STABILITY_API_KEY` = your Stability key
   - `KIE_AI_API_KEY` = your KIE key
7. Click **"Save"**
8. **Redeploy your edge function** after adding keys

### Method 2: Supabase CLI (For Local Development)

1. Create or edit `supabase/.env.local` file:
   ```bash
   OPENAI_API_KEY=sk-proj-...
   STABILITY_API_KEY=sk-...
   KIE_AI_API_KEY=...
   ```

2. For production, use:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-proj-...
   supabase secrets set STABILITY_API_KEY=sk-...
   supabase secrets set KIE_AI_API_KEY=...
   ```

---

## ✅ Verification

After adding keys, test each provider:

### Test OpenAI DALL-E 3:
1. Go to Images Studio
2. Select "OpenAI DALL-E 3"
3. Enter prompt: "A cat wearing sunglasses"
4. Click Generate
5. Should complete in 5-10 seconds

### Test Stability AI:
1. Select "Stability AI"
2. Enter prompt: "Digital art of a futuristic city"
3. Click Generate
4. Should complete in 3-7 seconds

### Test KIE AI:
1. Select "KIE AI Flux"
2. Enter prompt: "Abstract colorful patterns"
3. Click Generate
4. Should complete in 20-60 seconds (with progress bar)

---

## 🔐 Security Best Practices

✅ **DO:**
- Store keys in Supabase secrets (not in code)
- Use environment variables for local development
- Keep keys confidential and rotate them periodically
- Monitor usage and costs regularly
- Set up billing alerts on provider platforms

❌ **DON'T:**
- Commit keys to Git/GitHub
- Share keys publicly or in chat
- Use the same key across multiple projects
- Leave unused keys active
- Exceed your budget limits

---

## 💰 Cost Management Tips

1. **Start with small budgets** on each platform ($5-10)
2. **Monitor usage** in provider dashboards:
   - OpenAI: https://platform.openai.com/usage
   - Stability: https://platform.stability.ai/account/billing
3. **Set spending limits** in each platform's settings
4. **Use cheaper providers** for testing (Stability AI)
5. **Implement user quotas** in your app if needed

---

## 🆘 Troubleshooting

### Error: "API key not configured"
- **Fix**: Add the key to Supabase secrets and redeploy the edge function

### Error: "Insufficient credits"
- **Fix**: Add credits to your provider account (OpenAI or Stability)

### Error: "Invalid API key"
- **Fix**: Double-check the key format and copy it again
- **OpenAI**: Should start with `sk-proj-` or `sk-`
- **Stability**: Should start with `sk-`

### Keys Added but Not Working
- **Fix**: Redeploy the edge function:
  ```bash
  supabase functions deploy generate-image-unified
  ```

---

## 📊 Quick Comparison

| Provider | Cost/Image | Speed | Quality | Best For |
|----------|-----------|-------|---------|----------|
| **OpenAI DALL-E 3** | $0.04-0.08 | ⚡ Fast | ⭐⭐⭐⭐⭐ | Photorealistic |
| **Stability AI** | $0.003-0.01 | ⚡⚡ Faster | ⭐⭐⭐⭐ | Artistic/Creative |
| **KIE AI Flux** | Varies | 🐢 Slower | ⭐⭐⭐ | Budget/Testing |

---

## 🎯 Recommended Setup

For the best experience, we recommend:

1. **Get OpenAI API key** (for primary use)
   - Add $10 credit to start
   - Use for final/production images

2. **Get Stability AI key** (as backup)
   - Add $5 credit to start
   - Use for bulk generation or artistic styles

3. **Keep KIE AI** (if you have it)
   - Use for testing and development

This gives you **3 providers** with automatic fallback if one fails!

---

**Need help?** Check the full setup guide in `AI_IMAGES_SETUP_INSTRUCTIONS.md`
