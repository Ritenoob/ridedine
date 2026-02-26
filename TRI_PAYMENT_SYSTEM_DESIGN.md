# Tri-Payment System Design (Stripe + e-Transfer + Crypto)

**Created:** 2026-02-25
**Status:** Design Phase

## Overview

Support **three payment methods** in RidenDine:
1. **Credit/Debit Card** (Stripe) - Instant, automatic
2. **Interac e-Transfer** - Manual, 24-48h
3. **Cryptocurrency** - On-chain or instant (Lightning/stablecoin)

---

## Payment Method Comparison

| Feature | Stripe | e-Transfer | Crypto |
|---------|--------|------------|--------|
| **Speed** | Instant | 24-48h | Instant (Lightning) / 10-60min (on-chain) |
| **Confirmation** | Automatic | Manual admin | Automatic (blockchain) |
| **Fees** | 2.9% + 30¢ | Free | 0.5-2% (processor) or Gas fees |
| **Refunds** | Easy (API) | Manual | Complex (send back) |
| **Currencies** | CAD | CAD | USDT, USDC, BTC, ETH |
| **KYC Required** | No | No | Depends (some processors) |
| **Settlement** | 2-7 days | Instant to bank | Instant to wallet |
| **Risk** | Low (fraud protection) | Low | Medium (price volatility) |

---

## Crypto Payment Options

### Option 1: Crypto Payment Processors (Recommended)

Use a payment processor that handles crypto → fiat conversion:

**Popular Processors:**
1. **Coinbase Commerce** (Free, no KYC for customers)
   - Accepts: BTC, ETH, USDC, DAI, DOGE, LTC
   - Settlement: USD/CAD to bank account
   - Fees: 1% on conversions
   - Webhook support: Yes

2. **BitPay** (Enterprise)
   - Accepts: BTC, ETH, BCH, XRP, DOGE, 10+ others
   - Settlement: USD/CAD to bank, or keep crypto
   - Fees: 1% for settlements
   - Webhook support: Yes

3. **NOWPayments** (Low fees)
   - Accepts: 200+ cryptocurrencies
   - Settlement: Keep in crypto or convert
   - Fees: 0.5% for custody, variable for settlements
   - Webhook support: Yes

4. **CoinGate** (EU/Global)
   - Accepts: 70+ cryptocurrencies
   - Settlement: EUR/USD/BTC
   - Fees: 1% + network fees
   - Webhook support: Yes

**Recommendation:** Start with **Coinbase Commerce**
- ✅ Free for basic use
- ✅ Easy integration
- ✅ No customer KYC
- ✅ Settles to CAD
- ✅ Good reputation
- ✅ Simple API

### Option 2: Direct Wallet (Advanced)

Accept crypto directly to your wallet (no processor):

**Pros:**
- No processor fees (only network fees)
- Full control of funds
- No intermediary

**Cons:**
- Must monitor blockchain manually
- Handle price volatility yourself
- Complex refunds
- More security responsibility
- Requires crypto knowledge

**Not recommended for MVP** - too complex.

---

## User Flow: Crypto Payment

### Flow 1: Coinbase Commerce (Recommended)

