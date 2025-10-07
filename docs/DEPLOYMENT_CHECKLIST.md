# AI Images Module - Deployment Checklist

## 📋 Pre-Deployment Checklist

### ✅ Step 1: Database Migration
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy contents of `supabase/migrations/20251007000000_add_image_generation_providers.sql`
- [ ] Paste and run the migration
- [ ] Verify tables updated:
  ```sql
  -- Check generated_images has new columns
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'generated_images';

  -- Should see: provider, model, parameters

  -- Check image_generation_queue exists
  SELECT * FROM image_generation_queue LIMIT 1;
  ```

### ✅ Step 2: Get API Keys

#### OpenAI (Recommended - Required for best quality)
- [ ] Visit https://platform.openai.com/api-keys
- [ ] Create new secret key
- [ ] Copy key (format: `sk-proj-...` or `sk-...`)
- [ ] **IMPORTANT**: Add credits at https://platform.openai.com/settings/organization/billing
- [ ] Recommended: Start with $10

#### Stability AI (Optional - Good for art)
- [ ] Visit https://platform.stability.ai/account/keys
- [ ] Create API key
- [ ] Copy key (format: `sk-...`)
- [ ] **IMPORTANT**: Add credits to account
- [ ] Recommended: Start with $5

#### KIE AI (Optional - Already have?)
- [ ] Check if you already have this key
- [ ] If not, get from https://kie.ai

### ✅ Step 3: Configure Supabase Secrets

**Option A: Supabase Dashboard (Recommended)**
- [ ] Go to Project Settings > Edge Functions > Secrets
- [ ] Add `OPENAI_API_KEY` = `sk-proj-your-key`
- [ ] Add `STABILITY_API_KEY` = `sk-your-key` (optional)
- [ ] Add `KIE_AI_API_KEY` = `your-key` (if needed)
- [ ] Click Save

**Option B: Supabase CLI**
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase secrets set STABILITY_API_KEY=sk-...
supabase secrets set KIE_AI_API_KEY=...
```

### ✅ Step 4: Deploy Edge Function

**Option A: Automatic (If using Git)**
- [ ] Commit and push your code
- [ ] Supabase will auto-deploy

**Option B: Manual via CLI**
```bash
supabase functions deploy generate-image-unified
```

**Option C: Manual via Dashboard**
- [ ] Go to Edge Functions in Supabase
- [ ] Create new function: `generate-image-unified`
- [ ] Upload the function code
- [ ] Deploy

### ✅ Step 5: Verify Deployment

- [ ] Check Edge Functions logs:
  ```bash
  supabase functions logs generate-image-unified --tail
  ```
- [ ] Or in Dashboard: Edge Functions > generate-image-unified > Logs
- [ ] Should see no errors on startup

---

## 🧪 Testing Checklist

### Test Each Provider

#### Test OpenAI DALL-E 3
- [ ] Go to Images Studio page
- [ ] Select "OpenAI DALL-E 3" from dropdown
- [ ] Enter prompt: `"a cat wearing sunglasses, photorealistic"`
- [ ] Click "Generate Image"
- [ ] ✅ Should complete in 5-10 seconds
- [ ] ✅ Image appears in gallery
- [ ] ✅ Can download image
- [ ] ✅ Can favorite image
- [ ] ✅ Can delete image

#### Test Stability AI (if configured)
- [ ] Select "Stability AI" from dropdown
- [ ] Enter prompt: `"digital art of a futuristic city"`
- [ ] Click "Generate Image"
- [ ] ✅ Should complete in 3-7 seconds
- [ ] ✅ Image appears in gallery
- [ ] ✅ All actions work (download, favorite, delete)

#### Test KIE AI (if configured)
- [ ] Select "KIE AI Flux" from dropdown
- [ ] Enter prompt: `"abstract colorful patterns"`
- [ ] Click "Generate Image"
- [ ] ✅ Progress bar appears
- [ ] ✅ Should complete in 20-60 seconds
- [ ] ✅ Image appears in gallery
- [ ] ✅ All actions work

### Test UI Features

#### Generate Tab
- [ ] Provider dropdown works
- [ ] Prompt textarea accepts input
- [ ] Negative prompt textarea works (optional)
- [ ] Generate button is disabled when empty
- [ ] Progress bar shows for async providers
- [ ] Toast notifications appear
- [ ] Form resets after successful generation

#### Gallery Tab
- [ ] Images load on page refresh
- [ ] Grid layout is responsive
- [ ] Hover actions appear (download, favorite, delete)
- [ ] Download saves file correctly
- [ ] Favorite toggle works
- [ ] Delete removes image
- [ ] Empty state shows when no images
- [ ] Provider badge shows correct provider

#### Error Handling
- [ ] Test with invalid API key (should show error)
- [ ] Test with empty prompt (should show validation)
- [ ] Test with no internet (should show error)
- [ ] All errors show user-friendly messages

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify everything works:

```sql
-- Check migration applied
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'generated_images'
AND column_name IN ('provider', 'model', 'parameters');

