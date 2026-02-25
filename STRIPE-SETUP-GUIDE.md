# Stripe Setup Guide for RidenDine

**Purpose:** Configure Stripe Connect to enable marketplace payments between customers and chefs.

**Time Required:** 15-20 minutes

---

## Overview

RidenDine uses Stripe Connect to handle:
1. **Customer Payments** → Platform collects 100% of order total
2. **Chef Payouts** → Platform pays chef 85% (platform keeps 15% fee)
3. **Automated Transfers** → Money flows automatically on delivery

---

## Step 1: Get Stripe API Keys

### 1.1 Login to Stripe Dashboard

Visit: https://dashboard.stripe.com

**If you don't have a Stripe account:**
1. Sign up at https://stripe.com
2. Complete business verification (required for live payments)
3. Provide business details, bank account info

### 1.2 Navigate to API Keys

1. Click **Developers** in top navigation
2. Click **API keys** in sidebar
3. You'll see two sets of keys:

**Test Keys (for development):**
```
Publishable key: pk_test_51...
Secret key: sk_test_51...
```

**Live Keys (for production - ONLY visible after account activation):**
```
Publishable key: pk_live_51...
Secret key: sk_live_51...
```

### 1.3 Copy Keys to Environment Variables

**For initial testing, use TEST keys:**

```bash
# In Vercel Dashboard → Project → Settings → Environment Variables
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

**When ready for real money, switch to LIVE keys:**

```bash
STRIPE_SECRET_KEY=sk_live_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
```

---

## Step 2: Enable Stripe Connect

### 2.1 Activate Connect

1. Go to: https://dashboard.stripe.com/settings/connect
2. Click **Get started** (if first time)
3. Accept Stripe Connect terms

### 2.2 Configure Connect Settings

**Platform Details:**
- **Platform name:** RidenDine
- **Support email:** your-business-email@domain.com
- **Support phone:** Your business phone number
- **Statement descriptor:** RIDENDINE (appears on customer credit card statements)

**Brand Settings:**
- Upload your logo (optional)
- Choose brand color (optional)

### 2.3 Set Connect OAuth Redirect URLs

This is where chefs are sent after connecting their Stripe account.

**Add these URLs:**

**Test Mode:**
```
https://your-web-app-test.vercel.app/become-chef/callback
http://localhost:3001/become-chef/callback
```

**Live Mode:**
```
https://your-web-app.vercel.app/become-chef/callback
```

Or if using custom domain:
```
https://ridendine.com/become-chef/callback
```

---

## Step 3: Configure Webhooks

Webhooks notify your app when payments succeed, fail, or are refunded.

### 3.1 Add Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter endpoint URL:

**For Supabase Edge Functions:**
```
https://your-project.supabase.co/functions/v1/webhook_stripe
```

### 3.2 Select Events to Listen For

Check these events:

**Payment Events:**
- [x] `checkout.session.completed` - Customer completed checkout
- [x] `payment_intent.succeeded` - Payment succeeded
- [x] `payment_intent.payment_failed` - Payment failed

**Refund Events:**
- [x] `charge.refunded` - Refund issued

**Connect Events (for chef payouts):**
- [x] `account.updated` - Chef Stripe account updated
- [x] `transfer.created` - Payout transfer created
- [x] `transfer.failed` - Payout transfer failed

### 3.3 Get Webhook Signing Secret

After creating the webhook:

1. Click on the webhook you just created
2. Copy the **Signing secret** (starts with `whsec_...`)
3. Add to environment variables:

```bash
# Vercel Dashboard
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SIGNING_SECRET_HERE

# Supabase Secrets
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SIGNING_SECRET_HERE
```

**Important:** Test mode and live mode have different webhook secrets!

---

## Step 4: Test Payments

### 4.1 Test Cards

Use these cards in **test mode** only:

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
Zip: Any 5 digits (e.g., 12345)
```

**Declined Payment:**
```
Card Number: 4000 0000 0000 0002
```

**Requires 3D Secure Authentication:**
```
Card Number: 4000 0025 0000 3155
```

### 4.2 Test Complete Flow

1. Visit your web app
2. Sign up as customer
3. Add items to cart
4. Proceed to checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete payment

**Verify:**
- Order appears in admin dashboard
- Payment shows in Stripe Dashboard → Payments
- Webhook receives `checkout.session.completed` event

### 4.3 Test Chef Payout

1. Sign up as chef
2. Connect Stripe account (use Stripe test mode account)
3. Receive an order
4. Mark order as delivered

**Verify:**
- Transfer shows in Stripe Dashboard → Connect → Transfers
- Chef receives 85% of order total
- Platform keeps 15% commission

---

## Step 5: Go Live

### 5.1 Complete Account Activation

Before going live, Stripe requires:

1. **Business Verification:**
   - Business name, address
   - EIN or SSN (US) / Business number (Canada)
   - Bank account for payouts

2. **Tax Information:**
   - Business tax classification
   - W-9 form (US businesses)

3. **Phone Verification:**
   - Verify your phone number

**Complete at:** https://dashboard.stripe.com/settings/account

### 5.2 Switch to Live Keys

1. Go to: https://dashboard.stripe.com/apikeys
2. Toggle to **Live mode** (switch in top-right)
3. Copy **Live keys**:
   - `pk_live_...`
   - `sk_live_...`

4. Update environment variables:

```bash
# In Vercel Dashboard (Production environment)
STRIPE_SECRET_KEY=sk_live_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
```