```
Customer Checkout:
┌────────────────────────────────────┐
│ 1. Select Payment Method           │
│    ○ Credit/Debit Card             │
│    ○ e-Transfer                    │
│    ○ Cryptocurrency ✓              │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 2. Crypto Checkout                 │
│                                     │
│ Order Total: $25.00 CAD            │
│                                     │
│ Select Cryptocurrency:             │
│ [ Bitcoin (BTC) ]                  │
│ [ Ethereum (ETH) ]                 │
│ [ USD Coin (USDC) ] ← Recommended  │
│ [ Other... ]                       │
│                                     │
│ [Continue to Payment]              │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 3. Coinbase Commerce Payment Page  │
│    (Redirect or Embedded)           │
│                                     │
│ Pay: 25.34 USDC                    │
│ (≈ $25.00 CAD)                     │
│                                     │
│ 📱 Scan QR Code                    │
│ [QR Code]                          │
│                                     │
│ OR                                 │
│                                     │
│ 📋 Send to Address:                │
│ 0x742d35Cc6634C0532925a3b844Bc... │
│ [Copy Address]                     │
│                                     │
│ Waiting for payment... ⏳           │
│ Expires in: 14:58                  │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 4. Customer Sends Crypto           │
│    (MetaMask, Trust Wallet, etc.)  │
└────────────────────────────────────┘
              ↓ (10 seconds - 60 min)
┌────────────────────────────────────┐
│ 5. Blockchain Confirmation         │
│    Pending... (1/3 confirmations)  │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 6. Payment Confirmed! ✅            │
│    Order #abc123 confirmed         │
│    Chef preparing your meal        │
│                                     │
│    [View Order Status]             │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ Backend: Webhook Fires              │
│ - charge:confirmed (Coinbase)       │
│ - Updates order: payment_status=paid│
│ - Triggers distribute_payment       │
│ - Chef/CoCo/Driver get paid         │
└────────────────────────────────────┘
```

**Timing:**
- **USDC/USDT (stablecoins):** ~30 seconds
- **Bitcoin:** 10-60 minutes (6 confirmations)
- **Ethereum:** 1-5 minutes (12 confirmations)
- **Lightning Network (BTC):** Instant (<1 second)

---

## Database Schema Changes

### 1. Add crypto payment method

```sql
-- Update orders table
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('stripe', 'e_transfer', 'crypto'));
```

### 2. Create crypto_payments table

```sql
CREATE TABLE crypto_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Processor info
  processor VARCHAR(50) NOT NULL, -- 'coinbase_commerce', 'bitpay', 'nowpayments'
  processor_payment_id VARCHAR(255) NOT NULL, -- External payment ID
  hosted_url TEXT, -- Link to payment page

  -- Payment details
  cryptocurrency VARCHAR(20) NOT NULL, -- 'BTC', 'ETH', 'USDC', etc.
  crypto_amount VARCHAR(100) NOT NULL, -- "0.00087" BTC or "25.34" USDC
  fiat_amount_cents INTEGER NOT NULL, -- Amount in CAD cents
  fiat_currency VARCHAR(3) DEFAULT 'CAD',

  -- Exchange rate at time of payment
  exchange_rate_crypto_to_fiat DECIMAL(20, 8),

  -- Blockchain details
  wallet_address VARCHAR(255), -- Receiving address
  transaction_hash VARCHAR(255), -- On-chain tx hash
  confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 1,

  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',        -- Waiting for payment
      'detected',       -- Payment seen on blockchain (0 confirmations)
      'confirming',     -- Waiting for confirmations
      'confirmed',      -- Fully confirmed
      'overpaid',       -- Paid more than required
      'underpaid',      -- Paid less than required
      'expired',        -- Payment window expired
      'cancelled',      -- Customer cancelled
      'failed'          -- Payment failed
    )),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '15 minutes',
  detected_at TIMESTAMP WITH TIME ZONE, -- First seen on blockchain
  confirmed_at TIMESTAMP WITH TIME ZONE, -- Fully confirmed

  -- Metadata
  metadata JSONB,

  UNIQUE(order_id),
  UNIQUE(processor_payment_id)
);

CREATE INDEX idx_crypto_status ON crypto_payments(status);
CREATE INDEX idx_crypto_order ON crypto_payments(order_id);
CREATE INDEX idx_crypto_processor_id ON crypto_payments(processor_payment_id);
CREATE INDEX idx_crypto_tx_hash ON crypto_payments(transaction_hash);
```

### 3. RLS Policies

