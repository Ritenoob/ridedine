-- Create audit_log table for tracking security-relevant events
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth.signin',
    'auth.signout',
    'auth.signup',
    'auth.password_reset',
    'order.created',
    'order.updated',
    'order.cancelled',
    'payment.succeeded',
    'payment.failed',
    'admin.user_updated',
    'admin.order_updated',
    'admin.chef_approved',
    'admin.chef_rejected',
    'security.rate_limit_exceeded',
    'security.auth_failed'
  )),
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_event ON audit_log(user_id, event_type);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_log
-- Only service role can insert (via Edge Functions)
CREATE POLICY "service_role_can_insert_audit_log"
ON audit_log FOR INSERT TO service_role
WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "users_can_view_own_audit_log"
ON audit_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all audit logs (assuming admin role check)
-- Note: This requires a function to check admin role from profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "admins_can_view_all_audit_logs"
ON audit_log FOR SELECT TO authenticated
USING (is_admin());

-- Function to log audit events (called from Edge Functions or database triggers)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (user_id, event_type, event_data, ip_address, user_agent)
  VALUES (
    p_user_id,
    p_event_type,
    p_event_data,
    p_ip_address::INET,
    p_user_agent
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;

-- Trigger to automatically log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.customer_id,
      'order.created',
      jsonb_build_object(
        'order_id', NEW.id,
        'chef_id', NEW.chef_id,
        'total_cents', NEW.total_cents,
        'delivery_method', NEW.delivery_method
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_audit_event(
      NEW.customer_id,
      'order.updated',
      jsonb_build_object(
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Data retention: automatically delete audit logs older than 1 year
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Note: Schedule this function to run periodically via pg_cron or external scheduler
-- For now, it's a manual function that can be called when needed
