# RideNDine Payment Demo Guide

## Overview

RideNDine supports both demo payments (for testing) and real Stripe payments. The system automatically detects which mode to use based on environment configuration.

## Payment Modes

### Demo Mode (Default)
When `DEMO_MODE=true` OR Stripe keys are not configured:
- Payments succeed automatically
- No actual charges occur
- Orders are created immediately with "paid" status
- Returns mock payment IDs with "demo_" prefix

### Live Mode
When `DEMO_MODE=false` AND Stripe keys are configured:
- Real Stripe payment intents created
- Actual card charges occur
- Full Stripe checkout flow
- Webhook handling for payment confirmation

## Configuration

### Environment Variables

```bash
# Demo mode (bypasses Stripe)
DEMO_MODE=true

# Stripe keys (required for live payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend Configuration

In `/docs/config.js`:
```javascript
window.__RIDENDINE_CONFIG__ = {
  apiBaseUrl: "https://ridendine-demo.onrender.com"
};
```

The frontend automatically fetches Stripe publishable key from `/api/config`.

## API Endpoints

### Create Payment Intent
```bash
POST /api/payments/create-intent
Content-Type: application/json

{
  "items": [
    {
      "name": "Pho Bo",
      "price": 12.99,
      "quantity": 1
    }
  ],
  "amount": 14.68,
  "chefId": "store_hoang_gia_pho",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St"
  }
}
```

**Demo Mode Response:**
```json
{
  "status": "succeeded",
  "paymentId": "demo_1770763812758_tgdh3ss69",
  "orderId": "RD-MLH71YFQ48ABJ",
  "demoMode": true,
  "message": "Demo payment succeeded automatically"
}
```

**Live Mode Response:**
```json
{
  "clientSecret": "pi_3ABC..._secret_XYZ",
  "paymentId": "pi_3ABC123",
  "orderId": "RD-MLH71YFQ48ABJ"
}
```

### Create Checkout Session (Legacy)
```bash
POST /api/payments/create-checkout-session
Content-Type: application/json

{
  "items": [...],
  "chefId": "store_hoang_gia_pho",
  "customerInfo": {...}
}
```

**Demo Mode:**
- Returns mock session with auto-redirect to success page
- Order created immediately with "paid" status

**Live Mode:**
- Creates Stripe checkout session
- Returns URL for hosted checkout page
- Order created in "pending" status

### Verify Payment
```bash
GET /api/payments/verify/:sessionId
```

Returns order and payment status.

### Stripe Webhook
```bash
POST /api/payments/webhook
Stripe-Signature: t=...,v1=...

{
  "type": "checkout.session.completed",
  "data": {
    "object": {...}
  }
}
```

Handles Stripe events to update order status.

## Frontend Integration

### Payment Flow

1. **Add items to cart**
2. **Proceed to checkout**
3. **Call create-intent**
4. **Handle response:**
   - **Demo mode**: Show success immediately, redirect to dashboard
   - **Live mode**: Use Stripe.js to confirm payment

### Example Frontend Code

```javascript
async function processPayment(items, total, customerInfo) {
  try {
    // Create payment intent
    const response = await window.apiFetch('/api/payments/create-intent', {
      method: 'POST',
      body: {
        items,
        amount: total,
        customerInfo
      }
    });

    const data = await response.json();

    if (data.demoMode) {
      // Demo mode - instant success
      window.showToast('✅ Demo payment successful!', 'success');
      
      // Store payment info
      localStorage.setItem('paid', 'true');
      localStorage.setItem('orderId', data.orderId);
      localStorage.setItem('paymentId', data.paymentId);
      
      // Redirect to dashboard
      setTimeout(() => {
        navigateTo('/admin');
      }, 1500);
    } else {
      // Live mode - use Stripe
      const stripe = Stripe(stripePublishableKey);
      
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email
          }
        }
      });

      if (result.error) {
        window.showToast('⚠️ Payment failed: ' + result.error.message, 'error');
      } else {
        window.showToast('✅ Payment successful!', 'success');
        localStorage.setItem('paid', 'true');
        localStorage.setItem('orderId', data.orderId);
        navigateTo('/admin');
      }
    }
  } catch (error) {
    console.error('Payment error:', error);
    window.showToast('⚠️ Payment failed', 'error');
  }
}
```

### Success Redirect

After successful payment:
```javascript
// Store payment status
localStorage.setItem('paid', 'true');
localStorage.setItem('orderId', data.orderId);

