-- Add missing columns and update schema for new features

-- Add tip_cents to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_cents INTEGER DEFAULT 0 CHECK (tip_cents >= 0);

-- Add featured flag to dishes table
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_dishes_featured ON dishes(featured);

-- Add dish_id column to order_items (keeping menu_item_id for backward compatibility)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS dish_id UUID REFERENCES dishes(id);

-- Allow customers to create orders
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
CREATE POLICY "Customers can create orders" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Allow customers to insert order items for their orders
DROP POLICY IF EXISTS "Customers can create order items" ON order_items;
CREATE POLICY "Customers can create order items" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- Update the tracking token trigger to apply on INSERT
DROP TRIGGER IF EXISTS set_tracking_token_trigger ON orders;
CREATE TRIGGER set_tracking_token_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_token();
