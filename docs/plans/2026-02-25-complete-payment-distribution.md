# Complete Payment Distribution & Driver Earnings Implementation Plan

Created: 2026-02-25
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)
>
> - PENDING: Initial state, awaiting implementation
> - COMPLETE: All tasks implemented
> - VERIFIED: All checks passed
>
> **Approval Gate:** Implementation CANNOT proceed until `Approved: Yes`
> **Worktree:** Set at plan creation (from dispatcher). `Yes` uses git worktree isolation; `No` works directly on current branch (default)
> **Type:** `Feature` or `Bugfix` — set at planning time, used by dispatcher for routing

## Summary

**Goal:** Implement multi-party payment distribution so that after a customer pays, funds are automatically split to Chef, CoCo ($6 from $10 base), and Driver (delivery_fee_cents), plus build a real driver earnings UI replacing the placeholder.

**Architecture:** Switch from Stripe Checkout direct-transfer (chef only) to platform-capture + Stripe Transfers API post-payment. A new `distribute_payment` Edge Function is triggered by the webhook after payment succeeds. New database tables (`coco_config`, `payment_transfers`) track distribution. Driver earnings UI queries `DeliveriesRepository.getDriverEarnings()` which already exists.

**Tech Stack:** Supabase Edge Functions (Deno), Stripe Transfers API, React Native (Expo), TypeScript, PostgreSQL

## Scope

### In Scope

- Database migration: `coco_config` table, `payment_transfers` table, `connect_account_id` on drivers
- New Edge Function: `distribute_payment` — splits funds to Chef, CoCo, Driver
- Modify Edge Function: `create_checkout_session` — capture to platform instead of direct transfer
- Modify Edge Function: `webhook_stripe` — trigger distribution after payment succeeds
- New Edge Function: `create_driver_connect_account` — driver Stripe onboarding (mirrors chef pattern)
- Update webhook: handle driver `account.updated` events
- Shared types: add `Driver`, `PaymentTransfer`, `CocoConfig` types
- Mobile: implement driver earnings screen with real data

### Out of Scope

- Delivery Company payouts (no entity/infrastructure exists — deferred)
- CoCo admin dashboard UI (one-time setup via SQL)
- Driver onboarding UI in mobile app (requires UX design — deferred)
- Stripe Connect account verification flow for drivers (deferred)
- Real-time earnings push notifications

## Prerequisites

- Supabase project with service role key configured
- Stripe account with Connect enabled
- Existing Edge Functions deployment pipeline working

## Runtime Environment

- **Supabase Local:** `cd backend/supabase && supabase start` launches local Postgres + Edge Functions runtime
- **Edge Functions Dev:** `supabase functions serve` serves all functions at `http://localhost:54321/functions/v1/{function_name}`
- **Edge Function Secrets:** Set via `supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...`
- **Stripe Test Mode:** Use Stripe test keys for development; webhook testing via `stripe listen --forward-to localhost:54321/functions/v1/webhook_stripe`
- **Mobile Dev:** `cd apps/mobile && npx expo start` for driver earnings UI development
- **Health Check:** `curl http://localhost:54321/functions/v1/distribute_payment` should return auth error (confirms function is deployed)

## Context for Implementer

- **Patterns to follow:** Chef Connect onboarding pattern in `backend/supabase/functions/create_connect_account/index.ts` — reuse for drivers. Webhook pattern in `webhook_stripe/index.ts:93-115` for `account.updated`.
- **Conventions:** Edge Functions use Deno `serve()`, import Stripe from esm.sh, use `supabaseAdmin` client with service role key. Migrations are sequential numbered files in `backend/supabase/migrations/`. Shared types in `packages/shared/src/types.ts`, enums in `enums.ts`.
- **Key files:**
  - `backend/supabase/functions/create_checkout_session/index.ts` — current payment flow (lines 123-149: Stripe session creation with direct transfer)
  - `backend/supabase/functions/webhook_stripe/index.ts` — webhook handler (lines 34-138: event switch)
  - `backend/supabase/functions/create_connect_account/index.ts` — chef onboarding pattern to replicate
  - `backend/supabase/migrations/20240106000000_add_commission_system.sql` — existing commission/payout tables
  - `backend/supabase/migrations/20240111000000_enhance_driver_module.sql` — drivers table (no connect_account_id)
  - `packages/data/src/deliveries-repository.ts` — `getDriverEarnings()` already exists (lines 176-207)
  - `apps/mobile/app/(driver)/earnings.tsx` — placeholder to replace
