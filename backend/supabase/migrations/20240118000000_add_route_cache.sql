-- Migration: Add route cache table
-- Purpose: Cache Google Maps Routes API results for 2-5 minutes to minimize API usage
-- Based on: docs/GOOGLE_MAPS_INTEGRATION.md Phase 1

CREATE TABLE route_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  provider TEXT NOT NULL,
  distance_meters INT NOT NULL,
  duration_seconds INT NOT NULL,
  polyline JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite index for fast lookups by origin + destination coordinates
CREATE INDEX idx_route_cache_coords ON route_cache(origin_lat, origin_lng, dest_lat, dest_lng);

-- Index for cleanup queries (delete entries older than 5 minutes)
CREATE INDEX idx_route_cache_created ON route_cache(created_at);

-- RLS policies
ALTER TABLE route_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (Edge Functions use service role key)
CREATE POLICY "Service role can manage route cache"
  ON route_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read route cache (for apps to check cache before API calls)
CREATE POLICY "Authenticated users can read route cache"
  ON route_cache
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE route_cache IS 'Caches route calculation results for 2-5 minutes to stay within Google Maps free tier limits';
COMMENT ON COLUMN route_cache.origin_lat IS 'Starting point latitude';
COMMENT ON COLUMN route_cache.origin_lng IS 'Starting point longitude';
COMMENT ON COLUMN route_cache.dest_lat IS 'Destination latitude';
COMMENT ON COLUMN route_cache.dest_lng IS 'Destination longitude';
COMMENT ON COLUMN route_cache.provider IS 'Provider used (google, osrm, mapbox)';
COMMENT ON COLUMN route_cache.distance_meters IS 'Total distance in meters';
COMMENT ON COLUMN route_cache.duration_seconds IS 'Estimated duration in seconds';
COMMENT ON COLUMN route_cache.polyline IS 'Route geometry (encoded polyline or GeoJSON)';
COMMENT ON COLUMN route_cache.cached_at IS 'Last time this entry was accessed (for LRU eviction)';
COMMENT ON COLUMN route_cache.created_at IS 'When this entry was first created (for TTL expiration)';
