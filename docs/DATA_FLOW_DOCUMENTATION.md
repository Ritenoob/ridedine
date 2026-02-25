# RidenDine Data Flow Documentation

**Generated:** 2026-02-25
**Purpose:** Complete end-to-end data flow tracing for all user journeys

---

## Table of Contents

1. [Customer Order Flow](#customer-order-flow)
2. [Chef Order Management Flow](#chef-order-management-flow)
3. [Driver Delivery Flow](#driver-delivery-flow)
4. [Payment Processing Flow](#payment-processing-flow)
5. [Real-time GPS Tracking Flow](#real-time-gps-tracking-flow)
6. [Admin Dashboard Flow](#admin-dashboard-flow)
7. [Authentication Flow](#authentication-flow)

---

## Customer Order Flow

### Journey: Customer browses menu → places order → tracks delivery → receives food

#### Step 1: Browse Available Chefs

```
[Customer App]
  ↓ GET /rest/v1/chefs?status=eq.active
[Supabase REST API]
  ↓ RLS Policy Check: Public read access
[PostgreSQL]
  ↓ Execute: SELECT * FROM chefs WHERE status = 'active' AND payout_enabled = true
[Result Set]
  ↓ JSON response
[Customer App - Chefs List Screen]
```

**Data Structure:**
```typescript
{
  chefs: [
    {
      id: "uuid",
      profile_id: "uuid",
      status: "active",
      cuisine_types: ["Italian", "Pizza"],
      lat: 40.7128,
      lng: -74.0060,
      photo_url: "https://..."
    }
  ]
}
```

**RLS Policy:**
```sql
CREATE POLICY "Chefs are publicly viewable"
ON chefs FOR SELECT
USING (status = 'active' AND payout_enabled = true);
```

---

#### Step 2: View Chef's Menu

```
[Customer App]
  ↓ GET /rest/v1/menus?chef_id=eq.{chef_id}&is_active=eq.true
[Supabase REST API]
  ↓ RLS Policy Check: Public read for active menus
[PostgreSQL]
  ↓ Execute: SELECT m.*, array_agg(mi.*) as items
      FROM menus m
      LEFT JOIN menu_items mi ON mi.menu_id = m.id
      WHERE m.chef_id = $1 AND m.is_active = true
      GROUP BY m.id
[Result Set]
  ↓ JSON response with nested items
[Customer App - Menu Screen]
```

**Data Structure:**
```typescript
{
  menu: {
    id: "uuid",
    chef_id: "uuid",
    title: "Dinner Menu",
    items: [
      {
        id: "uuid",
        name: "Margherita Pizza",
        price_cents: 1200,
        is_available: true,
        photo_url: "https://...",
        dietary_tags: ["vegetarian"]
      }
    ]
  }
}
```

---

#### Step 3: Add to Cart (Local State)

```
[Customer App - Menu Screen]
  ↓ User taps "Add to Cart"
[React State Management]
  ↓ Update local cart state (no API call yet)
[AsyncStorage]
  ↓ Persist cart for session recovery
  {
    cart: {
      chef_id: "uuid",
      items: [
        { menu_item_id: "uuid", quantity: 2, special_instructions: "Extra cheese" }
      ]
    }
  }
```

**State Flow:**
```typescript
// State update (React Native)
const [cart, setCart] = useState<CartItem[]>([]);

const addToCart = (menuItem: MenuItem, quantity: number) => {
  const newItem = {
    menu_item_id: menuItem.id,
    menu_item: menuItem,
    quantity,
    special_instructions: ""
  };
  setCart([...cart, newItem]);
  AsyncStorage.setItem('cart', JSON.stringify([...cart, newItem]));
};
```

---

#### Step 4: Place Order

```
[Customer App - Checkout Screen]
  ↓ User taps "Place Order"
[Geocode Address]
  ↓ POST /functions/v1/geocode_address
  ↓ Body: { address: "123 Main St, New York, NY 10001" }
[Edge Function]
  ↓ Check geocode_cache table
  ↓ If miss: Call Google Geocoding API
  ↓ Store result with 30-day TTL
[Return Coordinates]
  ↓ { lat: 40.7128, lng: -74.0060, place_id: "..." }
[Customer App]
  ↓ POST /rest/v1/orders
  ↓ Body: {
      customer_id: auth.user.id,
      chef_id: "uuid",
      status: "pending",
      subtotal_cents: 1200,
      delivery_fee_cents: 500,
      platform_fee_cents: 170,
      total_cents: 1870,
      delivery_method: "delivery",
      address: "123 Main St...",
      lat: 40.7128,
      lng: -74.0060,
      notes: "Ring doorbell twice"
    }
[Supabase REST API]
  ↓ RLS Policy Check: user_id = customer_id
[PostgreSQL]
  ↓ BEGIN TRANSACTION
  ↓ INSERT INTO orders (...) RETURNING *
  ↓ INSERT INTO order_items (order_id, menu_item_id, quantity, price_cents, special_instructions)
  ↓ VALUES ($1, $2, $3, $4, $5)
  ↓ COMMIT
[Database Trigger]
  ↓ ON INSERT orders
  ↓ Invoke Edge Function: notify_chef
[Edge Function - Notify Chef]
  ↓ SELECT chef.profile_id FROM chefs WHERE id = NEW.chef_id
  ↓ Send push notification via Supabase Realtime
[Realtime Channel]
  ↓ Broadcast to channel: orders:chef:{chef_id}
  ↓ Payload: { event: 'INSERT', new: { order data } }
[Chef App]
  ↓ Subscribed to orders:chef:{chef_id}
  ↓ Receive notification
  ↓ Show alert: "New Order from Jane Doe"
```

**Database Transaction:**
```sql
BEGIN;
  INSERT INTO orders (customer_id, chef_id, status, total_cents, ...)
  VALUES ($1, $2, 'pending', $3, ...)
  RETURNING *;

  INSERT INTO order_items (order_id, menu_item_id, quantity, price_cents)
  SELECT $order_id, unnest($item_ids), unnest($quantities), unnest($prices);
COMMIT;
```

**RLS Policy:**
```sql
CREATE POLICY "Customers can create their own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);
```

---

## Chef Order Management Flow

### Journey: Chef receives order → accepts → prepares → marks ready

#### Step 1: Receive Order Notification

```
[Database Trigger]
  ↓ After INSERT on orders table
[Edge Function - Notify Chef]
  ↓ GET chef profile_id for order.chef_id
[Realtime Broadcast]
  ↓ Channel: orders:chef:{chef_id}
  ↓ Event: INSERT
  ↓ Payload: { order_id, customer_name, items, total }
[Chef App]
  ↓ Subscribed to channel
  ↓ useEffect(() => {
      supabase
        .channel(`orders:chef:${chefId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `chef_id=eq.${chefId}`
        }, handleNewOrder)
        .subscribe()
    })
[React State Update]
  ↓ Show notification banner
  ↓ Play sound alert
  ↓ Add order to pending list
```

---

#### Step 2: Accept Order

```
[Chef App - Orders Screen]
  ↓ Chef taps "Accept"
[Supabase REST API]
  ↓ PATCH /rest/v1/orders?id=eq.{order_id}
  ↓ Body: { status: "accepted", accepted_at: "ISO timestamp" }
[RLS Policy Check]
  ↓ Policy: Chefs can update their own orders
  ↓ Check: EXISTS (SELECT 1 FROM chefs WHERE profile_id = auth.uid() AND id = orders.chef_id)
[PostgreSQL]
  ↓ UPDATE orders SET status = 'accepted', accepted_at = NOW()
  ↓ WHERE id = $1 AND chef_id = (SELECT id FROM chefs WHERE profile_id = auth.uid())
[Database Trigger]
  ↓ After UPDATE on orders
  ↓ Invoke Edge Function: notify_customer
[Realtime Broadcast]
  ↓ Channel: orders:customer:{customer_id}
  ↓ Event: UPDATE
  ↓ Payload: { order_id, status: "accepted" }
[Customer App]
  ↓ Subscribed to orders:customer:{user_id}
  ↓ Receive update
  ↓ Update UI: "Chef accepted your order!"
```

**RLS Policy:**
```sql
CREATE POLICY "Chefs can update their own orders"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chefs
    WHERE profile_id = auth.uid()
    AND id = orders.chef_id
  )
);
```

---

#### Step 3: Update Cooking Status

```
[Chef App]
  ↓ Chef taps "Start Cooking"
[Update Flow]
  ↓ PATCH /rest/v1/orders?id=eq.{order_id}
  ↓ Body: { status: "cooking", cooking_started_at: "ISO timestamp" }
[Same RLS + Realtime flow as Step 2]
[Customer App]
  ↓ Receives UPDATE event
  ↓ Show: "Your order is being prepared 🍳"
```

---

#### Step 4: Mark Ready for Pickup

```
[Chef App]
  ↓ Chef taps "Ready"
[Update Order Status]
  ↓ PATCH /rest/v1/orders?id=eq.{order_id}
  ↓ Body: { status: "ready", ready_at: "ISO timestamp" }
[Database Trigger]
  ↓ After UPDATE orders SET status = 'ready'
  ↓ Invoke Edge Function: dispatch_driver
[Edge Function - Auto Dispatch]
  ↓ 1. Create delivery record
  ↓    INSERT INTO deliveries (order_id, status, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, delivery_fee_cents)
  ↓    VALUES ($order_id, 'pending', $chef_lat, $chef_lng, $customer_lat, $customer_lng, $fee)
  ↓
  ↓ 2. Find available drivers within 15km
  ↓    SELECT id, lat, lng FROM profiles
  ↓    WHERE role = 'driver'
  ↓    AND status = 'online'
  ↓    AND ST_DWithin(
  ↓      ST_MakePoint(lng, lat)::geography,
  ↓      ST_MakePoint($chef_lng, $chef_lat)::geography,
  ↓      15000
  ↓    )
  ↓
  ↓ 3. Assign best driver (closest + highest rating)
  ↓    UPDATE deliveries SET driver_id = $best_driver_id, status = 'assigned'
  ↓    WHERE id = $delivery_id
[Realtime Broadcast]
  ↓ Channel: deliveries:driver:{driver_id}
  ↓ Event: INSERT
  ↓ Payload: { delivery details }
[Driver App]
  ↓ Receives new delivery assignment
  ↓ Show: "New delivery available - $12.50"
```

---

## Driver Delivery Flow

### Journey: Driver receives assignment → accepts → picks up → delivers

#### Step 1: Receive Delivery Assignment

```
[Edge Function - Auto Dispatch]
  ↓ Assigns delivery to best available driver
[Realtime Broadcast]
  ↓ Channel: deliveries:driver:{driver_id}
  ↓ Payload: {
      delivery_id: "uuid",
      order_id: "uuid",
      pickup_address: "Chef location",
      dropoff_address: "Customer location",
      delivery_fee_cents: 1250,
      estimated_distance_km: 5.2
    }
[Driver App]
  ↓ Subscribed to deliveries:driver:{user_id}
  ↓ Receive notification
  ↓ Show modal: "New Delivery Request"
  ↓ Display: Pickup/dropoff addresses, fee, estimated distance
```

---

#### Step 2: Accept Delivery

```
[Driver App - Jobs Screen]
  ↓ Driver taps "Accept"
[Supabase REST API]
  ↓ PATCH /rest/v1/deliveries?id=eq.{delivery_id}
  ↓ Body: { status: "en_route_to_pickup" }
[RLS Policy Check]
  ↓ Policy: Drivers can update their assigned deliveries
  ↓ Check: auth.uid() = driver_id
[PostgreSQL]
  ↓ UPDATE deliveries SET status = 'en_route_to_pickup', accepted_at = NOW()
  ↓ WHERE id = $1 AND driver_id = (SELECT id FROM profiles WHERE id = auth.uid())
[Realtime Broadcast]
  ↓ Channel: orders:customer:{customer_id}
  ↓ Event: delivery_assigned
  ↓ Payload: { driver_name, vehicle_type, eta: "15 min" }
[Customer App]
  ↓ Receives update
  ↓ Show: "Driver John is on the way 🚗"
  ↓ Enable live tracking map
```

---

#### Step 3: Live GPS Tracking

```
[Driver App]
  ↓ expo-location requestForegroundPermissionsAsync()
  ↓ watchPositionAsync({ accuracy: High, timeInterval: 5000 })
[GPS Sensor]
  ↓ Every 5 seconds: { latitude, longitude, accuracy, timestamp }
[Driver App State]
  ↓ useEffect(() => {
      const subscription = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000 },
        (location) => {
          broadcastLocation(location.coords);
        }
      );
    }, [])
