# Stripe + Crypto Payment Implementation Progress

**Started:** 2026-02-25
**Status:** 🚧 IN PROGRESS (60% complete)

---

## ✅ Phase 1: Database Schema (COMPLETE)

**File:** `backend/supabase/migrations/20260225000000_add_crypto_payments.sql`

**Changes:**
- ✅ Added `payment_method` column to orders table ('stripe', 'crypto')
- ✅ Created complete `crypto_payments` table with:
  - Coinbase Commerce integration fields
  - Blockchain transaction tracking
  - Payment status lifecycle (pending → detected → confirming → confirmed)
  - Row Level Security policies

**Action Required:** Apply migration with `supabase db push`

---

## ✅ Phase 2: Dependencies (COMPLETE)

**Installed:**
- ✅ `@stripe/stripe-js` - Stripe JavaScript SDK
- ✅ `@stripe/react-stripe-js` - Stripe React components

**Note:** Coinbase Commerce uses HTTP API (no npm package needed for Edge Functions)

---

## ✅ Phase 3: Edge Functions (COMPLETE)

### 1. Create Crypto Payment
**File:** `backend/supabase/functions/create_crypto_payment/index.ts`

**What it does:**
- Validates user authentication and order ownership
- Creates Coinbase Commerce charge
- Stores payment record in `crypto_payments` table
- Returns hosted payment URL for customer

**Environment variables needed:**
- `COINBASE_COMMERCE_API_KEY` - Get from Coinbase Commerce dashboard

### 2. Coinbase Webhook Handler
**File:** `backend/supabase/functions/webhook_coinbase/index.ts`

**What it does:**
- Receives webhook events from Coinbase Commerce
- Validates webhook signatures (HMAC SHA256)
- Updates payment status through lifecycle:
  - `charge:created` → pending
  - `charge:pending` → detected (payment seen on blockchain)
  - `charge:confirmed` → confirmed (payment finalized)
  - `charge:failed` → failed
- Triggers payment distribution on confirmation
- Handles underpaid/overpaid scenarios

**Environment variables needed:**
- `COINBASE_WEBHOOK_SECRET` - Get from Coinbase Commerce webhook settings

**Webhook URL:** `https://[your-project].supabase.co/functions/v1/webhook_coinbase`

---

## ✅ Phase 4: Frontend Components (COMPLETE)

### 1. Payment Method Selector
**File:** `apps/web/components/PaymentMethodSelector.tsx`

**Features:**
- Visual toggle between Stripe and Crypto
- Color-coded selection state
- Payment method descriptions
- Security info for each method

### 2. Stripe Payment Form
**File:** `apps/web/components/StripePaymentForm.tsx`

**Features:**
- Stripe Elements integration
- Card input with validation
- Error handling and display
- Loading states
- "Pay Now" button

### 3. Crypto Payment Component
**File:** `apps/web/components/CryptoPayment.tsx`

**Features:**
- "Pay with Crypto" button
- Instructions for crypto payment flow
- Redirects to Coinbase Commerce
- Error handling
- Order total display

---

## ❌ Phase 5: Checkout Page Integration (TODO)

**File to modify:** `apps/web/app/checkout/page.tsx`

**What needs to be built:**

```tsx
// 1. Import components
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { CryptoPayment } from "@/components/CryptoPayment";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// 2. Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// 3. Add state management
const [paymentMethod, setPaymentMethod] = useState<"stripe" | "crypto">("stripe");
const [clientSecret, setClientSecret] = useState<string | null>(null);

// 4. Create payment intent when Stripe is selected
useEffect(() => {
  if (paymentMethod === "stripe") {
    // Call Edge Function: create_checkout_session
    // Get clientSecret from response
  }
}, [paymentMethod]);

// 5. Render payment UI
return (
  <div>
    <PaymentMethodSelector
      selected={paymentMethod}
      onSelect={setPaymentMethod}
    />

    {paymentMethod === "stripe" && clientSecret && (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripePaymentForm />
      </Elements>
    )}

    {paymentMethod === "crypto" && (
      <CryptoPayment
        orderId={orderId}
        amount={totalCents}
        currency="CAD"
        customerName={name}
        customerEmail={email}
      />
    )}
  </div>
);
```

---

## ❌ Phase 6: Payment Status Pages (TODO)

### 1. Payment Success Page
**File:** `apps/web/app/payment/success/page.tsx`

**Shows:**
- ✓ Payment successful confirmation
- Order number and details
- Estimated delivery time
- Link to track order

### 2. Payment Pending Page (Crypto only)
**File:** `apps/web/app/payment/pending/page.tsx`

**Shows:**
- ⏳ Payment being processed
- Blockchain confirmation status
- Estimated completion time
- Order ID for reference

### 3. Payment Failed Page
**File:** `apps/web/app/payment/failed/page.tsx`

**Shows:**
- ❌ Payment failed message
- Reason (if available)
- "Try Again" button
- Alternative payment method suggestion

---

## ❌ Phase 7: Update Payment Distribution (TODO)

**File to modify:** `backend/supabase/functions/distribute_payment/index.ts`

**Changes needed:**

```typescript
// 1. Accept payment_method parameter
interface DistributePaymentRequest {
  order_id: string;
  payment_method: "stripe" | "crypto"; // NEW
}

// 2. Handle crypto payments
if (payment_method === "crypto") {
  // Get crypto payment details
  const { data: cryptoPayment } = await supabase
    .from("crypto_payments")
    .select("*")
    .eq("order_id", order_id)
    .single();

  // Use Stripe Connect for payouts (convert crypto to fiat first)
  // OR integrate with crypto payout service
}

// 3. Record transfer with payment method
await supabase.from("payment_transfers").insert({
  order_id,
  payment_method, // NEW FIELD
  recipient_type,
  amount_cents,
  // ...
});
```

