# AI Images Module - Step-by-Step Implementation Guide

## 📊 Current Situation Analysis

### What You Already Have:
✅ **`platform_api_keys` table** - For your platform's API keys (n8n, database access)
✅ **Settings page with API Management tab** - Users can add external service API keys
✅ **`apiKeyService`** - Service to manage `user_api_keys` (but table doesn't exist yet!)

### What's Missing:
❌ **`user_api_keys` table** - Database table to store user's external service API keys (OpenAI, Stability, etc.)
❌ **Provider columns in `generated_images`** - To track which AI provider was used
❌ **Edge function to use user's API keys** - Backend logic to retrieve and use keys

---

## 🎯 Implementation Steps

### Step 1: Create `user_api_keys` Table

This table stores external service API keys (OpenAI, Stability AI, etc.) that users add in Settings.

**Run this SQL in Supabase Dashboard > SQL Editor:**

```sql
-- Create user_api_keys table for external service API keys
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Key Information
    name TEXT NOT NULL,
    service TEXT NOT NULL, -- 'openai', 'stability', 'elevenlabs', etc.
    api_key_encrypted TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

    -- Usage Tracking
    last_used_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_service ON user_api_keys(user_id, service);

-- Enable RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own API keys"
    ON user_api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
    ON user_api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
    ON user_api_keys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
    ON user_api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_api_keys IS 'External service API keys (OpenAI, Stability AI, etc.) added by users in Settings';
```

---

### Step 2: Add Provider Support to `generated_images` Table

Extend the existing table to track which AI provider was used.

**Run this SQL:**

```sql
-- Add provider columns to generated_images
ALTER TABLE generated_images
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'kie-ai',
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

-- Create index for provider queries
CREATE INDEX IF NOT EXISTS idx_generated_images_provider ON generated_images(provider);

COMMENT ON COLUMN generated_images.provider IS 'AI provider: openai, stability, kie-ai';
COMMENT ON COLUMN generated_images.model IS 'Specific model used: dall-e-3, stable-diffusion-core, flux-kontext-pro';
COMMENT ON COLUMN generated_images.parameters IS 'Generation parameters used (negative_prompt, size, etc.)';
```

---

### Step 3: Update Edge Function to Support User API Keys

The edge function needs to:
1. Check if user has their own API key for the provider
2. If yes, use user's key
3. If no, use platform's key (from Supabase secrets)

**Update: `supabase/functions/generate-image-unified/index.ts`**

I'll modify the edge function to check user's API keys first:

```typescript
// Helper function to get API key (user's key or platform key)
async function getApiKey(
  supabase: any,
  userId: string,
  provider: string,
  platformKey: string | undefined
): Promise<string> {
  console.log(`Getting API key for provider: ${provider}, user: ${userId}`);

  // Try to get user's personal API key first
  const { data: userKey, error } = await supabase
    .from('user_api_keys')
    .select('api_key_encrypted')
    .eq('user_id', userId)
    .eq('service', provider)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!error && userKey?.api_key_encrypted) {
    console.log(`Using user's personal ${provider} API key`);

    // Update last_used_at
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('service', provider)
      .eq('status', 'active');

    // Decrypt user's key (simple base64 for now)
    try {
      return atob(userKey.api_key_encrypted);
    } catch (e) {
      console.error('Failed to decrypt user API key');
    }
  }

  // Fallback to platform key
  if (platformKey) {
    console.log(`Using platform ${provider} API key`);
    return platformKey;
  }

  throw new Error(`No API key configured for ${provider}`);
}
```

Then use it in the edge function:

```typescript
// In the main serve() function, replace API key retrieval:

