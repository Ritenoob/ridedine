-- Add payment distribution tables and columns for multi-party payment splitting
-- CoCo partner receives $6.00 per order, drivers receive delivery_fee_cents

-- CoCo configuration table (single row for the partner organization)
CREATE TABLE IF NOT EXISTS coco_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_account_id TEXT UNIQUE,
  payout_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Payment transfers tracking table (reconciliation for all multi-party transfers)
CREATE TABLE IF NOT EXISTS payment_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('chef', 'coco', 'driver', 'delivery_company')),
  recipient_id UUID NOT NULL,
  stripe_transfer_id TEXT UNIQUE,
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'skipped')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Add Stripe Connect account columns to drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS connect_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payout_enabled BOOLEAN NOT NULL DEFAULT false;

-- Indexes for payment_transfers queries
CREATE INDEX IF NOT EXISTS idx_payment_transfers_order ON payment_transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_recipient ON payment_transfers(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_status ON payment_transfers(status);

-- RLS Policies for coco_config
ALTER TABLE coco_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_can_manage_coco_config"
ON coco_config FOR ALL TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "coco_config_public_read"
ON coco_config FOR SELECT TO authenticated
USING (true);

-- RLS Policies for payment_transfers
ALTER TABLE payment_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_can_manage_all_transfers"
ON payment_transfers FOR ALL TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "chefs_can_view_own_transfers"
ON payment_transfers FOR SELECT TO authenticated
USING (
  recipient_type = 'chef' AND
  EXISTS (
    SELECT 1 FROM chefs
    WHERE chefs.profile_id = auth.uid()
    AND chefs.id = payment_transfers.recipient_id
  )
);

CREATE POLICY "drivers_can_view_own_transfers"
ON payment_transfers FOR SELECT TO authenticated
USING (
  recipient_type = 'driver' AND
  EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.profile_id = auth.uid()
    AND drivers.id = payment_transfers.recipient_id
  )
);

-- Insert default CoCo config row (admin will complete Stripe onboarding later)
INSERT INTO coco_config (stripe_account_id, payout_enabled)
VALUES (NULL, false)
ON CONFLICT DO NOTHING;
