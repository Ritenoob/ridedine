-- ============================================================
-- RidenDine Demo - Data Verification Queries
-- ============================================================
-- Purpose: Verify demo data integrity before and during testing
-- Usage: Run these in Supabase SQL Editor
-- Expected Results: Documented for each query
-- ============================================================

-- ============================================================
-- SECTION 1: Pre-Demo Data Validation
-- ============================================================

-- Query 1.1: Verify Active Chefs
-- Expected: >= 10 chefs with status 'active'
SELECT
  COUNT(*) as total_active_chefs,
  COUNT(CASE WHEN avatar_url IS NOT NULL THEN 1 END) as chefs_with_photos,
  COUNT(CASE WHEN bio IS NOT NULL THEN 1 END) as chefs_with_bio
FROM chefs
WHERE status = 'active';

-- Query 1.2: Chef Distribution by Cuisine
-- Expected: Diverse cuisine types
SELECT
  cuisine_types,
  COUNT(*) as chef_count
FROM chefs
WHERE status = 'active'
GROUP BY cuisine_types
ORDER BY chef_count DESC;

-- Query 1.3: Verify Menu Items Available
-- Expected: >= 50 total menu items, all with prices
SELECT
  COUNT(*) as total_menu_items,
  COUNT(CASE WHEN is_available = true THEN 1 END) as available_items,
  COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as items_with_photos,
  AVG(price_cents)::integer as avg_price_cents,
  MIN(price_cents) as min_price,
  MAX(price_cents) as max_price
FROM menu_items;

-- Query 1.4: Menu Items Per Chef
-- Expected: Each chef has 5-8 menu items
SELECT
  c.id as chef_id,
  c.display_name as chef_name,
  COUNT(mi.id) as menu_item_count,
  COUNT(CASE WHEN mi.is_available = true THEN 1 END) as available_count
FROM chefs c
LEFT JOIN menus m ON c.id = m.chef_id
LEFT JOIN menu_items mi ON m.id = mi.menu_id
WHERE c.status = 'active'
GROUP BY c.id, c.display_name
ORDER BY menu_item_count DESC;

-- Query 1.5: Verify Test User Accounts
-- Expected: customer-001, chef-001, driver-001, admin-001 exist
SELECT
  id,
  email,
  role,
  created_at
FROM profiles
WHERE id IN ('customer-001', 'chef-001', 'driver-001', 'admin-001')
ORDER BY role;

-- Query 1.6: Check RLS Policies (Critical for Security)
-- Expected: Policies exist for chefs, menu_items, orders
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chefs', 'menus', 'menu_items', 'orders', 'deliveries')
ORDER BY tablename, policyname;

-- Query 1.7: Verify Supabase Storage Buckets
-- Expected: chef-photos, menu-item-photos, delivery-proofs exist
SELECT
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE name IN ('chef-photos', 'menu-item-photos', 'delivery-proofs')
ORDER BY name;

-- ============================================================
-- SECTION 2: During-Demo Health Checks
-- ============================================================

-- Query 2.1: Recent Order Activity
-- Expected: Shows recent test orders with correct status flow
SELECT
  o.id,
  o.status,
  o.total_cents / 100.0 as total_dollars,
  o.payment_status,
  c.display_name as chef_name,
  p.email as customer_email,
  o.created_at,
  o.accepted_at,
  o.ready_at,
  o.completed_at
FROM orders o
LEFT JOIN chefs c ON o.chef_id = c.id
LEFT JOIN profiles p ON o.customer_id = p.id
ORDER BY o.created_at DESC
LIMIT 10;

-- Query 2.2: Order Status Distribution
-- Expected: Mix of pending, accepted, cooking, ready, delivered
SELECT
  status,
  COUNT(*) as order_count,
  SUM(total_cents) / 100.0 as total_revenue_dollars
FROM orders
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY order_count DESC;

-- Query 2.3: Delivery Status Check
-- Expected: All deliveries have matching orders
SELECT
  d.id as delivery_id,
  d.status as delivery_status,
  d.driver_id,
  o.id as order_id,
  o.status as order_status,
  d.created_at,
  d.picked_up_at,
  d.delivered_at
FROM deliveries d
LEFT JOIN orders o ON d.order_id = o.id
ORDER BY d.created_at DESC
LIMIT 10;

-- Query 2.4: Payment Processing Status
-- Expected: No stuck payments (authorized but not captured after delivery)
SELECT
  o.id,
  o.status as order_status,
  o.payment_status,
  o.total_cents / 100.0 as total_dollars,
  o.created_at,
  d.status as delivery_status,
  d.delivered_at
FROM orders o
LEFT JOIN deliveries d ON o.id = d.order_id
WHERE o.payment_status = 'authorized'
  AND d.status = 'delivered'
  AND d.delivered_at < NOW() - INTERVAL '5 minutes';
