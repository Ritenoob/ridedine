# RidenDine Hybrid Brain Transplant — Driver Dispatch, Routing & Realtime

Created: 2026-02-24
Status: PENDING
Approved: Yes
Iterations: 1
Worktree: No
Type: Feature

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)
>
> - PENDING: Initial state, awaiting implementation
> - COMPLETE: All tasks implemented
> - VERIFIED: All checks passed
>
> **Approval Gate:** Implementation CANNOT proceed until `Approved: Yes`
> **Worktree:** Set at plan creation (from dispatcher). `Yes` uses git worktree isolation; `No` works directly on current branch (default)
> **Type:** `Feature` or `Bugfix` — set at planning time, used by dispatcher for routing

## Summary

**Goal:** Port the NestJS "brain" algorithms (dispatch engine, multi-provider routing, realtime tracking) into the Supabase "shell" as Edge Functions, wire the driver jobs screen, and create an auto-assignment pipeline triggered by DB events.

**Architecture:** Supabase Edge Functions (Deno/TS) replace the NestJS microservices. A Postgres trigger fires when an order becomes "ready", auto-creating a delivery and invoking the assign-driver function via `pg_net`. Supabase Realtime Broadcast replaces the custom WebSocket/Redis stack for live driver GPS tracking.

**Tech Stack:** Supabase Edge Functions (Deno), PostgreSQL triggers + `pg_net`, Supabase Realtime Broadcast, Google Maps Routes API (default provider), React Native (Expo Router)

## Scope

### In Scope

- `assign_driver` Edge Function: Haversine + reliability scoring, driver assignment
- `get_route` Edge Function: Multi-provider routing (Google Maps default, OSRM/Mapbox fallback)
- DB migration: auto-create delivery + trigger assign-driver when order → 'ready'
- Driver reliability scoring table/function
- Supabase Realtime Broadcast for live driver GPS updates
- Wire `(driver)/jobs.tsx` to show available deliveries with accept/reject
- Update `(customer)/tracking.tsx` to subscribe to Realtime Broadcast for live driver position
- Update `lib/location.ts` to publish GPS to Supabase Broadcast channel

### Out of Scope

- Commission auto-calculation (tables exist, logic deferred)
- Push notifications for driver assignment
- Admin panel changes for delivery management
- Driver onboarding/verification flow
- Image upload for delivery proof (UI exists, storage deferred)

## Prerequisites

- `GOOGLE_MAPS_API_KEY` environment variable set in Supabase Edge Functions secrets
- Existing DB tables: `drivers`, `deliveries`, `orders`, `commission_records` (all exist via migrations)
- `pg_net` extension enabled in Supabase (for HTTP calls from triggers)
- Supabase project URL and service role key configured

## Context for Implementer

- **Patterns to follow:** Edge function pattern in `backend/supabase/functions/geocode_address/index.ts` — uses `serve()` from Deno std, `corsHeaders` from `_shared/cors.ts`, typed request/response interfaces
- **Conventions:** Edge functions use TypeScript, import from Deno std library. Supabase client created with `createClient()` from `@supabase/supabase-js`. DB functions use `SECURITY DEFINER` for elevated access.
- **Key files:**
  - `backend/supabase/functions/_shared/cors.ts` — CORS headers shared across edge functions
  - `packages/data/src/deliveries-repository.ts` — DeliveriesRepository with full delivery CRUD
  - `packages/shared/src/geo.ts` — Haversine `calculateDistance()` and `isValidCoordinate()` already exist
  - `packages/shared/src/enums.ts` — `DeliveryStatus` enum with all status values
  - `apps/mobile/lib/location.ts` — existing location tracking setup
  - `apps/mobile/app/(driver)/active.tsx` — fully built active delivery screen (reference pattern)
  - `apps/mobile/app/(driver)/jobs.tsx` — placeholder to be wired
  - `apps/mobile/app/(customer)/tracking.tsx` — customer tracking screen to add Realtime
