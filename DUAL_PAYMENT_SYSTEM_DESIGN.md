# Dual Payment System Design (Stripe + e-Transfer)

**Created:** 2026-02-25
**Status:** Design Phase

## Overview

Support two payment methods in RidenDine:
1. **Credit/Debit Card** (Stripe) - Instant, automatic distribution
2. **Interac e-Transfer** - Manual, pending confirmation

---

## Payment Method Comparison

| Feature | Stripe Credit Card | e-Transfer |
|---------|-------------------|------------|
| **Processing** | Instant | Manual (24-48h) |
| **Confirmation** | Automatic | Admin verifies |
| **Distribution** | Immediate (webhook) | After confirmation |
| **Customer Flow** | Enter card → Pay → Done | Select e-Transfer → Get instructions → Send via bank → Wait |
| **Order Status** | Confirmed immediately | Pending until verified |
| **Fees** | 2.9% + 30¢ (Stripe) | Free |
| **Refunds** | Automatic (Stripe API) | Manual (send e-Transfer back) |

---

## User Flows

### Flow 1: Credit Card Payment (Stripe)

```
Customer Checkout:
┌────────────────────────────────────┐
│ 1. Select Payment Method           │
│    ○ Credit/Debit Card             │
│    ○ e-Transfer                    │
└────────────────────────────────────┘
              ↓ (selects Card)
┌────────────────────────────────────┐
│ 2. Enter Card Details              │
│    Card Number: [4242 4242...]     │
│    Expiry: [12/25]                 │
│    CVC: [123]                      │
│    Postal Code: [M5V 3A8]          │
│                                     │
│    [Pay $25.00]                    │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 3. Processing...                   │
│    (Stripe confirms payment)        │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 4. Payment Successful! ✅           │
│    Order Confirmed                 │
│    Order #abc123                   │
│    Chef preparing your meal        │
│                                     │
│    [View Order Status]             │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ Backend: Webhook Fires              │
│ - payment_intent.succeeded          │
│ - Updates order: payment_status=paid│
│ - Triggers distribute_payment       │
│ - Chef/CoCo/Driver get paid         │
└────────────────────────────────────┘
```

### Flow 2: e-Transfer Payment

```
Customer Checkout:
┌────────────────────────────────────┐
│ 1. Select Payment Method           │
│    ○ Credit/Debit Card             │
│    ○ e-Transfer ✓                  │
└────────────────────────────────────┘
              ↓ (selects e-Transfer)
┌────────────────────────────────────┐
│ 2. e-Transfer Instructions         │
│                                     │
│ 📧 Send e-Transfer to:             │
│    payments@ridendine.com          │
│                                     │
│ 💰 Amount: $25.00 CAD              │
│                                     │
│ 📝 Security Question:              │
│    "Order number?"                 │
│                                     │
│ 📌 Answer: abc123                  │
│                                     │
│ ⚠️ Important:                      │
│ - Include order #abc123 in message│
│ - Payment must be received within  │
│   24 hours or order will cancel    │
│                                     │
│ [I've Sent the e-Transfer]         │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 3. Payment Pending ⏳               │
│    Order #abc123                   │
│                                     │
│    Waiting for payment confirmation│
│    We'll email you when received   │
│                                     │
│    Expected: Within 24 hours       │
│                                     │
│    [View Order Status]             │
└────────────────────────────────────┘
              ↓ (24-48h later)
┌────────────────────────────────────┐
│ Admin Verifies:                    │
│ - Checks email for e-Transfer      │
│ - Confirms amount matches          │
│ - Clicks "Confirm Payment"         │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ 4. Payment Confirmed! ✅            │
│    (Email sent to customer)        │
│    Order confirmed                 │
│    Chef preparing your meal        │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│ Backend: Payment Confirmed          │
│ - Updates order: payment_status=paid│
│ - Triggers distribute_payment       │
│ - Chef/CoCo/Driver get paid         │
└────────────────────────────────────┘
```

---

## Database Schema Changes

### 1. Add payment method to orders table

```sql
ALTER TABLE orders
ADD COLUMN payment_method VARCHAR(20) DEFAULT 'stripe'
  CHECK (payment_method IN ('stripe', 'e_transfer'));

-- New payment statuses for e-transfer
-- Current: 'unpaid', 'paid', 'failed'
-- Add: 'pending_transfer', 'transfer_received', 'transfer_expired'
```

### 2. Create e_transfer_payments table