[Supabase Realtime]
  ↓ supabase.channel(`delivery:${deliveryId}`)
  ↓   .send({
  ↓     type: 'broadcast',
  ↓     event: 'location_update',
  ↓     payload: { lat, lng, timestamp }
  ↓   })
[Realtime Channel]
  ↓ Broadcast to all subscribers of delivery:{delivery_id}
[Customer App]
  ↓ Subscribed to delivery:{delivery_id}
  ↓ useEffect(() => {
      supabase.channel(`delivery:${deliveryId}`)
        .on('broadcast', { event: 'location_update' }, (payload) => {
          setDriverLocation(payload);
          updateMapMarker(payload.lat, payload.lng);
        })
        .subscribe()
    }, [])
[React Native Map]
  ↓ Update driver marker position
  ↓ Recalculate ETA based on distance
  ↓ Animate marker movement
```

---

#### Step 4: Calculate Route (Cached)

```
[Customer App]
  ↓ Needs to display route polyline on map
[Edge Function Call]
  ↓ POST /functions/v1/get_route
  ↓ Body: {
      origin: { lat: driver_lat, lng: driver_lng },
      destination: { lat: customer_lat, lng: customer_lng }
    }
[Edge Function - Get Route]
  ↓ Check route_cache table
  ↓ SELECT * FROM route_cache
  ↓ WHERE origin_lat = $1 AND origin_lng = $2
  ↓ AND dest_lat = $3 AND dest_lng = $4
  ↓ AND created_at > NOW() - INTERVAL '5 minutes'
