# RidenDine End-to-End Test Script

**Purpose:** Verify complete order flow from customer browsing to driver delivery
**Duration:** ~20 minutes
**Prerequisites:** Demo data seeded, all services running

---

## Test Environment Setup

### 1. Start All Services

```bash
# Terminal 1: Mobile app dev server
cd apps/mobile
npx expo start

# Terminal 2: Admin dashboard (optional for monitoring)
cd apps/admin
npm run dev
```

### 2. Verify Backend Health

```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/chefs \
  -H "apikey: your-anon-key"

# Should return 200 with chef list
```

### 3. Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Customer | jane@ridendine.demo | demo123 | Place orders |
| Chef | maria@ridendine.demo | demo123 | Accept & prepare orders |
| Driver | mike@ridendine.demo | demo123 | Deliver orders |
| Admin | use seeded admin from `scripts/seed.ts` | (see seed) | Monitor platform |

---

## Test Scenario: Complete Order Flow

### Phase 1: Customer Journey (Customer App)

#### Test 1.1: Browse Available Chefs

**Steps:**
1. Open Customer app (Expo Go)
2. Navigate to "Browse Chefs" tab
3. Verify chef list loads

**Expected Results:**
- [ ] 10 chefs displayed
- [ ] Each chef shows: name, cuisine types, photo, rating
- [ ] Chefs sorted by distance (closest first)
- [ ] Loading state shown while fetching

**Validation:**
```typescript
// Check RLS policy allows public read
// Query: SELECT * FROM chefs WHERE status = 'active'
```

---

#### Test 1.2: View Chef Menu

**Steps:**
1. Tap on "Maria Rodriguez" (Mexican cuisine)
2. View menu details

**Expected Results:**
- [ ] Menu loads with 5 dishes
- [ ] Each dish shows: name, description, price, photo, dietary tags
- [ ] "Add to Cart" button enabled for available items
- [ ] Unavailable items grayed out

**Sample Data Check:**
```sql
SELECT * FROM menu_items
WHERE menu_id = 'menu-001'
AND is_available = true;
-- Should return 5 dishes
```

---

#### Test 1.3: Add Items to Cart

**Steps:**
1. Tap "Add to Cart" on "Tacos al Pastor" ($12.00)
2. Tap "Add to Cart" on "Elote" ($6.00)
3. Navigate to Cart tab

**Expected Results:**
- [ ] Cart shows 2 items
- [ ] Subtotal: $18.00
- [ ] Delivery fee: $5.00
- [ ] Platform fee: $1.80 (10% of subtotal)
- [ ] Total: $24.80
- [ ] "Checkout" button enabled

**State Verification:**
```typescript
// AsyncStorage should persist cart
AsyncStorage.getItem('cart').then(cart => {
  expect(JSON.parse(cart).items.length).toBe(2);
});
```

---

#### Test 1.4: Enter Delivery Address

**Steps:**
1. Tap "Checkout"
2. Enter address: "456 Park Ave, New York, NY 10022"
3. Tap "Geocode Address"

**Expected Results:**
- [ ] Address geocoded successfully
- [ ] Coordinates displayed: ~(40.7614, -73.9776)
- [ ] Map shows marker at address
- [ ] Distance to chef calculated: ~5.2km
- [ ] Estimated delivery time: 25-35 min

**API Call Check:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/geocode_address \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"address": "456 Park Ave, New York, NY 10022"}'

# Expected: { lat: 40.7614, lng: -73.9776, cached: true/false }
```

---

#### Test 1.5: Place Order

**Steps:**
1. Review order summary
2. Enter payment method (use Stripe test card: 4242 4242 4242 4242)
3. Tap "Place Order"

**Expected Results:**
- [ ] Payment authorized (not captured yet)
- [ ] Order created in database
- [ ] Order status: "pending"
- [ ] Confirmation screen shows order ID
- [ ] Chef receives notification

**Database Verification:**
```sql
-- Check order created
SELECT id, customer_id, chef_id, status, total_cents, payment_status
FROM orders
WHERE customer_id = 'customer-001'
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- status: 'pending'
-- payment_status: 'authorized'
-- total_cents: 2480

