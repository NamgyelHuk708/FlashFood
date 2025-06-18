-- Create functions to get user statistics efficiently

-- Function to get user review count
CREATE OR REPLACE FUNCTION get_user_review_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO review_count
  FROM reviews
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(review_count, 0);
END;
$$;

-- Function to get user favorite count
CREATE OR REPLACE FUNCTION get_user_favorite_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  favorite_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO favorite_count
  FROM favorites
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(favorite_count, 0);
END;
$$;

-- Function to get user's recent reviews
CREATE OR REPLACE FUNCTION get_user_recent_reviews(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  restaurant_id UUID,
  restaurant_name TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.restaurant_id,
    rest.name as restaurant_name,
    r.rating,
    r.comment,
    r.created_at
  FROM reviews r
  LEFT JOIN restaurants rest ON r.restaurant_id = rest.id
  WHERE r.user_id = user_uuid
  ORDER BY r.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_review_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_favorite_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_reviews(UUID, INTEGER) TO authenticated;
