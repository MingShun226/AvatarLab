-- Simplified Conversations Schema
-- Store individual messages, ordered by timestamp only

DROP TABLE IF EXISTS public.conversations CASCADE;

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Avatar tracking
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,

  -- Contact Information
  phone_number VARCHAR(15) NOT NULL,

  -- Message content (stores: "user: message | assistant: response")
  text TEXT NOT NULL,

  -- Timestamp (used for ordering)
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

-- Index for fast retrieval by avatar + phone number + timestamp (DESC for latest first)
CREATE INDEX idx_conversations_avatar_phone_timestamp
ON public.conversations USING btree (avatar_id, phone_number, timestamp DESC) TABLESPACE pg_default;

-- Index for phone number lookup
CREATE INDEX idx_conversations_phone
ON public.conversations USING btree (phone_number) TABLESPACE pg_default;

COMMENT ON TABLE public.conversations IS 'Stores individual WhatsApp message exchanges, ordered by timestamp';
COMMENT ON COLUMN public.conversations.text IS 'Message exchange in format: user: message | assistant: response';
