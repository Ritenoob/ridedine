-- Migration: Add geocode cache table
-- Purpose: Cache Google Geocoding API results for 30 days to minimize API usage
-- Based on: docs/GOOGLE_MAPS_INTEGRATION.md Phase 1

CREATE TABLE geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  place_id TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by address
CREATE INDEX idx_geocode_cache_address ON geocode_cache(address);

-- Index for cleanup queries (delete entries older than 30 days)
CREATE INDEX idx_geocode_cache_created ON geocode_cache(created_at);

-- RLS policies
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (Edge Functions use service role key)
CREATE POLICY "Service role can manage geocode cache"
  ON geocode_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read geocode cache (for customer apps)
CREATE POLICY "Authenticated users can read geocode cache"
  ON geocode_cache
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE geocode_cache IS 'Caches Google Geocoding API results for 30 days to stay within free tier limits';
COMMENT ON COLUMN geocode_cache.address IS 'Normalized address string used as lookup key';
COMMENT ON COLUMN geocode_cache.place_id IS 'Google Place ID from Geocoding API';
COMMENT ON COLUMN geocode_cache.lat IS 'Latitude coordinate';
COMMENT ON COLUMN geocode_cache.lng IS 'Longitude coordinate';
COMMENT ON COLUMN geocode_cache.cached_at IS 'Last time this entry was accessed (for LRU eviction)';
COMMENT ON COLUMN geocode_cache.created_at IS 'When this entry was first created (for 30-day expiration)';
