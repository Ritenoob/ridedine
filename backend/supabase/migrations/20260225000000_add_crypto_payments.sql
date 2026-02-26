-- Add crypto payment support to RidenDine
-- Migration: 20260225000000_add_crypto_payments.sql
-- Purpose: Enable cryptocurrency payments via Coinbase Commerce

-- 1. Update orders table to support crypto payment method
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'stripe'
  CHECK (payment_method IN ('stripe', 'crypto'));

-- 2. Create crypto_payments table
CREATE TABLE IF NOT EXISTS crypto_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Processor info (Coinbase Commerce)
  processor VARCHAR(50) NOT NULL DEFAULT 'coinbase_commerce',
  processor_payment_id VARCHAR(255) NOT NULL, -- Coinbase charge ID
  hosted_url TEXT, -- Coinbase hosted payment page URL

  -- Payment details
  cryptocurrency VARCHAR(20), -- 'BTC', 'ETH', 'USDC', 'USDT', etc.
  crypto_amount VARCHAR(100), -- Amount in crypto (e.g., "0.00087" BTC)
  fiat_amount_cents INTEGER NOT NULL, -- Amount in CAD cents
  fiat_currency VARCHAR(3) DEFAULT 'CAD',

  -- Exchange rate at time of payment
  exchange_rate_crypto_to_fiat DECIMAL(20, 8),

  -- Blockchain details
  wallet_address VARCHAR(255), -- Receiving wallet address
  transaction_hash VARCHAR(255), -- On-chain transaction hash
  block_height INTEGER, -- Block number
  confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 1,

  -- Network info
  network VARCHAR(50), -- 'ethereum', 'bitcoin', 'polygon', etc.

  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',        -- Waiting for customer payment
      'detected',       -- Payment seen on blockchain (0 confirmations)
      'confirming',     -- Waiting for required confirmations
      'confirmed',      -- Fully confirmed and settled
      'overpaid',       -- Customer paid more than required
      'underpaid',      -- Customer paid less than required
      'expired',        -- Payment window expired (15 min default)
      'cancelled',      -- Customer cancelled
      'failed',         -- Payment failed for some reason
      'resolved'        -- Overpaid/underpaid resolved by admin
    )),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '15 minutes',
  detected_at TIMESTAMP WITH TIME ZONE, -- First seen on blockchain
  confirmed_at TIMESTAMP WITH TIME ZONE, -- Fully confirmed

  -- Metadata (store full Coinbase Commerce webhook data)
  metadata JSONB,

  -- Constraints
  UNIQUE(order_id),
  UNIQUE(processor_payment_id)
);

-- 3. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_crypto_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_order ON crypto_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_crypto_processor_id ON crypto_payments(processor_payment_id);
CREATE INDEX IF NOT EXISTS idx_crypto_tx_hash ON crypto_payments(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_created ON crypto_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_expires ON crypto_payments(expires_at);

-- 4. Enable Row Level Security
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Customers can view their own crypto payments
CREATE POLICY "Users can view own crypto payments"
  ON crypto_payments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- 6. RLS Policy: Admins can view all crypto payments
CREATE POLICY "Admins can view all crypto payments"
  ON crypto_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. RLS Policy: Service role can insert/update crypto payments
CREATE POLICY "Service role can manage crypto payments"
  ON crypto_payments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. Add comments for documentation
COMMENT ON TABLE crypto_payments IS 'Tracks cryptocurrency payments via Coinbase Commerce';
COMMENT ON COLUMN crypto_payments.processor_payment_id IS 'Coinbase Commerce charge ID for webhook tracking';
COMMENT ON COLUMN crypto_payments.hosted_url IS 'URL to Coinbase Commerce payment page';
COMMENT ON COLUMN crypto_payments.crypto_amount IS 'Amount in cryptocurrency (stored as string for precision)';
COMMENT ON COLUMN crypto_payments.confirmations IS 'Number of blockchain confirmations received';
COMMENT ON COLUMN crypto_payments.metadata IS 'Full Coinbase Commerce webhook data as JSON';
