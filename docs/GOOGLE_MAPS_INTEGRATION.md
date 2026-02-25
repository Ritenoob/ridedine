# Google Maps Integration - Free Tier Optimization

**Goal:** Implement Google Maps Platform within free tier limits (~10,000 calls/SKU/month)

**Based on:** `docs/googlemapsWorkflow and Architecture.txt`

---

## Current State ✅

**Already Implemented:**
- ✅ **Haversine pre-filtering** - `find_nearby_drivers` SQL function uses Haversine distance (no API calls)
- ✅ **Multi-provider routing** - `get_route` Edge Function with Google → OSRM → Mapbox fallback
- ✅ **GPS tracking** - Supabase Realtime Broadcast (no Google API usage)
- ✅ **Event-driven updates** - Driver location published on significant position changes only

**Current API Usage per Order:**
- 1 route calculation (Google Maps Routes API) = 1 call
- No geocoding yet (addresses entered as raw text)
- No autocomplete
- **Estimated:** ~50 orders/day × 1 call = 1,500 calls/month ✅ Well under 10k limit

---

## Phase 1: Critical for Demo (High Priority)

### Task 1: Geocoding with Caching ⭐ CRITICAL

**Problem:** Customer delivery addresses need lat/lng coordinates for routing and driver assignment.

**Solution:** Create geocoding service with 30-day cache.

**Implementation:**

```sql
-- Migration: Add geocode cache table
CREATE TABLE geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  place_id TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geocode_cache_address ON geocode_cache(address);
CREATE INDEX idx_geocode_cache_created ON geocode_cache(created_at);

-- Auto-expire entries older than 30 days (run via cron)
DELETE FROM geocode_cache WHERE created_at < NOW() - INTERVAL '30 days';
```

**Edge Function:** `backend/supabase/functions/geocode_address/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { address } = await req.json();

  // 1. Check cache first
  const { data: cached } = await supabase
    .from("geocode_cache")
    .select("*")
    .eq("address", address)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .single();

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Cache miss - call Google Geocoding API
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY")!;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  );
  const data = await response.json();

  if (data.status !== "OK" || !data.results[0]) {
    return new Response(JSON.stringify({ error: "Geocoding failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  const place_id = result.place_id;

  // 3. Store in cache
  await supabase.from("geocode_cache").insert({
    address,
    place_id,
    lat,
    lng,
  });

  return new Response(JSON.stringify({ address, place_id, lat, lng }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Usage in Customer Checkout:**

```typescript
// apps/mobile/app/(customer)/checkout.tsx
const geocodeAddress = async (address: string) => {
  const { data } = await supabase.functions.invoke("geocode_address", {
    body: { address },
  });
  return data; // { lat, lng, place_id }
};

// Before order placement
const coords = await geocodeAddress(deliveryAddress);
// Store coords.lat, coords.lng in order
```

**API Usage Impact:** 1 geocode call per unique address (cached for 30 days)

---

### Task 2: Route Caching ⭐ CRITICAL

**Problem:** Multiple orders to same area trigger redundant route calculations.

**Solution:** Cache routes for 2-5 minutes.

**Implementation:**

```sql
-- Migration: Add route cache table
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

CREATE INDEX idx_route_cache_coords ON route_cache(origin_lat, origin_lng, dest_lat, dest_lng);
CREATE INDEX idx_route_cache_created ON route_cache(created_at);

-- Auto-expire entries older than 5 minutes (run frequently)
DELETE FROM route_cache WHERE created_at < NOW() - INTERVAL '5 minutes';
```

**Modify:** `backend/supabase/functions/get_route/index.ts`

```typescript
// Add at the beginning of serve() handler
const cacheKey = `${coordinates[0].lat},${coordinates[0].lng}-${coordinates[coordinates.length - 1].lat},${coordinates[coordinates.length - 1].lng}`;

// Check cache first
const { data: cached } = await supabase
  .from("route_cache")
  .select("*")
  .eq("origin_lat", coordinates[0].lat)
  .eq("origin_lng", coordinates[0].lng)
  .eq("dest_lat", coordinates[coordinates.length - 1].lat)
  .eq("dest_lng", coordinates[coordinates.length - 1].lng)
  .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
  .single();

