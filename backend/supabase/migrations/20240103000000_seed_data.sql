-- Seed data for development and testing
-- Run this after the schema migrations

-- Insert sample profiles (chefs, drivers, customers, admin)
-- Note: In production, these would be created through Supabase Auth
-- For dev, you'll need to create these users in Supabase Auth first, then update the IDs

-- Admin profile (create user in Supabase Auth first)
-- Email: admin@ridendine.com, Password: admin123
-- Then update the ID below

-- Sample Chef Profiles (10 chefs)
-- For dev: Create these in Supabase Auth, then run this with actual UUIDs

-- Example seed data structure - update IDs after creating auth users
/*
INSERT INTO profiles (id, role, name, email, phone) VALUES
  ('replace-with-chef1-uuid', 'chef', 'Maria Rodriguez', 'maria@ridendine.com', '+1-555-0101'),
  ('replace-with-chef2-uuid', 'chef', 'John Chen', 'john@ridendine.com', '+1-555-0102'),
  -- ... more chefs
  ('replace-with-driver1-uuid', 'driver', 'Mike Johnson', 'mike@ridendine.com', '+1-555-0201'),
  -- ... more drivers
  ('replace-with-admin-uuid', 'admin', 'Admin User', 'admin@ridendine.com', '+1-555-0001');
*/

-- For quick dev setup, create sample chefs WITHOUT auth (dev only)
-- These will be visible but not functional for login
DO $$
DECLARE
  chef1_profile_id UUID := gen_random_uuid();
  chef2_profile_id UUID := gen_random_uuid();
  chef3_profile_id UUID := gen_random_uuid();
  chef4_profile_id UUID := gen_random_uuid();
  chef5_profile_id UUID := gen_random_uuid();
  chef6_profile_id UUID := gen_random_uuid();
  chef7_profile_id UUID := gen_random_uuid();
  chef8_profile_id UUID := gen_random_uuid();
  chef9_profile_id UUID := gen_random_uuid();
  chef10_profile_id UUID := gen_random_uuid();
  
  chef1_id UUID;
  chef2_id UUID;
  chef3_id UUID;
  chef4_id UUID;
  chef5_id UUID;
  chef6_id UUID;
  chef7_id UUID;
  chef8_id UUID;
  chef9_id UUID;
  chef10_id UUID;
  
  driver1_profile_id UUID := gen_random_uuid();
  driver2_profile_id UUID := gen_random_uuid();
  driver3_profile_id UUID := gen_random_uuid();
  driver4_profile_id UUID := gen_random_uuid();
  driver5_profile_id UUID := gen_random_uuid();