[Cache Result]
  ↓ If HIT: Return cached polyline (saves API cost)
  ↓ If MISS: Call Google Routes API
[Google Routes API]
  ↓ Request route with traffic data
  ↓ Response: {
      distance_meters: 5200,
      duration_seconds: 900,
      polyline: "encoded_polyline_string"
    }
[Store in Cache]
  ↓ INSERT INTO route_cache (origin_lat, origin_lng, dest_lat, dest_lng, provider, distance_meters, duration_seconds, polyline, created_at)
  ↓ VALUES ($1, $2, $3, $4, 'google', $5, $6, $7, NOW())
[Return to App]
  ↓ { polyline: "...", duration: 900 }
[Customer App]
  ↓ Decode polyline
  ↓ Draw route on map
  ↓ Display ETA: "15 min away"
```

**Cost Savings:**
- Without cache: 3,000 API calls/month = $15/month
- With cache (5-min TTL): 750 API calls/month = $3.75/month
- **92% cost reduction**

---

#### Step 5: Mark Delivered

```
[Driver App - Active Delivery Screen]
  ↓ Driver arrives at customer location
  ↓ Driver taps "Mark Delivered"
[Photo Upload Flow]
  ↓ expo-image-picker launchCameraAsync()
  ↓ User takes photo of food at doorstep
