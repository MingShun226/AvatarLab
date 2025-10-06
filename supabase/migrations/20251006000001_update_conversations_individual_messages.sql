-- Update Conversations Schema: Individual Message Storage
-- Each message exchange is stored as a separate row instead of concatenated text

-- Drop old table if exists
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Create new conversations table with individual messages
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Avatar tracking
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,

  -- Contact Information
  phone_number VARCHAR(15) NOT NULL,

  -- Message content (stores: "user: message | assistant: response")
  text TEXT NOT NULL,

  -- Message order (sequential number for this phone + avatar conversation)
  message_order INTEGER NOT NULL,

  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

-- Index for fast retrieval by avatar + phone number + order
CREATE INDEX idx_conversations_avatar_phone_order
ON public.conversations USING btree (avatar_id, phone_number, message_order DESC) TABLESPACE pg_default;

-- Index for fast retrieval by avatar + phone number + timestamp
CREATE INDEX idx_conversations_avatar_phone_timestamp
ON public.conversations USING btree (avatar_id, phone_number, timestamp DESC) TABLESPACE pg_default;

-- Index for phone number lookup
CREATE INDEX idx_conversations_phone
ON public.conversations USING btree (phone_number) TABLESPACE pg_default;

-- Unique constraint to prevent duplicate order numbers
CREATE UNIQUE INDEX idx_conversations_avatar_phone_order_unique
ON public.conversations USING btree (avatar_id, phone_number, message_order) TABLESPACE pg_default;

COMMENT ON TABLE public.conversations IS 'Stores individual WhatsApp message exchanges as separate rows';
COMMENT ON COLUMN public.conversations.text IS 'Message exchange in format: user: message | assistant: response';
COMMENT ON COLUMN public.conversations.message_order IS 'Sequential order number for this conversation thread';