// Redirect to admin dashboard
navigateTo('/admin');

// Or redirect to order tracking
navigateTo(`/order-tracking?id=${data.orderId}`);
```

## Testing

### Demo Mode Testing

1. Set `DEMO_MODE=true`
2. Any payment request succeeds automatically
3. No Stripe keys required
4. Perfect for development and demos

```bash
# Test payment
curl -X POST http://localhost:8080/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"name": "Test", "price": 10, "quantity": 1}],
    "amount": 10
  }'
```

### Stripe Test Mode

1. Set `DEMO_MODE=false`
2. Use Stripe test keys from dashboard
3. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires 3D Secure: `4000 0025 0000 3155`

### Webhook Testing

Use Stripe CLI for local webhook testing:
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:8080/api/payments/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## Security Considerations

### Demo Mode
- ✅ Safe for public demos
- ✅ No actual charges
- ⚠️ Should not be used in production
- ⚠️ Orders created without real payment

### Live Mode
- ✅ Real payment processing
- ✅ Stripe security standards (PCI DSS Level 1)
- ⚠️ Requires webhook endpoint to be publicly accessible
- ⚠️ Must verify webhook signatures

## Troubleshooting

### "Payment failed" in demo mode
- Check that `DEMO_MODE=true` is set
- Verify API endpoint is reachable
- Check browser console for errors

### Stripe initialization failed
- Verify `STRIPE_PUBLISHABLE_KEY` is set in environment
- Check `/api/config` returns publishable key
- Ensure using correct environment (test vs. live)

### Webhook not working
- Verify webhook URL is publicly accessible
- Check Stripe webhook secret is correct
- Use Stripe dashboard to view webhook delivery attempts
- Check server logs for webhook errors

### Order not created
- Check API response for errors
- Verify all required fields are provided
- Check server logs for creation errors

## Best Practices

1. **Use demo mode for development** - Fast, no setup required
2. **Test with Stripe test mode** - Before going live
3. **Handle errors gracefully** - Show user-friendly messages
4. **Store order ID** - For tracking and customer service
5. **Redirect after success** - Clear UX flow
6. **Verify webhooks** - Don't trust client-side only
7. **Log all transactions** - For debugging and auditing

## Payment Success Flow

```
Customer                 Frontend                Backend              Stripe
   │                        │                       │                   │
   │──Add to cart───────────│                       │                   │
   │                        │                       │                   │
   │──Checkout──────────────│                       │                   │
   │                        │                       │                   │
   │                        │──Create intent────────│                   │
   │                        │                       │                   │
   │                        │                       │──(if live)────────│
   │                        │                       │                   │
   │                        │◄──Response────────────│                   │
   │                        │                       │                   │
   │                        │──(if live) Confirm────────────────────────│
   │                        │                       │                   │
   │                        │◄──Success─────────────────────────────────│
   │                        │                       │                   │
   │                        │                       │◄──Webhook─────────│
   │                        │                       │                   │
   │◄──Success message──────│                       │                   │
   │                        │                       │                   │
   │──Redirect to /admin────│                       │                   │
```

## Integration Checklist

- [x] Backend payments route supports demo mode
- [x] `/api/payments/create-intent` endpoint created
- [x] Auto-creates order with "paid" status in demo mode
- [x] Returns mock payment ID in demo mode
- [ ] Frontend checkout page integrated
- [ ] Stripe.js loaded conditionally (live mode only)
- [ ] Success redirect to dashboard implemented
- [ ] Order ID stored in localStorage
- [ ] Customer tracking page shows payment status
- [ ] Error handling for all payment scenarios

## Next Steps

1. Implement checkout UI in `/docs/pages/checkout.html`
2. Add Stripe.js integration for live mode
3. Create order tracking page
4. Add payment receipt display
5. Implement refund handling (admin only)
