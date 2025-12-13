-- Create generated_videos table for video generation history
CREATE TABLE IF NOT EXISTS generated_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL, -- KIE.AI task ID for polling
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'kie-veo3-fast', 'kie-sora-2-pro-text2vid'
  model TEXT, -- Model identifier
  generation_type TEXT DEFAULT 'text2vid', -- 'text2vid' or 'img2vid'
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  video_url TEXT, -- Final video URL when completed
  thumbnail_url TEXT, -- Optional thumbnail
  error_message TEXT, -- Error message if failed
  parameters JSONB, -- Generation parameters (aspect_ratio, duration, etc.)
  aspect_ratio TEXT,
  duration INTEGER, -- in seconds
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ -- When generation completed
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_videos_user_id ON generated_videos(user_id);

-- Create index on status for background polling
CREATE INDEX IF NOT EXISTS idx_generated_videos_status ON generated_videos(status);

-- Create index on task_id for status updates
CREATE INDEX IF NOT EXISTS idx_generated_videos_task_id ON generated_videos(task_id);

-- Enable RLS
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own videos
CREATE POLICY "Users can view own videos" ON generated_videos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own videos
CREATE POLICY "Users can insert own videos" ON generated_videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own videos
CREATE POLICY "Users can update own videos" ON generated_videos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON generated_videos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_generated_videos_updated_at
  BEFORE UPDATE ON generated_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