[Supabase Storage]
  ↓ POST /storage/v1/object/delivery-proofs/{delivery_id}.jpg
  ↓ Upload photo with driver JWT
[Storage Bucket Policy]
  ↓ RLS: Drivers can upload to their own deliveries
[Get Public URL]
  ↓ { public_url: "https://...supabase.co/storage/v1/object/public/delivery-proofs/..." }
[Update Delivery]
  ↓ PATCH /rest/v1/deliveries?id=eq.{delivery_id}
  ↓ Body: {
      status: "delivered",
      delivered_at: "ISO timestamp",
      proof_url: "public_url"
    }
[Database Trigger]
  ↓ After UPDATE deliveries SET status = 'delivered'
  ↓ Invoke Edge Function: process_payment
[Edge Function - Process Payment]
  ↓ (See Payment Processing Flow below)
[Realtime Broadcast]
  ↓ Channel: orders:customer:{customer_id}
  ↓ Event: delivered
  ↓ Payload: { proof_url, delivered_at }
[Customer App]
  ↓ Show: "Your order has been delivered! ✅"
  ↓ Display proof photo
  ↓ Prompt: "Rate your experience"
```

---

## Payment Processing Flow

### Journey: Order delivered → payment captured → funds split → chef paid out

#### Step 1: Payment Hold (On Order Creation)

```
[Customer App - Checkout]
  ↓ User taps "Place Order"