BEGIN
  -- Insert chef profiles
  INSERT INTO profiles (id, role, name, email, phone) VALUES
    (chef1_profile_id, 'chef', 'Maria Rodriguez', 'maria.chef@ridendine.com', '+1-555-0101'),
    (chef2_profile_id, 'chef', 'John Chen', 'john.chef@ridendine.com', '+1-555-0102'),
    (chef3_profile_id, 'chef', 'Sofia Patel', 'sofia.chef@ridendine.com', '+1-555-0103'),
    (chef4_profile_id, 'chef', 'David Kim', 'david.chef@ridendine.com', '+1-555-0104'),
    (chef5_profile_id, 'chef', 'Emma Wilson', 'emma.chef@ridendine.com', '+1-555-0105'),
    (chef6_profile_id, 'chef', 'Ahmed Hassan', 'ahmed.chef@ridendine.com', '+1-555-0106'),
    (chef7_profile_id, 'chef', 'Linda Martinez', 'linda.chef@ridendine.com', '+1-555-0107'),
    (chef8_profile_id, 'chef', 'Raj Sharma', 'raj.chef@ridendine.com', '+1-555-0108'),
    (chef9_profile_id, 'chef', 'Isabella Rossi', 'isabella.chef@ridendine.com', '+1-555-0109'),
    (chef10_profile_id, 'chef', 'Michael Brown', 'michael.chef@ridendine.com', '+1-555-0110');

  -- Insert driver profiles
  INSERT INTO profiles (id, role, name, email, phone) VALUES
    (driver1_profile_id, 'driver', 'Mike Johnson', 'mike.driver@ridendine.com', '+1-555-0201'),
    (driver2_profile_id, 'driver', 'Sarah Lee', 'sarah.driver@ridendine.com', '+1-555-0202'),
    (driver3_profile_id, 'driver', 'Carlos Garcia', 'carlos.driver@ridendine.com', '+1-555-0203'),
    (driver4_profile_id, 'driver', 'Jessica Wang', 'jessica.driver@ridendine.com', '+1-555-0204'),
    (driver5_profile_id, 'driver', 'Tom Anderson', 'tom.driver@ridendine.com', '+1-555-0205');

  -- Insert chefs (all approved for demo)
  INSERT INTO chefs (id, profile_id, status, cuisine_types, bio, rating, address, lat, lng) VALUES
    (gen_random_uuid(), chef1_profile_id, 'approved', ARRAY['Mexican', 'Latin'],
     'Authentic Mexican cuisine from family recipes passed down through generations. Specializing in tacos, enchiladas, and homemade salsas.',
     4.8, '123 Main St, San Francisco, CA', 37.7749, -122.4194),

    (gen_random_uuid(), chef2_profile_id, 'approved', ARRAY['Chinese', 'Asian Fusion'],
     'Modern Chinese fusion with traditional techniques. Known for hand-pulled noodles and dim sum.',
     4.9, '456 Market St, San Francisco, CA', 37.7849, -122.4094),

    (gen_random_uuid(), chef3_profile_id, 'approved', ARRAY['Indian', 'Vegetarian'],
     'Delicious vegetarian Indian cuisine with fresh spices and authentic flavors. All dishes are made fresh to order.',
     4.7, '789 Valencia St, San Francisco, CA', 37.7649, -122.4294),

    (gen_random_uuid(), chef4_profile_id, 'approved', ARRAY['Korean', 'BBQ'],
     'Traditional Korean BBQ and comfort food. Famous for bibimbap and Korean fried chicken.',
     4.6, '321 Mission St, San Francisco, CA', 37.7949, -122.3994),

    (gen_random_uuid(), chef5_profile_id, 'approved', ARRAY['American', 'Comfort Food'],
     'Classic American comfort food with a modern twist. Burgers, mac & cheese, and more.',
     4.5, '654 Folsom St, San Francisco, CA', 37.7549, -122.4394),

    (gen_random_uuid(), chef6_profile_id, 'approved', ARRAY['Mediterranean', 'Middle Eastern'],
     'Fresh Mediterranean and Middle Eastern dishes. Specializing in falafel, shawarma, and mezze platters.',
     4.9, '987 Hayes St, San Francisco, CA', 37.7749, -122.4294),

    (gen_random_uuid(), chef7_profile_id, 'approved', ARRAY['Italian', 'Pizza'],
     'Authentic Neapolitan pizza and fresh pasta. Using imported Italian ingredients and traditional methods.',
     4.8, '147 Castro St, San Francisco, CA', 37.7649, -122.4394),

    (gen_random_uuid(), chef8_profile_id, 'approved', ARRAY['Indian', 'Curry'],
     'North Indian specialties with homemade naan and rich curries. Family recipes from Punjab.',
     4.7, '258 Clement St, San Francisco, CA', 37.7849, -122.4594),

    (gen_random_uuid(), chef9_profile_id, 'approved', ARRAY['Italian', 'Pasta'],
     'Fresh handmade pasta daily. Traditional Italian recipes from Tuscany region.',
     4.9, '369 Columbus Ave, San Francisco, CA', 37.7949, -122.4194),

    (gen_random_uuid(), chef10_profile_id, 'approved', ARRAY['American', 'Soul Food'],
     'Soulful Southern cooking. Fried chicken, collard greens, and cornbread made with love.',
     4.6, '741 Divisadero St, San Francisco, CA', 37.7749, -122.4494);

  -- Get chef IDs for inserting dishes
  SELECT id INTO chef1_id FROM chefs WHERE profile_id = chef1_profile_id;
  SELECT id INTO chef2_id FROM chefs WHERE profile_id = chef2_profile_id;
  SELECT id INTO chef3_id FROM chefs WHERE profile_id = chef3_profile_id;
  SELECT id INTO chef4_id FROM chefs WHERE profile_id = chef4_profile_id;
  SELECT id INTO chef5_id FROM chefs WHERE profile_id = chef5_profile_id;
  SELECT id INTO chef6_id FROM chefs WHERE profile_id = chef6_profile_id;
  SELECT id INTO chef7_id FROM chefs WHERE profile_id = chef7_profile_id;
  SELECT id INTO chef8_id FROM chefs WHERE profile_id = chef8_profile_id;
  SELECT id INTO chef9_id FROM chefs WHERE profile_id = chef9_profile_id;
  SELECT id INTO chef10_id FROM chefs WHERE profile_id = chef10_profile_id;

  -- Insert 50 dishes across all chefs
  -- Chef 1 - Mexican (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef1_id, 'Beef Tacos', 'Three soft tacos with seasoned ground beef, fresh salsa, and cilantro', 12.99, 'Mexican', ARRAY['gluten-free option'], TRUE),
    (chef1_id, 'Chicken Enchiladas', 'Corn tortillas filled with chicken, topped with red sauce and cheese', 14.99, 'Mexican', ARRAY['spicy'], TRUE),
    (chef1_id, 'Veggie Burrito', 'Large flour tortilla with rice, beans, peppers, and guacamole', 11.99, 'Mexican', ARRAY['vegetarian'], TRUE),
    (chef1_id, 'Carne Asada Plate', 'Grilled steak with rice, beans, and tortillas', 18.99, 'Mexican', ARRAY[]::text[], TRUE),
    (chef1_id, 'Chips & Guacamole', 'Fresh made guacamole with crispy tortilla chips', 7.99, 'Mexican', ARRAY['vegan', 'gluten-free'], TRUE);

  -- Chef 2 - Chinese (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef2_id, 'Hand-Pulled Noodles', 'Fresh noodles in savory broth with vegetables', 13.99, 'Chinese', ARRAY['vegetarian option'], TRUE),
    (chef2_id, 'Dim Sum Platter', 'Assorted dumplings: pork shu mai, shrimp har gow, veggie buns', 16.99, 'Chinese', ARRAY[]::text[], TRUE),
    (chef2_id, 'Kung Pao Chicken', 'Spicy stir-fry with peanuts and dried chilies', 15.99, 'Chinese', ARRAY['spicy', 'nuts'], TRUE),
    (chef2_id, 'Mapo Tofu', 'Silky tofu in spicy Sichuan sauce', 12.99, 'Chinese', ARRAY['spicy', 'vegetarian'], TRUE),
    (chef2_id, 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 8.99, 'Chinese', ARRAY['vegan'], TRUE);

  -- Chef 3 - Indian Vegetarian (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef3_id, 'Paneer Tikka Masala', 'Grilled cottage cheese in creamy tomato sauce', 14.99, 'Indian', ARRAY['vegetarian'], TRUE),
    (chef3_id, 'Chana Masala', 'Chickpeas in aromatic spice blend', 12.99, 'Indian', ARRAY['vegan', 'gluten-free'], TRUE),
    (chef3_id, 'Vegetable Biryani', 'Fragrant basmati rice with mixed vegetables and spices', 13.99, 'Indian', ARRAY['vegan', 'gluten-free'], TRUE),
    (chef3_id, 'Samosa Plate', 'Crispy pastries filled with spiced potatoes and peas', 7.99, 'Indian', ARRAY['vegan'], TRUE),
    (chef3_id, 'Dal Makhani', 'Creamy black lentils slow-cooked overnight', 11.99, 'Indian', ARRAY['vegetarian', 'gluten-free'], TRUE);

  -- Chef 4 - Korean (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef4_id, 'Bibimbap', 'Mixed rice bowl with vegetables, egg, and gochujang sauce', 14.99, 'Korean', ARRAY['gluten-free option'], TRUE),
    (chef4_id, 'Korean Fried Chicken', 'Crispy wings with sweet and spicy glaze', 15.99, 'Korean', ARRAY[]::text[], TRUE),
    (chef4_id, 'Bulgogi Bowl', 'Marinated beef over rice with kimchi', 16.99, 'Korean', ARRAY[]::text[], TRUE),
    (chef4_id, 'Kimchi Pancake', 'Savory pancake with kimchi and scallions', 9.99, 'Korean', ARRAY['vegetarian option'], TRUE),
    (chef4_id, 'Tteokbokki', 'Spicy rice cakes in gochujang sauce', 10.99, 'Korean', ARRAY['spicy', 'vegan'], TRUE);

  -- Chef 5 - American Comfort (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef5_id, 'Classic Cheeseburger', 'Half-pound beef patty with cheese, lettuce, tomato', 13.99, 'American', ARRAY[]::text[], TRUE),
    (chef5_id, 'Mac & Cheese', 'Creamy three-cheese pasta with breadcrumb topping', 11.99, 'American', ARRAY['vegetarian'], TRUE),
    (chef5_id, 'Buffalo Wings', 'Crispy wings tossed in buffalo sauce', 12.99, 'American', ARRAY['spicy'], TRUE),
    (chef5_id, 'Grilled Cheese & Tomato Soup', 'Classic combo with sourdough bread', 10.99, 'American', ARRAY['vegetarian'], TRUE),
    (chef5_id, 'BBQ Pulled Pork Sandwich', 'Slow-cooked pork with coleslaw on brioche', 14.99, 'American', ARRAY[]::text[], TRUE);

  -- Chef 6 - Mediterranean (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef6_id, 'Falafel Wrap', 'Crispy falafel with tahini, veggies in pita', 11.99, 'Mediterranean', ARRAY['vegan'], TRUE),
    (chef6_id, 'Shawarma Plate', 'Spiced chicken or lamb with rice and salad', 15.99, 'Mediterranean', ARRAY['gluten-free option'], TRUE),
    (chef6_id, 'Mezze Platter', 'Hummus, baba ganoush, tabbouleh, and pita', 13.99, 'Mediterranean', ARRAY['vegan option'], TRUE),
    (chef6_id, 'Greek Salad', 'Fresh vegetables with feta and olives', 9.99, 'Mediterranean', ARRAY['vegetarian', 'gluten-free'], TRUE),
    (chef6_id, 'Lamb Kebab', 'Grilled lamb skewers with tzatziki', 17.99, 'Mediterranean', ARRAY['gluten-free'], TRUE);

  -- Chef 7 - Italian Pizza (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef7_id, 'Margherita Pizza', 'San Marzano tomatoes, fresh mozzarella, basil', 14.99, 'Italian', ARRAY['vegetarian'], TRUE),
    (chef7_id, 'Pepperoni Pizza', 'Classic pepperoni with mozzarella', 15.99, 'Italian', ARRAY[]::text[], TRUE),
    (chef7_id, 'Truffle Mushroom Pizza', 'Wild mushrooms with truffle oil and arugula', 18.99, 'Italian', ARRAY['vegetarian'], TRUE),
    (chef7_id, 'Caesar Salad', 'Romaine, parmesan, croutons, Caesar dressing', 9.99, 'Italian', ARRAY['vegetarian'], TRUE),
    (chef7_id, 'Garlic Bread', 'Fresh baked with garlic butter and herbs', 6.99, 'Italian', ARRAY['vegetarian'], TRUE);

  -- Chef 8 - Indian Curry (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef8_id, 'Butter Chicken', 'Tender chicken in creamy tomato curry', 15.99, 'Indian', ARRAY[]::text[], TRUE),
    (chef8_id, 'Lamb Rogan Josh', 'Aromatic lamb curry with Kashmiri spices', 17.99, 'Indian', ARRAY['gluten-free'], TRUE),
    (chef8_id, 'Garlic Naan', 'Fresh baked flatbread with garlic and butter', 3.99, 'Indian', ARRAY['vegetarian'], TRUE),
    (chef8_id, 'Chicken Tikka', 'Grilled chicken marinated in yogurt and spices', 14.99, 'Indian', ARRAY['gluten-free'], TRUE),
    (chef8_id, 'Palak Paneer', 'Cottage cheese in creamy spinach curry', 13.99, 'Indian', ARRAY['vegetarian', 'gluten-free'], TRUE);

  -- Chef 9 - Italian Pasta (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef9_id, 'Carbonara', 'Spaghetti with eggs, pecorino, guanciale', 16.99, 'Italian', ARRAY[]::text[], TRUE),
    (chef9_id, 'Pesto Penne', 'Fresh basil pesto with pine nuts', 14.99, 'Italian', ARRAY['vegetarian', 'nuts'], TRUE),
    (chef9_id, 'Lasagna Bolognese', 'Layers of pasta, meat sauce, béchamel', 17.99, 'Italian', ARRAY[]::text[], TRUE),
    (chef9_id, 'Mushroom Risotto', 'Creamy arborio rice with wild mushrooms', 15.99, 'Italian', ARRAY['vegetarian', 'gluten-free'], TRUE),
    (chef9_id, 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 7.99, 'Italian', ARRAY['vegetarian'], TRUE);

  -- Chef 10 - Soul Food (5 dishes)
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, dietary_tags, available) VALUES
    (chef10_id, 'Fried Chicken', 'Crispy buttermilk fried chicken pieces', 14.99, 'American', ARRAY[]::text[], TRUE),
    (chef10_id, 'Collard Greens', 'Slow-cooked greens with smoked turkey', 8.99, 'American', ARRAY[]::text[], TRUE),
    (chef10_id, 'Mac & Cheese (Soul)', 'Baked mac with sharp cheddar', 10.99, 'American', ARRAY['vegetarian'], TRUE),
    (chef10_id, 'Cornbread', 'Sweet Southern-style cornbread', 5.99, 'American', ARRAY['vegetarian'], TRUE),
    (chef10_id, 'BBQ Ribs', 'Fall-off-the-bone ribs with house BBQ sauce', 19.99, 'American', ARRAY[]::text[], TRUE);

  -- Insert drivers
  INSERT INTO drivers (profile_id, name, status, phone, vehicle_type, license_plate, rating, total_deliveries) VALUES
    (driver1_profile_id, 'Mike Johnson', 'online', '+1-555-0201', 'Car', 'ABC-1234', 4.9, 245),
    (driver2_profile_id, 'Sarah Lee', 'online', '+1-555-0202', 'Bike', 'XYZ-5678', 4.8, 189),
    (driver3_profile_id, 'Carlos Garcia', 'offline', '+1-555-0203', 'Car', 'DEF-9012', 4.7, 312),
    (driver4_profile_id, 'Jessica Wang', 'online', '+1-555-0204', 'Scooter', 'GHI-3456', 4.9, 156),
    (driver5_profile_id, 'Tom Anderson', 'busy', '+1-555-0205', 'Car', 'JKL-7890', 4.6, 421);

END $$;