```sql
-- Customers can view their own crypto payments
CREATE POLICY "Users can view own crypto payments"
  ON crypto_payments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- Admins can view all crypto payments
CREATE POLICY "Admins can view all crypto payments"
  ON crypto_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Backend Implementation

### 1. Edge Function: create_crypto_payment

**Path:** `backend/supabase/functions/create_crypto_payment/index.ts`

```typescript
import Stripe from "stripe";
import { CoinbaseCommerceClient, Charge } from "coinbase-commerce-node";

POST /functions/v1/create_crypto_payment

Headers: {
  Authorization: Bearer <user_token>
}

Body: {
  order_id: string;
}

Response: {
  payment_id: string;
  processor: string;
  hosted_url: string; // Redirect user here
  expires_at: string;
  supported_currencies: string[]; // ['BTC', 'ETH', 'USDC', ...]
}
```

**Implementation (Coinbase Commerce):**

```typescript
const Client = CoinbaseCommerceClient.init(process.env.COINBASE_API_KEY);

// Fetch order
const { data: order } = await supabase
  .from("orders")
  .select("*")
  .eq("id", orderId)
  .single();

// Create Coinbase Commerce charge
const charge = await Client.charge.create({
  name: `RidenDine Order #${order.id.slice(0, 8)}`,
  description: `Food order from RidenDine`,
  pricing_type: "fixed_price",
  local_price: {
    amount: (order.total_cents / 100).toFixed(2),
    currency: "CAD",
  },
  metadata: {
    order_id: order.id,
    customer_id: order.customer_id,
  },
  redirect_url: `${baseUrl}/orders/${order.id}/success`,
  cancel_url: `${baseUrl}/orders/${order.id}/cancel`,
});

// Save to database
await supabase.from("crypto_payments").insert({
  order_id: order.id,
  processor: "coinbase_commerce",
  processor_payment_id: charge.id,
  hosted_url: charge.hosted_url,
  cryptocurrency: "MULTI", // Coinbase allows customer to choose
  crypto_amount: "0", // Will be set when customer selects currency
  fiat_amount_cents: order.total_cents,
  fiat_currency: "CAD",
  expires_at: charge.expires_at,
  status: "pending",
  metadata: charge,
});

// Update order
await supabase
  .from("orders")
  .update({
    payment_method: "crypto",
    payment_status: "pending",
  })
  .eq("id", order.id);

return {
  payment_id: charge.id,
  processor: "coinbase_commerce",
  hosted_url: charge.hosted_url,
  expires_at: charge.expires_at,
  supported_currencies: ["BTC", "ETH", "USDC", "DAI"],
};
```

### 2. Webhook Handler: coinbase_commerce_webhook

**Path:** `backend/supabase/functions/webhook_coinbase/index.ts`

```typescript
POST /functions/v1/webhook_coinbase

Headers: {
  X-CC-Webhook-Signature: <signature>
}

Body: {
  event: {
    type: string; // 'charge:confirmed', 'charge:failed', etc.
    data: {
      id: string;
      code: string;
      pricing: {...};
      payments: [...];
      timeline: [...];
    }
  }
}
```

**Webhook Events:**

| Event | Action |
|-------|--------|
| `charge:created` | Payment created (ignore) |
| `charge:pending` | Payment detected (0 confirmations) |
| `charge:confirmed` | ✅ Payment confirmed → distribute! |
| `charge:failed` | ❌ Payment failed → cancel order |
| `charge:delayed` | ⏳ Taking longer than expected |

**Implementation:**

```typescript
import { Webhook } from "coinbase-commerce-node";

// Verify webhook signature
const isValid = Webhook.verifySigHeader(
  rawBody,
  signature,
  process.env.COINBASE_WEBHOOK_SECRET
);

if (!isValid) {
  return new Response("Invalid signature", { status: 401 });
}

const { event } = await req.json();