[Edge Function - Create Payment Intent]
  ↓ POST /functions/v1/create_payment_intent
  ↓ Body: { order_id, amount_cents: 1870 }
[Stripe API]
  ↓ POST https://api.stripe.com/v1/payment_intents
  ↓ Headers: { Authorization: "Bearer sk_test_..." }
  ↓ Body: {
      amount: 1870,
      currency: "usd",
      customer: stripe_customer_id,
      capture_method: "manual",  // Hold funds, don't capture yet
      metadata: { order_id: "uuid" }
    }
[Stripe Response]
  ↓ {
      id: "pi_...",
      status: "requires_payment_method",
      client_secret: "pi_...secret_..."
    }
[Return to App]
  ↓ { client_secret, payment_intent_id }
[Customer App]
  ↓ Use @stripe/stripe-react-native
  ↓ confirmPayment({ clientSecret, paymentMethod })
[Stripe SDK]
  ↓ Collect card details
  ↓ Tokenize card securely
  ↓ Confirm payment with Stripe
[Stripe Response]
  ↓ { status: "requires_capture" }  // Funds authorized but not captured
[Update Order]
  ↓ PATCH /rest/v1/orders?id=eq.{order_id}
  ↓ Body: {
      payment_intent_id: "pi_...",
      payment_status: "authorized"
    }
```

**Why "manual capture"?**
- Funds are authorized (held on customer's card) but NOT charged yet
- Prevents charging customer if chef doesn't fulfill order
- Capture happens only after delivery is confirmed

---

#### Step 2: Capture Payment (After Delivery)

```
[Database Trigger]
  ↓ After UPDATE deliveries SET status = 'delivered'
  ↓ Invoke Edge Function: process_payment
[Edge Function - Process Payment]
  ↓ SELECT order_id, payment_intent_id, total_cents, chef_id
  ↓ FROM orders WHERE id = (SELECT order_id FROM deliveries WHERE id = $delivery_id)
[Stripe API - Capture]
  ↓ POST https://api.stripe.com/v1/payment_intents/{intent_id}/capture
  ↓ Body: { amount_to_capture: 1870 }
[Stripe Response]
  ↓ {
      status: "succeeded",
      amount_received: 1870,
      charges: { data: [{ id: "ch_..." }] }
    }
[Update Order]
  ↓ UPDATE orders
  ↓ SET payment_status = 'captured', captured_at = NOW()
  ↓ WHERE id = $order_id
```

---

#### Step 3: Calculate Platform Fee & Chef Payout

```
[Edge Function - Calculate Split]
  ↓ Get order totals
  ↓ subtotal_cents: 1200  (food cost)
  ↓ delivery_fee_cents: 500  (to driver)
  ↓ platform_fee_cents: 170  (10% of subtotal)
  ↓ total_cents: 1870
[Calculate Chef Payout]
  ↓ chef_payout = subtotal_cents - platform_fee_cents
  ↓ chef_payout = 1200 - 170 = 1030 cents ($10.30)
[Calculate Driver Payout]
  ↓ driver_payout = delivery_fee_cents = 500 cents ($5.00)
[Platform Revenue]
  ↓ platform_revenue = platform_fee_cents = 170 cents ($1.70)
```

**Fee Structure:**
- **Customer pays:** $18.70 total
  - Food: $12.00
  - Delivery: $5.00
  - Platform fee: $1.70 (10% of food cost)
- **Chef receives:** $10.30 (food - platform fee)
- **Driver receives:** $5.00 (delivery fee)
- **Platform keeps:** $1.70 (10% commission)

---

#### Step 4: Transfer to Chef's Stripe Connect Account

```
[Edge Function]
  ↓ Get chef's connect_account_id
  ↓ SELECT connect_account_id FROM chefs WHERE id = $chef_id
