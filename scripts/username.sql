-- Simple approach: Just use email prefix for existing users
UPDATE profiles 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL OR username = '';

-- Handle duplicates by adding numbers
DO $$
DECLARE
    profile_record RECORD;
    base_name TEXT;
    counter INTEGER;
    new_username TEXT;
BEGIN
    -- Loop through profiles that might have duplicate usernames
    FOR profile_record IN 
        SELECT id, username, email 
        FROM profiles 
        WHERE username IN (
            SELECT username 
            FROM profiles 
            GROUP BY username 
            HAVING COUNT(*) > 1
        )
        ORDER BY created_at
    LOOP
        base_name := LOWER(SPLIT_PART(profile_record.email, '@', 1));
        counter := 1;
        new_username := base_name;
        
        -- Find a unique username
        WHILE EXISTS (
            SELECT 1 FROM profiles 
            WHERE username = new_username 
            AND id != profile_record.id
        ) LOOP
            new_username := base_name || counter::text;
            counter := counter + 1;
        END LOOP;
        
        -- Update the username
        UPDATE profiles 
        SET username = new_username 
        WHERE id = profile_record.id;
    END LOOP;
END $$;
