-- ============================================================
-- Commission & Payout System
-- ============================================================

-- Commission records generated per order
CREATE TABLE IF NOT EXISTS commission_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  chef_id uuid NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  order_total_cents integer NOT NULL DEFAULT 0,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.1500,
  commission_cents integer NOT NULL DEFAULT 0,
  chef_payout_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'paid_out', 'disputed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  paid_out_at timestamptz
);

-- Payout logs for tracking payments to chefs
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id uuid NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL DEFAULT 0,
  commission_record_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text
);

-- Platform settings for admin-configurable commission rate
CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default commission rate (15%)
INSERT INTO platform_settings (key, value) VALUES ('commission_rate', '0.15')
ON CONFLICT (key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commission_records_order ON commission_records(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_chef ON commission_records(chef_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(status);
CREATE INDEX IF NOT EXISTS idx_payouts_chef ON payouts(chef_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- Row Level Security
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read all commission records
CREATE POLICY "Admin can manage commission records" ON commission_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Chefs can view their own commission records
CREATE POLICY "Chefs can view own commissions" ON commission_records
  FOR SELECT USING (
    chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  );

-- Admin can manage payouts
CREATE POLICY "Admin can manage payouts" ON payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Chefs can view their own payouts
CREATE POLICY "Chefs can view own payouts" ON payouts
  FOR SELECT USING (
    chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  );

-- Admin can manage platform settings
CREATE POLICY "Admin can manage settings" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone can read platform settings
CREATE POLICY "Anyone can read settings" ON platform_settings
  FOR SELECT USING (true);