```sql
CREATE TABLE e_transfer_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- e-Transfer details
  amount_cents INTEGER NOT NULL,
  recipient_email VARCHAR(255) NOT NULL, -- payments@ridendine.com
  security_question TEXT,
  security_answer TEXT,

  -- Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'received', 'confirmed', 'expired', 'cancelled')),
  sender_email VARCHAR(255), -- customer's email used for transfer
  sender_name VARCHAR(255),
  reference_number VARCHAR(100), -- e-Transfer ref number

  -- Verification
  verified_by UUID REFERENCES profiles(id), -- admin who verified
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  received_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(order_id)
);

CREATE INDEX idx_etransfer_status ON e_transfer_payments(status);
CREATE INDEX idx_etransfer_order ON e_transfer_payments(order_id);
CREATE INDEX idx_etransfer_expires ON e_transfer_payments(expires_at);
```

### 3. Add RLS policies

```sql
-- Customers can view their own e-transfer payments
CREATE POLICY "Users can view own e-transfer"
  ON e_transfer_payments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- Admins can view and update all e-transfer payments
CREATE POLICY "Admins can manage e-transfers"
  ON e_transfer_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Frontend Components

### 1. Payment Method Selection

**Component:** `apps/web/components/PaymentMethodSelector.tsx`

```typescript
interface PaymentMethodSelectorProps {
  onSelect: (method: 'stripe' | 'e_transfer') => void;
  selected: 'stripe' | 'e_transfer';
}

// UI:
// ┌─────────────────────────────────┐
// │ Select Payment Method           │
// ├─────────────────────────────────┤
// │ ○ Credit/Debit Card             │
// │   Instant confirmation          │
// │   2.9% + 30¢ fee                │
// │                                 │
// │ ○ Interac e-Transfer            │
// │   Free, 24-48h confirmation     │
// │   Bank transfer required        │
// └─────────────────────────────────┘
```

### 2. Stripe Payment Form

**Component:** `apps/web/components/StripePaymentForm.tsx`

Uses `@stripe/react-stripe-js` with Stripe Elements.

### 3. e-Transfer Instructions

**Component:** `apps/web/components/ETransferInstructions.tsx`

```typescript
interface ETransferInstructionsProps {
  orderId: string;
  amount: number;
  recipientEmail: string;
  securityQuestion: string;
  securityAnswer: string;
}

// Shows:
// - Email to send to
// - Amount in CAD
// - Security Q&A
// - Expiry time (24h countdown)
// - "I've sent it" button
```

### 4. Payment Pending Status

**Component:** `apps/web/components/PaymentPendingCard.tsx`

Shows order with pending e-Transfer, countdown timer, instructions to check email.

---

## Admin Interface

### Admin Dashboard: Pending e-Transfers

**Route:** `/dashboard/payments/pending`

```
┌──────────────────────────────────────────────────────────┐
│ Pending e-Transfer Payments                              │
├──────────────────────────────────────────────────────────┤
│ 🔔 3 payments waiting for confirmation                   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Order #abc123                      $25.00    ⏰ 18h││
│ │ Customer: John Doe (john@email.com)               ││
│ │ Recipient: payments@ridendine.com                 ││
│ │ Security: "Order number?" → "abc123"              ││
│ │ Sent: 2 hours ago                                 ││
│ │                                                    ││
│ │ [Mark as Received] [Confirm Payment] [Cancel]     ││
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Order #def456                      $32.00    ⏰ 22h││
│ │ Customer: Jane Smith                              ││
│ │ ...                                                ││
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Actions:**
1. **Mark as Received** - e-Transfer seen in email, waiting to accept
2. **Confirm Payment** - e-Transfer accepted, trigger distribution
3. **Cancel** - Invalid/expired transfer

### Payment Confirmation Modal

```
┌────────────────────────────────────┐
│ Confirm e-Transfer Payment         │
├────────────────────────────────────┤
│ Order #abc123                      │
│ Amount: $25.00                     │
│ Customer: John Doe                 │
│                                    │
│ e-Transfer Reference:              │
│ [Input ref number]                 │
│                                    │
│ Sender Email (from e-Transfer):    │
│ [john@email.com]                   │
│                                    │
│ Verification Notes (optional):     │
│ [Text area]                        │
│                                    │
│ ⚠️ This will:                      │
│ - Mark order as paid               │
│ - Confirm order with chef          │
│ - Trigger payment distribution     │
│                                    │
│ [Cancel]  [Confirm Payment]        │
└────────────────────────────────────┘
```

---

## Backend Implementation

### 1. Edge Function: create_etransfer_payment

**Path:** `backend/supabase/functions/create_etransfer_payment/index.ts`

