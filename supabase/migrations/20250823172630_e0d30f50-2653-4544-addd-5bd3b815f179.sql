
-- Remove unused columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bio;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS website;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own avatar" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Make sure all existing users have a referral code
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL OR referral_code = '';

-- Update the trigger to ensure referral code is always generated
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, referral_code, referrer_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    generate_referral_code(),
    NEW.raw_user_meta_data->>'referrer_code'
  );
  RETURN NEW;
END;
$$;