- **Gotchas:** The `create_checkout_session` currently uses `transfer_data.destination` which sends funds directly to chef. Must remove this and use platform capture instead. The `orders` table already has `delivery_fee_cents` and `platform_fee_cents` columns.
- **Domain context:** CoCo is a single partner organization. $10 base per order, 60% to CoCo ($6.00), 40% retained by platform ($4.00). This is separate from the existing 15% commission system — the $10 CoCo split is in addition to any commission.

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Database migration for payment distribution tables
- [x] Task 2: Add shared types for Driver, PaymentTransfer, CocoConfig
- [x] Task 3: Create distribute_payment Edge Function
- [x] Task 4: Modify create_checkout_session for platform capture
- [x] Task 5: Modify webhook_stripe to trigger distribution
- [x] Task 6: Create driver Connect account onboarding Edge Function
- [x] Task 7: Implement driver earnings UI in mobile app

**Total Tasks:** 7 | **Completed:** 7 | **Remaining:** 0

## Implementation Tasks

### Task 1: Database Migration for Payment Distribution Tables

**Objective:** Add `coco_config` table, `payment_transfers` table, and `connect_account_id` column to drivers table.

**Dependencies:** None

**Files:**

- Create: `backend/supabase/migrations/20240119000000_add_payment_distribution.sql`

**Key Decisions / Notes:**

- `coco_config` stores one row for the CoCo partner Stripe account
- `payment_transfers` tracks every individual transfer for reconciliation
- Add `connect_account_id` and `payout_enabled` to `drivers` table (mirrors chef pattern)
- RLS: admins manage all, drivers view own transfers, chefs view own transfers
- Insert default CoCo config row with `payout_enabled = false` (admin completes onboarding later)

**Definition of Done:**

- [ ] All tests pass (unit, integration if applicable)
- [ ] No diagnostics errors (linting, type checking)
- [ ] Migration SQL is valid and creates all three schema changes (coco_config, payment_transfers, drivers columns)
- [ ] RLS policies prevent unauthorized access to payment_transfers
- [ ] Indexes exist on payment_transfers(order_id) and payment_transfers(recipient_type, recipient_id)

**Verify:**

- `grep -c "CREATE TABLE" backend/supabase/migrations/20240119000000_add_payment_distribution.sql` — returns 2 (coco_config + payment_transfers)
- `grep "connect_account_id" backend/supabase/migrations/20240119000000_add_payment_distribution.sql` — shows ALTER TABLE drivers

### Task 2: Add Shared Types for Payment Distribution

**Objective:** Add `Driver`, `PaymentTransfer`, and `CocoConfig` TypeScript interfaces to the shared package so all apps can use them.

**Dependencies:** None

**Files:**

- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/enums.ts` (add `RecipientType` enum)

**Key Decisions / Notes:**

- `Driver` interface mirrors the database schema (id, profile_id, connect_account_id, payout_enabled, vehicle_type, etc.)
- `PaymentTransfer` interface includes order_id, recipient_type, recipient_id, stripe_transfer_id, amount_cents, status
- `RecipientType` enum: 'chef' | 'coco' | 'driver' | 'delivery_company'
- `CocoConfig` interface: id, stripe_account_id, payout_enabled

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] `Driver` type includes `connect_account_id` and `payout_enabled` fields
- [ ] `PaymentTransfer` type includes all fields matching the migration schema
- [ ] `RecipientType` enum has 4 values
- [ ] Types are exported from `packages/shared/src/index.ts` (if barrel file exists) or directly importable

**Verify:**

- `grep "Driver" packages/shared/src/types.ts` — shows Driver interface
- `grep "RecipientType" packages/shared/src/enums.ts` — shows enum
- `cd /home/nygmaee/Desktop/ridendine-demo-main && npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | head -5` — zero errors

### Task 3: Create distribute_payment Edge Function

**Objective:** Create a new Edge Function that distributes payment to Chef, CoCo, and Driver via Stripe Transfers API after a payment succeeds.

**Dependencies:** Task 1, Task 2

**Files:**

- Create: `backend/supabase/functions/distribute_payment/index.ts`

**Key Decisions / Notes:**

- Called by webhook after `payment_intent.succeeded`
- Accepts `{ order_id, payment_intent_id }` in request body
- Fetches order with chef (connect_account_id) and delivery (driver_id → driver connect_account_id)
- Fetches CoCo config for CoCo Stripe account
- Creates Stripe transfers with `transfer_group: order_${order_id}` for reconciliation
- Chef gets `subtotal_cents`, CoCo gets $6.00 (600 cents), Driver gets `delivery_fee_cents`
- Platform retains: $4.00 from CoCo split + any additional platform_fee_cents
- Records each transfer in `payment_transfers` table
- Gracefully skips recipients without connect_account_id (logs warning, doesn't fail)
- Uses `source_transaction` parameter to avoid insufficient funds errors
- Follow existing Edge Function patterns: Deno serve, Stripe esm.sh import, supabaseAdmin client

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Function creates separate Stripe transfers for each recipient (chef, coco, driver)
- [ ] Each transfer is recorded in payment_transfers table with correct status
- [ ] Missing connect_account_id on any party doesn't crash the function
- [ ] transfer_group links all transfers to the same order

**Verify:**

- `test -f backend/supabase/functions/distribute_payment/index.ts && echo "EXISTS"` — returns EXISTS
- `grep "stripe.transfers.create" backend/supabase/functions/distribute_payment/index.ts | wc -l` — returns 3 (chef, coco, driver)
- `grep "payment_transfers" backend/supabase/functions/distribute_payment/index.ts` — shows insert into tracking table

### Task 4: Modify create_checkout_session for Platform Capture

**Objective:** Change checkout session creation from direct-transfer-to-chef to platform-capture, so funds land in the platform account for subsequent distribution.

**Dependencies:** None

**Files:**

- Modify: `backend/supabase/functions/create_checkout_session/index.ts`

**Key Decisions / Notes:**

- Remove `payment_intent_data.transfer_data.destination` (line 140-142)
- Remove `payment_intent_data.application_fee_amount` (line 139) — no longer needed since platform captures 100%
- Add `payment_intent_data.metadata.order_id` so webhook can identify the order
- Keep the existing authentication, order fetch, and validation logic unchanged
- Remove the `chefConnectAccountId` requirement (lines 109-114) — chef account is now checked during distribution, not checkout
- Update `OrderRecord` type to remove the `chefs` join (no longer needed at checkout time)

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Checkout session no longer includes `transfer_data.destination`
- [ ] Checkout session no longer includes `application_fee_amount`
- [ ] `metadata.order_id` is set on payment_intent_data
- [ ] Function still validates order exists and amount is positive

**Verify:**

- `grep "transfer_data" backend/supabase/functions/create_checkout_session/index.ts` — no results (removed)
- `grep "application_fee_amount" backend/supabase/functions/create_checkout_session/index.ts` — no results (removed)
- `grep "order_id" backend/supabase/functions/create_checkout_session/index.ts` — shows metadata usage

### Task 5: Modify webhook_stripe to Trigger Distribution

**Objective:** Update the Stripe webhook handler to call `distribute_payment` after payment succeeds, and handle driver `account.updated` events.

**Dependencies:** Task 3

**Files:**

- Modify: `backend/supabase/functions/webhook_stripe/index.ts`

**Key Decisions / Notes:**

- In `payment_intent.succeeded` case (lines 58-71): after updating order status, call the `distribute_payment` Edge Function via fetch
- Use `Deno.env.get('SUPABASE_URL')` + `/functions/v1/distribute_payment` as the URL
- Pass `Authorization: Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` for auth
- Pass `{ order_id, payment_intent_id }` in body
- In `account.updated` case (lines 93-115): also update `drivers` table `payout_enabled` when a driver account is updated
- Add error handling: if distribution fails, log error but still return 200 to Stripe (don't retry the webhook, distribution can be retried separately)

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] `payment_intent.succeeded` handler triggers distribute_payment function call
- [ ] Distribution failure doesn't cause webhook to return non-200
- [ ] `account.updated` handler updates both chefs AND drivers tables

**Verify:**

- `grep "distribute_payment" backend/supabase/functions/webhook_stripe/index.ts` — shows fetch call
- `grep "drivers" backend/supabase/functions/webhook_stripe/index.ts` — shows driver payout_enabled update

### Task 6: Create Driver Connect Account Onboarding Edge Function

**Objective:** Create an Edge Function for driver Stripe Connect account onboarding, mirroring the existing chef pattern.

**Dependencies:** Task 1

**Files:**

- Create: `backend/supabase/functions/create_driver_connect_account/index.ts`

**Key Decisions / Notes:**

- Nearly identical to `create_connect_account/index.ts` but targets `drivers` table
- Accepts `{ driver_id, return_url, refresh_url }` in request body
- Creates Stripe Express account with `transfers` capability (drivers receive transfers, not direct charges)
- Stores `connect_account_id` in `drivers` table
- Returns `{ account_id, onboarding_url }` for the driver to complete KYC
- Authentication required (driver must be logged in)

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Function creates Stripe Express account with transfers capability
- [ ] connect_account_id is stored in drivers table
- [ ] Returns onboarding URL for driver KYC completion
- [ ] Handles missing driver_id with 400 error

**Verify:**

- `test -f backend/supabase/functions/create_driver_connect_account/index.ts && echo "EXISTS"` — returns EXISTS
- `grep "drivers" backend/supabase/functions/create_driver_connect_account/index.ts` — shows drivers table update
- `grep "account_onboarding" backend/supabase/functions/create_driver_connect_account/index.ts` — shows onboarding link creation

### Task 7: Implement Driver Earnings UI in Mobile App

**Objective:** Replace the placeholder earnings screen with a real earnings display showing delivery history, earnings totals, and payout status.

**Dependencies:** Task 1, Task 2

**Files:**

- Modify: `apps/mobile/app/(driver)/earnings.tsx`
- Test: Manual verification via Expo

**Key Decisions / Notes:**

- Use `DeliveriesRepository.getDriverEarnings()` which already exists (packages/data/src/deliveries-repository.ts:176-207)
- Display: today's earnings, this week's earnings, this month's earnings
- Show list of completed deliveries with fee amount and date
- Show payout status indicator (connect_account_id present + payout_enabled)
- If driver has no connect_account_id, show "Set up payouts" message
- Follow existing mobile app patterns: StyleSheet, View/Text/FlatList from react-native
- Use date ranges for filtering (today = start of day, week = start of Monday, month = start of month)
- Format cents to dollars for display (delivery_fee_cents / 100)

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Earnings screen shows today/week/month totals
- [ ] Completed deliveries list shows fee and date
- [ ] Payout status indicator shows whether driver has Stripe account set up
- [ ] Loading state shown while fetching data
- [ ] Empty state shown when no deliveries exist

**Verify:**

- `grep "getDriverEarnings" apps/mobile/app/\(driver\)/earnings.tsx` — shows repository usage
- `grep "delivery_fee_cents" apps/mobile/app/\(driver\)/earnings.tsx` — shows fee display logic
- `wc -l apps/mobile/app/\(driver\)/earnings.tsx` — shows substantial implementation (>50 lines, not placeholder)

## Testing Strategy

- **Unit tests:** Test `distribute_payment` logic (split calculations, graceful handling of missing accounts). Test shared type exports compile.
- **Integration tests:** Test webhook → distribute_payment flow with mock Stripe responses. Test driver earnings query returns correct totals.
- **Manual verification:** Deploy Edge Functions, trigger a test payment, verify transfers appear in Stripe Dashboard. Check mobile earnings screen renders with test data.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Stripe insufficient funds for transfers | Med | High | Use `source_transaction` parameter to link transfers to the payment |
| CoCo Stripe account not onboarded | High | Med | `distribute_payment` skips CoCo transfer if no account configured, logs warning |
| Driver has no connect_account_id | High | Med | `distribute_payment` skips driver transfer, records as 'skipped' in payment_transfers |
| Webhook times out calling distribute_payment | Low | Med | Return 200 to Stripe immediately, distribution runs async. Log failures for retry. |
| Breaking existing chef payment flow | Med | High | Task 4 removes direct transfer; Task 3 replaces with Transfers API. Test with existing order data. |

## Goal Verification

### Truths (what must be TRUE for the goal to be achieved)

- After a customer payment succeeds, separate Stripe transfers are created for Chef, CoCo, and Driver
- Each transfer amount is correct: Chef gets subtotal_cents, CoCo gets 600 cents, Driver gets delivery_fee_cents
- All transfers are recorded in the payment_transfers table with correct status
- Drivers can view their earnings (today/week/month) in the mobile app
- Missing Stripe accounts on any party don't crash the payment flow

### Artifacts (what must EXIST to support those truths)

- `backend/supabase/migrations/20240119000000_add_payment_distribution.sql` — creates coco_config, payment_transfers tables, adds drivers columns
- `backend/supabase/functions/distribute_payment/index.ts` — orchestrates multi-party transfer
- `backend/supabase/functions/create_driver_connect_account/index.ts` — driver Stripe onboarding
- `apps/mobile/app/(driver)/earnings.tsx` — real earnings UI (not placeholder)

### Key Links (critical connections that must be WIRED)

- `webhook_stripe` payment_intent.succeeded → calls `distribute_payment` function
- `distribute_payment` → reads order + chef + delivery + driver + coco_config → creates Stripe transfers → inserts payment_transfers records
- `earnings.tsx` → calls `DeliveriesRepository.getDriverEarnings()` → displays results
- `create_checkout_session` → captures to platform (no transfer_data.destination)

## Open Questions

- CoCo Stripe account ID will need to be configured by admin after plan is implemented (one-time setup)
- Driver onboarding UI flow not included — drivers need a way to trigger `create_driver_connect_account` from the mobile app (deferred)

### Deferred Ideas

- Delivery Company payout infrastructure
- Driver onboarding UI in mobile app
- CoCo management dashboard in admin app
- Automated retry mechanism for failed transfers
- Earnings export / CSV download for drivers
