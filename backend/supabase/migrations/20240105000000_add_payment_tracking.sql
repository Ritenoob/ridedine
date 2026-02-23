-- Add payment tracking columns to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
