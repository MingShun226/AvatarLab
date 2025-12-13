# Version Control Guide

## Understanding Prompt vs Fine-Tuning

Your chatbot has **TWO separate systems** that work together:

### 1. Prompt (Quick Training) ⚡
- **What it is**: Just updates the system instructions/prompt
- **Speed**: Instant (0 seconds)
- **Cost**: FREE
- **Storage**: Saved in `avatar_training_data` with `training_type = 'prompt_update'`
- **When to use**: Quick personality tweaks, instruction changes
- **Example**: "Be more friendly", "Use more emojis", "Be professional"

### 2. Fine-Tuning (Deep Training) 🧠
- **What it is**: Creates a NEW machine learning model trained on your data
- **Speed**: 10-60 minutes
- **Cost**: $3-20 per training
- **Storage**: Model ID saved in `avatar_training_data.fine_tuned_model_id`
- **When to use**: Learning conversation style, language patterns, personality
- **Example**: Your Malaysian conversation training with "lah", "lor", "wah"

## How They Work Together

```
┌─────────────────────────────────────────┐
│          Your Avatar's Brain            │
├─────────────────────────────────────────┤
│                                         │
│  1. Fine-Tuned Model (if active)        │
│     ↓                                   │
│     Handles: Conversation style,        │
│     language patterns, tone             │
│                                         │
│  2. System Prompt (always applies)      │
│     ↓                                   │
│     Adds: Current instructions,         │
│     personality traits, rules           │
│                                         │
│  3. Final Response                      │
│     = Model Style + Prompt Instructions │
│                                         │
└─────────────────────────────────────────┘
```

## Version Control in Learning Path

### What You See

**Training History Timeline** shows ALL versions:
- ✅ Quick Training sessions (prompt updates)
- ✅ Deep Training sessions (fine-tuned models)
- ✅ Which version is currently **ACTIVE**
- ✅ Status of each version (Completed, Training, Failed)

### Version States

#### Active Now (Green Badge)
```
Status: Active Now
Meaning: This fine-tuned model is CURRENTLY being used
Action: Can deactivate to switch back to base model
```

#### Completed (Gray Badge)
```
Status: Completed
Meaning: Training succeeded but NOT currently active
Action: Can activate to switch to this version
```

#### Training (Blue Badge)
```
Status: Training
Meaning: Currently being trained (10-60 min)
Action: Wait for completion
```

#### Quick Training (Outline Badge)
```
Status: Quick Training
Meaning: Prompt update (instant)
Action: Can restore this prompt version
```

## How to Switch Versions

### Switch Between Fine-Tuned Models

1. Go to **Learning Path** page (navbar)
2. Find the version you want in **Training History**
3. Click **"Activate This Version"** button

**Example:**
```
Version 1: ft:gpt-4o:...:model1 [Active Now] [Deactivate] [Delete]
Version 2: ft:gpt-4o:...:model2 [Completed] [Activate This Version] [Delete] ← Click here
```

After clicking:
- Version 2 becomes active
- Version 1 badge changes from "Active Now" to "Completed"
- Your chatbot immediately uses Version 2
- No need to retrain!

### Switch Back to Base Model

1. Find your currently active version (green "Active Now" badge)
2. Click **"Deactivate"** button
3. Avatar switches back to base model (gpt-4o-mini)

**When to do this:**
- Fine-tuned model is too expensive
- Model didn't learn correctly
- Want to compare base vs fine-tuned

### Delete Training Versions

1. Go to **Learning Path** page (navbar)
2. Find the version you want to delete in **Training History**
3. Click **"Delete"** button (red icon)
4. Confirm deletion in the dialog

**What Gets Deleted:**
- ✅ Training data record
- ✅ Associated fine-tune jobs
- ✅ Training examples used in this session
- ✅ If currently active, model gets deactivated first

**IMPORTANT:**
- ⚠️ **This action cannot be undone!**
- ⚠️ If you delete an active model, your avatar switches to base model
- ⚠️ The actual OpenAI fine-tuned model is NOT deleted (still in your OpenAI account)
- 💡 You can manually delete the OpenAI model in OpenAI dashboard if needed

