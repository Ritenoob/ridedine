---
name: order-lifecycle-management
description: |
  Master order lifecycle and state management in RidenDine. Use when: (1) implementing order
  status updates, (2) debugging invalid state transitions, (3) handling role-based order
  operations, (4) building order tracking, (5) implementing cancellations. Key insight:
  Standardized lifecycle is draft → placed → accepted → preparing → ready → picked_up →
  out_for_delivery → delivered. Status enforcement via CHECK constraint + RLS policies.
author: Claude Code
version: 1.0.0
---

# Order Lifecycle Management

## Problem

RidenDine orders move through multiple states involving customers, chefs, and drivers. Each role can only perform specific status transitions. Database constraints enforce valid transitions. Payment status tracks separately from order fulfillment status.

## Context / Trigger Conditions

Use this skill when:
- Implementing order status updates (chef accepts order, driver picks up)
- Debugging "invalid status transition" errors
- Building order tracking UI
- Handling order cancellations
- Implementing notifications for status changes
- Role-based order filtering

## Order Status Lifecycle

**Standardized Lifecycle (from Task 1 schema reconciliation):**

```
draft → placed → accepted → preparing → ready → picked_up → out_for_delivery → delivered
  ↓
cancelled (can occur at any stage before delivered)
```

**Status Definitions:**

| Status               | Actor    | Meaning                                      | Payment Required |
| -------------------- | -------- | -------------------------------------------- | ---------------- |
| `draft`              | Customer | Cart/checkout in progress, not paid yet      | No               |
| `placed`             | System   | Payment succeeded, awaiting chef confirmation| Yes              |
| `accepted`           | Chef     | Chef confirmed order, will prepare           | Yes              |
| `preparing`          | Chef     | Chef is cooking                              | Yes              |
| `ready`              | Chef     | Food ready for pickup                        | Yes              |
| `picked_up`          | Driver   | Driver collected from chef                   | Yes              |
| `out_for_delivery`   | Driver   | En route to customer                         | Yes              |
| `delivered`          | Driver   | Customer received order                      | Yes              |
| `cancelled`          | Any      | Order cancelled (refund if paid)             | Depends          |

**Database Constraint:**

```sql
-- Migration: backend/supabase/migrations/20240107000000_schema_reconciliation.sql
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'placed', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'));
```

## Payment Status Tracking

**Separate from order status:**

```typescript
// orders table schema
interface Order {
  id: string;
  customer_id: string;
  chef_id: string;
  driver_id?: string;
  status: OrderStatus; // Fulfillment status
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'; // Payment status
  total_cents: number;
  created_at: string;
  updated_at?: string;
}
```

**Payment Status Lifecycle:**

```
pending → paid (Stripe webhook confirms payment)
  ↓
failed (payment declined)

paid → refunded (order cancelled after payment)
```

## Pattern 1: Create Draft Order (Checkout)

**Actor:** Customer
**Transition:** None → `draft`

**Location:** `apps/web/app/checkout/page.tsx`

**Flow:**
1. Customer adds items to cart
2. Customer clicks "Checkout"
3. Create draft order in database
4. Create order items
5. Redirect to Stripe Checkout
6. On payment success → Webhook updates to `placed`

**Example Implementation:**

```typescript
// apps/web/app/checkout/actions.ts
'use server';

import { createActionClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createDraftOrder(
  cartItems: CartItem[],
  chefId: string
) {
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Calculate total (server-side validation)
  const totalCents = cartItems.reduce(
    (sum, item) => sum + item.price_cents * item.quantity,
    0
  );

  // Create draft order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      chef_id: chefId,
      status: 'draft', // Entry status
      payment_status: 'pending',
      total_cents: totalCents,
    })
    .select()
    .single();

  if (error) throw error;

  // Create order items
  const { error: itemsError } = await supabase.from('order_items').insert(
    cartItems.map((item) => ({
      order_id: order.id,
      dish_id: item.dish_id,
      quantity: item.quantity,
      price_cents: item.price_cents,
    }))
  );

  if (itemsError) throw itemsError;

  return order.id;
}
```

## Pattern 2: Payment Success → Placed

**Actor:** System (Stripe webhook)
**Transition:** `draft` → `placed`

**Location:** `backend/supabase/functions/webhook_stripe/index.ts`

**Example Implementation:**

```typescript
// Webhook handler (see stripe-connect-marketplace skill for full implementation)
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;

  if (orderId) {
    // Update order status to "placed" (payment confirmed)
    await supabase
      .from('orders')
      .update({
        status: 'placed', // Ready for chef to accept
        payment_status: 'paid',
      })
      .eq('id', orderId)
      .eq('status', 'draft'); // Only update if still in draft status

    // Send notification to chef (email, push notification, etc.)
  }
  break;
}
```

