-- Add restaurant owner system

-- Step 1: Add restaurant ownership table
CREATE TABLE IF NOT EXISTS restaurant_owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, restaurant_id)
);

-- Step 2: Add business fields to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$'));
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended'));
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Add restaurant photos table
CREATE TABLE IF NOT EXISTS restaurant_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add owner responses to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_response_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id);

-- Step 5: Enable RLS on new tables
ALTER TABLE restaurant_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_photos ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for restaurant_owners
CREATE POLICY "Users can view restaurant owners" ON restaurant_owners FOR SELECT USING (true);
CREATE POLICY "Users can request ownership" ON restaurant_owners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can view their ownership" ON restaurant_owners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can update their ownership" ON restaurant_owners FOR UPDATE USING (auth.uid() = user_id);

-- Step 7: Create RLS policies for restaurant_photos
CREATE POLICY "Anyone can view restaurant photos" ON restaurant_photos FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage photos" ON restaurant_photos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM restaurant_owners ro 
    WHERE ro.restaurant_id = restaurant_photos.restaurant_id 
    AND ro.user_id = auth.uid() 
    AND ro.status = 'approved'
  )
);

-- Step 8: Update restaurant policies for owners
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
CREATE POLICY "Authenticated users can create restaurants" ON restaurants FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = created_by
);

CREATE POLICY "Restaurant owners can update their restaurants" ON restaurants FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM restaurant_owners ro 
    WHERE ro.restaurant_id = restaurants.id 
    AND ro.user_id = auth.uid() 
    AND ro.status = 'approved'
  ) OR created_by = auth.uid()
);

-- Step 9: Create functions for restaurant management

-- Function to check if user owns a restaurant
CREATE OR REPLACE FUNCTION user_owns_restaurant(user_uuid UUID, restaurant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM restaurant_owners 
    WHERE user_id = user_uuid 
    AND restaurant_id = restaurant_uuid 
    AND status = 'approved'
  );
END;
$$;

-- Function to get user's restaurants
CREATE OR REPLACE FUNCTION get_user_restaurants(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  cuisine_type TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  rating DECIMAL,
  image_url TEXT,
  opening_hours JSONB,
  price_range TEXT,
  status TEXT,
  owner_verified BOOLEAN,
  ownership_status TEXT,
  ownership_role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.cuisine_type,
    r.address,
    r.phone,
    r.email,
    r.website,
    r.description,
    r.latitude,
    r.longitude,
    r.rating,
    r.image_url,
    r.opening_hours,
    r.price_range,
    r.status,
    r.owner_verified,
    ro.status as ownership_status,
    ro.role as ownership_role,
    r.created_at
  FROM restaurants r
  INNER JOIN restaurant_owners ro ON r.id = ro.restaurant_id
  WHERE ro.user_id = user_uuid
  ORDER BY r.created_at DESC;
END;
$$;

-- Function to respond to reviews
CREATE OR REPLACE FUNCTION add_owner_response(
  review_uuid UUID,
  response_text TEXT,
  restaurant_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the restaurant
  IF NOT user_owns_restaurant(auth.uid(), restaurant_uuid) THEN
    RETURN FALSE;
  END IF;
  
  -- Update the review with owner response
  UPDATE reviews 
  SET 
    owner_response = response_text,
    owner_response_date = NOW(),
    responded_by = auth.uid()
  WHERE id = review_uuid 
  AND restaurant_id = restaurant_uuid;
  
  RETURN FOUND;
END;
$$;

-- Step 10: Grant permissions
GRANT EXECUTE ON FUNCTION user_owns_restaurant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_restaurants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_owner_response(UUID, TEXT, UUID) TO authenticated;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_user_id ON restaurant_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_restaurant_id ON restaurant_owners(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_status ON restaurant_owners(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_photos_restaurant_id ON restaurant_photos(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_by ON restaurants(created_by);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);

-- Step 12: Update restaurants with sample business hours
UPDATE restaurants 
SET opening_hours = '{
  "monday": {"open": "09:00", "close": "22:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "22:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "22:00", "closed": false},
  "thursday": {"open": "09:00", "close": "22:00", "closed": false},
  "friday": {"open": "09:00", "close": "23:00", "closed": false},
  "saturday": {"open": "10:00", "close": "23:00", "closed": false},
  "sunday": {"open": "10:00", "close": "21:00", "closed": false}
}'::jsonb,
price_range = '$$',
phone = '+1 (555) 123-4567',
description = 'A wonderful dining experience with fresh ingredients and exceptional service.'
WHERE opening_hours IS NULL;