5. Update Supabase secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_51...
```

### 5.3 Create Live Mode Webhook

**Important:** Test and live webhooks are separate!

1. Toggle Stripe Dashboard to **Live mode**
2. Go to: https://dashboard.stripe.com/webhooks
3. Add endpoint (same URL as test mode)
4. Select same events
5. Copy new webhook secret:

```bash
# Update with LIVE webhook secret
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_SECRET_HERE
```

### 5.4 Update Connect OAuth URLs

1. Go to: https://dashboard.stripe.com/settings/connect
2. Switch to **Live mode**
3. Add production redirect URL:

```
https://ridendine.com/become-chef/callback
```

---

## Step 6: Platform Fees Configuration

RidenDine's business model:
- **Customer pays:** $20 order + $5 delivery fee = **$25 total**
- **Chef receives:** 85% of $20 = **$17**
- **Platform keeps:** 15% of $20 = **$3**
- **Delivery fee:** $5 (100% to platform)
- **Total platform revenue per order:** $8

### Configure Fee Percentage

Edit in `.env.production`:

```bash
# Default: 15% platform fee
PLATFORM_FEE_PERCENTAGE=15

# Change to your desired percentage
# Example: 10% fee
PLATFORM_FEE_PERCENTAGE=10
```

**Note:** Fee is calculated on subtotal only (excludes delivery fee).

---

## Step 7: Monitoring & Reports

### 7.1 View Payments

**All Payments:**
https://dashboard.stripe.com/payments

**Successful Payments:**
https://dashboard.stripe.com/payments?status[]=succeeded

**Failed Payments:**
https://dashboard.stripe.com/payments?status[]=failed

### 7.2 View Transfers (Chef Payouts)

https://dashboard.stripe.com/connect/transfers

### 7.3 View Connected Accounts (Chefs)

https://dashboard.stripe.com/connect/accounts/overview

### 7.4 Download Reports

1. Go to: https://dashboard.stripe.com/reports
2. Create custom report
3. Export to CSV for accounting

**Useful Reports:**
- Daily balance summary
- Transfer reconciliation
- Fee breakdown

---

## Step 8: Security Best Practices

### 8.1 Protect API Keys

- ✅ NEVER commit secret keys to git
- ✅ Use environment variables
- ✅ Set keys in Vercel dashboard, not in code
- ✅ Rotate keys regularly (every 90 days)

### 8.2 Verify Webhook Signatures

The code already does this - verify it's working:

```typescript
// In webhook_stripe Edge Function
const signature = headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

**Test:** Send fake webhook (should fail signature verification)

### 8.3 Enable 3D Secure

Reduces fraud and chargebacks:

1. Go to: https://dashboard.stripe.com/settings/payment_methods
2. Enable 3D Secure for all card payments
3. Set rules:
   - Require for payments > $50
   - Optional for payments < $50

### 8.4 Set Up Fraud Detection

1. Go to: https://dashboard.stripe.com/radar
2. Review Radar rules
3. Customize risk thresholds
4. Enable email alerts for high-risk payments

---

## Troubleshooting

### "Payment failed" with no error message

**Cause:** Missing or incorrect Stripe keys

**Fix:**
1. Check `STRIPE_SECRET_KEY` in Vercel
2. Verify key starts with `sk_test_` or `sk_live_`
3. Ensure no extra spaces or quotes

### "Webhook signature verification failed"

**Cause:** Wrong webhook secret

**Fix:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click your webhook
3. Copy signing secret (starts with `whsec_`)
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel AND Supabase

### "Chef onboarding fails"

**Cause:** Connect OAuth redirect URL mismatch

**Fix:**
1. Check current app URL
2. Add exact URL to Connect settings:
   https://dashboard.stripe.com/settings/connect
3. Include `/become-chef/callback` path

### "Transfer failed" / Chef not receiving payout

**Cause:** Chef's Stripe account not fully activated

**Fix:**
1. Check connected account in Stripe Dashboard
2. Click chef's account
3. Review "Requirements" section
4. Notify chef to complete onboarding

### Test mode vs Live mode confusion

**Symptoms:**
- Test payments work, live payments fail
- Can't find transactions in dashboard

**Fix:**
- Check mode toggle in top-right of Stripe Dashboard
- Test keys only work in test mode
- Live keys only work in live mode
- Webhooks are separate for test/live

---

## Support & Resources

**Stripe Documentation:**
- Connect Overview: https://stripe.com/docs/connect
- Webhooks Guide: https://stripe.com/docs/webhooks
- Testing Cards: https://stripe.com/docs/testing

**Stripe Support:**
- Email: support@stripe.com
- Live Chat: https://support.stripe.com (bottom-right)
- Phone: Available for verified accounts

**RidenDine Stripe Integration:**
- Edge Function code: `backend/supabase/functions/webhook_stripe/`
- Checkout flow: `apps/web/app/checkout/`
- Chef onboarding: `apps/web/app/become-chef/`

---

## Quick Reference

### Environment Variables Needed

```bash
# Required for payments
STRIPE_SECRET_KEY=sk_live_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional configurations
PLATFORM_FEE_PERCENTAGE=15
DEFAULT_DELIVERY_FEE_CENTS=500
MINIMUM_ORDER_CENTS=1000
```

### Webhook URL

```
https://your-project.supabase.co/functions/v1/webhook_stripe
```

### Required Webhook Events

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

### Connect OAuth Redirect

```
https://[your-domain]/become-chef/callback
```

---

**Last Updated:** February 24, 2026
**Status:** Ready for configuration
