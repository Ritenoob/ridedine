-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('customer', 'chef', 'driver', 'admin')),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create chefs table
CREATE TABLE IF NOT EXISTS chefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  connect_account_id TEXT,
  payout_enabled BOOLEAN DEFAULT FALSE,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  cuisine_types TEXT[] DEFAULT '{}',
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chefs_profile_id ON chefs(profile_id);
CREATE INDEX IF NOT EXISTS idx_chefs_status ON chefs(status);

ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;

-- Chefs can read their own data
CREATE POLICY "Chefs can read own data" ON chefs
  FOR SELECT USING (profile_id = auth.uid());

-- Chefs can update their own data
CREATE POLICY "Chefs can update own data" ON chefs
  FOR UPDATE USING (profile_id = auth.uid());

-- Everyone can view approved chefs
CREATE POLICY "Anyone can view approved chefs" ON chefs
  FOR SELECT USING (status = 'approved');

-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_chef_id ON menus(chef_id);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Chefs can manage their own menus
CREATE POLICY "Chefs can manage own menus" ON menus
  FOR ALL USING (
    chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  );

-- Everyone can view active menus from approved chefs
CREATE POLICY "Anyone can view active menus" ON menus
  FOR SELECT USING (
    is_active = TRUE AND 
    chef_id IN (SELECT id FROM chefs WHERE status = 'approved')
  );

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  is_available BOOLEAN DEFAULT TRUE,
  photo_url TEXT,
  dietary_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Chefs can manage their own menu items
CREATE POLICY "Chefs can manage own menu items" ON menu_items
  FOR ALL USING (
    menu_id IN (
      SELECT m.id FROM menus m
      INNER JOIN chefs c ON m.chef_id = c.id
      WHERE c.profile_id = auth.uid()
    )
  );

-- Everyone can view available menu items
CREATE POLICY "Anyone can view available menu items" ON menu_items
  FOR SELECT USING (
    is_available = TRUE AND
    menu_id IN (
      SELECT m.id FROM menus m
      INNER JOIN chefs c ON m.chef_id = c.id
      WHERE m.is_active = TRUE AND c.status = 'approved'
    )
  );

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (
    status IN ('placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled', 'refunded')
  ),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  platform_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_chef_id ON orders(chef_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can read their own orders
CREATE POLICY "Customers can read own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- Chefs can read orders assigned to them
CREATE POLICY "Chefs can read assigned orders" ON orders
  FOR SELECT USING (
    chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  );

-- Chefs can update status of their orders
CREATE POLICY "Chefs can update order status" ON orders
  FOR UPDATE USING (
    chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  );

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can read order items for their orders
CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE customer_id = auth.uid() OR 
            chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
    )
  );

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (
    status IN ('assigned', 'en_route_to_pickup', 'arrived_at_pickup', 'picked_up', 
               'en_route_to_dropoff', 'arrived_at_dropoff', 'delivered')
  ),
  pickup_eta TIMESTAMP WITH TIME ZONE,
  dropoff_eta TIMESTAMP WITH TIME ZONE,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Drivers can read and update their deliveries
CREATE POLICY "Drivers can manage assigned deliveries" ON deliveries
  FOR ALL USING (driver_id = auth.uid());

-- Customers and chefs can read delivery status for their orders
CREATE POLICY "Users can read delivery status for their orders" ON deliveries
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE customer_id = auth.uid() OR 
            chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chefs_updated_at BEFORE UPDATE ON chefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
