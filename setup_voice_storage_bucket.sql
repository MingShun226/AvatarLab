-- Create storage bucket for voice samples
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-samples', 'voice-samples', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for voice samples - users can upload their own
CREATE POLICY "Users can upload their own voice samples"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own voice samples
CREATE POLICY "Users can view their own voice samples"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own voice samples
CREATE POLICY "Users can delete their own voice samples"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public can view voice samples (for playback)
CREATE POLICY "Public can view voice samples"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-samples');