-- Check generated images
SELECT id, prompt, provider, created_at
FROM generated_images
ORDER BY created_at DESC
LIMIT 5;

-- Check provider distribution
SELECT provider, COUNT(*) as total
FROM generated_images
GROUP BY provider;

-- Check generation queue (for async)
SELECT id, provider, status, created_at
FROM image_generation_queue
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🚨 Troubleshooting

### Issue: "API key not configured"
- [ ] Verify key is in Supabase Secrets
- [ ] Redeploy edge function
- [ ] Check function logs for errors

### Issue: "Insufficient credits"
- [ ] Add credits to provider account (OpenAI or Stability)
- [ ] Check billing dashboard on provider site

### Issue: Image not saving to gallery
- [ ] Check browser console for errors
- [ ] Verify database migration was applied
- [ ] Check RLS policies in Supabase

### Issue: Download not working
- [ ] Check browser allows downloads
- [ ] Verify CORS headers in edge function
- [ ] Try right-click > Save Image As

### Issue: Progress not updating
- [ ] Check if provider is async (KIE AI)
- [ ] Check edge function logs
- [ ] Verify task ID is being returned

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Check Supabase function logs for errors
- [ ] Monitor API usage and costs
- [ ] Review user feedback/support tickets

### Weekly Checks
- [ ] Review provider costs and optimize
- [ ] Check database storage usage
- [ ] Review most popular prompts
- [ ] Check success/failure rates

### Monthly Checks
- [ ] Rotate API keys for security
- [ ] Review and optimize costs
- [ ] Update provider pricing if changed
- [ ] Check for new AI providers to add

---

## 🎯 Success Criteria

✅ **Ready for Production if:**
- All tests pass ✅
- No errors in function logs ✅
- Images generate successfully ✅
- Download works ✅
- Gallery persists ✅
- UI is responsive ✅
- Error messages are clear ✅
- API costs are within budget ✅

---

## 📞 Support Resources

- **Implementation Plan**: `docs/AI_IMAGES_INTEGRATION_PLAN.md`
- **Setup Guide**: `docs/AI_IMAGES_SETUP_INSTRUCTIONS.md`
- **API Keys Guide**: `docs/API_KEYS_QUICK_SETUP.md`
- **Summary**: `docs/AI_IMAGES_IMPLEMENTATION_SUMMARY.md`

---

## 🎉 Launch Checklist

Final steps before going live:

- [ ] All tests completed successfully
- [ ] API keys have sufficient credits
- [ ] Edge functions deployed and running
- [ ] Database migration applied
- [ ] Documentation reviewed
- [ ] User guide prepared (optional)
- [ ] Support team briefed (if applicable)
- [ ] Monitoring set up
- [ ] Backup plan in place

---

**Once complete, your AI Images module is ready to use! 🚀**

---

**Last Updated**: October 7, 2025
**Version**: 1.0.0