switch (event.type) {
  case "charge:confirmed": {
    // Update crypto_payments
    await supabase
      .from("crypto_payments")
      .update({
        status: "confirmed",
        transaction_hash: event.data.payments[0].transaction_id,
        confirmations: event.data.payments[0].confirmations,
        confirmed_at: new Date().toISOString(),
        metadata: event.data,
      })
      .eq("processor_payment_id", event.data.id);

    // Update order
    const { data: payment } = await supabase
      .from("crypto_payments")
      .select("order_id")
      .eq("processor_payment_id", event.data.id)
      .single();

    await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", payment.order_id);

    // 🚀 Trigger payment distribution
    await fetch(`${supabaseUrl}/functions/v1/distribute_payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        order_id: payment.order_id,
      }),
    });

    break;
  }

  case "charge:failed": {
    // Cancel order
    await supabase.from("crypto_payments").update({
      status: "failed",
    }).eq("processor_payment_id", event.data.id);

    // ...
    break;
  }
}
```

### 3. Modified: distribute_payment

**Add crypto support** (same as e-Transfer - no source_transaction):

```typescript
interface DistributePaymentRequest {
  payment_intent_id?: string; // Stripe
  order_id?: string; // e-Transfer OR crypto
}

// If order_id provided:
// 1. Check order.payment_method
// 2. If 'crypto': fetch crypto_payments table
// 3. No source_transaction (transfer from platform balance)
// 4. Execute same 3-way split
```

---

## Frontend Implementation

### 1. Payment Method Selector (Updated)

```tsx
// apps/web/components/PaymentMethodSelector.tsx

<div className="payment-methods">
  {/* Stripe */}
  <label className="payment-option">
    <input type="radio" name="payment" value="stripe" />
    <div className="payment-card">
      <div className="icon">💳</div>
      <div className="details">
        <h3>Credit/Debit Card</h3>
        <p>Instant confirmation • 2.9% + 30¢ fee</p>
      </div>
    </div>
  </label>

  {/* e-Transfer */}
  <label className="payment-option">
    <input type="radio" name="payment" value="e_transfer" />
    <div className="payment-card">
      <div className="icon">🏦</div>
      <div className="details">
        <h3>Interac e-Transfer</h3>
        <p>Free • 24-48h confirmation</p>
      </div>
    </div>
  </label>

  {/* Crypto */}
  <label className="payment-option">
    <input type="radio" name="payment" value="crypto" />
    <div className="payment-card">
      <div className="icon">₿</div>
      <div className="details">
        <h3>Cryptocurrency</h3>
        <p>Instant • BTC, ETH, USDC • Low fees</p>
        <span className="badge">Recommended for speed</span>
      </div>
    </div>
  </label>
</div>
```

### 2. Crypto Payment Component

```tsx
// apps/web/components/CryptoPayment.tsx

interface CryptoPaymentProps {
  orderId: string;
  amount: number;
}

export function CryptoPayment({ orderId, amount }: CryptoPaymentProps) {
  const [loading, setLoading] = useState(false);

  const initiateCryptoPayment = async () => {
    setLoading(true);

    // Call edge function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create_crypto_payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      }
    );

    const data = await response.json();

    // Redirect to Coinbase Commerce
    window.location.href = data.hosted_url;
  };

  return (
    <div className="crypto-payment">
      <h3>Pay with Cryptocurrency</h3>

      <div className="amount">
        <strong>${amount.toFixed(2)} CAD</strong>
      </div>

      <div className="supported-currencies">
        <span className="badge">Bitcoin</span>
        <span className="badge">Ethereum</span>
        <span className="badge">USDC</span>
        <span className="badge">+more</span>
      </div>

      <p className="info">
        ⚡ Instant with stablecoins (USDC)
        <br />
        🔒 Secure blockchain payment
        <br />
        📱 Use any crypto wallet
      </p>

      <button
        onClick={initiateCryptoPayment}
        disabled={loading}
        className="btn btn-primary btn-lg"
      >
        {loading ? "Redirecting..." : "Pay with Crypto"}
      </button>

      <p className="fine-print">
        You'll be redirected to Coinbase Commerce to complete payment
      </p>
    </div>
  );
}
```

### 3. Crypto Payment Status Page

```tsx
// apps/web/app/orders/[orderId]/crypto-pending/page.tsx

export default function CryptoPendingPage() {
  const [status, setStatus] = useState<"pending" | "confirming" | "confirmed">(
    "pending"
  );

  useEffect(() => {
    // Poll for payment status
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("crypto_payments")
        .select("status")
        .eq("order_id", orderId)
        .single();

      if (data?.status === "confirming") setStatus("confirming");
      if (data?.status === "confirmed") {
        setStatus("confirmed");
        router.push(`/orders/${orderId}/success`);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="crypto-status">
      {status === "pending" && (
        <>
          <div className="spinner">⏳</div>
          <h2>Waiting for Payment</h2>
          <p>Complete payment in your crypto wallet</p>
          <p className="expires">Expires in 14:58</p>
        </>
      )}

      {status === "confirming" && (
        <>
          <div className="spinner">🔄</div>
          <h2>Payment Detected!</h2>
          <p>Waiting for blockchain confirmation...</p>
          <p className="confirmations">2 of 3 confirmations</p>
        </>
      )}
    </div>
  );
}
```

---

## Admin Dashboard

### Crypto Payments Monitor

**Route:** `/dashboard/payments/crypto`

```
┌──────────────────────────────────────────────────────────┐
│ Cryptocurrency Payments                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ⏳ Pending (2)  |  🔄 Confirming (1)  |  ✅ Confirmed (45)│
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🔄 Confirming                                       ││
│ │ Order #abc123                      25.34 USDC       ││
│ │ 2 of 3 confirmations                               ││
│ │ TX: 0x7d3a4b...                   [View on Etherscan]│
│ │ Detected 2 minutes ago                             ││
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ⏳ Pending                                          ││
│ │ Order #def456                      0.00087 BTC      ││
│ │ Waiting for payment                                ││
│ │ Expires in 12:34                                   ││
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Setup & Research (1 hour)
- [ ] Sign up for Coinbase Commerce account
- [ ] Get API keys (production & test)
- [ ] Set up webhook endpoint URL
- [ ] Test Coinbase Commerce UI manually
- [ ] Review Coinbase Commerce docs

### Phase 2: Database (1 hour)
- [ ] Create migration: add 'crypto' to payment_method enum
- [ ] Create migration: crypto_payments table with RLS
- [ ] Test: Can create crypto payment records
- [ ] Test: RLS policies work correctly

### Phase 3: Backend (3-4 hours)
- [ ] Install coinbase-commerce-node SDK
- [ ] Create edge function: create_crypto_payment
- [ ] Create edge function: webhook_coinbase
- [ ] Modify distribute_payment: support crypto
- [ ] Test: Create charge via API
- [ ] Test: Webhook receives events
- [ ] Test: Payment confirmation triggers distribution

### Phase 4: Frontend (3-4 hours)
- [ ] Update PaymentMethodSelector: add crypto option
- [ ] Create CryptoPayment component
- [ ] Create crypto-pending status page
- [ ] Update checkout page: integrate crypto flow
- [ ] Test: Customer can select crypto
- [ ] Test: Redirects to Coinbase Commerce
- [ ] Test: Returns to success page

### Phase 5: Admin UI (2 hours)
- [ ] Create /dashboard/payments/crypto page
- [ ] Show pending, confirming, confirmed payments
- [ ] Display transaction hashes with blockchain explorer links
- [ ] Test: Admin can monitor crypto payments

### Phase 6: Testing & Documentation (2 hours)
- [ ] E2E test: Full crypto payment flow (testnet)
- [ ] E2E test: Webhook confirmation
- [ ] E2E test: Payment distribution
- [ ] Documentation: User guide for crypto payments
- [ ] Documentation: Admin guide for monitoring

---

## Total Time Estimate

**12-15 hours** for crypto payment integration

**Breakdown:**
- Setup: 1 hour
- Database: 1 hour
- Backend: 3-4 hours
- Frontend: 3-4 hours
- Admin UI: 2 hours
- Testing: 2 hours

**Combined with e-Transfer:** 25-35 hours total

---

## Recommended Approach

### Option A: All Three (Full System)
Build Stripe + e-Transfer + Crypto simultaneously

**Time:** 25-35 hours
**Pros:** Complete payment solution
**Cons:** Long development time

### Option B: Stripe + Crypto (Skip e-Transfer)
Start with instant payment methods only

**Time:** 18-22 hours
**Pros:** Both instant, automated
**Cons:** No free option for Canadians

### Option C: Stripe First, Add Later
Build Stripe → Launch → Add e-Transfer → Add Crypto

**Time:** Phase 1: 6-8h, Phase 2: +10h, Phase 3: +12h
**Pros:** Faster to market, iterate based on demand
**Cons:** Multiple deployment cycles

### Option D: Phased by Popularity
Build Stripe → Crypto → e-Transfer

**Time:** Same as Option C, different order
**Pros:** Prioritize automated methods
**Cons:** Canadians without crypto wait longer

---

## My Recommendation

**Option C: Stripe First, Then Add Others**

**Reasoning:**
1. **Fastest to market** - Get payments working ASAP (6-8 hours)
2. **Test with real users** - See which payment methods they want
3. **Iterate based on demand** - If users ask for crypto, add it
4. **Lower risk** - Test distribution system with one method first
5. **Easier debugging** - Fewer variables during initial launch

**Timeline:**
- **Week 1:** Stripe only (launch)
- **Week 2:** Monitor user requests
- **Week 3:** Add most-requested method (crypto or e-Transfer)
- **Week 4:** Add third method if needed

---

## Security & Compliance

### Crypto-Specific Considerations

1. **Price Volatility**
   - Use stablecoins (USDC, USDT) when possible
   - Lock price for 15 minutes (Coinbase handles this)
   - Display crypto amount + CAD equivalent

2. **Overpayment/Underpayment**
   - Coinbase handles overpayment refunds
   - Underpayment: Auto-refund or contact customer

3. **Chargebacks**
   - Good news: Crypto has NO chargebacks!
   - Bad news: No refund protection for customer
   - Solution: Good customer service

4. **Tax Reporting**
   - Crypto payments = taxable income
   - Coinbase provides transaction reports
   - Consult accountant for crypto tax rules

5. **Regulations**
   - Check local crypto payment laws
   - No special license needed for <$100k/month
   - Coinbase handles KYC/AML compliance

---

## Quick Start Guide (Crypto Only - 12h)

If you want to start with just crypto payments:

### Day 1 (6 hours)
1. Sign up for Coinbase Commerce (30 min)
2. Build backend: create_crypto_payment + webhook (3h)
3. Test backend with Coinbase test mode (30 min)
4. Build database migrations (1h)
5. Test end-to-end backend flow (1h)

### Day 2 (6 hours)
1. Build frontend: Payment selector (1h)
2. Build frontend: Crypto payment component (2h)
3. Build frontend: Status/pending page (1h)
4. Build admin: Crypto payment monitor (1h)
5. E2E testing + documentation (1h)

### Launch
- Deploy to production
- Switch to live Coinbase API keys
- Monitor first few transactions closely
- Iterate based on user feedback

---

## Next Steps

**What would you like to do?**

**Option A:** Build all three payment methods (25-35 hours)
**Option B:** Start with Stripe, add others later (phased approach)
**Option C:** Build Stripe + Crypto only (skip e-Transfer)
**Option D:** Build Crypto only (fastest, 12 hours)

Which approach fits your timeline and priorities?