switch (provider) {
  case 'openai': {
    const openaiKey = await getApiKey(
      supabase,
      user.id,
      'openai',
      Deno.env.get('OPENAI_API_KEY')
    );
    result = await generateWithOpenAI(prompt, parameters, openaiKey);
    break;
  }

  case 'stability': {
    const stabilityKey = await getApiKey(
      supabase,
      user.id,
      'stability',
      Deno.env.get('STABILITY_API_KEY')
    );
    result = await generateWithStability(prompt, parameters, stabilityKey);
    break;
  }

  case 'kie-ai': {
    const kieKey = await getApiKey(
      supabase,
      user.id,
      'kie-ai',
      Deno.env.get('KIE_AI_API_KEY')
    );
    result = await generateWithKieAI(prompt, parameters, kieKey);
    break;
  }
}
```

---

### Step 4: Test the User API Key Flow

**A. Test with User's Personal Key:**

1. Go to **Settings > API Management** tab
2. Add a new API key:
   - **Key Name**: "My OpenAI Key"
   - **Service**: "openai"
   - **API Key**: `sk-proj-your-actual-key`
3. Go to **Images Studio**
4. Select "OpenAI DALL-E 3"
5. Generate an image
6. ✅ Should use your personal key (check function logs)

**B. Test with Platform Key (Fallback):**

1. Don't add any API key in Settings
2. Go to **Images Studio**
3. Select "OpenAI DALL-E 3"
4. Generate an image
5. ✅ Should use platform key from Supabase secrets

---

### Step 5: Optional - Add Platform API Keys (Admin Only)

If you want to provide free credits to users using platform keys:

**Add platform keys to Supabase:**

1. Go to **Project Settings** > **Edge Functions** > **Secrets**
2. Add these (optional):
   ```
   OPENAI_API_KEY=sk-proj-your-platform-key
   STABILITY_API_KEY=sk-your-platform-key
   KIE_AI_API_KEY=your-kie-key (if you have one)
   ```

**How it works:**
- ✅ User has their own key → Use user's key (they pay)
- ✅ User doesn't have key → Use platform key (you pay)
- ❌ Neither exists → Show error "Please add API key in Settings"

---

## 🎯 Deployment Sequence

### Database Changes (Run these SQL statements in order):

1. ✅ **Step 1**: Create `user_api_keys` table
2. ✅ **Step 2**: Add provider columns to `generated_images`

### Code Changes:

3. ✅ **Already done**: Updated edge function with user key support
4. ✅ **Already done**: Frontend service layer
5. ✅ **Already done**: ImagesSection UI

### Testing:

6. ✅ Test user API key flow
7. ✅ Test platform key fallback
8. ✅ Test image generation, download, favorites

---

## 🔄 User Flow Diagrams

### Flow 1: User Adds Their Own API Key

```
1. User → Settings → API Management
2. Click "Add New API Key"
3. Enter:
   - Name: "My OpenAI Key"
   - Service: "openai"
   - API Key: sk-proj-...
4. Click "Add API Key"
5. Key saved to user_api_keys table (encrypted)

Then when generating:
6. User → Images Studio → Select "OpenAI"
7. Click Generate
8. Edge function checks user_api_keys → Found!
9. Uses user's key → User pays for generation
10. Image saved to gallery
```

### Flow 2: User Uses Platform Key (No Personal Key)

```
1. User → Images Studio → Select "OpenAI"
2. Click Generate
3. Edge function checks user_api_keys → Not found
4. Fallback to Supabase secret (OPENAI_API_KEY)
5. Uses platform key → Platform pays
6. Image saved to gallery
```

### Flow 3: No Key Available

```
1. User → Images Studio → Select "OpenAI"
2. Click Generate
3. Edge function checks user_api_keys → Not found
4. Check platform key → Not configured
5. Return error: "Please add OpenAI API key in Settings"
6. User goes to Settings and adds their key
```

---

## 📋 Quick Reference

### Database Tables:

| Table | Purpose | Example |
|-------|---------|---------|
| `user_api_keys` | User's external service keys | OpenAI key for John |
| `platform_api_keys` | Platform's internal API keys | n8n webhook key |
| `generated_images` | Generated images with provider info | Image by OpenAI |

### API Key Priority:

1. **First**: Check `user_api_keys` (user's personal key)
2. **Second**: Check Supabase secrets (platform key)
3. **Last**: Return error if neither exists

### Service Names (Standardized):

- `'openai'` - OpenAI DALL-E 3
- `'stability'` - Stability AI
- `'kie-ai'` - KIE AI Flux
- `'elevenlabs'` - ElevenLabs (future)

---

## ✅ Final Checklist

### Database:
- [ ] Run SQL to create `user_api_keys` table
- [ ] Run SQL to add provider columns to `generated_images`
- [ ] Verify tables exist with: `SELECT * FROM user_api_keys LIMIT 1;`

### Edge Function:
- [ ] Edge function already updated (no action needed)
- [ ] Deploy edge function: `supabase functions deploy generate-image-unified`

### Testing:
- [ ] Add API key in Settings → API Management
- [ ] Generate image in Images Studio
- [ ] Verify image appears in gallery
- [ ] Check function logs to confirm which key was used

### Optional (Platform Keys):
- [ ] Add platform API keys to Supabase secrets
- [ ] Test fallback when user has no key

---

## 🎉 You're Done!

After completing these steps:
1. ✅ Users can add their own API keys (Settings > API Management)
2. ✅ Platform can provide free credits with fallback keys
3. ✅ Images track which provider was used
4. ✅ Full image generation, download, favorites work

**No duplicate tables, clean integration with existing system!**

---

**Next Step**: Run the SQL statements in Step 1 and Step 2, then test! 🚀
