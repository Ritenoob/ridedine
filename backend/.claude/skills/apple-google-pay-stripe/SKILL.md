---
name: apple-google-pay-stripe
description: |
  Add Apple Pay and Google Pay to Stripe checkout. Use when: (1) adding mobile wallet payments,
  (2) improving mobile conversion, (3) implementing one-tap checkout. Stripe Payment Request Button
  automatically detects device capabilities and shows Apple Pay (Safari/iOS) or Google Pay (Chrome/Android).
author: Claude Code
version: 1.0.0
---

# Apple Pay & Google Pay with Stripe

## Problem

Users want frictionless mobile checkout with Apple Pay (iOS/Safari) and Google Pay (Android/Chrome). Manual card entry on mobile has high abandonment rates.

## Context / Trigger Conditions

Use this skill when:
- Adding mobile wallet support to Stripe checkout
- Improving mobile conversion rates
- User requests "add Apple Pay" or "add Google Pay"
- Building one-tap payment flows

**Key insight:** Stripe's Payment Request Button API handles both automatically - no separate integrations needed.

## Solution

### Architecture Overview

```
User Device Detection
├─ iOS + Safari → Shows Apple Pay
├─ Android + Chrome → Shows Google Pay
├─ Desktop Chrome → Shows Google Pay
└─ Fallback → Regular card form
```

**Single API handles both wallets + detects availability automatically.**

### Implementation Pattern

#### 1. Frontend - Payment Request Button

```typescript
import { PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';

export function AppleGooglePayButton({
  amount,  // in cents
  currency = 'usd',
  onSuccess,
  onError
}: Props) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    // Create payment request
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency.toLowerCase(),
      total: {
        label: 'Order Total',
        amount: amount, // in cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if Apple Pay or Google Pay is available
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    // Handle payment method creation
    pr.on('paymentmethod', async (event) => {
      try {
        // Confirm payment on backend
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method_id: event.paymentMethod.id,
            amount,
          }),
        });

        const { clientSecret } = await response.json();

        // Confirm payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          event.complete('fail');
          onError?.(error.message);
        } else {
          event.complete('success');
          onSuccess?.(paymentIntent);
        }
      } catch (err) {
        event.complete('fail');
        onError?.(err.message);
      }
    });

  }, [stripe, amount, currency, onSuccess, onError]);

  if (!canMakePayment) {
    return null; // Hide button if not available
  }

  return (
    <PaymentRequestButtonElement
      options={{ paymentRequest }}
      className="payment-request-button"
    />
  );
}
```

#### 2. Backend - Payment Intent Creation

```typescript
// API endpoint: /api/confirm-payment
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const { payment_method_id, amount } = await req.json();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: payment_method_id,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${req.headers.get('origin')}/payment/success`,
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

#### 3. UI Integration Pattern

Show Payment Request Button above card form:

```tsx
<div className="payment-section">
  {/* Apple Pay / Google Pay - shows automatically if available */}
  <AppleGooglePayButton
    amount={totalCents}
    currency="usd"
    onSuccess={handleSuccess}
    onError={handleError}
  />

  {/* Divider */}
  {canMakePayment && (
    <div className="payment-divider">
      <span>Or pay with card</span>
    </div>
  )}

  {/* Traditional card form - always shown as fallback */}
  <CardElement />
  <button onClick={handleCardPayment}>Pay ${total}</button>
</div>
```

### Styling the Payment Request Button

```css
.payment-request-button {
  /* Stripe automatically styles for Apple Pay (black) or Google Pay (white) */
  height: 44px;
  margin-bottom: 16px;
}

.payment-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
}

.payment-divider::before,
.payment-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.payment-divider span {
  padding: 0 10px;
  color: #666;
  font-size: 14px;
}
```

## Verification Checklist

### Apple Pay Testing (requires macOS/iOS)

- [ ] **Safari on Mac:** Wallet enrolled → Apple Pay button appears
- [ ] **Safari on iPhone:** Wallet enrolled → Apple Pay button appears
- [ ] **Chrome on Mac:** No Apple Pay (Safari only)
- [ ] **Click button:** Native Apple Pay sheet appears
- [ ] **Complete payment:** Success callback fires
- [ ] **Order created:** Backend receives payment_method

