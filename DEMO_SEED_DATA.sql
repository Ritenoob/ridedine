-- RidenDine Demo Seed Data
-- Creates 10 chefs, 50 dishes, and 5 drivers for demo purposes

-- ============================================
-- DEMO PROFILES (Chefs, Drivers, Customers)
-- ============================================

-- Insert Chef Profiles (role: chef)
INSERT INTO profiles (id, role, name, email, phone, created_at) VALUES
('chef-001', 'chef', 'Maria Rodriguez', 'maria@ridendine.demo', '+1-555-0101', NOW()),
('chef-002', 'chef', 'James Chen', 'james@ridendine.demo', '+1-555-0102', NOW()),
('chef-003', 'chef', 'Aisha Patel', 'aisha@ridendine.demo', '+1-555-0103', NOW()),
('chef-004', 'chef', 'Giovanni Rossi', 'giovanni@ridendine.demo', '+1-555-0104', NOW()),
('chef-005', 'chef', 'Kenji Tanaka', 'kenji@ridendine.demo', '+1-555-0105', NOW()),
('chef-006', 'chef', 'Sophie Dubois', 'sophie@ridendine.demo', '+1-555-0106', NOW()),
('chef-007', 'chef', 'Carlos Mendez', 'carlos@ridendine.demo', '+1-555-0107', NOW()),
('chef-008', 'chef', 'Fatima Hassan', 'fatima@ridendine.demo', '+1-555-0108', NOW()),
('chef-009', 'chef', 'David Kim', 'david@ridendine.demo', '+1-555-0109', NOW()),
('chef-010', 'chef', 'Elena Ivanova', 'elena@ridendine.demo', '+1-555-0110', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Driver Profiles (role: driver)
INSERT INTO profiles (id, role, name, email, phone, created_at) VALUES
('driver-001', 'driver', 'Mike Johnson', 'mike@ridendine.demo', '+1-555-0201', NOW()),
('driver-002', 'driver', 'Sarah Williams', 'sarah@ridendine.demo', '+1-555-0202', NOW()),
('driver-003', 'driver', 'Alex Martinez', 'alex@ridendine.demo', '+1-555-0203', NOW()),
('driver-004', 'driver', 'Emily Brown', 'emily@ridendine.demo', '+1-555-0204', NOW()),
('driver-005', 'driver', 'Tom Anderson', 'tom@ridendine.demo', '+1-555-0205', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Customer Profiles (role: customer)
INSERT INTO profiles (id, role, name, email, phone, created_at) VALUES
('customer-001', 'customer', 'Jane Doe', 'jane@ridendine.demo', '+1-555-0301', NOW()),
('customer-002', 'customer', 'John Smith', 'john@ridendine.demo', '+1-555-0302', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CHEF DETAILS
-- ============================================

INSERT INTO chefs (id, profile_id, status, connect_account_id, payout_enabled, address, lat, lng, cuisine_types, bio, photo_url, created_at) VALUES
('chef-001', 'chef-001', 'active', 'acct_demo_001', true, '123 Main St, New York, NY 10001', 40.7128, -74.0060, ARRAY['Mexican', 'Latin'], 'Authentic Mexican cuisine with a modern twist', 'https://i.pravatar.cc/300?img=1', NOW()),
('chef-002', 'chef-002', 'active', 'acct_demo_002', true, '456 Park Ave, New York, NY 10022', 40.7614, -73.9776, ARRAY['Chinese', 'Asian'], 'Traditional Chinese dishes from Sichuan province', 'https://i.pravatar.cc/300?img=2', NOW()),
('chef-003', 'chef-003', 'active', 'acct_demo_003', true, '789 Broadway, New York, NY 10003', 40.7308, -73.9973, ARRAY['Indian', 'Vegetarian'], 'North Indian specialties and vegetarian delights', 'https://i.pravatar.cc/300?img=3', NOW()),
('chef-004', 'chef-004', 'active', 'acct_demo_004', true, '321 Mulberry St, New York, NY 10012', 40.7214, -73.9967, ARRAY['Italian', 'Pizza'], 'Neapolitan pizza and fresh pasta', 'https://i.pravatar.cc/300?img=4', NOW()),
('chef-005', 'chef-005', 'active', 'acct_demo_005', true, '654 Amsterdam Ave, New York, NY 10025', 40.7939, -73.9718, ARRAY['Japanese', 'Sushi'], 'Traditional Japanese sushi and ramen', 'https://i.pravatar.cc/300?img=5', NOW()),
('chef-006', 'chef-006', 'active', 'acct_demo_006', true, '987 Columbus Ave, New York, NY 10025', 40.7985, -73.9665, ARRAY['French', 'Bakery'], 'Classic French cuisine and pastries', 'https://i.pravatar.cc/300?img=6', NOW()),
('chef-007', 'chef-007', 'active', 'acct_demo_007', true, '147 Bleecker St, New York, NY 10012', 40.7282, -74.0006, ARRAY['Spanish', 'Tapas'], 'Spanish tapas and paella', 'https://i.pravatar.cc/300?img=7', NOW()),
('chef-008', 'chef-008', 'active', 'acct_demo_008', true, '258 Atlantic Ave, Brooklyn, NY 11201', 40.6863, -73.9895, ARRAY['Middle Eastern', 'Mediterranean'], 'Authentic Middle Eastern flavors', 'https://i.pravatar.cc/300?img=8', NOW()),
('chef-009', 'chef-009', 'active', 'acct_demo_009', true, '369 Court St, Brooklyn, NY 11231', 40.6779, -74.0048, ARRAY['Korean', 'BBQ'], 'Korean BBQ and traditional dishes', 'https://i.pravatar.cc/300?img=9', NOW()),
('chef-010', 'chef-010', 'active', 'acct_demo_010', true, '741 Bedford Ave, Brooklyn, NY 11249', 40.7081, -73.9571, ARRAY['Russian', 'Eastern European'], 'Traditional Russian and Eastern European cuisine', 'https://i.pravatar.cc/300?img=10', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MENUS
-- ============================================

INSERT INTO menus (id, chef_id, title, description, is_active, created_at) VALUES
('menu-001', 'chef-001', 'Maria''s Mexican Favorites', 'Authentic Mexican dishes', true, NOW()),
('menu-002', 'chef-002', 'James'' Sichuan Menu', 'Spicy Sichuan specialties', true, NOW()),
('menu-003', 'chef-003', 'Aisha''s Indian Classics', 'North Indian comfort food', true, NOW()),
('menu-004', 'chef-004', 'Giovanni''s Pizza & Pasta', 'Fresh Italian favorites', true, NOW()),
('menu-005', 'chef-005', 'Kenji''s Sushi Bar', 'Traditional Japanese sushi', true, NOW()),
('menu-006', 'chef-006', 'Sophie''s French Bistro', 'Classic French dishes', true, NOW()),
('menu-007', 'chef-007', 'Carlos'' Tapas Selection', 'Spanish small plates', true, NOW()),
('menu-008', 'chef-008', 'Fatima''s Mediterranean', 'Middle Eastern specialties', true, NOW()),
('menu-009', 'chef-009', 'David''s Korean Kitchen', 'Korean BBQ and more', true, NOW()),
('menu-010', 'chef-010', 'Elena''s Russian Table', 'Traditional Russian dishes', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MENU ITEMS (50 dishes across 10 chefs)
-- ============================================

-- Chef 001 - Mexican (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-001', 'menu-001', 'Tacos al Pastor', 'Marinated pork with pineapple, onions, cilantro', 1200, true, 'https://source.unsplash.com/400x300/?tacos', ARRAY['gluten-free'], NOW()),
('item-002', 'menu-001', 'Chicken Enchiladas', 'Rolled tortillas with chicken, cheese, and red sauce', 1400, true, 'https://source.unsplash.com/400x300/?enchiladas', ARRAY[], NOW()),
('item-003', 'menu-001', 'Vegetarian Burrito Bowl', 'Black beans, rice, guacamole, salsa', 1100, true, 'https://source.unsplash.com/400x300/?burrito', ARRAY['vegetarian'], NOW()),
('item-004', 'menu-001', 'Carne Asada Quesadilla', 'Grilled steak with melted cheese', 1300, true, 'https://source.unsplash.com/400x300/?quesadilla', ARRAY[], NOW()),
('item-005', 'menu-001', 'Elote (Mexican Street Corn)', 'Grilled corn with mayo, cheese, chili', 600, true, 'https://source.unsplash.com/400x300/?corn', ARRAY['vegetarian', 'gluten-free'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 002 - Chinese (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-006', 'menu-002', 'Kung Pao Chicken', 'Spicy stir-fry with peanuts and vegetables', 1300, true, 'https://source.unsplash.com/400x300/?kung-pao', ARRAY[], NOW()),
('item-007', 'menu-002', 'Mapo Tofu', 'Soft tofu in spicy Sichuan sauce', 1100, true, 'https://source.unsplash.com/400x300/?tofu', ARRAY['vegetarian', 'spicy'], NOW()),
('item-008', 'menu-002', 'Dan Dan Noodles', 'Spicy sesame noodles with pork', 1000, true, 'https://source.unsplash.com/400x300/?noodles', ARRAY['spicy'], NOW()),
('item-009', 'menu-002', 'Twice-Cooked Pork', 'Pork belly with leeks and fermented beans', 1400, true, 'https://source.unsplash.com/400x300/?pork', ARRAY[], NOW()),
('item-010', 'menu-002', 'Hot and Sour Soup', 'Traditional spicy and tangy soup', 800, true, 'https://source.unsplash.com/400x300/?soup', ARRAY['spicy'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 003 - Indian (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-011', 'menu-003', 'Butter Chicken', 'Tender chicken in creamy tomato sauce', 1500, true, 'https://source.unsplash.com/400x300/?butter-chicken', ARRAY[], NOW()),
('item-012', 'menu-003', 'Palak Paneer', 'Spinach curry with cottage cheese', 1200, true, 'https://source.unsplash.com/400x300/?paneer', ARRAY['vegetarian'], NOW()),
('item-013', 'menu-003', 'Chicken Tikka Masala', 'Grilled chicken in spiced curry sauce', 1400, true, 'https://source.unsplash.com/400x300/?tikka', ARRAY[], NOW()),
('item-014', 'menu-003', 'Vegetable Biryani', 'Fragrant rice with mixed vegetables', 1100, true, 'https://source.unsplash.com/400x300/?biryani', ARRAY['vegetarian', 'vegan'], NOW()),
('item-015', 'menu-003', 'Samosa (3 pieces)', 'Crispy pastries filled with spiced potatoes', 700, true, 'https://source.unsplash.com/400x300/?samosa', ARRAY['vegetarian', 'vegan'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 004 - Italian (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-016', 'menu-004', 'Margherita Pizza', 'Classic tomato, mozzarella, basil', 1200, true, 'https://source.unsplash.com/400x300/?margherita-pizza', ARRAY['vegetarian'], NOW()),
('item-017', 'menu-004', 'Pepperoni Pizza', 'Tomato sauce, mozzarella, pepperoni', 1400, true, 'https://source.unsplash.com/400x300/?pepperoni-pizza', ARRAY[], NOW()),
('item-018', 'menu-004', 'Fettuccine Alfredo', 'Creamy parmesan pasta', 1300, true, 'https://source.unsplash.com/400x300/?alfredo', ARRAY['vegetarian'], NOW()),
('item-019', 'menu-004', 'Spaghetti Carbonara', 'Pasta with eggs, cheese, pancetta', 1400, true, 'https://source.unsplash.com/400x300/?carbonara', ARRAY[], NOW()),
('item-020', 'menu-004', 'Caprese Salad', 'Fresh mozzarella, tomatoes, basil', 900, true, 'https://source.unsplash.com/400x300/?caprese', ARRAY['vegetarian', 'gluten-free'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 005 - Japanese (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-021', 'menu-005', 'Sushi Combo (12 pieces)', 'Assorted nigiri and rolls', 2200, true, 'https://source.unsplash.com/400x300/?sushi', ARRAY['gluten-free'], NOW()),
('item-022', 'menu-005', 'Salmon Sashimi', 'Fresh raw salmon slices', 1800, true, 'https://source.unsplash.com/400x300/?sashimi', ARRAY['gluten-free'], NOW()),
('item-023', 'menu-005', 'Tonkotsu Ramen', 'Rich pork bone broth with noodles', 1500, true, 'https://source.unsplash.com/400x300/?ramen', ARRAY[], NOW()),
('item-024', 'menu-005', 'Chicken Teriyaki', 'Grilled chicken with teriyaki glaze', 1400, true, 'https://source.unsplash.com/400x300/?teriyaki', ARRAY['gluten-free'], NOW()),
('item-025', 'menu-005', 'Vegetable Tempura', 'Lightly battered and fried vegetables', 1100, true, 'https://source.unsplash.com/400x300/?tempura', ARRAY['vegetarian'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 006 - French (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-026', 'menu-006', 'Coq au Vin', 'Chicken braised in red wine', 1800, true, 'https://source.unsplash.com/400x300/?coq-au-vin', ARRAY[], NOW()),
('item-027', 'menu-006', 'Beef Bourguignon', 'Slow-cooked beef in burgundy wine', 2000, true, 'https://source.unsplash.com/400x300/?beef-bourguignon', ARRAY[], NOW()),
('item-028', 'menu-006', 'Ratatouille', 'Provençal vegetable stew', 1200, true, 'https://source.unsplash.com/400x300/?ratatouille', ARRAY['vegetarian', 'vegan', 'gluten-free'], NOW()),
('item-029', 'menu-006', 'French Onion Soup', 'Caramelized onions with cheese', 1000, true, 'https://source.unsplash.com/400x300/?onion-soup', ARRAY['vegetarian'], NOW()),
('item-030', 'menu-006', 'Crème Brûlée', 'Vanilla custard with caramelized sugar', 800, true, 'https://source.unsplash.com/400x300/?creme-brulee', ARRAY['vegetarian', 'gluten-free'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 007 - Spanish (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-031', 'menu-007', 'Paella Valenciana', 'Traditional rice dish with chicken and seafood', 1800, true, 'https://source.unsplash.com/400x300/?paella', ARRAY['gluten-free'], NOW()),
('item-032', 'menu-007', 'Patatas Bravas', 'Crispy potatoes with spicy tomato sauce', 900, true, 'https://source.unsplash.com/400x300/?patatas-bravas', ARRAY['vegetarian', 'vegan'], NOW()),
('item-033', 'menu-007', 'Gambas al Ajillo', 'Garlic shrimp tapas', 1300, true, 'https://source.unsplash.com/400x300/?gambas', ARRAY['gluten-free'], NOW()),
('item-034', 'menu-007', 'Chorizo in Red Wine', 'Spanish sausage cooked in wine', 1100, true, 'https://source.unsplash.com/400x300/?chorizo', ARRAY['gluten-free'], NOW()),
('item-035', 'menu-007', 'Tortilla Española', 'Spanish potato and egg omelette', 800, true, 'https://source.unsplash.com/400x300/?tortilla', ARRAY['vegetarian', 'gluten-free'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 008 - Middle Eastern (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-036', 'menu-008', 'Chicken Shawarma Plate', 'Marinated chicken with rice and salad', 1400, true, 'https://source.unsplash.com/400x300/?shawarma', ARRAY[], NOW()),
('item-037', 'menu-008', 'Falafel Wrap', 'Chickpea fritters with tahini sauce', 1000, true, 'https://source.unsplash.com/400x300/?falafel', ARRAY['vegetarian', 'vegan'], NOW()),
('item-038', 'menu-008', 'Lamb Kofta', 'Spiced ground lamb kebabs', 1600, true, 'https://source.unsplash.com/400x300/?kofta', ARRAY['gluten-free'], NOW()),
('item-039', 'menu-008', 'Hummus & Pita', 'Creamy chickpea dip with warm bread', 700, true, 'https://source.unsplash.com/400x300/?hummus', ARRAY['vegetarian', 'vegan'], NOW()),
('item-040', 'menu-008', 'Baba Ganoush', 'Smoky eggplant dip', 800, true, 'https://source.unsplash.com/400x300/?baba-ganoush', ARRAY['vegetarian', 'vegan', 'gluten-free'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 009 - Korean (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-041', 'menu-009', 'Korean BBQ Short Ribs', 'Marinated beef ribs for grilling', 2200, true, 'https://source.unsplash.com/400x300/?korean-bbq', ARRAY['gluten-free'], NOW()),
('item-042', 'menu-009', 'Bibimbap', 'Mixed rice bowl with vegetables and egg', 1300, true, 'https://source.unsplash.com/400x300/?bibimbap', ARRAY['vegetarian'], NOW()),
('item-043', 'menu-009', 'Kimchi Fried Rice', 'Spicy fermented cabbage fried rice', 1100, true, 'https://source.unsplash.com/400x300/?kimchi', ARRAY['spicy'], NOW()),
('item-044', 'menu-009', 'Korean Fried Chicken', 'Crispy chicken with sweet-spicy glaze', 1500, true, 'https://source.unsplash.com/400x300/?korean-chicken', ARRAY[], NOW()),
('item-045', 'menu-009', 'Japchae', 'Sweet potato noodles with vegetables', 1200, true, 'https://source.unsplash.com/400x300/?japchae', ARRAY['vegetarian', 'vegan'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Chef 010 - Russian (5 dishes)
INSERT INTO menu_items (id, menu_id, name, description, price_cents, is_available, photo_url, dietary_tags, created_at) VALUES
('item-046', 'menu-010', 'Beef Stroganoff', 'Tender beef in creamy mushroom sauce', 1700, true, 'https://source.unsplash.com/400x300/?stroganoff', ARRAY[], NOW()),
('item-047', 'menu-010', 'Borscht', 'Traditional beet soup with sour cream', 900, true, 'https://source.unsplash.com/400x300/?borscht', ARRAY['vegetarian'], NOW()),
('item-048', 'menu-010', 'Pelmeni', 'Siberian dumplings with meat filling', 1200, true, 'https://source.unsplash.com/400x300/?pelmeni', ARRAY[], NOW()),
('item-049', 'menu-010', 'Chicken Kiev', 'Breaded chicken with herb butter', 1600, true, 'https://source.unsplash.com/400x300/?chicken-kiev', ARRAY[], NOW()),
('item-050', 'menu-010', 'Blini with Caviar', 'Thin pancakes with caviar and sour cream', 2500, true, 'https://source.unsplash.com/400x300/?blini', ARRAY[], NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================

-- Count verification
DO $$
DECLARE
    profile_count INT;
    chef_count INT;
    menu_count INT;
    item_count INT;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id LIKE 'chef-%' OR id LIKE 'driver-%' OR id LIKE 'customer-%';
    SELECT COUNT(*) INTO chef_count FROM chefs WHERE id LIKE 'chef-%';
    SELECT COUNT(*) INTO menu_count FROM menus WHERE id LIKE 'menu-%';
    SELECT COUNT(*) INTO item_count FROM menu_items WHERE id LIKE 'item-%';

    RAISE NOTICE '✅ Demo data seeded successfully!';
    RAISE NOTICE '   Profiles: % (10 chefs + 5 drivers + 2 customers)', profile_count;
    RAISE NOTICE '   Chefs: %', chef_count;
    RAISE NOTICE '   Menus: %', menu_count;
    RAISE NOTICE '   Menu Items: %', item_count;
END $$;
