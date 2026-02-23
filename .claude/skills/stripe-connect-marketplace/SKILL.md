---
name: stripe-connect-marketplace
description: |
  Master Stripe Connect for marketplace payments in RidenDine. Use when: (1) onboarding chefs
  to Stripe Connect, (2) implementing payment flows with platform fees, (3) handling webhooks,
  (4) managing payouts, (5) debugging payment issues. Key insight: RidenDine uses Standard
  Connect accounts with 15% platform fee deducted automatically via application_fee_amount.
author: Claude Code
version: 1.0.0
---

# Stripe Connect Marketplace Patterns

## Problem

RidenDine is a marketplace connecting customers with chefs. Stripe Connect enables:
- Chefs receive payments directly to their bank accounts
- Platform (RidenDine) takes 15% commission automatically
- PCI-compliant payment processing (no card data stored on server)
- Automated payouts to chefs

## Context / Trigger Conditions

Use this skill when:
- Onboarding new chefs to accept payments
- Implementing checkout flow with platform fees
- Chef reports missing payouts
- Payment webhook events not processing
- Debugging "account not found" errors
- Setting up Stripe test mode

## RidenDine Stripe Architecture

**Account Types:**
- **Platform Account:** RidenDine's Stripe account (holds platform fees)
- **Connected Accounts:** One per chef (Standard Connect accounts)

**Payment Flow:**
```
Customer → Stripe Checkout → Chef's Connected Account (85%) + Platform Fee (15%)
```

**Key Components:**
1. **Edge Function: `create_connect_account`** - Onboards chefs
2. **Edge Function: `create_checkout_session`** - Creates payment sessions
3. **Edge Function: `webhook_stripe`** - Handles payment events
4. **Database:** `chefs.stripe_account_id` stores connected account IDs

## Pattern 1: Chef Onboarding (Create Connected Account)

**Location:** `backend/supabase/functions/create_connect_account/index.ts`

**Flow:**
1. Chef signs up via admin or web app
2. Frontend calls Edge Function with `profile_id`
3. Edge Function creates Stripe Standard Connect account
4. Edge Function creates Account Link for onboarding
5. Chef completes Stripe onboarding (bank details, identity verification)
6. Webhook confirms account is active
7. Database updated with `stripe_account_id`

**Example Implementation:**

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { profile_id, email, refresh_url, return_url } = await req.json();

  // Create Standard Connect account
  const account = await stripe.accounts.create({
    type: 'standard',
    email,
    metadata: { profile_id },
  });

  // Create Account Link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: refresh_url || 'https://ridendine.com/chef/onboarding',
    return_url: return_url || 'https://ridendine.com/chef/dashboard',
    type: 'account_onboarding',
  });

  // Update database with stripe_account_id
  const { error } = await supabase
    .from('chefs')
    .update({ stripe_account_id: account.id })
    .eq('profile_id', profile_id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ url: accountLink.url }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Database Update:**

```sql
-- chefs table already has stripe_account_id column
-- Migration: backend/supabase/migrations/20240101000000_init.sql
ALTER TABLE chefs ADD COLUMN stripe_account_id TEXT UNIQUE;
```

**Frontend Integration (Next.js):**

```typescript
// apps/web/app/chef/onboarding/page.tsx
async function connectStripe() {
  const response = await fetch('/api/connect-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: user.id,
      email: user.email,
      refresh_url: window.location.href,
      return_url: `${window.location.origin}/chef/dashboard`,
    }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe onboarding
}
```

## Pattern 2: Checkout with Platform Fee

**Location:** `backend/supabase/functions/create_checkout_session/index.ts`

**Flow:**
1. Customer clicks "Checkout"
2. Frontend calls Edge Function with order details
3. Edge Function:
   - Validates order items exist in database
   - Calculates total (server-side validation)
   - Retrieves chef's `stripe_account_id`
   - Creates Stripe Checkout Session with `application_fee_amount`
4. Customer redirected to Stripe Checkout
5. Customer completes payment
6. Webhook confirms payment success
7. Order status updated to "placed"

