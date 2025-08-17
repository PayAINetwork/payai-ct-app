-- Migration: Update handle_new_auth_user function to include agent verification
-- Date: 2025-08-18

-- Create the updated function with agent verification logic
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user data as before
  INSERT INTO public.users (id, email, name, picture, avatar_url, handle, created_at, updated_at)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'picture', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'user_name', new.created_at, new.updated_at)
  ON CONFLICT DO NOTHING;
  
  -- Search for agents with matching twitter_user_id and update them
  UPDATE public.agents 
  SET 
    user_id = new.id,
    is_verified = true,
    verification_date = new.created_at
  WHERE twitter_user_id = new.raw_user_meta_data->>'sub';
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