- **Gotchas:** The `find_nearby_drivers()` SQL function already exists in migration `20240111000000_enhance_driver_module.sql` — it returns drivers sorted by distance but doesn't factor reliability. The assign-driver edge function adds the reliability scoring layer on top.
- **Domain context:** The NestJS dispatch algorithm scores drivers as `reliability - distance * 8` where reliability is a 0-100 score and distance is in km. This means a driver 5km away needs 40+ reliability to score positive.
- **Source algorithms:** NestJS dispatch at `/home/nygmaee/Desktop/rideendine/services/dispatch/server.js`, routing at `/home/nygmaee/Desktop/rideendine/services/routing/server.js`

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Assign-Driver Edge Function
- [x] Task 2: Multi-Provider Routing Edge Function
- [x] Task 3: Driver Reliability Scoring DB Schema
- [x] Task 4: Auto-Assignment Pipeline (DB Trigger + Migration)
- [x] Task 5: Realtime Driver Tracking (Broadcast + Mobile)
- [x] Task 6: Driver Jobs Screen (Wire UI)
- [ ] Task 7: [FIX] Fix column names in auto_assign_delivery trigger
- [ ] Task 8: [FIX] Fix deliveries.driver_id FK constraint and assignment logic
- [ ] Task 9: [FIX] Fix tracking.tsx to join deliveries for broadcast subscription

**Total Tasks:** 9 | **Completed:** 6 | **Remaining:** 3

> Extended 2026-02-24: Tasks 7-9 added for critical bugs found during verification (Iteration 1)

## Implementation Tasks

### Task 1: Assign-Driver Edge Function

**Objective:** Create a Supabase Edge Function that finds nearby available drivers, scores them using Haversine distance + reliability, and assigns the best driver to a delivery.

**Dependencies:** None

**Files:**

- Create: `backend/supabase/functions/assign_driver/index.ts`
- Reference: `backend/supabase/functions/geocode_address/index.ts` (pattern)
- Reference: `/home/nygmaee/Desktop/rideendine/services/dispatch/server.js` (algorithm source)

**Key Decisions / Notes:**

