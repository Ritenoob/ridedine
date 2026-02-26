-- Add columns to existing drivers table for availability tracking
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(current_lat, current_lng) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available) WHERE is_available = true;

-- Enhance deliveries table with driver tracking fields
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS driver_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS driver_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS driver_last_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_eta TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dropoff_eta TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS dropoff_address TEXT,
ADD COLUMN IF NOT EXISTS dropoff_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS dropoff_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS delivery_fee_cents INT NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5,2);

-- Create index for driver location tracking
CREATE INDEX idx_deliveries_driver_location ON deliveries(driver_id, status) WHERE status IN ('en_route_to_pickup', 'picked_up', 'en_route_to_dropoff');

-- Enable RLS on drivers table
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drivers table
CREATE POLICY "drivers_can_view_own_profile"
ON drivers FOR SELECT TO authenticated
USING (auth.uid() = profile_id);

CREATE POLICY "drivers_can_update_own_profile"
ON drivers FOR UPDATE TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "public_can_view_active_drivers"
ON drivers FOR SELECT TO authenticated
USING (is_available = true AND is_verified = true);

-- Trigger to update updated_at timestamp on drivers
CREATE OR REPLACE FUNCTION update_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_drivers_updated_at_trigger ON drivers;
CREATE TRIGGER update_drivers_updated_at_trigger
BEFORE UPDATE ON drivers
FOR EACH ROW
EXECUTE FUNCTION update_drivers_updated_at();

-- Function to update driver stats after delivery completion
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered' THEN
    UPDATE drivers
    SET
      total_deliveries = total_deliveries + 1,
      is_available = true  -- Make driver available again after delivery
    WHERE id = NEW.driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_driver_stats ON deliveries;
CREATE TRIGGER trigger_update_driver_stats
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_stats();

-- Function to find nearby available drivers (for auto-assignment)
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_max_distance_km DECIMAL DEFAULT 10.0,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  driver_id UUID,
  profile_id UUID,
  distance_km DECIMAL,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS driver_id,
    d.profile_id,
    -- Haversine distance calculation
    (
      6371 * acos(
        cos(radians(p_lat)) *
        cos(radians(d.current_lat)) *
        cos(radians(d.current_lng) - radians(p_lng)) +
        sin(radians(p_lat)) *
        sin(radians(d.current_lat))
      )
    )::DECIMAL(5,2) AS distance_km,
    d.current_lat,
    d.current_lng
  FROM drivers d
  WHERE
    d.is_available = true
    AND d.is_verified = true
    AND d.current_lat IS NOT NULL
    AND d.current_lng IS NOT NULL
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_nearby_drivers TO service_role;
GRANT EXECUTE ON FUNCTION find_nearby_drivers TO authenticated;