**Example Implementation:**

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { order_id } = await req.json();

  // Fetch order details from database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, chefs!inner(stripe_account_id), order_items(*)')
    .eq('id', order_id)
    .single();

  if (orderError) throw orderError;
  if (!order.chefs.stripe_account_id) {
    throw new Error('Chef has not completed Stripe onboarding');
  }

  // Calculate total (server-side validation)
  const totalCents = order.order_items.reduce(
    (sum: number, item: any) => sum + item.price_cents * item.quantity,
    0
  );

  // Platform fee: 15% of total
  const platformFeeCents = Math.floor(totalCents * 0.15);

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: order.order_items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.dish_name || 'Dish' },
          unit_amount: item.price_cents,
        },
        quantity: item.quantity,
      })),
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        metadata: { order_id: order.id },
      },
      success_url: `${req.headers.get('origin')}/order/${order.id}?success=true`,
      cancel_url: `${req.headers.get('origin')}/checkout?canceled=true`,
      metadata: { order_id: order.id },
    },
    {
      stripeAccount: order.chefs.stripe_account_id, // Payment goes to chef's account
    }
  );

  return new Response(
    JSON.stringify({ url: session.url }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Frontend Integration:**

```typescript
// apps/web/app/checkout/page.tsx
async function handleCheckout() {
  // Create draft order in database first
  const { data: order } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      chef_id: cart.chefId,
      total_cents: cart.total,
      status: 'draft',
    })
    .select()
    .single();

  // Create order items
  await supabase.from('order_items').insert(
    cart.items.map((item) => ({
      order_id: order.id,
      dish_id: item.id,
      quantity: item.quantity,
      price_cents: item.price * 100,
    }))
  );

  // Create Stripe Checkout Session
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: order.id }),
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
}
```

## Pattern 3: Webhook Handling

**Location:** `backend/supabase/functions/webhook_stripe/index.ts`

**Critical:** Stripe webhook signature verification prevents unauthorized events.

**Events to Handle:**
- `checkout.session.completed` → Update order status to "placed"
- `payment_intent.succeeded` → Confirm payment success
- `account.updated` → Chef completed onboarding or updated details
- `payout.paid` → Chef received payout

**Example Implementation:**

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  const body = await req.text();

  // ⚠️ CRITICAL: Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        // Update order status to "placed" (payment confirmed)
        await supabase
          .from('orders')
          .update({ status: 'placed', payment_status: 'paid' })
          .eq('id', orderId);
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        await supabase
          .from('orders')
          .update({ payment_status: 'paid' })
          .eq('id', orderId);
      }
      break;
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      const profileId = account.metadata?.profile_id;

      if (profileId && account.charges_enabled) {
        // Chef completed onboarding and can accept payments
        await supabase
          .from('chefs')
          .update({
            stripe_account_id: account.id,
            stripe_onboarding_complete: true,
          })
          .eq('profile_id', profileId);
      }
      break;
    }

    case 'payout.paid': {
      const payout = event.data.object as Stripe.Payout;
      // Log payout for chef's records (optional)
      console.log(`Payout ${payout.id} paid to account ${payout.destination}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Webhook Configuration:**

1. **Development:** Use Stripe CLI to forward webhooks
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/webhook_stripe
   ```

2. **Production:** Configure webhook endpoint in Stripe Dashboard
   - URL: `https://<project-id>.supabase.co/functions/v1/webhook_stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `account.updated`, `payout.paid`
   - Copy webhook secret to Supabase Secrets: `STRIPE_WEBHOOK_SECRET`

## Pattern 4: Testing with Stripe Test Mode

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires authentication: `4000 0027 6000 3184`

**Test Environment Variables:**

```bash
# .env.local (Development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI or Dashboard
```

**Supabase Edge Function Secrets:**

```bash
# Set via Supabase Dashboard → Settings → Secrets
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Testing Checklist:**

- [ ] Chef onboarding redirects to Stripe account link
- [ ] Chef completes onboarding (test mode allows skipping verification)
- [ ] `chefs.stripe_account_id` populated after onboarding
- [ ] Checkout creates Stripe session with platform fee
- [ ] Payment completes successfully with test card
- [ ] Webhook receives `checkout.session.completed` event
- [ ] Order status changes from "draft" to "placed"
- [ ] Platform fee (15%) deducted correctly

## Debugging Common Issues

### Issue: "Chef has not completed Stripe onboarding"

**Symptom:** Checkout fails with error about missing `stripe_account_id`

**Cause:** Chef's connected account not created or onboarding incomplete

**Fix:**
1. Check database: `SELECT stripe_account_id FROM chefs WHERE id = '<chef-id>'`
2. If NULL:
   - Create connected account via `create_connect_account` Edge Function
   - Send chef onboarding link
3. If present but onboarding incomplete:
   - Check Stripe Dashboard → Connect → Accounts
   - Verify account status is "Complete" (charges_enabled: true)
   - Re-trigger onboarding link if needed

### Issue: Webhook not firing

**Symptom:** Order status stays "draft" after payment

**Cause:** Webhook endpoint not configured or signature verification failing

**Fix:**
1. **Development:** Ensure Stripe CLI is running: `stripe listen --forward-to ...`
2. **Production:**
   - Verify webhook endpoint in Stripe Dashboard
   - Check Edge Function logs: `supabase functions logs webhook_stripe`
   - Confirm `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. **Test webhook manually:**
   ```bash
   stripe trigger checkout.session.completed
   ```

### Issue: Platform fee not deducted

**Symptom:** Chef receives full payment amount (100%), not 85%

**Cause:** `application_fee_amount` not set correctly

**Fix:**
1. Check Edge Function code: `create_checkout_session/index.ts`
2. Verify calculation: `platformFeeCents = Math.floor(totalCents * 0.15)`
3. Confirm `payment_intent_data.application_fee_amount` is passed
4. Test with small amounts to verify:
   - $10.00 order → $1.50 platform fee → $8.50 to chef
   - $100.00 order → $15.00 platform fee → $85.00 to chef

### Issue: "No such connected account"

**Symptom:** Stripe API returns 404 for connected account

**Cause:** `stripe_account_id` in database doesn't exist in Stripe

**Fix:**
1. Verify account exists in Stripe Dashboard → Connect → Accounts
2. If missing:
   - Delete orphaned `stripe_account_id` from database
   - Re-onboard chef via `create_connect_account`
3. If exists but mismatched:
   - Update database with correct `stripe_account_id` from Stripe Dashboard

## Security Checklist

- [ ] **Webhook signature verification:** Always use `stripe.webhooks.constructEvent()`
- [ ] **Never trust client:** Recalculate order total server-side
- [ ] **Validate chef account:** Confirm `stripe_account_id` exists before checkout
- [ ] **Secure secrets:** Store Stripe keys in environment variables (Supabase Secrets)
- [ ] **Use HTTPS:** Webhook endpoint must use HTTPS in production
- [ ] **Test mode separation:** Use different Stripe accounts for test/production

## References

- Stripe Connect docs: https://stripe.com/docs/connect
- Stripe Connect Standard: https://stripe.com/docs/connect/standard-accounts
- Stripe Checkout: https://stripe.com/docs/checkout
- Stripe Webhooks: https://stripe.com/docs/webhooks
- RidenDine Edge Functions: `backend/supabase/functions/`
- RidenDine SECURITY.md: Documents payment architecture