**When to Delete:**
- Failed training sessions cluttering history
- Old versions you'll never use again
- Test versions that didn't work well
- Free up database space

## Stats Card Indicators

### Active Model Card

**Shows Fine-Tuned Model:**
```
┌──────────────────────────┐
│ Active Model        ✓    │
│ ft:gpt-4o:...:model      │
│ [Fine-Tuned Active]      │
└──────────────────────────┘
```

**Shows Base Model:**
```
┌──────────────────────────┐
│ Active Model             │
│ Base Model (gpt-4o-mini) │
│ [No Fine-Tuning]         │
└──────────────────────────┘
```

## Real-World Example

You trained your chatbot with Malaysian conversation style:

### Training History:
```
1. ft:gpt-4o:...:CVZq68Yu [Active Now] [Deactivate]
   - Deep Training
   - Malaysian conversation style
   - 44 examples
   - $8.50
   - 2 hours ago

2. Prompt Update [Completed] [Restore Prompt]
   - Quick Training
   - Added "Be friendly and helpful"
   - Free
   - 1 day ago

3. ft:gpt-4o:...:ABC123 [Completed] [Activate This Version]
   - Deep Training
   - First attempt (didn't work well)
   - 20 examples
   - $5.00
   - 3 days ago
```

### What You Can Do:

1. **Test current model** (CVZq68Yu):
   - Chat with avatar
   - Should respond with "lah", "lor", etc.

2. **Compare with old model** (ABC123):
   - Click "Activate This Version" on version 3
   - Chat again
   - See the difference
   - Click "Activate This Version" on version 1 to switch back

3. **Deactivate fine-tuning**:
   - Click "Deactivate" on version 1
   - Avatar uses base model (no Malaysian style)
   - Cheaper, but generic responses

4. **Restore old prompt**:
   - Click "Restore Prompt" on version 2
   - Brings back old instructions
   - Fine-tuned model still active

## Cost Considerations

### Active Fine-Tuned Model
- Input: ~$3.75 per 1M tokens
- Output: ~$15.00 per 1M tokens
- **~2-4x more expensive** than base model

### Base Model (Deactivated)
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens
- **Cheaper** but no personalization

**Strategy**:
- Use fine-tuned for important conversations
- Deactivate for testing/development
- Activate when you need the personalized style

## FAQ

**Q: Can I have multiple fine-tuned models?**
A: Yes! Train as many as you want, but only ONE can be active at a time.

**Q: If I activate an old version, do I lose the new one?**
A: No! All versions are saved. You can switch between them anytime.

**Q: Does the prompt update when I switch fine-tuned models?**
A: No. Prompt and fine-tuned model are separate. You can have:
- Model A + Prompt X
- Model A + Prompt Y
- Model B + Prompt X
- Base Model + Prompt Z

**Q: What happens to active jobs if I switch versions?**
A: Active training jobs continue in background. When complete, they appear in history but aren't automatically activated.

**Q: Can I delete old versions?**
A: Yes! Click the "Delete" button on any training version. This will:
- Remove it from your training history
- Delete associated training data and jobs
- Auto-deactivate if it's currently active
- **Note:** The OpenAI model itself remains in your OpenAI account (delete manually if needed)

**Q: What happens if I delete the currently active model?**
A: The system will automatically deactivate it first, switching your avatar back to base model, then delete the training record.

**Q: Can I recover a deleted version?**
A: No, deletion is permanent. However, if you saved the training file, you can re-train a new version with the same data.

**Q: Does deleting a version delete the OpenAI model?**
A: No. Deletion only removes the record from your database. The actual fine-tuned model still exists in your OpenAI account. To fully delete:
1. Delete from Learning Path (removes from your app)
2. Go to OpenAI dashboard → Fine-tuning → Delete model (removes from OpenAI)

## Summary

✅ **Prompt** = Instructions (instant, free)
✅ **Fine-Tuning** = ML Model (slow, costs money, learns patterns)
✅ **Learning Path** = Version control system
✅ **Activate/Deactivate** = Switch between versions instantly
✅ **Delete** = Remove unwanted versions permanently
✅ **One Active Model** = Only one fine-tuned model active at a time
✅ **Version History** = All training sessions tracked in timeline
