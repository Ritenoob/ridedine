-- Fix deliveries.driver_id FK constraint
-- Issue: deliveries.driver_id was referencing profiles(id) but assign_driver writes drivers(id) values
-- This caused FK constraint violations when assigning drivers to deliveries

-- Drop the existing FK constraint
-- Note: In PostgreSQL, FK constraints are named {table}_{column}_fkey by default
ALTER TABLE deliveries
  DROP CONSTRAINT IF EXISTS deliveries_driver_id_fkey;

-- Add the correct FK constraint pointing to drivers table
ALTER TABLE deliveries
  ADD CONSTRAINT deliveries_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES drivers(id)
  ON DELETE SET NULL;

-- Drop the old RLS policy that assumed driver_id was a profile_id
DROP POLICY IF EXISTS "Drivers can manage assigned deliveries" ON deliveries;

-- Create new RLS policy that joins through drivers table to get profile_id
CREATE POLICY "Drivers can manage assigned deliveries" ON deliveries
  FOR ALL USING (
    driver_id IN (
      SELECT id FROM drivers WHERE profile_id = auth.uid()
    )
  );
