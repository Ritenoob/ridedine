---
name: ridendine-payment-distribution
description: |
  Master RidenDine's multi-party payment distribution model. Use when: (1) implementing
  payment splits, (2) onboarding new payment recipients (Chef, CoCo, Driver, Delivery Company),
  (3) calculating commission splits, (4) debugging payout issues, (5) extending payment
  infrastructure. Key insight: Customer pays → Platform distributes to 4 parties with CoCo
  receiving 60/40 split on $10/order base.
author: Claude Code
version: 1.0.0
---

# RidenDine Payment Distribution Model

## Problem

RidenDine is a multi-party marketplace where customer payments must be split between:
1. **Platform** (RidenDine) - retains platform fee
2. **Chef** - receives payment for food preparation
3. **CoCo** (Partner) - receives 60/40 split from $10 base per order
4. **Driver** - receives delivery fee
5. **Delivery Company** (optional) - receives logistics fee

## Context / Trigger Conditions

Use this skill when:
- Implementing customer checkout flow with multi-party splits
- Onboarding chefs, drivers, or delivery companies to receive payments
- Calculating commission breakdown for financial reporting
- Debugging missing payouts to any party
- Adding new payment recipients to the platform
- Understanding what's implemented vs. what's missing

## Current Implementation Status (As of 2026-02-25)

### ✅ Implemented
- **Customer → Chef payment** (via Stripe Connect Express accounts)
- **Platform fee retention** (application_fee_amount mechanism)
- **Payment tracking** (orders.payment_status, orders.payment_intent_id)
- **Chef payout infrastructure** (chefs.connect_account_id, automatic transfers)

### ❌ Not Implemented
- **CoCo payment split** (no tracking, no payout mechanism)
- **Driver payouts** (delivery_fee_cents tracked but not distributed)
- **Delivery Company payouts** (no infrastructure exists)
- **Multi-party split logic** (only platform + chef works currently)

## Payment Distribution Model

### Business Model Overview

**Per Order:**
```
Customer Total: $X
├─ Food Cost: $Y (to Chef)
├─ CoCo Share: $10 × 60% = $6.00 (to CoCo)
├─ Platform Share: $10 × 40% = $4.00 (retained)
├─ Driver Fee: delivery_fee_cents (to Driver)
└─ Delivery Company Fee: TBD (if applicable)
```

**CoCo Partnership Terms:**
- Base: $10.00 per order (fixed)
- Split: 60% CoCo ($6.00), 40% Platform ($4.00)
- Payment frequency: TBD (immediate, daily, weekly?)
- Onboarding status: Not implemented

### Current Chef-Only Implementation

**Location:** `backend/supabase/functions/create_checkout_session/index.ts`

**Current Flow:**
```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_intent_data: {
    application_fee_amount: order.platform_fee_cents, // Platform keeps this
    transfer_data: {
      destination: order.chefs.connect_account_id, // Chef gets (total - platform_fee)
    },
  },
  // ...
});
```

**Problem:** This only handles Chef + Platform. No mechanism for CoCo, Driver, or Delivery Company.

## Pattern 1: Multi-Party Split Architecture (Needs Implementation)

### Recommended Approach: Stripe Transfers API

**Why not Checkout Session splits?** Stripe Checkout only supports ONE destination account. For 4+ parties, use Transfers API after payment capture.

**New Flow:**
```
1. Customer pays via Stripe Checkout (100% to Platform account)
2. Webhook: payment_intent.succeeded
3. Calculate splits server-side
4. Create separate Transfers to each connected account:
   - Transfer to Chef (food cost)
   - Transfer to CoCo ($6.00)
   - Transfer to Driver (delivery_fee_cents)
   - Transfer to Delivery Company (if applicable)
5. Platform retains remainder ($4.00 from CoCo + any additional platform fee)
```

### Implementation Blueprint

**Step 1: Add Connected Accounts for All Parties**

```sql
-- backend/supabase/migrations/YYYYMMDD_add_payment_recipients.sql

-- Add Stripe Connect account for CoCo (one account for entire organization)
CREATE TABLE IF NOT EXISTS coco_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_account_id TEXT UNIQUE,
  payout_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Add Stripe Connect account per driver
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS connect_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payout_enabled BOOLEAN NOT NULL DEFAULT false;

-- Track individual transfers for reconciliation
CREATE TABLE IF NOT EXISTS payment_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('chef', 'coco', 'driver', 'delivery_company')),
  recipient_id UUID NOT NULL, -- profile_id or driver_id or coco_config.id
  stripe_transfer_id TEXT UNIQUE,
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_transfers_order ON payment_transfers(order_id);
CREATE INDEX idx_payment_transfers_recipient ON payment_transfers(recipient_type, recipient_id);
```