### Google Pay Testing

- [ ] **Chrome on Android:** Google Pay button appears
- [ ] **Chrome on Desktop:** Google Pay button appears (if signed into Google account with card)
- [ ] **Click button:** Google Pay sheet appears
- [ ] **Complete payment:** Success callback fires
- [ ] **Order created:** Backend receives payment_method

### Device Matrix

| Device/Browser | Shows Apple Pay | Shows Google Pay | Fallback to Card |
|---------------|-----------------|------------------|------------------|
| iPhone Safari | ✅ Yes | ❌ No | ✅ Yes |
| iPhone Chrome | ❌ No | ❌ No | ✅ Yes |
| Android Chrome | ❌ No | ✅ Yes | ✅ Yes |
| Mac Safari | ✅ Yes | ❌ No | ✅ Yes |
| Mac Chrome | ❌ No | ✅ Yes (if signed in) | ✅ Yes |
| Windows Chrome | ❌ No | ✅ Yes (if signed in) | ✅ Yes |

## Requirements & Setup

### 1. Stripe Account Configuration

**Enable Apple Pay:**
1. Go to Stripe Dashboard → Settings → Payment Methods
2. Enable "Apple Pay"
3. Register domain (required for web):
   - Download verification file from Stripe
   - Host at `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`
   - Verify in Stripe Dashboard

**Enable Google Pay:**
1. Stripe Dashboard → Settings → Payment Methods
2. Enable "Google Pay"
3. No domain registration needed (automatic)

### 2. HTTPS Requirement

**Apple Pay and Google Pay ONLY work on HTTPS domains.**

- Development: Use `localhost` (works without HTTPS)
- Production: Must have valid SSL certificate
- Staging: Must have valid SSL certificate

### 3. Dependencies

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.0.0",
    "@stripe/react-stripe-js": "^2.0.0",
    "stripe": "^14.0.0"
  }
}
```

## Conversion Impact

**Industry benchmarks:**
- Apple Pay: 25-40% higher conversion than card entry
- Google Pay: 15-30% higher conversion than card entry
- Mobile abandonment: 70% reduction with wallet payments

**Coinbase case study (Moonshot):**
- Apple Pay onramp increased conversion by 25%
- Average transaction time: 12 seconds vs 3+ minutes for card entry

## Common Issues

### Apple Pay Button Not Showing

**Cause:** Domain not verified or wallet not enrolled

**Fix:**
1. Check domain registration in Stripe Dashboard
2. Ensure `apple-developer-merchantid-domain-association` file is accessible
3. Verify user has cards in Apple Wallet
4. Test on Safari (Chrome won't show Apple Pay)

### Google Pay Button Not Showing

**Cause:** User not signed into Google account with payment method

**Fix:**
1. Sign into Chrome with Google account
2. Add payment method to Google Pay (pay.google.com)
3. Refresh page

### Payment Request Fails Silently

**Cause:** Missing `return_url` or invalid amount

**Fix:**
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: 'usd',
  payment_method: payment_method_id,
  confirmation_method: 'manual',
  confirm: true,
  return_url: `${origin}/payment/success`, // REQUIRED
});
```

## RidenDine Implementation

**Files to modify:**

1. **`apps/web/components/StripePaymentForm.tsx`**
   - Add `PaymentRequestButtonElement` above card form
   - Implement availability check with `canMakePayment()`

2. **`apps/web/app/checkout/page.tsx`**
   - Already has Stripe Elements wrapper
   - Just add `<AppleGooglePayButton>` component

3. **Backend (no changes needed)**
   - Existing `create_checkout_session` Edge Function works as-is
   - Payment Request API uses same Payment Intent flow

**Estimated implementation time:** 30-45 minutes

## References

- **Stripe Payment Request Button:** https://stripe.com/docs/stripe-js/elements/payment-request-button
- **Apple Pay Integration:** https://stripe.com/docs/apple-pay
- **Google Pay Integration:** https://stripe.com/docs/google-pay
- **Testing:** https://stripe.com/docs/testing#apple-pay
