-- Simple Conversation Memory System for WhatsApp Integration
-- Stores conversation history as continuous text transcript

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Avatar tracking (which avatar is chatting)
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,

  -- Contact Information
  phone_number VARCHAR(15) NOT NULL,

  -- Conversation Transcript (entire conversation as text)
  conversation_content TEXT NOT NULL,

  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW()
) TABLESPACE pg_default;

-- Index for fast retrieval by avatar + phone number (UNIQUE conversation per avatar-phone pair)
CREATE INDEX IF NOT EXISTS idx_conversations_avatar_phone
ON public.conversations USING btree (avatar_id, phone_number) TABLESPACE pg_default;

-- Index for fast retrieval by phone number
CREATE INDEX IF NOT EXISTS idx_conversations_phone
ON public.conversations USING btree (phone_number) TABLESPACE pg_default;

-- Index for retrieving latest conversations
CREATE INDEX IF NOT EXISTS idx_conversations_avatar_phone_timestamp
ON public.conversations USING btree (avatar_id, phone_number, timestamp DESC) TABLESPACE pg_default;

-- Enable Row Level Security (optional, comment out if not needed)
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy (optional, comment out if not needed)
-- CREATE POLICY "Public can view all conversations"
-- ON public.conversations
-- FOR SELECT
-- TO public
-- USING (true);

COMMENT ON TABLE public.conversations IS 'Stores WhatsApp conversation history as text transcripts';
COMMENT ON COLUMN public.conversations.conversation_content IS 'Full conversation text: user: message | assistant: reply || user: next message | assistant: next reply';