```typescript
POST /functions/v1/create_etransfer_payment

Body: {
  order_id: string;
  customer_email: string;
}

Response: {
  payment_id: string;
  recipient_email: string;
  amount_cents: number;
  security_question: string;
  security_answer: string; // Based on order ID
  expires_at: string;
}
```

**Logic:**
1. Validate order exists and is unpaid
2. Create e_transfer_payments record
3. Update order: payment_method='e_transfer', payment_status='pending_transfer'
4. Return transfer instructions
5. Send email to customer with instructions

### 2. Edge Function: confirm_etransfer_payment

**Path:** `backend/supabase/functions/confirm_etransfer_payment/index.ts`

```typescript
POST /functions/v1/confirm_etransfer_payment

Headers: {
  Authorization: Bearer <admin_token>
}

Body: {
  payment_id: string;
  reference_number: string;
  sender_email: string;
  verification_notes?: string;
}

Response: {
  success: boolean;
  order_id: string;
  distribution_triggered: boolean;
}
```

**Logic:**
1. Verify admin role
2. Update e_transfer_payments:
   - status='confirmed'
   - verified_by=admin_id
   - verified_at=NOW()
   - reference_number, sender_email, notes
3. Update order: payment_status='paid'
4. **Trigger distribute_payment** (same as Stripe webhook)
5. Send confirmation email to customer
6. Notify chef: order confirmed

### 3. Modified: distribute_payment

**Change:** Accept both Stripe and e-Transfer payments

```typescript
// Current: only accepts payment_intent_id (Stripe)
// New: also accepts order_id (e-Transfer)

interface DistributePaymentRequest {
  payment_intent_id?: string; // Stripe
  order_id?: string; // e-Transfer
}

// Logic:
// 1. If payment_intent_id → fetch charge_id (Stripe flow)
// 2. If order_id → no charge_id, mark as e-transfer
// 3. Fetch order and delivery details
// 4. Calculate splits (same logic)
// 5. Create Stripe Transfers:
//    - If Stripe: use charge_id as source_transaction
//    - If e-Transfer: transfer from platform balance (no source)
```

### 4. Cron Job: expire_old_etransfers

**Trigger:** Every hour

```sql
-- Find expired e-transfers
UPDATE e_transfer_payments
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at < NOW();

-- Cancel associated orders
UPDATE orders
SET status = 'cancelled',
    payment_status = 'failed'
WHERE id IN (
  SELECT order_id FROM e_transfer_payments
  WHERE status = 'expired'
);

-- Send expiry emails to customers
```

---

## Payment Distribution Logic

### Scenario 1: Stripe Payment (Current)

```
Customer pays $25 with credit card
↓
Stripe charges $25 from customer
↓
Webhook: payment_intent.succeeded
↓
distribute_payment() executes:
  - Chef Transfer: $18 (90% of $20 order)
  - CoCo Transfer: $6 (60% of $10 delivery)
  - Driver Transfer: Amount from delivery_fee
↓
All transfers use charge_id as source_transaction
```

### Scenario 2: e-Transfer Payment (New)

```
Customer sends $25 e-Transfer
↓
Admin receives e-Transfer in bank email
↓
Admin clicks "Confirm Payment" in dashboard
↓
confirm_etransfer_payment() executes:
  - Marks payment as confirmed
  - Triggers distribute_payment(order_id)
↓
distribute_payment() executes:
  - Chef Transfer: $18 (from platform balance)
  - CoCo Transfer: $6 (from platform balance)
  - Driver Transfer: Amount from platform balance
↓
No source_transaction (not a Stripe charge)
Platform balance decreases by $25
```

**Important:** For e-Transfer, the platform must have sufficient balance in Stripe to make the transfers. The $25 received via e-Transfer goes to the platform's bank account, not Stripe.

---

## Email Notifications

### 1. e-Transfer Instructions (Customer)

**Trigger:** After order created with e-Transfer

**Subject:** Payment Instructions for Order #abc123

**Body:**
```
Hi John,

Thank you for your order! Please complete payment via Interac e-Transfer.

📧 Send e-Transfer to: payments@ridendine.com
💰 Amount: $25.00 CAD
📝 Security Question: "Order number?"
📌 Answer: abc123

⚠️ Important:
- Include your order number (abc123) in the transfer message
- Payment must be received within 24 hours
- We'll confirm your order once payment is received

Questions? Reply to this email or contact support.

[View Order Status]
```

### 2. Payment Received (Customer)

**Trigger:** Admin confirms e-Transfer

**Subject:** Payment Confirmed - Order #abc123

