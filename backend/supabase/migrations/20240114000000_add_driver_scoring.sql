-- Migration: Add Driver Reliability Scoring
-- Created: 2024-01-14
-- Purpose: Add driver_scores table and reliability calculation triggers

-- CRITICAL FIX: Add 'pending' to deliveries.status CHECK constraint
-- Without this, auto-assignment trigger cannot create deliveries with status='pending'
ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check CHECK (
  status IN ('pending', 'assigned', 'en_route_to_pickup', 'arrived_at_pickup',
             'picked_up', 'en_route_to_dropoff', 'arrived_at_dropoff', 'delivered')
);

-- Create driver_scores table
CREATE TABLE IF NOT EXISTS driver_scores (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  total_deliveries INT NOT NULL DEFAULT 0,
  on_time_deliveries INT NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (avg_rating >= 0 AND avg_rating <= 5.00),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for score lookups
CREATE INDEX IF NOT EXISTS idx_driver_scores_score ON driver_scores(score DESC);

-- Enable RLS on driver_scores
ALTER TABLE driver_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Drivers can view own score, admins can view all
CREATE POLICY "Drivers can view own score"
ON driver_scores FOR SELECT TO authenticated
USING (driver_id IN (
  SELECT id FROM drivers WHERE profile_id = auth.uid()
));

CREATE POLICY "Service role can manage all scores"
ON driver_scores FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Trigger function to update driver scores when delivery is completed
CREATE OR REPLACE FUNCTION update_driver_reliability_score()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_id UUID;
  v_total_deliveries INT;
  v_on_time_deliveries INT;
  v_avg_rating DECIMAL(3,2);
  v_new_score INT;
  v_on_time_bonus INT;
  v_rating_bonus INT;
BEGIN
  -- Only process when status changes to 'delivered'
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered' THEN
    v_driver_id := NEW.driver_id;

    -- Skip if no driver assigned
    IF v_driver_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Calculate totals from deliveries table
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE updated_at <= dropoff_eta),  -- On-time = completed before dropoff ETA
      0.00  -- Placeholder: no ratings table yet, starts at 0 until ratings are implemented
    INTO v_total_deliveries, v_on_time_deliveries, v_avg_rating
    FROM deliveries
    WHERE driver_id = v_driver_id AND status = 'delivered';

    -- Calculate on-time bonus (0-25 points)
    -- 100% on-time = 25 points, 0% on-time = 0 points
    v_on_time_bonus := CASE
      WHEN v_total_deliveries > 0 THEN
        LEAST(25, (v_on_time_deliveries * 25) / v_total_deliveries)
      ELSE 0
    END;

    -- Calculate rating bonus (0-25 points)
    -- 5.0 rating = 25 points, 0.0 rating = 0 points
    v_rating_bonus := LEAST(25, (v_avg_rating * 5)::INT);

    -- Final score: base(50) + on_time_bonus(0-25) + rating_bonus(0-25) = 50-100
    v_new_score := 50 + v_on_time_bonus + v_rating_bonus;

    -- Ensure score stays within bounds
    v_new_score := GREATEST(0, LEAST(100, v_new_score));

    -- Insert or update driver score
    INSERT INTO driver_scores (driver_id, score, total_deliveries, on_time_deliveries, avg_rating)
    VALUES (v_driver_id, v_new_score, v_total_deliveries, v_on_time_deliveries, v_avg_rating)
    ON CONFLICT (driver_id) DO UPDATE
    SET
      score = v_new_score,
      total_deliveries = v_total_deliveries,
      on_time_deliveries = v_on_time_deliveries,
      avg_rating = v_avg_rating,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on deliveries table
DROP TRIGGER IF EXISTS trigger_update_driver_reliability ON deliveries;
CREATE TRIGGER trigger_update_driver_reliability
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_reliability_score();

-- Seed initial scores for existing drivers (default 50)
INSERT INTO driver_scores (driver_id, score, total_deliveries, on_time_deliveries, avg_rating)
SELECT
  id AS driver_id,
  50 AS score,
  0 AS total_deliveries,
  0 AS on_time_deliveries,
  0.00 AS avg_rating
FROM drivers
ON CONFLICT (driver_id) DO NOTHING;

-- Grant execute permission on trigger function
GRANT EXECUTE ON FUNCTION update_driver_reliability_score TO service_role;
GRANT EXECUTE ON FUNCTION update_driver_reliability_score TO authenticated;