-- Check order items
SELECT menu_item_id, quantity, price_cents
FROM order_items
WHERE order_id = (SELECT id FROM orders WHERE customer_id = 'customer-001' ORDER BY created_at DESC LIMIT 1);

-- Expected: 2 rows
```

---

### Phase 2: Chef Journey (Chef App)

#### Test 2.1: Receive Order Notification

**Steps:**
1. Switch to Chef app (logged in as maria@ridendine.demo)
2. Verify notification received

**Expected Results:**
- [ ] Push notification displays: "New Order from Jane Doe"
- [ ] Sound alert plays
- [ ] Order appears in "Pending" tab
- [ ] Order details show: items, customer name, total, delivery address

**Realtime Check:**
```typescript
// Chef app subscribes to:
supabase.channel(`orders:chef:chef-001`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `chef_id=eq.chef-001`
  }, payload => {
    // Should trigger when customer places order
  })
  .subscribe();
```

---

#### Test 2.2: Accept Order

**Steps:**
1. Tap on order in Pending tab
2. Review order details
3. Tap "Accept Order"

**Expected Results:**
- [ ] Order status changes to "accepted"
- [ ] Order moves to "Active" tab
- [ ] Timer starts showing elapsed time
- [ ] Customer receives notification: "Chef accepted your order!"

**Database Verification:**
```sql
UPDATE orders
SET status = 'accepted', accepted_at = NOW()
WHERE id = 'order-xxx' AND chef_id = 'chef-001';

-- RLS should allow (chef owns this order)
```

---

#### Test 2.3: Start Cooking

**Steps:**
1. Tap "Start Cooking"
2. Verify status update

**Expected Results:**
- [ ] Order status: "cooking"
- [ ] Customer app shows: "Your order is being prepared 🍳"
- [ ] Estimated ready time displayed

---

#### Test 2.4: Mark Order Ready

**Steps:**
1. Wait ~30 seconds (simulate cooking)
2. Tap "Mark Ready"

**Expected Results:**
- [ ] Order status: "ready"
- [ ] Delivery record created automatically
- [ ] Driver assignment triggered (Edge Function)
- [ ] Best available driver notified

**Edge Function Execution:**
```sql
-- Check delivery created
SELECT id, order_id, status, driver_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
FROM deliveries
WHERE order_id = 'order-xxx';

-- Expected:
-- status: 'assigned'
-- driver_id: 'driver-001' (closest available)
-- pickup coordinates: chef location
-- dropoff coordinates: customer location
```

---

### Phase 3: Driver Journey (Driver App)

#### Test 3.1: Receive Delivery Assignment

**Steps:**
1. Switch to Driver app (logged in as mike@ridendine.demo)
2. Verify notification received

**Expected Results:**
- [ ] Notification: "New delivery available - $12.50"
- [ ] Delivery details show: pickup address (chef), dropoff address (customer), fee, distance
- [ ] "Accept" and "Decline" buttons visible
- [ ] Map preview shows route

---

#### Test 3.2: Accept Delivery

**Steps:**
1. Tap "Accept"
2. Verify status update

**Expected Results:**
- [ ] Delivery status: "en_route_to_pickup"
- [ ] Navigation button enabled
- [ ] Customer notified: "Driver Mike is on the way 🚗"
- [ ] Customer app shows live tracking map

---

#### Test 3.3: Navigate to Chef (Pickup)

**Steps:**
1. Tap "Navigate" button
2. Verify route displayed

**Expected Results:**
- [ ] Route polyline drawn on map
- [ ] ETA displayed: ~8-12 minutes
- [ ] Turn-by-turn directions available
- [ ] Driver marker updates every 5 seconds

**Route Caching Check:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/get_route \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "origin": {"lat": 40.7614, "lng": -73.9776},
    "destination": {"lat": 40.7128, "lng": -74.0060}
  }'

# First call: cached=false (Google API called)
# Second call within 5 min: cached=true (from route_cache table)
```

---

#### Test 3.4: Enable Live GPS Tracking

**Steps:**
1. Grant location permissions
2. Verify GPS broadcasting