**Body:**
```
Hi John,

Great news! We've received your e-Transfer payment.

✅ Payment confirmed: $25.00
✅ Order confirmed with chef
🍜 Your meal is being prepared

Track your order: [link]

Thank you for choosing RidenDine!
```

### 3. Payment Expired (Customer)

**Trigger:** 24h passed, no payment

**Subject:** Order Cancelled - Payment Not Received #abc123

**Body:**
```
Hi John,

Unfortunately, we haven't received your e-Transfer payment within 24 hours, so your order has been cancelled.

If you've already sent the payment, please contact us immediately and we'll sort it out.

Want to try again? [Reorder]
```

---

## Implementation Checklist

### Phase 1: Database & Backend (4-5 hours)
- [ ] Create migration: add payment_method column to orders
- [ ] Create migration: e_transfer_payments table with RLS
- [ ] Create edge function: create_etransfer_payment
- [ ] Create edge function: confirm_etransfer_payment
- [ ] Modify edge function: distribute_payment (support both methods)
- [ ] Create cron job: expire_old_etransfers
- [ ] Test: e-Transfer flow end-to-end (backend)

### Phase 2: Customer UI (4-6 hours)
- [ ] Component: PaymentMethodSelector
- [ ] Component: StripePaymentForm (Stripe Elements)
- [ ] Component: ETransferInstructions
- [ ] Component: PaymentPendingCard
- [ ] Update: checkout/page.tsx (integrate both payment methods)
- [ ] Page: /orders/[id] (show e-Transfer status)
- [ ] Test: Customer can select e-Transfer
- [ ] Test: Customer sees instructions
- [ ] Test: Order shows "pending payment"

### Phase 3: Admin UI (3-4 hours)
- [ ] Page: /dashboard/payments/pending
- [ ] Component: ETransferPaymentCard
- [ ] Component: ConfirmPaymentModal
- [ ] API: Confirm payment button triggers backend
- [ ] Test: Admin can see pending payments
- [ ] Test: Admin can confirm payments
- [ ] Test: Confirmation triggers distribution

### Phase 4: Email Notifications (2-3 hours)
- [ ] Email template: e-Transfer instructions
- [ ] Email template: Payment confirmed
- [ ] Email template: Payment expired
- [ ] Test: All emails send correctly

### Phase 5: Testing & Polish (2-3 hours)
- [ ] E2E test: Stripe payment flow
- [ ] E2E test: e-Transfer payment flow
- [ ] E2E test: Payment expiry
- [ ] E2E test: Admin confirmation
- [ ] Documentation: User guide for e-Transfer
- [ ] Documentation: Admin guide for payment verification

---

## Total Estimated Time

**15-20 hours** for complete dual payment system

**Breakdown:**
- Backend: 4-5 hours
- Customer UI: 4-6 hours
- Admin UI: 3-4 hours
- Emails: 2-3 hours
- Testing: 2-3 hours

---

## Security Considerations

### e-Transfer Specific
1. **Verification Required:** Admin must manually verify each e-Transfer
2. **Reference Matching:** Check order number in transfer message
3. **Amount Validation:** Confirm amount matches order total
4. **Expiry Enforcement:** Auto-cancel after 24 hours
5. **Fraud Prevention:** Track sender email, reference numbers

### General
1. **HTTPS Required:** All pages with payment info
2. **PCI Compliance:** Stripe handles card data (never touches your server)
3. **Admin Auth:** Only verified admins can confirm payments
4. **Audit Trail:** Log all payment confirmations with admin ID
5. **Idempotency:** Prevent duplicate confirmations

---

## Alternative: Instant e-Transfer Verification

**Advanced Option (Future):**
Integrate with e-Transfer API (if available from your bank) for automatic verification.

**Benefits:**
- No manual admin work
- Instant confirmation (like Stripe)
- Automatic payment distribution

**Challenges:**
- Bank API availability (not all banks offer this)
- Integration complexity
- Higher costs

---

## Recommendation

**Start with manual e-Transfer verification:**
- Simpler to implement
- Lower risk
- Lower costs
- Good for testing market demand

**Later, consider automation** if:
- High e-Transfer volume
- Admin verification becomes bottleneck
- Bank API becomes available

---

## Next Steps

**Do you want me to:**

**Option A:** Build the full dual payment system (15-20 hours)
**Option B:** Start with backend + basic UI (8-10 hours, iterate later)
**Option C:** Stripe only first, add e-Transfer later
**Option D:** e-Transfer only (skip Stripe)

Which approach would you prefer?