## Pattern 3: Chef Accepts Order

**Actor:** Chef
**Transition:** `placed` → `accepted`

**Location:** `apps/web/app/chef/orders/actions.ts`

**Example Implementation:**

```typescript
'use server';

import { createActionClient } from '@/lib/supabase/server';

export async function acceptOrder(orderId: string) {
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Update order status
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'accepted' })
    .eq('id', orderId)
    .eq('status', 'placed') // Only accept if currently placed
    .select()
    .single();

  if (error) throw error;

  // RLS policy ensures only order's chef can update (auth.uid() matches chef's profile_id)

  // Send notification to customer

  return data;
}
```

**Frontend (Chef Dashboard):**

```typescript
// apps/web/app/chef/orders/page.tsx
'use client';

import { acceptOrder } from './actions';

export function OrderCard({ order }: { order: Order }) {
  const handleAccept = async () => {
    try {
      await acceptOrder(order.id);
      // Refresh page or update state
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  };

  if (order.status === 'placed') {
    return (
      <div>
        <h3>Order #{order.id.slice(0, 8)}</h3>
        <p>Total: ${(order.total_cents / 100).toFixed(2)}</p>
        <button onClick={handleAccept}>Accept Order</button>
      </div>
    );
  }

  return <div>Order {order.status}</div>;
}
```

## Pattern 4: Chef Updates Cooking Status

**Actor:** Chef
**Transitions:**
- `accepted` → `preparing`
- `preparing` → `ready`

**Example Implementation:**

```typescript
'use server';

export async function updateOrderStatus(
  orderId: string,
  newStatus: 'preparing' | 'ready'
) {
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Validate transition
  const validTransitions: Record<string, string[]> = {
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
  };

  // Fetch current status
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  if (!validTransitions[order.status]?.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${order.status} → ${newStatus}`
    );
  }

  // Update status
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Notify driver if status is "ready" (assign driver)

  return data;
}
```

## Pattern 5: Driver Picks Up Order

**Actor:** Driver
**Transition:** `ready` → `picked_up` → `out_for_delivery`

**Example Implementation:**

```typescript
'use server';

export async function pickupOrder(orderId: string) {
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Get driver record
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!driver) throw new Error('Not a driver');

  // Update order: assign driver + change status
  const { data, error } = await supabase
    .from('orders')
    .update({
      driver_id: driver.id,
      status: 'picked_up',
    })
    .eq('id', orderId)
    .eq('status', 'ready') // Only pickup if ready
    .select()
    .single();

  if (error) throw error;

  // Notify customer

  return data;
}

export async function startDelivery(orderId: string) {
  const supabase = await createActionClient();

  // Update status to out_for_delivery
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'out_for_delivery' })
    .eq('id', orderId)
    .eq('status', 'picked_up')
    .select()
    .single();

  if (error) throw error;

  // Start GPS tracking (see ridendine-gps-tracking skill)

  return data;
}
```

## Pattern 6: Driver Completes Delivery

**Actor:** Driver
**Transition:** `out_for_delivery` → `delivered`

**Example Implementation:**

```typescript
'use server';

export async function completeDelivery(orderId: string, proofPhotoUrl?: string) {
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Update order to delivered
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      delivery_proof_url: proofPhotoUrl,
    })
    .eq('id', orderId)
    .eq('status', 'out_for_delivery')
    .select()
    .single();

  if (error) throw error;

  // Stop GPS tracking
  // Notify customer
  // Trigger payout to chef (Stripe Connect)

  return data;
}
```

## Pattern 7: Order Cancellation

**Actor:** Customer, Chef, or Admin
**Transition:** Any → `cancelled`

**Rules:**
- Customer can cancel before `accepted`
- Chef can cancel at any time before `picked_up`
- After `picked_up`, only admin can cancel
- Refund issued if payment status is `paid`

**Example Implementation:**

```typescript
'use server';