**Step 2: Create Transfer Distribution Edge Function**

**Location:** `backend/supabase/functions/distribute_payment/index.ts` (NEW FILE)

```typescript
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  const { order_id, payment_intent_id } = await req.json();

  // Fetch order with all related data
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      chefs!inner(connect_account_id),
      deliveries!inner(driver_id, delivery_fee_cents, drivers!inner(connect_account_id))
    `)
    .eq('id', order_id)
    .single();

  if (orderError) throw orderError;

  // Fetch CoCo config
  const { data: coco } = await supabaseAdmin
    .from('coco_config')
    .select('stripe_account_id')
    .single();

  // Calculate splits
  const COCO_BASE_CENTS = 1000; // $10.00 per order
  const COCO_SPLIT_PERCENT = 0.60; // 60% to CoCo
  const PLATFORM_SPLIT_PERCENT = 0.40; // 40% to Platform

  const cocoShareCents = Math.floor(COCO_BASE_CENTS * COCO_SPLIT_PERCENT); // $6.00
  const platformShareCents = Math.floor(COCO_BASE_CENTS * PLATFORM_SPLIT_PERCENT); // $4.00

  const chefPaymentCents = order.subtotal_cents; // Food cost to chef
  const driverPaymentCents = order.deliveries.delivery_fee_cents;

  const transfers = [];

  // Transfer to Chef
  if (order.chefs.connect_account_id) {
    const transfer = await stripe.transfers.create({
      amount: chefPaymentCents,
      currency: 'usd',
      destination: order.chefs.connect_account_id,
      transfer_group: `order_${order_id}`,
      metadata: { order_id, recipient_type: 'chef' },
    });
    transfers.push({
      order_id,
      recipient_type: 'chef',
      recipient_id: order.chef_id,
      stripe_transfer_id: transfer.id,
      amount_cents: chefPaymentCents,
      status: 'succeeded',
    });
  }

  // Transfer to CoCo
  if (coco?.stripe_account_id) {
    const transfer = await stripe.transfers.create({
      amount: cocoShareCents,
      currency: 'usd',
      destination: coco.stripe_account_id,
      transfer_group: `order_${order_id}`,
      metadata: { order_id, recipient_type: 'coco' },
    });
    transfers.push({
      order_id,
      recipient_type: 'coco',
      recipient_id: coco.id,
      stripe_transfer_id: transfer.id,
      amount_cents: cocoShareCents,
      status: 'succeeded',
    });
  }

  // Transfer to Driver
  if (order.deliveries?.drivers?.connect_account_id) {
    const transfer = await stripe.transfers.create({
      amount: driverPaymentCents,
      currency: 'usd',
      destination: order.deliveries.drivers.connect_account_id,
      transfer_group: `order_${order_id}`,
      metadata: { order_id, recipient_type: 'driver' },
    });
    transfers.push({
      order_id,
      recipient_type: 'driver',
      recipient_id: order.deliveries.driver_id,
      stripe_transfer_id: transfer.id,
      amount_cents: driverPaymentCents,
      status: 'succeeded',
    });
  }

  // Insert transfer records
  await supabaseAdmin.from('payment_transfers').insert(transfers);

  return new Response(
    JSON.stringify({
      success: true,
      transfers: transfers.length,
      platform_retained_cents: platformShareCents
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Step 3: Update Checkout Session to Capture to Platform**

**Modify:** `backend/supabase/functions/create_checkout_session/index.ts`

```typescript
// OLD (direct transfer to chef):
const session = await stripe.checkout.sessions.create({
  payment_intent_data: {
    application_fee_amount: platformFeeCents,
    transfer_data: {
      destination: chefConnectAccountId, // ❌ Remove this
    },
  },
  // ...
});

// NEW (capture to platform, distribute via webhook):
const session = await stripe.checkout.sessions.create({
  payment_intent_data: {
    // Platform receives full amount, distributes later
    metadata: { order_id: order.id },
  },
  // ...
});
```

**Step 4: Update Webhook to Trigger Distribution**

**Modify:** `backend/supabase/functions/webhook_stripe/index.ts`

```typescript
case 'payment_intent.succeeded': {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.order_id;

  if (orderId) {
    // Update order payment status
    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'succeeded' })
      .eq('id', orderId);

    // Trigger payment distribution to all parties
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/distribute_payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        payment_intent_id: paymentIntent.id,
      }),
    });
  }
  break;
}
```

## Pattern 2: Driver Payout Onboarding (Needs Implementation)

Similar to chef onboarding, but for drivers:

**New Edge Function:** `backend/supabase/functions/create_driver_connect_account/index.ts`

```typescript
// Nearly identical to create_connect_account for chefs
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  metadata: { driver_id, profile_id },
});

await supabaseAdmin
  .from('drivers')
  .update({ connect_account_id: account.id })
  .eq('id', driver_id);

// Return onboarding link...
```

**Frontend:** Add onboarding flow to driver profile setup (similar to chef flow)

## Pattern 3: CoCo Onboarding (One-Time Setup)

Since CoCo is a partner organization (not per-user), one Connect account for all orders:

**Admin-only operation:**

```typescript
// Run once via admin panel or Supabase SQL Editor
const cocoAccount = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: 'finance@coco-partner.com',
  capabilities: {
    transfers: { requested: true },
  },
});

// Store in database
await supabaseAdmin.from('coco_config').insert({
  stripe_account_id: cocoAccount.id,
  payout_enabled: false, // Set to true after onboarding complete
});

// Complete onboarding via Stripe Dashboard or account link
const accountLink = await stripe.accountLinks.create({
  account: cocoAccount.id,
  refresh_url: 'https://admin.ridendine.com/coco/onboarding',
  return_url: 'https://admin.ridendine.com/coco/dashboard',
  type: 'account_onboarding',
});
```

## Verification

After implementing multi-party splits:

**Test Order Flow:**
```sql
-- After a test order completes, verify transfers
SELECT
  pt.recipient_type,
  pt.amount_cents,
  pt.status,
  pt.stripe_transfer_id,
  o.total_cents
FROM payment_transfers pt
JOIN orders o ON pt.order_id = o.id
WHERE o.id = '<test-order-id>';

-- Expected results:
-- chef      | <food_cost>           | succeeded | tr_...
-- coco      | 600                   | succeeded | tr_...
-- driver    | <delivery_fee_cents>  | succeeded | tr_...
-- Platform retains: $4.00 from CoCo split + any additional platform fees
```

**Verify in Stripe Dashboard:**
- Platform Balance → Transfers → Verify all 3-4 transfers appear
- Each recipient's Connected Account → Balance → Verify incoming transfer

## Common Issues

### Issue: "Insufficient funds for transfer"

**Cause:** Platform account doesn't have enough balance (payment hasn't cleared yet)

**Fix:** Use `stripe.transfers.create()` with `source_transaction` parameter to link directly to the payment

```typescript
const transfer = await stripe.transfers.create({
  amount: chefPaymentCents,
  currency: 'usd',
  destination: chefConnectAccountId,
  source_transaction: paymentIntentId, // Links to the specific payment
});
```

### Issue: CoCo or Driver not receiving payments

**Diagnosis:**
```sql
-- Check if Connect accounts are set up
SELECT connect_account_id, payout_enabled FROM drivers WHERE id = '<driver-id>';
SELECT stripe_account_id, payout_enabled FROM coco_config;

-- Check transfer records
SELECT * FROM payment_transfers WHERE recipient_id = '<id>' ORDER BY created_at DESC;
```

**Fix:**
- If `connect_account_id` is NULL → Complete onboarding
- If `payout_enabled` is false → Complete Stripe identity verification
- If transfers show 'failed' status → Check failure_reason column

## Migration Path (Existing Orders)

For orders processed before multi-party split implementation:

1. **No retroactive transfers** - Only apply new logic to future orders
2. **Update webhook only** - Existing chef transfers continue working
3. **Gradual rollout** - Test with small orders first
4. **Monitor Stripe Balance** - Ensure sufficient funds before enabling CoCo/Driver transfers

## References

- Stripe Transfers API: https://stripe.com/docs/connect/separate-charges-and-transfers
- Stripe Connect: https://stripe.com/docs/connect
- RidenDine Chef Implementation: `.claude/skills/stripe-connect-marketplace/SKILL.md`
- Edge Functions: `backend/supabase/functions/`
