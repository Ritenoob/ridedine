-- Enhanced schema with simplified dishes table and tracking tokens
-- This migration adds/modifies tables for the unified Supabase system

-- Add tracking_token to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);

-- Create simplified dishes table (combining menu and menu_items)
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  cuisine_type TEXT,
  dietary_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dishes_chef_id ON dishes(chef_id);
CREATE INDEX IF NOT EXISTS idx_dishes_available ON dishes(available);

ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

-- Chefs can manage their own dishes
CREATE POLICY "Chefs can manage own dishes" ON dishes
  FOR ALL USING (
    chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  );

-- Everyone can view available dishes from approved chefs
CREATE POLICY "Anyone can view available dishes" ON dishes
  FOR SELECT USING (
    available = TRUE AND
    chef_id IN (SELECT id FROM chefs WHERE status = 'approved')
  );

-- Create trigger for dishes updated_at
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add customer_name and customer_email to orders for tracking without auth
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Update drivers table structure
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  phone TEXT,
  vehicle_type TEXT,
  license_plate TEXT,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON drivers(profile_id);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Drivers can read and update their own data
CREATE POLICY "Drivers can manage own data" ON drivers
  FOR ALL USING (profile_id = auth.uid());

-- Create trigger for drivers updated_at
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add rating to chefs table if not exists
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0;

-- Function to generate tracking token
CREATE OR REPLACE FUNCTION generate_tracking_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TRK-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking token on order insert
CREATE OR REPLACE FUNCTION set_tracking_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := generate_tracking_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_tracking_token 
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_tracking_token();