-- Expected: 0 rows (no stuck payments)

-- Query 2.5: Payout Verification
-- Expected: Each completed order has corresponding chef and driver payouts
SELECT
  o.id as order_id,
  o.total_cents / 100.0 as order_total,
  o.status,
  COUNT(CASE WHEN p.recipient_type = 'chef' THEN 1 END) as chef_payout_count,
  COUNT(CASE WHEN p.recipient_type = 'driver' THEN 1 END) as driver_payout_count,
  SUM(CASE WHEN p.recipient_type = 'chef' THEN p.amount_cents END) / 100.0 as chef_payout,
  SUM(CASE WHEN p.recipient_type = 'driver' THEN p.amount_cents END) / 100.0 as driver_payout
FROM orders o
LEFT JOIN payouts p ON o.id = p.order_id
WHERE o.status = 'completed'
  AND o.created_at > NOW() - INTERVAL '24 hours'
GROUP BY o.id, o.total_cents, o.status
ORDER BY o.created_at DESC;

-- ============================================================
-- SECTION 3: Performance & Optimization Checks
-- ============================================================

-- Query 3.1: Route Cache Effectiveness
-- Expected: High cache hit rate (> 80%)
SELECT
  cached,
  COUNT(*) as request_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM route_cache
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY cached;

-- Query 3.2: Geocoding Cache Effectiveness
-- Expected: High cache hit rate for common addresses
SELECT
  COUNT(*) as total_geocode_requests,
  COUNT(DISTINCT address) as unique_addresses,
  AVG(CASE WHEN cached = true THEN 1 ELSE 0 END) * 100 as cache_hit_rate_percent
FROM geocode_cache
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Query 3.3: Database Performance - Slow Queries
-- Expected: Most queries < 100ms
-- Note: Requires pg_stat_statements extension enabled
SELECT
  query,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(max_exec_time::numeric, 2) as max_ms,
  ROUND(total_exec_time::numeric, 2) as total_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%information_schema%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ============================================================
-- SECTION 4: Data Integrity Checks
-- ============================================================

-- Query 4.1: Orphaned Order Items
-- Expected: 0 rows (all order items belong to valid orders)
SELECT
  oi.id,
  oi.order_id,
  oi.menu_item_id
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;
-- Expected: 0 rows

-- Query 4.2: Orders Without Items
-- Expected: 0 rows (every order has at least 1 item)
SELECT
  o.id,
  o.status,
  o.total_cents,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.status, o.total_cents
HAVING COUNT(oi.id) = 0;
-- Expected: 0 rows

-- Query 4.3: Price Consistency Check
-- Expected: Order totals match sum of items + fees
SELECT
  o.id,
  o.total_cents / 100.0 as order_total,
  SUM(oi.price_cents * oi.quantity) / 100.0 as items_subtotal,
  o.delivery_fee_cents / 100.0 as delivery_fee,
  o.platform_fee_cents / 100.0 as platform_fee,
  (SUM(oi.price_cents * oi.quantity) + o.delivery_fee_cents + o.platform_fee_cents) / 100.0 as calculated_total,
  o.total_cents - (SUM(oi.price_cents * oi.quantity) + o.delivery_fee_cents + o.platform_fee_cents) as discrepancy_cents
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.total_cents, o.delivery_fee_cents, o.platform_fee_cents
HAVING o.total_cents != (SUM(oi.price_cents * oi.quantity) + o.delivery_fee_cents + o.platform_fee_cents);
-- Expected: 0 rows (no discrepancies)

-- Query 4.4: Invalid Coordinates Check
-- Expected: All coordinates within valid ranges
SELECT
  'chefs' as table_name,
  id,
  location_lat,
  location_lng
FROM chefs
WHERE location_lat < -90 OR location_lat > 90
   OR location_lng < -180 OR location_lng > 180

UNION ALL

SELECT
  'orders' as table_name,
  id,
  delivery_lat,
  delivery_lng
FROM orders
WHERE delivery_lat < -90 OR delivery_lat > 90
   OR delivery_lng < -180 OR delivery_lng > 180;
-- Expected: 0 rows

-- ============================================================
-- SECTION 5: Real-time Features Check
-- ============================================================

-- Query 5.1: Active Realtime Channels
-- Expected: Shows active subscriptions (if any)
-- Note: This checks for recent activity that would indicate realtime working
SELECT
  COUNT(DISTINCT order_id) as orders_with_status_changes,
  MAX(updated_at) as last_update
FROM orders
WHERE updated_at > NOW() - INTERVAL '5 minutes';