**Expected Results:**
- [ ] Location updates every 5 seconds
- [ ] Customer sees driver marker moving on map
- [ ] ETA updates dynamically based on distance
- [ ] Heading (direction) updates marker rotation

**Realtime GPS Check:**
```typescript
// Customer app subscribes to:
supabase.channel(`delivery:delivery-xxx`)
  .on('broadcast', { event: 'location_update' }, payload => {
    // Should receive { lat, lng, heading, speed, timestamp }
    // Every 5 seconds while driver is en route
  })
  .subscribe();
```

---

#### Test 3.5: Arrive at Chef Location

**Steps:**
1. (Simulate arrival by tapping "Arrive at Pickup")
2. Tap "Confirm Pickup"

**Expected Results:**
- [ ] Delivery status: "en_route_to_customer"
- [ ] Customer notified: "Driver picked up your order"
- [ ] Route updated to show chef → customer path

---

#### Test 3.6: Navigate to Customer

**Steps:**
1. Follow route to customer location
2. Monitor GPS tracking

**Expected Results:**
- [ ] Customer sees live driver location
- [ ] ETA displayed: ~10-15 minutes
- [ ] Notifications sent at milestones: "5 minutes away", "Driver nearby"

---

#### Test 3.7: Deliver Order

**Steps:**
1. Arrive at customer location
2. Tap "Mark Delivered"
3. Take photo for proof of delivery
4. Upload photo

**Expected Results:**
- [ ] Camera opens
- [ ] Photo captured
- [ ] Photo uploaded to Supabase Storage (delivery-proofs bucket)
- [ ] Delivery status: "delivered"
- [ ] Payment captured automatically (Edge Function)

**Storage Verification:**
```bash
# Check photo uploaded
curl https://your-project.supabase.co/storage/v1/object/public/delivery-proofs/delivery-xxx.jpg

# Should return image (200 OK)
```

---

### Phase 4: Payment Processing (Automatic)

#### Test 4.1: Payment Capture

**Expected Results (automatic after delivery marked):**
- [ ] Stripe payment captured: $24.80
- [ ] Order payment_status: "captured"
- [ ] Platform fee calculated: $1.80 (10% of $18.00 food cost)

**Stripe Dashboard Check:**
```
Payment Intent: pi_xxx
Status: succeeded
Amount: $24.80
Captured: true
```

---

#### Test 4.2: Chef Payout Transfer

**Expected Results:**
- [ ] Chef payout calculated: $16.20 ($18.00 - $1.80 platform fee)
- [ ] Transfer created to chef's Stripe Connect account
- [ ] Payout record inserted in database
- [ ] Chef notified: "You earned $16.20 from Jane's order"

**Database Check:**
```sql
SELECT chef_id, amount_cents, stripe_transfer_id, status
FROM payouts
WHERE order_id = 'order-xxx' AND chef_id = 'chef-001';

-- Expected:
-- amount_cents: 1620
-- status: 'completed'
-- stripe_transfer_id: 'tr_xxx'
```

---

#### Test 4.3: Driver Payout Transfer

**Expected Results:**
- [ ] Driver payout: $5.00 (delivery fee)
- [ ] Transfer created to driver's Stripe Connect account
- [ ] Payout record inserted
- [ ] Driver notified: "You earned $5.00 from this delivery"

**Database Check:**
```sql
SELECT driver_id, amount_cents, stripe_transfer_id, status
FROM payouts
WHERE delivery_id = 'delivery-xxx' AND driver_id = 'driver-001';

-- Expected:
-- amount_cents: 500
-- status: 'completed'
```

---

### Phase 5: Customer Post-Delivery

#### Test 5.1: Order Complete Notification

**Expected Results:**
- [ ] Customer receives: "Your order has been delivered! ✅"
- [ ] Proof photo displayed
- [ ] "Rate your experience" prompt shown
- [ ] Order moves to "Past Orders" tab

---

#### Test 5.2: Leave Review

**Steps:**
1. Tap "Rate your experience"
2. Give 5 stars
3. Write review: "Amazing tacos! Fast delivery"
4. Submit

