-- Add Location Indexes for Google Maps Integration
-- Created: 2024-01-12
-- Purpose: Optimize location-based queries for chef discovery and delivery tracking

-- Add indexes on latitude/longitude columns for fast distance queries
CREATE INDEX IF NOT EXISTS idx_chefs_location ON chefs(current_lat, current_lng) WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(current_lat, current_lng) WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;

-- Add indexes on delivery location columns
CREATE INDEX IF NOT EXISTS idx_deliveries_pickup_location ON deliveries(pickup_lat, pickup_lng) WHERE pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_dropoff_location ON deliveries(dropoff_lat, dropoff_lng) WHERE dropoff_lat IS NOT NULL AND dropoff_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_location ON deliveries(driver_lat, driver_lng) WHERE driver_lat IS NOT NULL AND driver_lng IS NOT NULL;

-- Add comments
COMMENT ON INDEX idx_chefs_location IS 'Optimize nearby chef queries';
COMMENT ON INDEX idx_drivers_location IS 'Optimize nearby driver queries';
COMMENT ON INDEX idx_deliveries_pickup_location IS 'Optimize pickup location queries';
COMMENT ON INDEX idx_deliveries_dropoff_location IS 'Optimize dropoff location queries';
COMMENT ON INDEX idx_deliveries_driver_location IS 'Optimize driver location queries for customer tracking';
