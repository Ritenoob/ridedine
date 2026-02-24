-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, token)
);

-- Create index for faster lookups
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_tokens
CREATE POLICY "users_can_view_own_tokens"
ON push_tokens FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_own_tokens"
ON push_tokens FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_tokens"
ON push_tokens FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_tokens"
ON push_tokens FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_push_tokens_updated_at_trigger ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at_trigger
BEFORE UPDATE ON push_tokens
FOR EACH ROW
EXECUTE FUNCTION update_push_tokens_updated_at();

-- Function to clean up old/inactive tokens
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS void AS $$
BEGIN
  -- Mark tokens as inactive if they haven't been updated in 90 days
  UPDATE push_tokens
  SET is_active = false
  WHERE is_active = true
    AND (updated_at IS NULL AND created_at < NOW() - INTERVAL '90 days')
    OR (updated_at IS NOT NULL AND updated_at < NOW() - INTERVAL '90 days');
END;
$$ LANGUAGE plpgsql;