**Expected Results:**
- [ ] Review saved to database
- [ ] Chef's average rating updated
- [ ] Review appears on chef's profile

**Database Verification:**
```sql
INSERT INTO reviews (customer_id, chef_id, order_id, rating, comment)
VALUES ('customer-001', 'chef-001', 'order-xxx', 5, 'Amazing tacos! Fast delivery');

-- Check chef's updated rating
SELECT AVG(rating) FROM reviews WHERE chef_id = 'chef-001';
```

---

## Admin Dashboard Monitoring (Optional)

### Test 6.1: Real-time Analytics

**Steps:**
1. Open Admin dashboard (use seeded admin credentials from `scripts/seed.ts`)
2. View dashboard

**Expected Results:**
- [ ] Today's orders: 1
- [ ] Today's revenue: $1.80 (platform fee)
- [ ] Active deliveries: 0 (after completion)
- [ ] Charts update in real-time

---

### Test 6.2: Order Details

**Steps:**
1. Navigate to "Orders" page
2. Find test order
3. View details

**Expected Results:**
- [ ] Complete order timeline displayed
- [ ] Customer, Chef, Driver names shown
- [ ] Payment breakdown visible
- [ ] Delivery proof photo displayed

---

## Test Results Summary

| Phase | Test | Status | Notes |
|-------|------|--------|-------|
| 1 | Customer Browse | ⬜ | |
| 1 | View Menu | ⬜ | |
| 1 | Add to Cart | ⬜ | |
| 1 | Enter Address | ⬜ | |
| 1 | Place Order | ⬜ | |
| 2 | Chef Notification | ⬜ | |
| 2 | Accept Order | ⬜ | |
| 2 | Start Cooking | ⬜ | |
| 2 | Mark Ready | ⬜ | |
| 3 | Driver Notification | ⬜ | |
| 3 | Accept Delivery | ⬜ | |
| 3 | GPS Tracking | ⬜ | |
| 3 | Pickup | ⬜ | |
| 3 | Deliver | ⬜ | |
| 4 | Payment Capture | ⬜ | |
| 4 | Chef Payout | ⬜ | |
| 4 | Driver Payout | ⬜ | |
| 5 | Customer Review | ⬜ | |

---

## Common Issues & Troubleshooting

### Issue: No chefs displayed

**Check:**
```sql
SELECT COUNT(*) FROM chefs WHERE status = 'active';
-- Should return 10
```

**Fix:** Run `DEMO_SEED_DATA.sql`

---

### Issue: Realtime not working

**Check:** Supabase Realtime enabled in project settings

**Test:**
```typescript
supabase.channel('test').on('broadcast', {}, console.log).subscribe();
// Should log connection status
```

---

### Issue: GPS not updating

**Check:**
- Location permissions granted
- expo-location installed: `npx expo install expo-location`
- Watchposition active (check logs)

---

### Issue: Payment fails

**Check:**
- Stripe test keys configured
- Webhook endpoint registered
- Edge Function deployed: `supabase functions deploy process_payment`

**Test Card Numbers:**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

---

## Success Criteria

✅ **Test Passed** if ALL of the following are true:
- [ ] Customer can browse chefs and place order
- [ ] Chef receives notification and can accept order
- [ ] Driver receives assignment and can deliver
- [ ] GPS tracking works in real-time
- [ ] Payment captured and split correctly
- [ ] All database records created with correct RLS
- [ ] No console errors or crashes
- [ ] All APIs respond within 2 seconds
- [ ] Photos upload successfully
- [ ] Notifications delivered instantly (<5 seconds)

---

## Performance Benchmarks

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Chef list load time | <2s | | ⬜ |
| Menu load time | <1s | | ⬜ |
| Order placement | <3s | | ⬜ |
| Realtime notification delay | <5s | | ⬜ |
| GPS update frequency | 5s | | ⬜ |
| Photo upload time | <10s | | ⬜ |
| Payment capture | <5s | | ⬜ |

---

## Data Cleanup (After Testing)

```sql
-- Remove test orders
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

-- Or reset entire database (⚠️ deletes ALL data)
-- supabase db reset
```