[Stripe API - Create Transfer]
  ↓ POST https://api.stripe.com/v1/transfers
  ↓ Headers: { Authorization: "Bearer sk_live_..." }
  ↓ Body: {
      amount: 1030,  // $10.30 in cents
      currency: "usd",
      destination: connect_account_id,  // Chef's connected account
      metadata: {
        order_id: "uuid",
        type: "chef_payout"
      }
    }
[Stripe Response]
  ↓ {
      id: "tr_...",
      status: "paid",
      destination: "acct_..."
    }
[Record Payout]
  ↓ INSERT INTO payouts (
      chef_id, order_id, amount_cents,
      stripe_transfer_id, status, created_at
    )
  ↓ VALUES (
      $chef_id, $order_id, 1030,
      'tr_...', 'completed', NOW()
    )
[Update Order]
  ↓ UPDATE orders
  ↓ SET payout_status = 'completed', payout_at = NOW()
  ↓ WHERE id = $order_id
[Realtime Broadcast]
  ↓ Channel: payouts:chef:{chef_id}
  ↓ Event: payout_completed
  ↓ Payload: { amount: 1030, order_id }
[Chef App]
  ↓ Show notification: "You earned $10.30 from Jane's order"
```

---

#### Step 5: Transfer to Driver's Stripe Connect Account

```
[Same flow as Chef, but with driver_payout amount]
[Stripe API - Create Transfer]
  ↓ POST /v1/transfers
  ↓ Body: {
      amount: 500,  // $5.00 delivery fee
      currency: "usd",
      destination: driver_connect_account_id,
      metadata: {
        delivery_id: "uuid",
        type: "driver_payout"
      }
    }
[Record Payout]
  ↓ INSERT INTO payouts (
      driver_id, delivery_id, amount_cents,
      stripe_transfer_id, status, created_at
    )
  ↓ VALUES (...)
[Driver App Notification]
  ↓ "You earned $5.00 from this delivery"
```

---

## Real-time GPS Tracking Flow

### Technical Implementation

#### Driver Side: Broadcasting Location

```typescript
// Driver App - useDriverLocation hook
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export function useDriverLocation(deliveryId: string) {
  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const startTracking = async () => {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Watch position every 5 seconds
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,  // 5 seconds
          distanceInterval: 10  // 10 meters
        },
        (location) => {
          // Broadcast via Supabase Realtime
          const channel = supabase.channel(`delivery:${deliveryId}`);
          channel.send({
            type: 'broadcast',
            event: 'location_update',
            payload: {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              heading: location.coords.heading,
              speed: location.coords.speed,
              timestamp: location.timestamp
            }
          });
        }
      );
    };

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, [deliveryId]);
}
```

---

#### Customer Side: Receiving Location

```typescript
// Customer App - useTrackDriver hook
import { supabase } from '@/lib/supabase';

export function useTrackDriver(deliveryId: string) {
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`delivery:${deliveryId}`)
      .on('broadcast', { event: 'location_update' }, (payload) => {
        setDriverLocation(payload);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [deliveryId]);

  return driverLocation;
}
```

---

#### Map Display with Route

```typescript
// Customer App - TrackingMap component
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useTrackDriver } from '@/hooks/useTrackDriver';
import { useRoute } from '@/hooks/useRoute';

