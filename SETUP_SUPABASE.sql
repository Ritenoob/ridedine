-- RidenDine Production Database Setup
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/exzccczfixfoscgdxebbz/sql

-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'chef', 'driver', 'admin')),
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  cuisine_type TEXT,
  bio TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES chefs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cuisine_type TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id),
  chef_id UUID REFERENCES chefs(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2),
  delivery_address TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'picked_up', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view approved chefs" ON chefs
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Public can view available dishes" ON dishes
  FOR SELECT USING (available = true);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Chefs can view their orders" ON orders
  FOR SELECT USING (
    chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  );

CREATE POLICY "Anyone can view order items for their orders" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id = auth.uid()
      OR chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Customers can create order items" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a demo chef with dishes
DO $$
DECLARE
  demo_chef_user_id UUID;
  demo_chef_id UUID;
  demo_admin_user_id UUID;
BEGIN
  -- Create demo chef user in auth
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'chef@ridendine.demo',
    crypt('demo123456', gen_salt('bf')),
    NOW(),
    '{"role": "chef", "name": "Demo Chef Maria"}'::jsonb,
    NOW(),
    NOW()
  ) RETURNING id INTO demo_chef_user_id;

  -- Create profile
  INSERT INTO profiles (id, role, name, email, phone)
  VALUES (demo_chef_user_id, 'chef', 'Demo Chef Maria', 'chef@ridendine.demo', '+1-555-0101');

  -- Create chef business
  INSERT INTO chefs (profile_id, business_name, cuisine_type, bio, status, rating)
  VALUES (demo_chef_user_id, 'Maria''s Kitchen', 'Italian', 'Authentic homemade Italian cuisine from Hamilton', 'approved', 4.8)
  RETURNING id INTO demo_chef_id;

  -- Create dishes
  INSERT INTO dishes (chef_id, name, description, price, cuisine_type, available) VALUES
    (demo_chef_id, 'Margherita Pizza', 'Fresh mozzarella, basil, San Marzano tomatoes', 14.99, 'Italian', true),
    (demo_chef_id, 'Pasta Carbonara', 'Classic Roman pasta with guanciale and pecorino', 16.99, 'Italian', true),
    (demo_chef_id, 'Lasagna Bolognese', 'Layers of pasta, rich meat sauce, and béchamel', 18.99, 'Italian', true),
    (demo_chef_id, 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 7.99, 'Italian', true);

  -- Create admin user
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'admin@ridendine.demo',
    crypt('admin123456', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "name": "Admin User"}'::jsonb,
    NOW(),
    NOW()
  ) RETURNING id INTO demo_admin_user_id;

  -- Create admin profile
  INSERT INTO profiles (id, role, name, email, phone)
  VALUES (demo_admin_user_id, 'admin', 'Admin User', 'admin@ridendine.demo', '+1-555-0001');

  RAISE NOTICE 'Demo accounts created!';
  RAISE NOTICE 'Chef: chef@ridendine.demo / demo123456';
  RAISE NOTICE 'Admin: admin@ridendine.demo / admin123456';
END $$;