- Reuse existing `find_nearby_drivers()` SQL function for distance calculation (single source of truth — avoids Haversine duplication between TS and SQL)
- Apply reliability scoring in TS on top of SQL results: `reliability - (distance_km * 8)`
- Query `driver_scores` table (created in Task 3) for reliability scores, default to 50
- Accept `delivery_id` as input, read delivery's pickup lat/lng, find and assign best driver
- Use `SELECT ... FOR UPDATE SKIP LOCKED` when updating driver to prevent race condition (multiple concurrent assignments can't claim same driver)
- Update `deliveries.driver_id` and set status to `assigned`
- Also update `drivers.is_available = false` for the assigned driver
- Pick highest score even if negative (someone far away is better than no one), return `no_drivers_available` only if zero drivers found by `find_nearby_drivers()`
- Use existing 10km radius from `find_nearby_drivers()` — no additional limit
- Define `corsHeaders` inline (no `_shared/cors.ts` exists — follow `geocode_address/index.ts` pattern)

**Definition of Done:**

- [ ] Edge function accepts `{ delivery_id }` and returns `{ driver_id, score, distance_km }`
- [ ] Haversine distance calculated correctly (matches `packages/shared/src/geo.ts`)
- [ ] If no available drivers within range, returns `{ driver_id: null, reason: "no_drivers_available" }`
- [ ] Assigned driver's `is_available` set to `false`
- [ ] All tests pass

**Verify:**

- `cd backend/supabase && supabase functions serve assign_driver` — function starts without errors
- `curl -X POST http://localhost:54321/functions/v1/assign_driver -H "Authorization: Bearer <token>" -d '{"delivery_id":"..."}' ` — returns assignment result

### Task 2: Multi-Provider Routing Edge Function

**Objective:** Create a Supabase Edge Function that calculates routes between coordinates using Google Maps (default), with OSRM and Mapbox as fallbacks.

**Dependencies:** None

**Files:**

- Create: `backend/supabase/functions/get_route/index.ts`
- Reference: `/home/nygmaee/Desktop/rideendine/services/routing/server.js` (algorithm source)

**Key Decisions / Notes:**

- Port `routeWithGoogle()`, `routeWithOsrm()`, `routeWithMapbox()` from NestJS routing service
- Google Maps is the default provider (user choice)
- **Automatic cascading fallback**: try Google, on quota/auth error (429/403) auto-retry with OSRM, then Mapbox if token set, then error. Log which provider succeeded.
- Port `decodePolyline()` for Google Maps encoded polyline support
- Accept `{ coordinates: [{lat, lng}], provider?: string, profile?: string }`
- Return `{ provider, distanceMeters, durationSeconds, geometry: [[lat, lng]] }`
- Use Google Routes API v2 (`routes.googleapis.com/directions/v2:computeRoutes`)
- Define `corsHeaders` inline (no `_shared/cors.ts` exists)

**Definition of Done:**

- [ ] Edge function accepts coordinates and returns route with distance, duration, geometry
- [ ] Google Maps provider works with `GOOGLE_MAPS_API_KEY` env var
- [ ] OSRM fallback works without API key (uses public `router.project-osrm.org`)
- [ ] Polyline decoding produces correct lat/lng coordinates
- [ ] All tests pass

**Verify:**

- `cd backend/supabase && supabase functions serve get_route` — function starts
- `curl -X POST http://localhost:54321/functions/v1/get_route -d '{"coordinates":[{"lat":40.7128,"lng":-74.006},{"lat":40.758,"lng":-73.9855}]}'` — returns route

### Task 3: Driver Reliability Scoring DB Schema

**Objective:** Create a migration that adds driver reliability scoring infrastructure — a `driver_scores` table and a trigger that updates scores after delivery completion.

**Dependencies:** None

**Files:**

- Create: `backend/supabase/migrations/20240114000000_add_driver_scoring.sql`

**Key Decisions / Notes:**

- **Add 'pending' to deliveries.status CHECK constraint** — current constraint doesn't include 'pending', which blocks auto-creation of unassigned deliveries
- `driver_scores` table: `driver_id (FK)`, `score (0-100, default 50)`, `total_deliveries`, `on_time_deliveries`, `avg_rating`, `updated_at`
- Trigger on `deliveries` table: when status → `delivered`, increment `total_deliveries`, recalculate score
- Score formula: `base(50) + on_time_bonus(0-25) + rating_bonus(0-25)` capped at 0-100
- Seed initial scores for existing drivers (default 50)

**Definition of Done:**

- [ ] `driver_scores` table created with proper constraints and RLS
- [ ] Trigger fires on delivery completion and updates score
- [ ] Score stays within 0-100 range
- [ ] RLS: drivers can view own score, admins can view all
- [ ] Migration applies cleanly

**Verify:**

- `psql -f backend/supabase/migrations/20240114000000_add_driver_scoring.sql` — no errors
- Manually insert a completed delivery → verify `driver_scores` updated

### Task 4: Auto-Assignment Pipeline (DB Trigger + Migration)

**Objective:** Create a DB trigger that auto-creates a delivery record when an order status changes to 'ready', then calls the assign-driver edge function via `pg_net`.

**Dependencies:** Task 1, Task 3

**Files:**

- Create: `backend/supabase/migrations/20240115000000_auto_assignment_pipeline.sql`

**Key Decisions / Notes:**

- Trigger on `orders` table: when `status` changes to `ready`, if no delivery exists for this order:
  1. **Validate chef has lat/lng set** — if NULL, set order status back to 'preparing' and abort (chef must set address first)
  2. Create delivery record with status='pending', chef address as pickup, customer address as dropoff
  3. Use `pg_net` to call `assign_driver` edge function with the new `delivery_id`
- **pg_net fallback**: First verify `pg_net` available via `SELECT * FROM pg_available_extensions WHERE name = 'pg_net'`. If unavailable, use Supabase Database Webhooks as alternative, or document manual assignment workflow
- The trigger function needs `SECURITY DEFINER` to access service role
- Edge function URL from Supabase project URL config
- **Duplicate guard**: `WHERE NOT EXISTS (SELECT 1 FROM deliveries WHERE order_id = NEW.id)` prevents duplicate deliveries

**Definition of Done:**

- [ ] `pg_net` extension enabled
- [ ] Trigger fires when order status → 'ready'
- [ ] Delivery record created with correct pickup (chef) and dropoff (customer) addresses
- [ ] `assign_driver` edge function called via `pg_net.http_post()`
- [ ] No duplicate deliveries created for the same order
- [ ] Migration applies cleanly

**Verify:**

- Update an order's status to 'ready' → verify delivery record created
- Verify `pg_net._http_response` shows the assign_driver call was made

### Task 5: Realtime Driver Tracking (Broadcast + Mobile)

**Objective:** Implement live driver GPS tracking using Supabase Realtime Broadcast. Drivers publish location, customers see live movement on the tracking map.

**Dependencies:** None

**Files:**

- Modify: `apps/mobile/lib/location.ts` — add Supabase Broadcast publishing
- Modify: `apps/mobile/app/(customer)/tracking.tsx` — subscribe to Broadcast for live position
- Modify: `apps/mobile/app/(driver)/active.tsx` — ensure location publishing during active delivery

**Key Decisions / Notes:**

- Use Supabase Realtime Broadcast (ephemeral, no DB persistence — just like the NestJS WebSocket approach)
- Channel name: `delivery:{delivery_id}` — scoped per delivery
- Driver publishes: `{ type: 'driver_location', lat, lng, heading, speed, timestamp }`
- Customer subscribes when viewing tracking screen
- Location still persisted to `deliveries.driver_lat/driver_lng` via `DeliveriesRepository.updateDriverLocation()` (existing)
- Broadcast adds the real-time map movement layer on top
- **Reconnection logic**: on channel error/disconnect, auto-reconnect after 5s. On app foreground resume, check subscription status and reconnect if needed. If no Broadcast update in 60s, poll `deliveries` table once as fallback

**Definition of Done:**

- [ ] Driver location published to Supabase Broadcast channel during active delivery
- [ ] Customer tracking screen subscribes to correct channel based on delivery ID
- [ ] Map marker updates in real-time as driver moves
- [ ] Channel cleanup on screen unmount / delivery complete
- [ ] Location updates persist to DB (existing behavior preserved)

**Verify:**

- TypeScript compiles without errors for both modified files
- Manual test: start active delivery → verify broadcast channel receives location events

### Task 6: Driver Jobs Screen (Wire UI)

**Objective:** Replace the placeholder `jobs.tsx` with a functional screen that shows available deliveries and lets drivers accept them.

**Dependencies:** Task 1 (assign-driver), Task 4 (auto-assignment creates deliveries)

**Files:**

- Modify: `apps/mobile/app/(driver)/jobs.tsx` — full rewrite
- Reference: `apps/mobile/app/(driver)/active.tsx` (styling patterns)
- Reference: `packages/data/src/deliveries-repository.ts` (data access)

**Key Decisions / Notes:**

- Use `DeliveriesRepository.getAvailableDeliveries()` to fetch unassigned deliveries
- **Filter by distance**: get driver's current location, filter results client-side to within 15km, display distance on each card
- Display: pickup address, dropoff address, delivery fee, distance from driver
- Accept button: calls `DeliveriesRepository.assignDelivery(deliveryId, driverId)`
- After accepting, navigate to the Active tab
- Pull-to-refresh for new jobs
- Empty state when no deliveries available
- Follow the styling pattern from `active.tsx` (orange accent #FF7A00, card layout)

**Definition of Done:**

- [ ] Jobs screen shows list of available (unassigned) deliveries
- [ ] Each job card shows pickup, dropoff, fee, distance
- [ ] Accept button assigns delivery to current driver
- [ ] After accepting, navigates to Active delivery screen
- [ ] Pull-to-refresh works
- [ ] Empty state displayed when no jobs available
- [ ] TypeScript compiles without errors

**Verify:**

- TypeScript build succeeds: `cd apps/mobile && npx tsc --noEmit`
- Screen renders job cards with correct data

### Task 7: [FIX] Fix column names in auto_assign_delivery trigger

**Objective:** Fix the auto_assign_delivery trigger function to reference the correct column names from the orders table (lat, lng, address instead of delivery_lat, delivery_lng, delivery_address).

**Dependencies:** None (critical bug fix)

**Files:**

- Modify: `backend/supabase/migrations/20240115000000_auto_assignment_pipeline.sql`

**Key Decisions / Notes:**

- The orders table has columns `lat`, `lng`, `address` (not `delivery_lat`, `delivery_lng`, `delivery_address`)
- This is causing the trigger to fail at runtime with "column does not exist" errors
- Every order marked 'ready' silently fails to create a delivery due to this bug

**Definition of Done:**

- [ ] Line 90 uses correct column names: `lat`, `lng`, `address`
- [ ] Trigger function compiles without errors
- [ ] Test: Mark an order as 'ready' and verify delivery is created successfully
- [ ] All tests pass

**Verify:**

- `psql` check: `SELECT lat, lng, address FROM orders LIMIT 1;` succeeds
- Create test order and mark ready, verify delivery appears in deliveries table

### Task 8: [FIX] Fix deliveries.driver_id FK constraint and assignment logic

**Objective:** Fix the foreign key mismatch where deliveries.driver_id references profiles(id) but assign_driver writes drivers(id) values, causing FK constraint violations.

**Dependencies:** None (critical bug fix)

**Files:**

- Create: `backend/supabase/migrations/20240116000000_fix_driver_id_fk.sql` (new migration to alter FK)
- Modify: `backend/supabase/migrations/20240101000000_initial_schema.sql` (update RLS policy if needed)

**Key Decisions / Notes:**

- Option A (RECOMMENDED): Alter deliveries.driver_id FK to reference drivers(id) instead of profiles(id)
- Option B: Change assign_driver to look up driver's profile_id and write that instead
- Choose Option A: simpler, driver_id should reference drivers table directly
- Update RLS policy on deliveries to join through drivers → profiles for auth.uid() check

**Definition of Done:**

- [ ] Migration created to alter FK constraint
- [ ] deliveries.driver_id now references drivers(id) ON DELETE SET NULL
- [ ] RLS policy updated to handle driver authentication correctly
- [ ] Test: Assign a driver and verify no FK constraint violations
- [ ] All tests pass

**Verify:**

- `psql` check: `\d deliveries` shows `driver_id | uuid | | foreign key (driver_id) REFERENCES drivers(id)`
- Assign driver via Edge Function, verify INSERT succeeds

### Task 9: [FIX] Fix tracking.tsx to join deliveries for broadcast subscription

**Objective:** Fix tracking.tsx loadOrder query to include deliveries so the broadcast subscription can activate and customers can see live driver location.

**Dependencies:** None (critical bug fix)

**Files:**

- Modify: `apps/mobile/app/(customer)/tracking.tsx`

**Key Decisions / Notes:**

- loadOrder query currently only joins chefs → profiles, missing deliveries
- This causes `order.deliveries[0].id` to always be undefined
- Broadcast subscription never activates, customer tracking is non-functional
- Add `deliveries(*)` to the select query

**Definition of Done:**

- [ ] loadOrder query includes deliveries join
- [ ] Broadcast subscription activates when delivery exists
- [ ] Customer sees live driver location updates
- [ ] TypeScript compiles without errors
- [ ] All tests pass

**Verify:**

- TypeScript build succeeds: `cd apps/mobile && npx tsc --noEmit`
- Load tracking screen for an order with delivery, verify broadcast channel subscribes

## Runtime Environment

- **Start command:** `cd backend/supabase && supabase start` (local Supabase stack)
- **Edge functions:** `supabase functions serve` (serves all functions)
- **Edge function URL:** `http://localhost:54321/functions/v1/{function_name}`
- **Set secrets:** `supabase secrets set GOOGLE_MAPS_API_KEY=<key>`
- **Health check:** `curl http://localhost:54321/functions/v1/assign_driver` (should return method not allowed for GET)
- **Restart procedure:** `supabase functions serve` auto-reloads on file changes

## Verification Gaps

> Found during verification (Iteration 1) — these issues block VERIFIED status and require fixes.

| Gap | Type | Severity | Affected Files | Fix Description |
|-----|------|----------|---------------|-----------------|
| auto_assign_delivery references non-existent columns | bugs | must_fix | backend/supabase/migrations/20240115000000_auto_assignment_pipeline.sql:90 | Change `delivery_lat`, `delivery_lng`, `delivery_address` to `lat`, `lng`, `address` |
| deliveries.driver_id FK references profiles(id) but code writes drivers(id) | bugs | must_fix | backend/supabase/migrations/20240101000000_initial_schema.sql:206, backend/supabase/functions/assign_driver/index.ts:193 | Create migration to alter FK to REFERENCES drivers(id), update RLS policy |
| tracking.tsx loadOrder doesn't join deliveries | bugs | must_fix | apps/mobile/app/(customer)/tracking.tsx:66 | Add `deliveries(*)` to select query |
| CORS wildcard on Edge Functions with service role key | security | must_fix | backend/supabase/functions/assign_driver/index.ts:5, get_route/index.ts:4 | Restrict origin to actual domains |
| Service role key in database settings | security | must_fix | backend/supabase/migrations/20240115000000_auto_assignment_pipeline.sql:129 | Use Database Webhooks or Supabase vault instead |
| Non-atomic fallback in assign_driver has race condition | bugs | must_fix | backend/supabase/functions/assign_driver/index.ts:174 | Remove fallback, require RPC function |
| No tests for assign_driver serve() handler | tdd | must_fix | backend/supabase/functions/assign_driver/index.test.ts | Extract testable functions, add handler tests |
| No tests for get_route serve() handler | tdd | must_fix | backend/supabase/functions/get_route/index.test.ts | Add precise assertions, test fallback cascade |
| jobs.test.ts tests duplicated function not actual code | tdd | must_fix | apps/mobile/app/(driver)/jobs.test.ts:7 | Import actual function, add component tests |
| Wrong on_time calculation in driver scoring | logic | should_fix | backend/supabase/migrations/20240114000000_add_driver_scoring.sql:66 | Use delivered timestamp vs dropoff_eta |
| avg_rating hardcoded to 5.0 | logic | should_fix | backend/supabase/migrations/20240114000000_add_driver_scoring.sql:67 | Use 0.00 default until ratings integrated |
| useEffect dependency on optional chaining unstable | bugs | should_fix | apps/mobile/app/(customer)/tracking.tsx:60 | Extract deliveryId to variable/useMemo |
| Google Maps non-quota errors skip fallback | bugs | should_fix | backend/supabase/functions/get_route/index.ts:240 | Fall back on any error, not just 429/403 |
| New Supabase client on every request | performance | should_fix | backend/supabase/functions/assign_driver/index.ts:44 | Move client creation outside handler |
| No HTTP method validation on assign_driver | error_handling | should_fix | backend/supabase/functions/assign_driver/index.ts:38 | Accept POST only |
| No HTTP method validation on get_route | error_handling | should_fix | backend/supabase/functions/get_route/index.ts:189 | Accept POST only |
| Mapbox token in URL query parameter | security | should_fix | backend/supabase/functions/get_route/index.ts:168 | Document as limitation, restrict token scope |
| Multiple `any` type annotations | bugs | should_fix | tracking.tsx:18, jobs.tsx:159, get_route/index.ts, assign_driver/index.ts | Define proper interfaces, use unknown for errors |
| No timeout on external API calls | error_handling | should_fix | backend/supabase/functions/get_route/index.ts:93 | Add AbortController with timeout |

## Testing Strategy

- **Unit tests:** Test Haversine scoring logic in isolation, test `scoreDriver()` function, test polyline decoding, test reliability score calculation
- **Integration tests:** Test edge functions with mock Supabase client — verify assign_driver finds and assigns correct driver, verify get_route returns proper geometry
- **DB tests:** Apply migrations to test database, verify triggers fire correctly, verify no duplicate deliveries
- **Manual verification:** End-to-end flow — place order → chef marks ready → delivery auto-created → driver assigned → driver sees in jobs → accepts → tracking shows live location

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| `pg_net` not enabled in Supabase project | Med | High | Migration includes `CREATE EXTENSION IF NOT EXISTS pg_net`; if unavailable, document manual assignment fallback |
| Google Maps API key not configured | Med | Med | OSRM fallback works without API key; get_route returns error with clear message if no provider available |
| No available drivers when order becomes ready | High | Med | assign_driver returns `{ driver_id: null, reason: "no_drivers_available" }`; delivery remains in `pending` status; admin dashboard (out of scope) can show pending deliveries requiring manual assignment |
| Supabase Realtime Broadcast latency | Low | Low | Location also persists to DB; polling fallback possible if Broadcast fails |
| Driver location permission denied on mobile | Med | Med | Graceful degradation — delivery tracking works without live GPS (shows last known position from DB) |

## Goal Verification

### Truths (what must be TRUE for the goal to be achieved)

- Orders marked "ready" by chefs automatically create delivery records
- Available drivers are scored and the best match is assigned to each delivery
- Drivers can see available delivery jobs and accept them
- Customers see live driver location on the tracking map during delivery
- Multi-provider routing returns distance and ETA for deliveries
- Driver reliability scores update after each completed delivery

### Artifacts (what must EXIST to support those truths)

- `backend/supabase/functions/assign_driver/index.ts` — Haversine + reliability scoring, assigns best driver
- `backend/supabase/functions/get_route/index.ts` — Multi-provider routing with Google Maps default
- `backend/supabase/migrations/20240114000000_add_driver_scoring.sql` — driver_scores table + triggers
- `backend/supabase/migrations/20240115000000_auto_assignment_pipeline.sql` — order-ready trigger + delivery creation
- `apps/mobile/app/(driver)/jobs.tsx` — functional jobs list with accept/reject
- `apps/mobile/lib/location.ts` — publishes to Supabase Broadcast channel

### Key Links (critical connections that must be WIRED)

- Order `status → 'ready'` trigger → creates delivery → calls `assign_driver` edge function
- `assign_driver` → queries `drivers` (available) + `driver_scores` → updates `deliveries.driver_id`
- Driver `location.ts` → Supabase Broadcast channel `delivery:{id}` → customer `tracking.tsx` map marker
- `jobs.tsx` → `DeliveriesRepository.getAvailableDeliveries()` → accept → `assignDelivery()`
- Delivery `status → 'delivered'` trigger → updates `driver_scores` reliability

## Open Questions

- Should failed auto-assignments retry on a timer, or wait for manual intervention? (Current plan: stay pending, manual intervention)

### Deferred Ideas

- Commission auto-calculation trigger (tables exist, logic can be added later)
- Push notifications when driver is assigned or approaching
- Admin panel delivery management dashboard
- Driver onboarding/verification workflow
- Batch order dispatching (multiple orders to one driver)