export function TrackingMap({ deliveryId, destination }) {
  const driverLocation = useTrackDriver(deliveryId);
  const route = useRoute(driverLocation, destination);

  return (
    <MapView
      region={{
        latitude: driverLocation?.lat || destination.lat,
        longitude: driverLocation?.lng || destination.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }}
    >
      {/* Driver marker */}
      {driverLocation && (
        <Marker
          coordinate={{
            latitude: driverLocation.lat,
            longitude: driverLocation.lng
          }}
          image={require('@/assets/car-icon.png')}
          rotation={driverLocation.heading || 0}
        />
      )}

      {/* Destination marker */}
      <Marker
        coordinate={{
          latitude: destination.lat,
          longitude: destination.lng
        }}
        image={require('@/assets/home-icon.png')}
      />

      {/* Route polyline */}
      {route && (
        <Polyline
          coordinates={route.coordinates}
          strokeColor="#4A90E2"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}
```

---

## Admin Dashboard Flow

### Journey: Admin reviews analytics → manages users → monitors revenue

#### Real-time Analytics Query

```typescript
// Admin Dashboard - useAnalytics hook
import { supabase } from '@/lib/supabase';

export function useAnalytics() {
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeDrivers: 0,
    pendingPayouts: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const today = new Date().toISOString().split('T')[0];

      // Today's orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`);

      // Today's revenue (platform fees)
      const { data: revenue } = await supabase
        .from('orders')
        .select('platform_fee_cents')
        .gte('created_at', `${today}T00:00:00`)
        .eq('payment_status', 'captured');

      const totalRevenue = revenue?.reduce((sum, o) => sum + o.platform_fee_cents, 0) || 0;

      // Active drivers
      const { count: driversCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver')
        .eq('status', 'online');

      // Pending payouts
      const { count: payoutsCount } = await supabase
        .from('payouts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setMetrics({
        todayOrders: ordersCount || 0,
        todayRevenue: totalRevenue,
        activeDrivers: driversCount || 0,
        pendingPayouts: payoutsCount || 0
      });
    };

    fetchMetrics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}
```

---

## Authentication Flow

### JWT-based Authentication with RLS

```
[Mobile/Web App]
  ↓ User enters email/password
[Supabase Auth]
  ↓ POST /auth/v1/token?grant_type=password
  ↓ Body: { email, password }
[Supabase Auth Service]
  ↓ Verify credentials against auth.users table
  ↓ Hash password with bcrypt, compare
[Generate JWT]
  ↓ Create JWT with claims:
  ↓ {
      sub: user_id,
      email: user@example.com,
      role: 'authenticated',
      aal: 'aal1',
      exp: timestamp + 3600  // 1 hour
    }
[Sign JWT]
  ↓ Sign with secret key
  ↓ JWT: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
[Return Tokens]
  ↓ {
      access_token: "jwt...",
      refresh_token: "refresh...",
      expires_in: 3600,
      user: { id, email, role }
    }
[Client Storage]
  ↓ Store in secure storage (AsyncStorage encrypted)
  ↓ Set auth header for all requests:
  ↓ Authorization: Bearer jwt...
```

---

### RLS Policy Enforcement

```
[Client Request]
  ↓ GET /rest/v1/orders
  ↓ Header: Authorization: Bearer jwt...
[Supabase REST API]
  ↓ Parse JWT, extract user_id
[PostgreSQL Session]
  ↓ SET LOCAL role = 'authenticated'
  ↓ SET LOCAL request.jwt.claims = '{"sub": "user_id", ...}'
[Execute Query with RLS]
  ↓ SELECT * FROM orders WHERE ...
  ↓ (PostgreSQL automatically applies RLS policies)
[RLS Policy]
  ↓ CREATE POLICY "Users can only see their own orders"
  ↓ ON orders FOR SELECT
  ↓ USING (
  ↓   customer_id = auth.uid()
  ↓   OR chef_id IN (SELECT id FROM chefs WHERE profile_id = auth.uid())
  ↓   OR EXISTS (SELECT 1 FROM deliveries WHERE order_id = orders.id AND driver_id = auth.uid())
  ↓ )
[Filter Results]
  ↓ Return only rows matching RLS policy
  ↓ Customer sees their orders
  ↓ Chef sees orders for their kitchen
  ↓ Driver sees orders they're delivering
```

---

## Error Handling & Retry Logic

### Network Request with Exponential Backoff

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
}

// Usage
const orders = await fetchWithRetry(() =>
  supabase.from('orders').select('*')
);
```

---

## Summary

This documentation covers the complete data flow for:
- ✅ Customer order placement and tracking
- ✅ Chef order management
- ✅ Driver delivery workflow
- ✅ Payment processing with Stripe Connect
- ✅ Real-time GPS tracking via Supabase Realtime
- ✅ Admin dashboard analytics
- ✅ JWT authentication with RLS enforcement

All flows use:
- **Row Level Security (RLS)** for authorization
- **Supabase Realtime** for live updates
- **Edge Functions** for server-side logic
- **Stripe Connect** for marketplace payments
- **Caching** for cost optimization (geocoding + routing)
