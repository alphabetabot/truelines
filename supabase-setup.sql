-- Run this in Supabase SQL Editor

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own subscription
CREATE POLICY "Users can manage own subscription" ON newsletter_subscribers
  FOR ALL USING (auth.uid() = user_id);

-- Function to auto-add subscriber when user signs up with newsletter opt-in
CREATE OR REPLACE FUNCTION handle_new_user_newsletter()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean = true THEN
    INSERT INTO newsletter_subscribers (email, user_id)
    VALUES (NEW.email, NEW.id)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run function on new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created_newsletter
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_newsletter();
