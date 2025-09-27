
-- Add phone column and referral columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT,
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referrer_code TEXT,
ADD COLUMN avatar_url TEXT;

-- Create a function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_check FROM public.profiles WHERE referral_code = code;
        
        -- If code doesn't exist, break the loop
        IF exists_check = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