if (cached) {
  return new Response(JSON.stringify({
    provider: cached.provider,
    distanceMeters: cached.distance_meters,
    durationSeconds: cached.duration_seconds,
    geometry: cached.polyline,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ... existing route calculation logic ...

// After successful route calculation, store in cache
await supabase.from("route_cache").insert({
  origin_lat: coordinates[0].lat,
  origin_lng: coordinates[0].lng,
  dest_lat: coordinates[coordinates.length - 1].lat,
  dest_lng: coordinates[coordinates.length - 1].lng,
  provider: route.provider,
  distance_meters: route.distanceMeters,
  duration_seconds: route.durationSeconds,
  polyline: route.geometry,
});
```

**API Usage Impact:** Reduces repeated route calculations for popular routes by ~80%

---

## Phase 2: Enhanced UX (Medium Priority)

### Task 3: Address Autocomplete with Session Tokens

**Problem:** Manual address entry is error-prone and doesn't validate addresses.

**Solution:** Google Places Autocomplete with session tokens (groups keystrokes into 1 billable call).

**Edge Function:** `backend/supabase/functions/autocomplete_address/index.ts`

```typescript
serve(async (req) => {
  const { input, sessionToken } = await req.json();
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY")!;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&sessiontoken=${sessionToken}&key=${apiKey}`
  );

  const data = await response.json();
  return new Response(JSON.stringify(data.predictions || []), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Usage in Customer App:**

```typescript
// Generate session token once per address input session
const sessionToken = uuidv4();

// As user types, call autocomplete
const predictions = await supabase.functions.invoke("autocomplete_address", {
  body: { input: userInput, sessionToken },
});

// When user selects a prediction, use place_id to get full details
const placeDetails = await geocodeAddress(selectedPrediction.description);
```

**API Usage Impact:** 1 autocomplete session per address (multiple keystrokes = 1 call)

---

## Phase 3: Production Hardening (Low Priority - Post-Demo)

### Monitoring & Quotas

**Google Cloud Console Setup:**
1. Create separate API keys for web, mobile, and backend
2. Restrict each key:
   - Backend key: Restrict by IP address
   - Mobile key: Restrict by package name (`com.ridendine.app`)
   - Web key: Restrict by HTTP referrer
3. Set daily quotas per key (e.g., 300 calls/day × 30 days = 9k/month, leaving buffer)
4. Enable usage alerts at 80% of quota

**Code-Level Circuit Breaker:**

```typescript
// Shared rate limiter for all Google API calls
const DAILY_QUOTA = 300;
let todayCalls = 0;
let lastResetDate = new Date().toDateString();

const checkQuota = () => {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    todayCalls = 0;
    lastResetDate = today;
  }

  if (todayCalls >= DAILY_QUOTA) {
    throw new Error("Daily Google API quota exceeded - using fallback");
  }

  todayCalls++;
};

// Use in all Google API calls
checkQuota();
const response = await fetch(googleApiUrl);
```

### Usage Dashboard

Create Supabase table to track API usage:

```sql
CREATE TABLE api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL, -- 'geocoding', 'routes', 'autocomplete'
  endpoint TEXT NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregation query
SELECT
  service,
  DATE(created_at) AS date,
  COUNT(*) AS total_calls,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS cache_hits,
  COUNT(*) - SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS api_calls
FROM api_usage_log
GROUP BY service, DATE(created_at)
ORDER BY date DESC;
```

---

## API Usage Projections

**Baseline (without optimizations):**
- 50 orders/day
- 1 geocode per order (customer address) = 50 calls
- 1 route per order = 50 calls
- **Total:** 100 calls/day × 30 days = **3,000 calls/month** ✅

**With Phase 1 optimizations (caching):**
- Geocoding: 50 unique addresses/day × 30% unique = 15 calls/day = 450/month
- Routes: 50 routes/day × 20% unique (same area) = 10 calls/day = 300/month
- **Total:** ~**750 calls/month** ✅ 92% reduction

**With Phase 2 (autocomplete):**
- Autocomplete sessions: 50 sessions/day = 1,500/month
- **Total:** ~**2,250 calls/month** ✅ Still well under 10k

---

## Implementation Priority for Tomorrow's Demo

**Must-Have (Today):**
1. ✅ Geocoding cache (Task #16) - Needed for address validation
2. ✅ Route caching (Task #17) - Prevents demo from hitting limits

**Nice-to-Have (Tomorrow Morning):**
3. ⚠️ Address autocomplete (Task #18) - Better UX but can demo with text input

**Post-Demo (Future):**
4. ⏳ API monitoring dashboard
5. ⏳ Quota circuit breakers
6. ⏳ Separate API keys with restrictions

---

## Database Migrations Checklist

```bash
# Create migrations
supabase migration new add_geocode_cache
supabase migration new add_route_cache

# Deploy to production
supabase db push

# Deploy Edge Functions
supabase functions deploy geocode_address
supabase functions deploy autocomplete_address
supabase functions deploy get_route # (updated with caching)
```

---

## Success Metrics

**After Implementation:**
- ✅ 90%+ cache hit rate for geocoding
- ✅ 80%+ cache hit rate for routing
- ✅ API usage < 3,000 calls/month
- ✅ $0 Google Maps bill (under free tier)
- ✅ Address validation working
- ✅ Fast route calculations (cached responses < 50ms)

**Monitoring:** Daily usage check in Google Cloud Console + weekly review of cache performance
