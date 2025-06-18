
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$ 
BEGIN

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reviews_user_id_fkey_profiles' 
        AND table_name = 'reviews'
    ) THEN
    
        ALTER TABLE reviews 
        ADD CONSTRAINT reviews_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update the reviews policies to work with the profiles relationship
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Create new policies for reviews with proper profile relationships
CREATE POLICY "Anyone can view reviews with profiles" ON reviews 
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reviews" ON reviews 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Users can update own reviews" ON reviews 
FOR UPDATE USING (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Users can delete own reviews" ON reviews 
FOR DELETE USING (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id_profiles ON reviews(user_id);


CREATE OR REPLACE VIEW reviews_with_profiles AS
SELECT 
  r.id,
  r.restaurant_id,
  r.user_id,
  r.rating,
  r.comment,
  r.created_at,
  p.email,
  p.full_name,
  p.avatar_url
FROM reviews r
LEFT JOIN profiles p ON r.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON reviews_with_profiles TO authenticated;
GRANT SELECT ON reviews_with_profiles TO anon;

-- Create a function to get reviews with user info
CREATE OR REPLACE FUNCTION get_reviews_with_profiles(restaurant_uuid UUID)
RETURNS TABLE (
  id UUID,
  restaurant_id UUID,
  user_id UUID,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_full_name TEXT,
  user_avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.restaurant_id,
    r.user_id,
    r.rating,
    r.comment,
    r.created_at,
    p.email,
    p.full_name,
    p.avatar_url
  FROM reviews r
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.restaurant_id = restaurant_uuid
  ORDER BY r.created_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles(UUID) TO anon;
