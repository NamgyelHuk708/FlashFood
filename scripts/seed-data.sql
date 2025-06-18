-- Insert sample restaurants
INSERT INTO restaurants (name, cuisine_type, address, latitude, longitude, rating, image_url) VALUES
('The Golden Spoon', 'Italian', '123 Main St, Downtown', 40.7128, -74.0060, 4.5, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'),
('Sakura Sushi', 'Japanese', '456 Oak Ave, Midtown', 40.7589, -73.9851, 4.8, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400'),
('Burger Palace', 'American', '789 Pine St, Uptown', 40.7831, -73.9712, 4.2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
('Spice Garden', 'Indian', '321 Elm St, East Side', 40.7282, -73.7949, 4.6, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('Taco Fiesta', 'Mexican', '654 Maple Ave, West End', 40.7505, -73.9934, 4.3, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'),
('Le Petit Bistro', 'French', '987 Cedar Ln, Old Town', 40.7614, -73.9776, 4.7, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400');

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