export async function cancelOrder(orderId: string, reason: string) {
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Fetch order details
  const { data: order } = await supabase
    .from('orders')
    .select('*, profiles!inner(role)')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  // Check cancellation permissions
  const userRole = order.profiles.role;
  const canCancel =
    (userRole === 'customer' && order.status === 'placed') ||
    (userRole === 'chef' && ['placed', 'accepted', 'preparing', 'ready'].includes(order.status)) ||
    userRole === 'admin';

  if (!canCancel) {
    throw new Error('Cannot cancel order at this stage');
  }

  // Update status
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', orderId);

  if (error) throw error;

  // Issue refund if payment was made
  if (order.payment_status === 'paid') {
    // Call Stripe refund API (see stripe-connect-marketplace skill)
    // Update payment_status to 'refunded'
  }

  // Notify all parties

  return { success: true };
}
```

## Pattern 8: Real-Time Order Tracking

**Customer sees live status updates:**

**Location:** `apps/web/app/orders/[orderId]/page.tsx`

**Example Implementation:**

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function OrderTracking({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial order
    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
      .then(({ data }) => setOrder(data));

    // Subscribe to updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h1>Order #{order.id.slice(0, 8)}</h1>
      <OrderStatusTimeline status={order.status} />
    </div>
  );
}

function OrderStatusTimeline({ status }: { status: string }) {
  const steps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'accepted', label: 'Chef Confirmed' },
    { key: 'preparing', label: 'Cooking' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <ol>
      {steps.map((step, index) => (
        <li
          key={step.key}
          className={index <= currentIndex ? 'completed' : 'pending'}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}
```

## Debugging Common Issues

### Issue: "Invalid status transition" error

**Symptom:** Database rejects status update

**Cause:** Attempting invalid transition or status typo

**Fix:**
1. Check CHECK constraint: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'orders'::regclass;`
2. Verify status value matches allowed values (lowercase)
3. Ensure transition follows lifecycle: `draft` → `placed` → `accepted` → ...

### Issue: Order stuck in "draft" after payment

**Symptom:** Payment succeeded but order still shows "draft"

**Cause:** Webhook not firing or processing error

**Fix:**
1. Check webhook logs in Stripe Dashboard
2. Verify `webhook_stripe` Edge Function logs: `supabase functions logs webhook_stripe`
3. Confirm `checkout.session.completed` event handled
4. Check `order_id` metadata passed to Stripe session

### Issue: Chef cannot update order status

**Symptom:** RLS policy blocks update

**Cause:** Chef's `profile_id` doesn't match order's `chef_id`

**Fix:**
1. Verify RLS policy on `orders` table:
   ```sql
   CREATE POLICY "Chefs can update own orders" ON orders
     FOR UPDATE
     USING (
       auth.uid() IN (
         SELECT profile_id FROM chefs WHERE id = orders.chef_id
       )
     );
   ```
2. Check `chefs.profile_id` matches authenticated user's ID
3. Test with Supabase Dashboard SQL Editor

### Issue: Order shows wrong status in different apps

**Symptom:** Web app shows "preparing", mobile shows "ready"

**Cause:** Cached data or missed real-time event

**Fix:**
1. Ensure real-time subscription is active
2. Check subscription status:
   ```typescript
   channel.subscribe((status) => {
     console.log('Subscription status:', status);
   });
   ```
3. Add revalidation in Server Components:
   ```typescript
   export const revalidate = 0; // Disable caching
   ```

## Testing Order Lifecycle

**Manual Testing Checklist:**

- [ ] Create draft order → Status = "draft", payment_status = "pending"
- [ ] Complete payment → Status = "placed", payment_status = "paid"
- [ ] Chef accepts order → Status = "accepted"
- [ ] Chef marks preparing → Status = "preparing"
- [ ] Chef marks ready → Status = "ready"
- [ ] Driver picks up → Status = "picked_up", driver_id assigned
- [ ] Driver starts delivery → Status = "out_for_delivery"
- [ ] Driver completes → Status = "delivered", delivered_at timestamp
- [ ] Cancel order before accepted → Status = "cancelled", refund issued
- [ ] Real-time updates work across tabs

## RLS Policies for Order Management

**From:** `backend/supabase/migrations/20240101000000_init.sql`

```sql
-- Customers can view own orders
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Chefs can view assigned orders
CREATE POLICY "Chefs can view assigned orders" ON orders
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT profile_id FROM chefs WHERE id = orders.chef_id
    )
  );

-- Chefs can update own orders (status transitions)
CREATE POLICY "Chefs can update own orders" ON orders
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT profile_id FROM chefs WHERE id = orders.chef_id
    )
  );

-- Drivers can view assigned deliveries
CREATE POLICY "Drivers can view assigned deliveries" ON orders
  FOR SELECT
  USING (
    driver_id IS NOT NULL AND
    auth.uid() IN (
      SELECT profile_id FROM drivers WHERE id = orders.driver_id
    )
  );

-- Drivers can update assigned deliveries
CREATE POLICY "Drivers can update assigned deliveries" ON orders
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT profile_id FROM drivers WHERE id = orders.driver_id
    )
  );
```

## References

- Schema reconciliation: `backend/supabase/migrations/20240107000000_schema_reconciliation.sql`
- Stripe webhook: `backend/supabase/functions/webhook_stripe/index.ts`
- Order tracking: `apps/web/app/orders/[orderId]/page.tsx`
- Supabase RLS: `supabase-rls-patterns` skill
