-- This script will create profiles for any existing auth users who don't have profiles yet
-- This is useful if you had users before implementing the proper relationship

INSERT INTO profiles (id, email, created_at)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Update any existing reviews that might have broken relationships
-- This ensures all reviews have valid user_id references
DELETE FROM reviews 
WHERE user_id NOT IN (SELECT id FROM profiles);