-- Query 5.2: GPS Tracking Activity
-- Expected: Recent GPS updates for active deliveries
SELECT
  d.id as delivery_id,
  d.driver_id,
  d.status,
  COUNT(gps.*) as gps_update_count,
  MAX(gps.timestamp) as last_gps_update
FROM deliveries d
LEFT JOIN gps_tracking gps ON d.id = gps.delivery_id
WHERE d.status IN ('en_route_to_pickup', 'en_route_to_customer')
  AND d.created_at > NOW() - INTERVAL '1 hour'
GROUP BY d.id, d.driver_id, d.status;

-- ============================================================
-- SECTION 6: Business Metrics (For Admin Dashboard)
-- ============================================================

-- Query 6.1: Today's Key Metrics
SELECT
  COUNT(DISTINCT o.id) as total_orders_today,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  SUM(CASE WHEN o.status = 'completed' THEN o.platform_fee_cents END) / 100.0 as platform_revenue_today,
  COUNT(DISTINCT c.id) as active_chefs,
  COUNT(DISTINCT d.driver_id) as active_drivers
FROM orders o
LEFT JOIN chefs c ON o.chef_id = c.id
LEFT JOIN deliveries d ON o.id = d.order_id
WHERE o.created_at::date = CURRENT_DATE;

-- Query 6.2: Average Order Value
SELECT
  ROUND(AVG(total_cents) / 100.0, 2) as avg_order_value,
  ROUND(MIN(total_cents) / 100.0, 2) as min_order_value,
  ROUND(MAX(total_cents) / 100.0, 2) as max_order_value,
  COUNT(*) as total_orders
FROM orders
WHERE created_at > NOW() - INTERVAL '7 days';

-- Query 6.3: Top Performing Chefs
-- Expected: Maria Rodriguez and other seed chefs with good ratings
SELECT
  c.display_name,
  c.cuisine_types,
  COUNT(o.id) as total_orders,
  ROUND(AVG(r.rating), 2) as avg_rating,
  COUNT(r.id) as review_count
FROM chefs c
LEFT JOIN orders o ON c.id = o.chef_id
LEFT JOIN reviews r ON c.id = r.chef_id
WHERE c.status = 'active'
  AND o.created_at > NOW() - INTERVAL '30 days'
GROUP BY c.id, c.display_name, c.cuisine_types
ORDER BY total_orders DESC
LIMIT 10;

-- Query 6.4: Customer Retention (Repeat Orders)
SELECT
  customer_id,
  COUNT(*) as order_count,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY order_count DESC;

-- ============================================================
-- SECTION 7: Quick Troubleshooting Queries
-- ============================================================

-- Query 7.1: Find Specific Test Order
-- Replace 'customer-001' with actual customer ID
SELECT
  o.*,
  c.display_name as chef_name,
  p.email as customer_email
FROM orders o
LEFT JOIN chefs c ON o.chef_id = c.id
LEFT JOIN profiles p ON o.customer_id = p.id
WHERE o.customer_id = 'customer-001'
ORDER BY o.created_at DESC
LIMIT 1;

-- Query 7.2: Check User Authentication
-- Verify test accounts can be found
SELECT
  id,
  email,
  role,
  created_at,
  last_sign_in_at
FROM profiles
WHERE email IN (
  'jane@ridendine.demo',
  'maria@ridendine.demo',
  'mike@ridendine.demo',
  'admin@ridendine.demo'
)
ORDER BY role;

-- Query 7.3: Reset Test Data (CAUTION: Use only in demo environment)
-- Uncomment to clear test orders
/*
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE customer_id = 'customer-001'
);
DELETE FROM deliveries WHERE order_id IN (
  SELECT id FROM orders WHERE customer_id = 'customer-001'
);
DELETE FROM payouts WHERE order_id IN (
  SELECT id FROM orders WHERE customer_id = 'customer-001'
);
DELETE FROM orders WHERE customer_id = 'customer-001';
*/

-- ============================================================
-- EXPECTED RESULTS SUMMARY
-- ============================================================
--
-- ✅ Pre-Demo Validation:
--    - Active chefs: >= 10
--    - Menu items: >= 50
--    - Test accounts: 4 (customer, chef, driver, admin)
--    - RLS policies: Present for all tables
--    - Storage buckets: 3 public buckets
--
-- ✅ During-Demo Health:
--    - Orders flowing through status pipeline
--    - Payments captured after delivery
--    - Payouts created for completed orders
--    - No orphaned or inconsistent data
--
-- ✅ Performance:
--    - Cache hit rate: > 80%
--    - Query times: < 100ms average
--    - Coordinates: All within valid ranges
--
-- ⚠️ If any query returns unexpected results:
--    1. Check Supabase project status (not paused)
--    2. Verify demo seed data was run
--    3. Check RLS policies not blocking reads
--    4. Review Edge Function logs for errors
--
-- ============================================================