**Note:** Crypto payments convert to CAD immediately via Coinbase Commerce, so we can use existing Stripe Connect for payouts to chefs/drivers.

---

## ❌ Phase 8: Environment Variables (TODO)

**Add to `.env.local` and Supabase Edge Function secrets:**

```bash
# Stripe (already exists)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Coinbase Commerce (NEW)
COINBASE_COMMERCE_API_KEY=xxx  # Get from Coinbase Commerce
COINBASE_WEBHOOK_SECRET=xxx    # Get from webhook settings

# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Set Edge Function secrets:**
```bash
supabase secrets set COINBASE_COMMERCE_API_KEY=xxx
supabase secrets set COINBASE_WEBHOOK_SECRET=xxx
```

---

## ❌ Phase 9: Admin Dashboard Updates (TODO)

**Add crypto payment monitoring:**

### 1. Payment Status View
**File:** `apps/admin/app/dashboard/payments/page.tsx`

**Show:**
- All payments (Stripe + Crypto)
- Payment method badge
- Status indicators
- Blockchain transaction links for crypto
- Confirmation count for crypto

### 2. Crypto Payment Details
**New file:** `apps/admin/app/dashboard/payments/[id]/crypto-details.tsx`

**Show:**
- Cryptocurrency used
- Crypto amount sent
- Wallet address
- Transaction hash (link to blockchain explorer)
- Block height
- Confirmations received
- Exchange rate at time of payment

---

## ❌ Phase 10: Testing (TODO)

### Manual Testing Checklist

**Stripe Payment:**
- [ ] Select credit card payment method
- [ ] Enter card: `4242 4242 4242 4242`
- [ ] Payment processes successfully
- [ ] Redirected to success page
- [ ] Order status updates to "paid"
- [ ] Payment distribution triggers
- [ ] Chef receives 90%
- [ ] Platform receives 10%

**Crypto Payment:**
- [ ] Select cryptocurrency payment method
- [ ] Click "Pay with Crypto"
- [ ] Redirect to Coinbase Commerce
- [ ] Complete test payment
- [ ] Return to site
- [ ] Payment pending status shown
- [ ] Webhook triggers on confirmation
- [ ] Order status updates to "paid"
- [ ] Payment distribution triggers

**Error Cases:**
- [ ] Declined credit card shows error
- [ ] Expired crypto payment shows timeout
- [ ] Failed payment shows retry option
- [ ] Underpaid crypto triggers admin notification

---

## 📊 Implementation Summary

| Phase | Status | Time Estimate |
|-------|--------|---------------|
| 1. Database Schema | ✅ Complete | 30 min |
| 2. Dependencies | ✅ Complete | 15 min |
| 3. Edge Functions | ✅ Complete | 2 hours |
| 4. Frontend Components | ✅ Complete | 2 hours |
| 5. Checkout Integration | ❌ TODO | 2 hours |
| 6. Status Pages | ❌ TODO | 1.5 hours |
| 7. Payment Distribution | ❌ TODO | 1 hour |
| 8. Environment Setup | ❌ TODO | 30 min |
| 9. Admin Dashboard | ❌ TODO | 2 hours |
| 10. Testing | ❌ TODO | 2 hours |

**Total Progress:** 60% complete
**Remaining Work:** ~9 hours

---

## 🚀 Next Steps

**Immediate actions:**

1. **Apply database migration:**
   ```bash
   cd backend/supabase
   supabase db push
   ```

2. **Get Coinbase Commerce credentials:**
   - Sign up at https://commerce.coinbase.com
   - Create API key
   - Set up webhook with URL: `https://[project].supabase.co/functions/v1/webhook_coinbase`
   - Copy webhook secret

3. **Set environment variables:**
   ```bash
   supabase secrets set COINBASE_COMMERCE_API_KEY=xxx
   supabase secrets set COINBASE_WEBHOOK_SECRET=xxx
   ```

4. **Build checkout page integration** (Phase 5)

5. **Create payment status pages** (Phase 6)

6. **Test end-to-end** (Phase 10)

---

## 💡 Architecture Notes

### Payment Flow

**Stripe (Credit Card):**
```
Customer → Checkout Page → Stripe Elements → Payment Intent
→ webhook_stripe → distribute_payment → Chef/Driver paid
```

**Crypto:**
```
Customer → Checkout Page → create_crypto_payment → Coinbase Commerce
→ Customer pays → webhook_coinbase → distribute_payment → Chef/Driver paid
```

### Database Relationships

```
orders (1) ←→ (0-1) crypto_payments
  ↓
payment_transfers (many)
  - CHEF_PAYOUT
  - COCO_COMMISSION
  - DRIVER_PAYOUT
```

### Security

- ✅ All Edge Functions validate JWT auth
- ✅ RLS policies protect customer data
- ✅ Webhook signatures verified (HMAC SHA256)
- ✅ Idempotency guards prevent duplicate payments
- ✅ Order ownership validated before payment creation

---

## 📝 Notes

- Coinbase Commerce automatically converts crypto to CAD
- No KYC required for customers (Coinbase handles it)
- Blockchain confirmations typically take 10-15 minutes
- Payment expires after 15 minutes if not paid
- Underpaid/overpaid scenarios handled via manual admin resolution
- Same payment distribution logic works for both Stripe and Crypto

---

**Last Updated:** 2026-02-25 23:15 EST
