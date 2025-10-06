-- Conversation Memory System for WhatsApp Integration
-- Stores conversation history for AI context in n8n workflows

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Avatar & User Context
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact Information
  phone_number VARCHAR(15) NOT NULL,
  contact_name VARCHAR(255), -- Optional: Name from WhatsApp contact

  -- Message Content
  message_role VARCHAR(20) NOT NULL CHECK (message_role IN ('user', 'assistant', 'system')),
  message_content TEXT NOT NULL,

  -- Message Metadata
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location')),
  media_url TEXT, -- If message contains media

  -- Context Tracking
  conversation_session_id UUID, -- Group messages into sessions
  platform VARCHAR(50) DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp', 'telegram', 'slack', 'web', 'api')),

  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX idx_conversations_phone ON public.conversations USING btree (phone_number);
CREATE INDEX idx_conversations_avatar_id ON public.conversations USING btree (avatar_id);
CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);
CREATE INDEX idx_conversations_timestamp ON public.conversations USING btree (timestamp DESC);
CREATE INDEX idx_conversations_session_id ON public.conversations USING btree (conversation_session_id);
CREATE INDEX idx_conversations_phone_timestamp ON public.conversations USING btree (phone_number, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Function: Get recent conversation history for a phone number
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_avatar_id UUID,
  p_user_id UUID,
  p_phone_number VARCHAR(15),
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  message_role VARCHAR(20),
  message_content TEXT,
  message_type VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.message_role,
    c.message_content,
    c.message_type,
    c.timestamp
  FROM public.conversations c
  WHERE c.avatar_id = p_avatar_id
    AND c.user_id = p_user_id
    AND c.phone_number = p_phone_number
  ORDER BY c.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get recent conversations (last message from each phone number)
CREATE OR REPLACE FUNCTION get_recent_contacts(
  p_avatar_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  phone_number VARCHAR(15),
  contact_name VARCHAR(255),
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (c.phone_number)
    c.phone_number,
    c.contact_name,
    c.message_content as last_message,
    c.timestamp as last_message_time,
    (SELECT COUNT(*) FROM public.conversations
     WHERE phone_number = c.phone_number
     AND avatar_id = p_avatar_id
     AND user_id = p_user_id) as message_count
  FROM public.conversations c
  WHERE c.avatar_id = p_avatar_id
    AND c.user_id = p_user_id
  ORDER BY c.phone_number, c.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clear old conversations (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_conversations(
  p_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.conversations
  WHERE timestamp < NOW() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.conversations IS 'Stores conversation history for WhatsApp and other platforms';
COMMENT ON FUNCTION get_conversation_history IS 'Retrieves recent conversation history for a specific phone number';
COMMENT ON FUNCTION get_recent_contacts IS 'Gets list of recent contacts with their last message';
COMMENT ON FUNCTION cleanup_old_conversations IS 'Removes conversations older than specified days (default 90)';
