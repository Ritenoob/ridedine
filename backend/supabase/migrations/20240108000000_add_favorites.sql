-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favoritable_type TEXT NOT NULL CHECK (favoritable_type IN ('chef', 'dish')),
  favoritable_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, favoritable_type, favoritable_id)
);

-- Create index for faster lookups
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_favoritable ON favorites(favoritable_type, favoritable_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites
CREATE POLICY "users_can_view_own_favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_can_add_own_favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_favorites"
ON favorites FOR DELETE
USING (auth.uid() = user_id);

-- Create saved_addresses table
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX idx_saved_addresses_default ON saved_addresses(user_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_addresses
CREATE POLICY "users_can_view_own_addresses"
ON saved_addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_can_add_own_addresses"
ON saved_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_addresses"
ON saved_addresses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_addresses"
ON saved_addresses FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_addresses_updated_at
BEFORE UPDATE ON saved_addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
