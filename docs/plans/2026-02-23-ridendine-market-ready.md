# RidenDine Market-Ready Delivery Plan

Created: 2026-02-23
Status: COMPLETE
Approved: Yes
Iterations: 0
Worktree: No

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)
>
> - PENDING: Initial state, awaiting implementation
> - COMPLETE: All tasks implemented
> - VERIFIED: All checks passed
>
> **Approval Gate:** Implementation CANNOT proceed until `Approved: Yes`
> **Worktree:** No — working directly on current branch

## Summary

**Goal:** Transform RidenDine from a functional MVP scaffold into a fully market-ready 3-sided marketplace (Customers, Chefs, Drivers) with zero errors, comprehensive testing, and production-grade security.

**Architecture:** Monorepo (pnpm workspaces) with 3 apps (web: Next.js 15, admin: Next.js 15, mobile: React Native/Expo 50), 3 shared packages (shared, data, ui), Supabase backend (PostgreSQL + Auth + Edge Functions + Storage), Stripe Connect payments, deployed to Vercel (web/admin) and EAS (mobile).

**Tech Stack:** TypeScript throughout, Supabase (database + auth + realtime + storage + edge functions), Stripe Connect, Expo Router, Next.js App Router, pnpm workspaces.

**Phased Delivery:** MVP Core → Beta Features → Full Production

## Scope

### In Scope

**Phase 1 — Foundation:**
- Repository cleanup (duplicate files, type safety, code consistency)
- Testing infrastructure setup (Vitest for web/admin, Jest for mobile)
- Development skills (Supabase RLS, Stripe Connect, Expo Router, Next.js patterns, order lifecycle, monorepo patterns, testing patterns)
- Operational skills (Vercel deployment, Supabase migrations, EAS mobile builds, monitoring, incident response)
- Claude agents (`.claude/agents/`) for specialized roles (code reviewer, security auditor, deployment engineer, etc.)
- Skills and agents review and gap analysis

**Phase 2 — MVP Core:**
- Admin authentication overhaul (replace hardcoded password with Supabase Auth)
- Stripe payment UI integration (web checkout + mobile checkout)
- Image upload system (Supabase Storage for dishes, chef photos, delivery proof)
- Customer profile management + favorites

**Phase 3 — Beta Features:**
- Search, filters, reviews & ratings
- Real-time updates (Supabase Realtime) + push notifications (Expo) + email notifications
- Error handling, input validation (Zod), security hardening

**Phase 4 — Production:**
- Full driver module (job matching, status tracking, earnings, delivery proof, GPS tracking)
- Google Maps integration (location services, delivery tracking, ETAs, foreground GPS during active deliveries)
- Comprehensive test suite (unit + integration + E2E, 80%+ coverage) + CI/CD hardening

### Out of Scope

- Internationalization (i18n) / multi-language support
- Dark mode / theme switching
- Loyalty program / gamification
- Multi-vendor cart (already single-chef enforced by design)
- Desktop native apps
- Background location tracking for drivers when app is closed (foreground GPS during active deliveries IS in scope)
- Scheduled/pre-orders (Phase 2+ feature)
- In-app chat support (Phase 3 feature)

## Prerequisites

- Node.js >= 20, pnpm >= 9
- Supabase project with service role key access
- Stripe account with Connect enabled (test mode for development)
- Expo account for EAS builds
- Google Maps API key
- SMTP service credentials (SendGrid, Resend, or similar) for transactional emails

## Context for Implementer

> This section is critical for cross-session continuity.

- **Patterns to follow:**
  - Supabase client: Web uses `apps/web/lib/supabaseClient.ts`, admin uses `apps/admin/lib/supabase-browser.ts` (NOTE: duplicate files in `src/lib/` directories should be removed in Task 1)
  - Order status workflow: `OrderStatus` enum in `packages/shared/src/enums.ts:14-26` — follows DRAFT → SUBMITTED → PLACED → ACCEPTED → PREPARING → READY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
  - Cart context: `apps/web/lib/CartContext.tsx` and `apps/mobile/lib/context/CartContext.tsx` — separate implementations for web and mobile
  - Edge Functions: Deno runtime in `backend/supabase/functions/` — each function has its own directory with `index.ts`
  - Shared types: `packages/shared/src/types.ts` and `packages/shared/src/enums.ts` — all apps import from `@home-chef/shared`
  - Data layer: `packages/data/src/orders-repository.ts` — OrdersRepository class pattern for Supabase queries

- **Conventions:**
  - Web/Admin: Next.js App Router, `"use client"` directive for interactive components
  - Mobile: Expo Router file-based routing with role-based groups `(auth)/`, `(customer)/`, `(chef)/`, `(driver)/`
  - Database: All tables use RLS, UUID primary keys, `created_at`/`updated_at` timestamps
  - Pricing: All monetary values stored as cents (integer), converted to dollars for display

- **Key files:**
  - `packages/shared/src/enums.ts` — All status enums (OrderStatus, ChefStatus, etc.)
  - `packages/shared/src/types.ts` — All TypeScript interfaces (NOTE: missing `Dish` interface — added in Task 1)
  - `packages/data/src/orders-repository.ts` — Order CRUD operations
  - `backend/supabase/migrations/` — 6 SQL migration files (run in order)
  - `backend/supabase/functions/` — 3 Edge Functions (create_checkout_session, create_connect_account, webhook_stripe)
  - `scripts/seed.ts` — Demo data seeding script

- **Gotchas:**
  - `apps/web/app/api/create-payment-intent/route.ts` returns 501 — intentionally disabled, needs full Stripe integration
  - `apps/web/app/checkout/page.tsx` creates orders with `payment_status: 'unpaid'` — bypasses payment; also references `session_id` column that doesn't exist in any migration
  - `apps/web/app/checkout/page.tsx` uses guest checkout (`customer_name: "Guest"`) but `customer_id` has NOT NULL constraint in DB — fundamentally broken, must add auth gate
  - Admin uses `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD` env var — security anti-pattern, must be replaced
  - Duplicate Supabase client files exist in both `lib/` and `src/lib/` directories in web and admin apps
  - Mobile app uses Expo SDK 50 / React Native 0.73 — check compatibility before adding new native modules
  - Mobile `package.json` is missing `@home-chef/data` dependency — must be added for repository access
  - `SECURITY.md` references Express/in-memory patterns that don't match actual architecture — needs rewrite
  - `packages/shared/src/types.ts` is missing `Dish` interface despite `dishes` table existing in DB
  - **Schema conflicts:** `dishes` vs `menu_items` naming in queries; three different order entry statuses (DRAFT in OrdersRepository, SUBMITTED in web checkout, PLACED in SQL CHECK constraint)
  - **Dual webhook architecture:** `apps/web/app/api/webhooks/payment/route.ts` has NO Stripe signature verification (uses `x-webhook-secret` with bypass fallback), while `backend/supabase/functions/webhook_stripe/` does proper `constructEvent` verification — must consolidate to Edge Function only

- **Domain context:**
  - 3-sided marketplace: Customers order, Chefs cook, Drivers deliver
  - Platform takes 15% commission (configurable in `platform_settings` table)
  - Stripe Connect: Platform creates checkout sessions, fees deducted automatically, chefs get direct payouts
  - Order lifecycle: Customer places → Chef accepts/rejects → Chef prepares → Marked ready → Driver picks up → Delivered

## Runtime Environment

- **Web app:** `pnpm --filter @home-chef/web dev` → `http://localhost:3001`
- **Admin app:** `pnpm --filter @home-chef/admin dev` → `http://localhost:3000`
- **Mobile app:** `cd apps/mobile && expo start` → Expo Go on device/simulator
- **Supabase:** Cloud-hosted (requires project URL + anon key)
- **Build commands:** `pnpm build:shared && pnpm build:web && pnpm build:admin`
- **Health check (web):** `GET /api/health`
- **Seed data:** `pnpm seed` (requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`)

## Repository Audit Report

### Critical Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | Payment UI disabled — checkout creates unpaid orders | CRITICAL | `apps/web/app/checkout/page.tsx`, `apps/web/app/api/create-payment-intent/route.ts` |
| 2 | Admin uses hardcoded master password | CRITICAL | `apps/admin/app/ui/AdminGate.tsx`, `.env.example` |
| 3 | Zero test coverage across entire codebase | CRITICAL | All apps |
| 4 | Driver module 100% stubbed | CRITICAL | `apps/mobile/app/(driver)/jobs.tsx`, `earnings.tsx` |
| 5 | Webhook security bypass — no Stripe signature verification | CRITICAL | `apps/web/app/api/webhooks/payment/route.ts` (uses `x-webhook-secret` with fallback bypass) |
| 6 | `customer_id NOT NULL` vs guest checkout — orders fail in DB | CRITICAL | `apps/web/app/checkout/page.tsx` creates guest orders, `orders` table requires `customer_id` |
| 7 | `session_id` column referenced but doesn't exist in any migration | HIGH | `apps/web/app/checkout/page.tsx` |
| 8 | Schema conflict: `dishes` vs `menu_items` table naming | HIGH | Queries reference both names; code uses `dishes`, some references use `menu_items` |
| 9 | Three different order entry statuses (DRAFT/SUBMITTED/PLACED) | HIGH | `orders-repository.ts` uses DRAFT, web uses SUBMITTED, SQL CHECK uses PLACED |
| 10 | No image uploads — emoji placeholders | HIGH | All dish/chef displays |
| 11 | Profile screen is just sign-out button | HIGH | `apps/mobile/app/(customer)/profile.tsx` |
| 12 | No input validation/sanitization | HIGH | All forms across all apps |
| 13 | No error boundaries | HIGH | `apps/web/`, `apps/admin/` |
| 14 | Missing `Dish` interface in shared types | HIGH | `packages/shared/src/types.ts` — `dishes` table exists but no TypeScript interface |
| 15 | Mobile app missing `@home-chef/data` dependency | HIGH | `apps/mobile/package.json` — can't use shared repositories |
| 16 | Dual webhook architecture — race conditions | MEDIUM | Both `apps/web/app/api/webhooks/payment/` and `backend/supabase/functions/webhook_stripe/` handle same events |
| 17 | SECURITY.md contradicts actual architecture | MEDIUM | `SECURITY.md` |
| 18 | Duplicate Supabase client files | MEDIUM | `apps/admin/src/lib/`, `apps/web/src/lib/` |
| 19 | Heavy `any` types in components | MEDIUM | `apps/web/app/chefs/page.tsx:7`, checkout, orders |
| 20 | Inline styles throughout, no design system | MEDIUM | All components |
| 21 | No real-time updates (polling only) | MEDIUM | `apps/mobile/app/(customer)/tracking.tsx:25` |
| 22 | No search beyond basic client-side filter | LOW | `apps/web/app/chefs/page.tsx:17` |
| 23 | No email notifications | LOW | Entire platform |

### Architecture Assessment

- **Strengths:** Clean monorepo structure, shared types, proper RLS policies, Edge Functions well-implemented, Stripe Connect backend complete
- **Weaknesses:** Frontend-heavy with no backend API routes (direct Supabase client calls), no middleware layer, no caching, no rate limiting
- **Technical Debt:** Inline styles, any types, duplicate files, no tests, stubbed screens

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

### Phase 1 — Foundation
- [x] Task 1: Repository cleanup and testing infrastructure
- [x] Task 2: Build development skills, operational skills, and agents

### Phase 2 — MVP Core
- [x] Task 3: Admin authentication overhaul
- [x] Task 4: Stripe payment integration (web + mobile)
- [x] Task 5: Image upload system
- [x] Task 6: Customer profile management and favorites

### Phase 3 — Beta Features
- [x] Task 7: Search, filters, reviews and ratings
- [x] Task 8: Real-time updates, push notifications, email notifications
- [x] Task 9: Error handling, input validation, security hardening

### Phase 4 — Production
- [x] Task 10: Full driver module
- [x] Task 11: Google Maps integration and delivery tracking
- [x] Task 12: Comprehensive test suite and CI/CD hardening

**Total Tasks:** 12 | **Completed:** 12 | **Remaining:** 0

## Implementation Tasks

### Task 1: Repository Cleanup and Testing Infrastructure

**Objective:** Fix structural issues discovered in audit — remove duplicate files, reconcile schema conflicts, fix type safety, add missing dependency, set up testing frameworks across all apps, establish code quality baseline.

**Dependencies:** None

**Files:**
- Delete: `apps/admin/src/lib/supabase-browser.ts` (duplicate of `apps/admin/lib/supabase-browser.ts`)
- Delete: `apps/admin/src/lib/supabase.ts` (duplicate of `apps/admin/lib/supabase.ts`)
- Delete: `apps/web/src/lib/supabaseClient.ts` (duplicate of `apps/web/lib/supabaseClient.ts`)
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/__tests__/setup.ts`
- Create: `apps/admin/vitest.config.ts`
- Create: `apps/admin/__tests__/setup.ts`
- Modify: `apps/web/package.json` (add vitest, @testing-library/react)
- Modify: `apps/admin/package.json` (replace jest with vitest, add @testing-library/react)
- Modify: `apps/mobile/package.json` (add `@home-chef/data` dependency — currently missing)
- Modify: `apps/web/app/chefs/page.tsx` (replace `any` types with proper interfaces)
- Modify: `apps/web/app/checkout/page.tsx` (replace `any` types, fix `session_id` reference)
- Modify: `packages/shared/src/types.ts` (add missing `Dish` interface to match `dishes` table)
- Modify: `SECURITY.md` (rewrite to match actual Supabase architecture)
- Create: `backend/supabase/migrations/20240107000000_schema_reconciliation.sql` (resolve schema conflicts)
- Create: `apps/web/__tests__/lib/CartContext.test.tsx` (first test to validate infrastructure)

**Key Decisions / Notes:**
- Use Vitest over Jest for web/admin — faster, better ESM support, native TypeScript
- Keep Jest for mobile (Expo ecosystem expects it)
- Remove duplicate `src/lib/` files — canonical location is `lib/` at app root
- Replace all `any` types in modified files with proper interfaces from `@home-chef/shared`
- Rewrite SECURITY.md to accurately reflect Supabase Auth + RLS security model
- **Schema reconciliation (CRITICAL):**
  - `dishes` table exists in DB but `menu_items` is used in some queries — standardize on `dishes` as the canonical table name, alias where needed
  - `session_id` column referenced in `checkout/page.tsx` does NOT exist in any migration — remove reference, use order ID for tracking
  - `customer_id NOT NULL` constraint in `orders` table conflicts with guest checkout pattern (`customer_name: "Guest"`) — add web auth gate requiring login before checkout instead of allowing guest orders
  - Three different order entry statuses (DRAFT in repository, SUBMITTED in web, PLACED in SQL CHECK constraint) — standardize: createOrder uses DRAFT, submitOrder transitions to PLACED, remove SUBMITTED as entry point
- **Mobile dependency:** `apps/mobile/package.json` is missing `@home-chef/data` — add it to use shared repository classes
- **Add `Dish` interface** to `packages/shared/src/types.ts` to match the `dishes` table schema

**Definition of Done:**
- [ ] No duplicate Supabase client files exist in `src/lib/` directories
- [ ] Schema reconciliation migration resolves dishes/menu_items ambiguity
- [ ] `session_id` references removed from checkout (use order ID instead)
- [ ] Web checkout requires authentication (no guest checkout with NULL customer_id)
- [ ] Order entry status standardized: DRAFT → PLACED (no SUBMITTED as entry)
- [ ] `Dish` interface added to `packages/shared/src/types.ts`
- [ ] Mobile app has `@home-chef/data` as dependency in `package.json`
- [ ] `pnpm --filter @home-chef/web test` runs Vitest and passes
- [ ] `pnpm --filter @home-chef/admin test` runs Vitest and passes
- [ ] CartContext test file validates add/remove/clear cart operations
- [ ] Zero `any` types in modified files
- [ ] SECURITY.md accurately describes Supabase Auth + RLS security model
- [ ] `pnpm build` succeeds with no TypeScript errors

**Verify:**
- `pnpm --filter @home-chef/web test -- --run` — web tests pass
- `pnpm --filter @home-chef/admin test -- --run` — admin tests pass
- `pnpm build` — full monorepo build succeeds
- `grep -r "src/lib/supabase" apps/admin/ apps/web/` — returns zero results
- `grep -r "session_id" apps/web/app/checkout/` — returns zero results
- `grep "Dish" packages/shared/src/types.ts` — returns the new interface

---

### Task 2: Build Development Skills, Operational Skills, and Agents

**Objective:** Create comprehensive `.claude/skills/` covering all repeatable development patterns and operational runbooks, plus `.claude/agents/` for specialized roles. Review all for completeness.

**Dependencies:** None

**Files:**

**Development Skills (7):**
- Create: `.claude/skills/supabase-rls-patterns/SKILL.md`
- Create: `.claude/skills/stripe-connect-marketplace/SKILL.md`
- Create: `.claude/skills/expo-router-patterns/SKILL.md`
- Create: `.claude/skills/nextjs-supabase-ssr/SKILL.md`
- Create: `.claude/skills/order-lifecycle-management/SKILL.md`
- Create: `.claude/skills/monorepo-pnpm-patterns/SKILL.md`
- Create: `.claude/skills/ridendine-testing/SKILL.md`

**Operational Skills (5):**
- Create: `.claude/skills/supabase-migrations/SKILL.md`
- Create: `.claude/skills/vercel-deployment/SKILL.md`
- Create: `.claude/skills/eas-mobile-deployment/SKILL.md`
- Create: `.claude/skills/ridendine-monitoring/SKILL.md`
- Create: `.claude/skills/ridendine-incident-response/SKILL.md`

**Agents (6):**
- Create: `.claude/agents/code-reviewer.md` (reviews PRs for RidenDine patterns, checks RLS policies, validates order lifecycle transitions)
- Create: `.claude/agents/security-auditor.md` (audits Supabase RLS, Stripe webhook signatures, auth flows, input validation)
- Create: `.claude/agents/deployment-engineer.md` (manages Vercel deployments, EAS builds, Supabase migrations, environment configs)
- Create: `.claude/agents/test-engineer.md` (writes and runs tests following ridendine-testing skill patterns, enforces 80% coverage)
- Create: `.claude/agents/database-admin.md` (manages Supabase migrations, RLS policies, storage buckets, Edge Functions)
- Create: `.claude/agents/mobile-developer.md` (specializes in Expo Router, React Native Maps, push notifications, mobile-specific patterns)

**Key Decisions / Notes:**
- Each skill follows the template from `.claude/skills/pilot-update-workflow/SKILL.md`
- Development skills (7): Cover the core patterns a developer needs to contribute to this codebase
- Operational skills (5): Cover deployment, migrations, monitoring, and incident response
- Agents (6): Specialized roles with system prompts, tool access, and domain-specific instructions
- Each skill includes: problem context, trigger conditions, step-by-step solution, verification, examples
- Each agent includes: role description, expertise areas, key rules, file paths to reference, verification steps
- Skills and agents reference actual file paths and code patterns from the codebase
- After creation, perform gap analysis: read all skills AND agents, check if any common workflow or role is missing
- **Skills review is a separate verification step:** After all skills and agents are created, systematically review each one against the codebase to ensure accuracy and completeness

**Definition of Done:**
- [ ] All 12 skill files created in `.claude/skills/`
- [ ] All 6 agent files created in `.claude/agents/`
- [ ] Each skill has proper YAML frontmatter with description and trigger conditions
- [ ] Each agent has role description, expertise areas, and key file references
- [ ] Each skill/agent references actual file paths from the codebase
- [ ] Gap analysis completed — no common development/ops workflow or role is uncovered
- [ ] Skills are discoverable via `ls .claude/skills/` and searchable via `grep`
- [ ] Agents are discoverable via `ls .claude/agents/`
- [ ] Cross-review: each agent references relevant skills, each skill can be used by appropriate agents

**Verify:**
- `ls .claude/skills/ | wc -l` — returns 13 (12 new + 1 existing)
- `ls .claude/agents/ | wc -l` — returns 6
- `grep -r "description:" .claude/skills/*/SKILL.md | wc -l` — returns 13
- `grep -l "Verify" .claude/skills/*/SKILL.md | wc -l` — returns 13 (all have verification sections)
- `grep -l "expertise" .claude/agents/*.md | wc -l` — returns 6

---

### Task 3: Admin Authentication Overhaul

**Objective:** Replace hardcoded master password (`admin123`) with proper Supabase Auth — admin users authenticate via email/password through Supabase, with role-based access control checking the `profiles.role` column.

**Dependencies:** Task 1

**Files:**
- Modify: `apps/admin/app/page.tsx` (login page — use Supabase Auth instead of password check)
- Modify: `apps/admin/app/ui/AdminGate.tsx` (check Supabase session + admin role)
- Modify: `apps/admin/middleware.ts` (add Supabase session validation)
- Modify: `apps/admin/lib/supabase-browser.ts` (ensure proper SSR client setup)
- Modify: `apps/admin/lib/supabase-server.ts` (server-side session handling)
- Delete: any reference to `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD`
- Modify: `.env.example` (remove `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD`)
- Create: `apps/admin/__tests__/ui/AdminGate.test.tsx`
- Test: `apps/admin/__tests__/auth/login.test.tsx`

**Key Decisions / Notes:**
- Use Supabase Auth's built-in email/password authentication
- AdminGate checks `profiles.role === 'admin'` after successful auth
- Server-side middleware validates session on every request to `/dashboard/*`
- Keep `supabase-server.ts` for SSR cookie-based auth (follows Next.js + Supabase best practices)
- Seed script already creates `admin@ridendine.demo` with role `admin` — this becomes the login

**Definition of Done:**
- [ ] Admin login page uses Supabase Auth email/password
- [ ] AdminGate verifies `profiles.role === 'admin'` from Supabase session
- [ ] Middleware redirects unauthenticated users to login page
- [ ] `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD` removed from all files
- [ ] Sign-out functionality works and clears session
- [ ] Non-admin users see "Access Denied" message after login
- [ ] Tests verify login flow and role-based access

**Verify:**
- `grep -r "ADMIN_MASTER_PASSWORD" .` — returns zero results
- `pnpm --filter @home-chef/admin test -- --run` — auth tests pass
- `pnpm --filter @home-chef/admin build` — builds successfully

---

### Task 4: Stripe Payment Integration

**Objective:** Wire up Stripe Checkout in both web and mobile apps so customers can actually pay for orders. Replace the current "no payment" stub with real Stripe Checkout Sessions using the existing `create_checkout_session` Edge Function.

**Dependencies:** Task 1

**Files:**
- Modify: `apps/web/app/checkout/page.tsx` (integrate Stripe Checkout redirect)
- Modify: `apps/web/app/api/create-payment-intent/route.ts` (call Supabase Edge Function or implement server-side Stripe)
- Create: `apps/web/app/orders/[orderId]/success/page.tsx` (payment success page)
- Create: `apps/web/app/orders/[orderId]/cancel/page.tsx` (payment cancelled page)
- Modify: `apps/mobile/app/(customer)/checkout.tsx` (add Stripe Checkout via WebView or expo-stripe)
- Create: `apps/web/lib/stripe.ts` (Stripe client initialization)
- Modify: `packages/data/src/orders-repository.ts` (add payment status methods)
- Create: `apps/web/__tests__/checkout.test.tsx`

**Key Decisions / Notes:**
- Web: Use `@stripe/stripe-js` (already in web dependencies) to redirect to Stripe Checkout
- Flow: Customer places order → order created with `payment_status: 'pending'` → redirect to Stripe Checkout → webhook updates status
- Mobile: Use `@stripe/stripe-react-native` or Expo WebView to open Stripe Checkout URL
- The Edge Function `create_checkout_session` already handles: auth verification, order lookup, platform fee calculation, Stripe session creation
- Success/cancel URLs route back to order detail pages
- Remove the "Payments temporarily disabled" alert from checkout
- Order creation must use authenticated user's ID (not guest) — requires auth gate from Task 1/9
- The `create-payment-intent` route at `apps/web/app/api/` should be removed entirely — all payment creation goes through Supabase Edge Function `create_checkout_session`

**Definition of Done:**
- [ ] Web checkout redirects to Stripe Checkout (test mode)
- [ ] Payment success page shows order confirmation with tracking token
- [ ] Payment cancel page allows retry
- [ ] Mobile checkout opens Stripe Checkout flow
- [ ] Order `payment_status` updates to 'succeeded' after successful payment (via webhook)
- [ ] "Payments temporarily disabled" alert removed from checkout
- [ ] `create-payment-intent` route either removed or properly implements Stripe

**Verify:**
- `pnpm --filter @home-chef/web build` — builds without errors
- `pnpm --filter @home-chef/web test -- --run` — checkout tests pass
- `grep -r "temporarily disabled" apps/web/` — returns zero results

---

### Task 5: Image Upload System

**Objective:** Implement image uploads using Supabase Storage for dish photos, chef profile photos, and delivery proof photos. Replace emoji placeholders with actual images.

**Dependencies:** Task 1

**Files:**
- Create: `packages/shared/src/storage.ts` (storage bucket names, upload helpers, URL generation)
- Create: `backend/supabase/migrations/20240107000000_add_storage_buckets.sql` (storage bucket policies)
- Modify: `apps/web/app/chefs/[chefId]/page.tsx` (display chef photos)
- Modify: `apps/web/app/chefs/page.tsx` (display chef photos in cards)
- Modify: `apps/mobile/app/(chef)/menu.tsx` (add image upload to dish creation/edit)
- Create: `packages/shared/src/image-upload.ts` (shared upload utility)
- Create: `apps/web/components/ImageUpload.tsx` (reusable image upload component)
- Create: `apps/mobile/components/ImagePicker.tsx` (mobile image picker using expo-image-picker)
- Test: `packages/shared/src/__tests__/storage.test.ts`

**Key Decisions / Notes:**
- 3 Supabase Storage buckets: `chef-photos`, `dish-photos`, `delivery-proof`
- Public read access for `chef-photos` and `dish-photos`, authenticated-only for `delivery-proof`
- Images resized client-side before upload (max 1200px width) to reduce storage costs
- Fallback to emoji/gradient placeholder when no image URL exists
- Migration adds RLS policies for storage buckets: chefs can upload to their own folders, public can read

**Definition of Done:**
- [ ] Storage migration creates 3 buckets with proper RLS policies
- [ ] Chef can upload dish photos from mobile menu management
- [ ] Dish photos display on web chefs page and chef detail page
- [ ] Chef profile photos display where emoji placeholders currently show
- [ ] Image upload component shows progress indicator
- [ ] Fallback placeholder renders when no image exists
- [ ] Upload utility handles errors gracefully (file too large, wrong format)

**Verify:**
- `pnpm --filter @home-chef/shared test -- --run` — storage tests pass
- `pnpm build` — full build succeeds
- Migration SQL is syntactically valid (checked by Supabase lint)

---

### Task 6: Customer Profile Management and Favorites

**Objective:** Replace the stub profile screen with full profile management (edit name, email, phone, delivery addresses) and add favorites functionality (favorite chefs and dishes for quick reorder).

**Dependencies:** Task 1, Task 5 (for profile photos)

**Files:**
- Modify: `apps/mobile/app/(customer)/profile.tsx` (full profile management screen)
- Create: `apps/mobile/app/(customer)/favorites.tsx` (favorites screen)
- Create: `backend/supabase/migrations/20240108000000_add_favorites.sql` (favorites table + saved addresses)
- Modify: `packages/shared/src/types.ts` (add Favorite, SavedAddress interfaces)
- Modify: `apps/mobile/app/(customer)/_layout.tsx` (add favorites tab)
- Create: `apps/web/app/account/page.tsx` (web profile management — currently exists but check implementation)
- Create: `packages/data/src/favorites-repository.ts` (favorites CRUD)
- Test: `packages/data/src/__tests__/favorites-repository.test.ts`

**Key Decisions / Notes:**
- Favorites table: `user_id`, `favoritable_type` (chef/dish), `favoritable_id`, `created_at`
- Saved addresses table: `user_id`, `label`, `address`, `lat`, `lng`, `is_default`
- Mobile profile screen: edit name, phone, manage saved addresses, upload profile photo
- Web account page: same functionality as mobile
- Favorites appear as heart icons on chef cards and dish cards
- "Reorder" button on past orders uses favorites + saved address

**Definition of Done:**
- [ ] Profile screen shows editable user info (name, email, phone)
- [ ] Users can add/edit/delete saved delivery addresses
- [ ] Users can favorite chefs and dishes (heart icon toggle)
- [ ] Favorites screen shows all favorited chefs and dishes
- [ ] Reorder from order history pre-fills cart with same items
- [ ] Migration creates favorites and saved_addresses tables with RLS
- [ ] Profile changes persist to Supabase

**Verify:**
- `pnpm --filter @home-chef/shared test -- --run` — favorites tests pass
- `pnpm build` — full build succeeds
- Migration SQL is syntactically valid

---

### Task 7: Search, Filters, Reviews and Ratings

**Objective:** Implement server-side search and filtering for chefs/dishes, and build a complete reviews and ratings system so customers can rate orders and browse chef ratings.

**Dependencies:** Task 1, Task 4 (reviews only after payment)

**Files:**
- Create: `backend/supabase/migrations/20240109000000_add_reviews.sql` (reviews table, rating aggregation)
- Modify: `packages/shared/src/types.ts` (add Review interface)
- Modify: `packages/shared/src/enums.ts` (add CuisineType enum)
- Create: `packages/data/src/reviews-repository.ts` (review CRUD)
- Modify: `apps/web/app/chefs/page.tsx` (server-side search, cuisine filters, rating sort)
- Create: `apps/web/app/chefs/[chefId]/reviews/page.tsx` (chef reviews page)
- Create: `apps/mobile/app/(customer)/review.tsx` (submit review screen)
- Modify: `apps/mobile/app/(customer)/orders.tsx` (add "Leave Review" button for delivered orders)
- Create: `apps/web/components/StarRating.tsx` (reusable star rating component)
- Test: `packages/data/src/__tests__/reviews-repository.test.ts`

**Key Decisions / Notes:**
- Reviews table: `customer_id`, `chef_id`, `order_id`, `rating` (1-5), `comment`, `created_at`
- One review per order (UNIQUE constraint on order_id)
- Chef rating is denormalized: `chefs.rating` = AVG of all reviews (updated by database trigger)
- Search: Supabase full-text search on chef name + bio + cuisine types
- Filters: cuisine type, rating range, availability
- Sort: rating (high to low), distance (if location available), newest

**Definition of Done:**
- [ ] Chefs page has search bar with server-side search (not client-side filter)
- [ ] Cuisine type filter dropdown works
- [ ] Sort by rating works
- [ ] Customers can submit 1-5 star review + comment for delivered orders
- [ ] Chef detail page shows average rating and individual reviews
- [ ] Chef `rating` column auto-updates when new review is submitted
- [ ] "Leave Review" button appears only for delivered orders without existing review

**Verify:**
- `pnpm --filter @home-chef/shared test -- --run` — reviews tests pass
- `pnpm build` — full build succeeds
- Migration SQL is syntactically valid

---

### Task 8: Real-time Updates, Push Notifications, Email Notifications

**Objective:** Replace polling with Supabase Realtime subscriptions for instant order updates. Add Expo push notifications for mobile. Add transactional email notifications for key events. Note: This task covers three notification channels but they share the same event triggers and notification infrastructure (Edge Function), so they are kept together.

**Dependencies:** Task 1, Task 4

**Files:**
- Modify: `apps/mobile/app/(customer)/tracking.tsx` (replace 10-second polling with Supabase Realtime)
- Modify: `apps/mobile/app/(chef)/orders.tsx` (subscribe to new order notifications)
- Create: `packages/data/src/use-subscribe-orders.ts` (already exists — enhance with Realtime)
- Create: `apps/mobile/lib/notifications.ts` (Expo push notification setup)
- Create: `backend/supabase/functions/send_notification/index.ts` (Edge Function for push + email)
- Create: `backend/supabase/functions/send_email/index.ts` (transactional email via Resend/SendGrid)
- Modify: `apps/mobile/app/_layout.tsx` (register push notification token on app start)
- Create: `backend/supabase/migrations/20240110000000_add_push_tokens.sql` (push token storage)
- Modify: `packages/shared/src/types.ts` (add PushToken interface)
- Test: `packages/data/src/__tests__/use-subscribe-orders.test.ts`

**Key Decisions / Notes:**
- Supabase Realtime: Subscribe to `orders` table changes filtered by user role
- Push notifications: `expo-notifications` — register token on login, store in `push_tokens` table
- Email: Use Resend or SendGrid via Edge Function — triggered by database webhooks or direct calls
- Notification events: new order (chef), order accepted (customer), order ready (customer/driver), order delivered (customer)
- Email events: order confirmation, order status change, payment receipt, chef application approved/rejected
- Database trigger on `orders` status change fires notification Edge Function

**Definition of Done:**
- [ ] Order tracking uses Supabase Realtime (no more 10-second polling)
- [ ] Chef receives push notification when new order arrives
- [ ] Customer receives push notification on order status changes
- [ ] Order confirmation email sent after successful payment
- [ ] Push token registered on app login, stored in database
- [ ] Unsubscribe from Realtime on component unmount (no memory leaks)

**Verify:**
- `pnpm --filter @home-chef/shared test -- --run` — subscription tests pass
- `pnpm build` — full build succeeds
- Migration SQL is syntactically valid
- Push notification Edge Function responds to test invocation

---

### Task 9: Error Handling, Input Validation, Security Hardening, Webhook Consolidation

**Objective:** Add comprehensive error boundaries, Zod validation on all forms and API inputs, rate limiting, audit logging, and consolidate the dual webhook architecture. Fix all security gaps identified in audit.

**Dependencies:** Task 1, Task 3, Task 4

**Files:**
- Create: `apps/web/app/error.tsx` (enhance existing — global error boundary)
- Create: `apps/web/components/ErrorBoundary.tsx` (reusable error boundary)
- Modify: `apps/admin/app/error.tsx` (enhance error handling)
- Modify: `packages/shared/src/schemas.ts` (add Zod schemas for all form inputs)
- Create: `packages/shared/src/zod/index.ts` (already exists — enhance with full validation schemas)
- Modify: `apps/web/app/checkout/page.tsx` (validate delivery address, customer info)
- Modify: `apps/mobile/app/(chef)/menu.tsx` (validate dish creation form)
- Delete or redirect: `apps/web/app/api/webhooks/payment/route.ts` (consolidate to Supabase Edge Function)
- Create: `apps/web/middleware.ts` (rate limiting, security headers, auth gate for checkout)
- Create: `backend/supabase/migrations/20240113000000_add_audit_log.sql` (audit_log table)
- Modify: `SECURITY.md` (already updated in Task 1 — add rate limiting and validation docs)
- Test: `packages/shared/src/__tests__/schemas.test.ts`

**Key Decisions / Notes:**
- Zod for runtime validation — already in `@home-chef/shared` dependencies
- Error boundaries at app level (global) + per-page level for critical pages
- Rate limiting: 100 req/15min general, 5 req/15min for auth endpoints (via Next.js middleware)
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP
- Validation on: all form submissions, all API route inputs, all Edge Function inputs
- Audit logging: log auth events, order state changes, admin actions to `audit_log` table
- **Webhook consolidation (CRITICAL SECURITY FIX):**
  - The Next.js webhook at `apps/web/app/api/webhooks/payment/route.ts` uses a custom `x-webhook-secret` header with a bypass fallback (`if (!webhookSecret) return true`) — this is a security hole
  - The Supabase Edge Function `webhook_stripe` already has proper Stripe signature verification via `constructEvent`
  - Consolidate ALL Stripe webhooks to the Edge Function. Remove or redirect the Next.js webhook route
  - This eliminates the race condition from dual webhook processing and the security bypass
- **Web auth gate:** Next.js middleware enforces authentication on `/checkout/*` routes — no more guest checkout creating orders with NULL customer_id

**Definition of Done:**
- [ ] All forms validate inputs before submission (Zod schemas)
- [ ] Error boundaries catch and display user-friendly error messages
- [ ] API routes validate request bodies with Zod
- [ ] Security headers set via middleware
- [ ] Rate limiting active on auth endpoints
- [ ] Invalid form input shows inline error messages
- [ ] Unhandled errors don't expose stack traces to users
- [ ] Dual webhook architecture eliminated — only Edge Function handles Stripe webhooks
- [ ] Next.js webhook route removed or redirects to Edge Function
- [ ] Web checkout routes require authentication via middleware
- [ ] Audit log table created with RLS policies

**Verify:**
- `pnpm --filter @home-chef/shared test -- --run` — schema validation tests pass
- `pnpm build` — full build succeeds
- `curl -I http://localhost:3001` — returns security headers
- `grep -r "x-webhook-secret" apps/web/` — returns zero results (webhook consolidated)
- `grep -r "webhookSecret" apps/web/app/api/webhooks/` — returns zero results

---

### Task 10: Full Driver Module

**Objective:** Build complete driver experience — job matching, order acceptance, status tracking through delivery, earnings dashboard, delivery proof photo upload, and foreground GPS tracking during active deliveries. This is a large task touching 12+ files; it is kept as one task because the driver module is a cohesive feature where components are tightly coupled (e.g., job acceptance feeds into active delivery, which feeds into earnings).

**Dependencies:** Task 1, Task 5 (delivery proof photos), Task 8 (push notifications for new jobs)

**Files:**
- Modify: `apps/mobile/app/(driver)/_layout.tsx` (add proper tab navigation: Jobs, Active, Earnings, Profile)
- Modify: `apps/mobile/app/(driver)/jobs.tsx` (replace stub — show available delivery jobs)
- Modify: `apps/mobile/app/(driver)/earnings.tsx` (replace stub — earnings dashboard)
- Create: `apps/mobile/app/(driver)/active.tsx` (active delivery tracking screen with GPS)
- Create: `apps/mobile/app/(driver)/profile.tsx` (driver profile and settings)
- Create: `apps/mobile/app/(driver)/delivery/[orderId].tsx` (delivery detail screen with map)
- Create: `apps/mobile/lib/location.ts` (foreground GPS tracking using expo-location)
- Create: `packages/data/src/deliveries-repository.ts` (delivery CRUD operations)
- Create: `backend/supabase/migrations/20240111000000_enhance_driver_module.sql` (driver availability, delivery assignment, location tracking columns)
- Modify: `packages/shared/src/types.ts` (add Driver interface, enhance Delivery interface with location fields)
- Modify: `packages/shared/src/enums.ts` (already has DeliveryStatus — verify completeness)
- Create: `backend/supabase/functions/assign_delivery/index.ts` (auto-assign or manual job acceptance)
- Modify: `apps/mobile/package.json` (add expo-location dependency)
- Test: `packages/data/src/__tests__/deliveries-repository.test.ts`

**Key Decisions / Notes:**
- Job flow: Order marked "ready" → notification sent to nearby available drivers → driver accepts → delivery created → driver picks up → delivers → marks delivered with proof photo
- Driver availability: toggle on/off in driver profile, stored in `drivers.is_available`
- Earnings: query `deliveries` table filtered by driver, sum delivery fees, show daily/weekly/monthly
- Delivery proof: photo uploaded to `delivery-proof` bucket (Task 5), URL stored in `deliveries.proof_url`
- Auto-assignment: V1 uses simple FIFO — first available driver gets notified, can accept or reject
- Delivery status progression: ASSIGNED → EN_ROUTE_TO_PICKUP → ARRIVED_AT_PICKUP → PICKED_UP → EN_ROUTE_TO_DROPOFF → ARRIVED_AT_DROPOFF → DELIVERED
- **GPS tracking:** Use `expo-location` for foreground GPS updates during active deliveries. Driver location (lat/lng) written to `deliveries` table every 15 seconds while delivery is active. Tracking stops when delivery is marked DELIVERED. Only foreground tracking (app must be open) — background tracking is out of scope.
- **Location permission:** Request `Permissions.LOCATION_FOREGROUND` when driver starts first delivery, with clear explanation UI. Handle permission denied gracefully.

**Definition of Done:**
- [ ] Driver sees available delivery jobs with order details
- [ ] Driver can accept/reject jobs
- [ ] Active delivery screen shows pickup/dropoff info and status progression
- [ ] Driver can mark each delivery status step
- [ ] Driver can upload delivery proof photo
- [ ] Earnings dashboard shows daily/weekly/monthly earnings
- [ ] Driver can toggle availability on/off
- [ ] Push notification received when new job is available
- [ ] GPS location updates every 15s during active delivery (foreground only)
- [ ] Driver location stored in deliveries table for customer tracking (Task 11)
- [ ] Location permission requested with clear rationale UI

**Verify:**
- `pnpm --filter @home-chef/shared test -- --run` — delivery tests pass
- `pnpm build` — full build succeeds
- Migration SQL is syntactically valid
- `grep "expo-location" apps/mobile/package.json` — dependency present

---

### Task 11: Google Maps Integration and Delivery Tracking

**Objective:** Integrate Google Maps API for location services — chef location display, delivery route visualization, customer delivery tracking with driver position, and distance-based chef sorting.

**Dependencies:** Task 10

**Files:**
- Create: `packages/shared/src/geo.ts` (geocoding helpers, distance calculation)
- Modify: `apps/mobile/app/(customer)/browse.tsx` (add map view for nearby chefs)
- Modify: `apps/mobile/app/(customer)/tracking.tsx` (show driver location on map)
- Modify: `apps/mobile/app/(driver)/active.tsx` (show route map with pickup/dropoff markers)
- Create: `apps/web/components/MapView.tsx` (web map component using @react-google-maps/api)
- Modify: `apps/web/app/tracking/page.tsx` (show delivery progress on map)
- Modify: `apps/mobile/app/(driver)/delivery/[orderId].tsx` (turn-by-turn navigation hints)
- Create: `backend/supabase/functions/geocode_address/index.ts` (geocode delivery addresses)
- Create: `backend/supabase/migrations/20240112000000_add_location_indexes.sql` (PostGIS or lat/lng indexes)
- Modify: `apps/web/package.json` (add @react-google-maps/api)
- Test: `packages/shared/src/__tests__/geo.test.ts`

**Key Decisions / Notes:**
- Mobile: Already has `react-native-maps` in dependencies — use it for map views
- Web: Add `@react-google-maps/api` for web map components
- Driver location updates: Supabase Realtime on `deliveries` table (driver updates lat/lng periodically)
- Distance sorting: Calculate Haversine distance client-side for nearby chefs
- Geocoding: Edge Function wraps Google Geocoding API to convert addresses → lat/lng
- ETA: Google Directions API via Edge Function for route + travel time estimates
- Location permission: Request on first use, store last known location

**Definition of Done:**
- [ ] Customer can see nearby chefs on a map
- [ ] Delivery tracking page shows driver location moving on map
- [ ] Driver sees route with pickup and dropoff markers
- [ ] Distance-based chef sorting works on browse page
- [ ] Addresses geocoded to lat/lng on order creation
- [ ] ETA displayed during active delivery
- [ ] Map components handle location permission gracefully

**Verify:**
- `pnpm --filter @home-chef/shared test -- --run` — geo tests pass
- `pnpm build` — full build succeeds
- Map components render without API key errors (graceful fallback)

---

### Task 12: Comprehensive Test Suite and CI/CD Hardening

**Objective:** Achieve 80%+ test coverage across all apps with unit, integration, and E2E tests. Harden CI/CD pipeline with linting, type checking, test gates, and deployment validation.

**Dependencies:** All previous tasks

**Files:**
- Create: `apps/web/__tests__/` (unit tests for all pages and components)
- Create: `apps/admin/__tests__/` (unit tests for all dashboard pages)
- Create: `packages/data/src/__tests__/` (integration tests for all repositories)
- Create: `packages/shared/src/__tests__/` (unit tests for all schemas, helpers, enums)
- Create: `e2e/` (Playwright E2E tests for critical user flows)
- Create: `e2e/customer-order-flow.spec.ts`
- Create: `e2e/chef-order-management.spec.ts`
- Create: `e2e/admin-chef-approval.spec.ts`
- Modify: `.github/workflows/ci.yml` (add test coverage gates, E2E, security scan)
- Create: `playwright.config.ts` (E2E test configuration)
- Modify: `package.json` (add test:coverage, test:e2e scripts)

**Key Decisions / Notes:**
- Unit tests: Mock Supabase client, test component rendering, form validation, state management
- Integration tests: Test repository classes against Supabase test instance or mocked client
- E2E tests: Playwright against running web app — critical flows only (order, chef management, admin)
- Coverage target: 80% for shared/data packages, 70% for apps (UI components harder to fully cover)
- CI pipeline additions: lint → typecheck → unit tests → build → E2E tests → coverage report
- Add coverage badges to README
- Security scanning: `npm audit` in CI, fail on critical vulnerabilities

**Definition of Done:**
- [ ] Unit test coverage >= 80% for `packages/shared` and `packages/data`
- [ ] Unit test coverage >= 70% for `apps/web` and `apps/admin`
- [ ] E2E test covers customer order flow end-to-end
- [ ] E2E test covers chef order management flow
- [ ] E2E test covers admin chef approval flow
- [ ] CI pipeline runs all tests and fails on coverage drop
- [ ] `npm audit` shows zero critical vulnerabilities
- [ ] All builds pass in CI

**Verify:**
- `pnpm test -- --run --coverage` — coverage meets thresholds
- `pnpm exec playwright test` — E2E tests pass
- `.github/workflows/ci.yml` includes test, coverage, and security scan steps
- `pnpm build` — full monorepo build succeeds

## Testing Strategy

- **Unit tests:** All shared packages (types, schemas, helpers), data layer (repositories with mocked Supabase), React components (rendering, user interaction, state)
- **Integration tests:** Repository classes against Supabase (test instance), Edge Functions (mocked Stripe), API routes
- **E2E tests (Playwright):** Customer order flow (browse → cart → checkout → payment → tracking), chef menu management + order processing, admin chef approval + analytics
- **Manual verification:** Stripe test payment end-to-end, push notification on real device, Google Maps rendering with valid API key, mobile app on iOS/Android simulators

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Schema reconciliation breaks existing seed data | Medium | High | Run seed script after migration to verify all demo data creates successfully; migration uses IF NOT EXISTS guards |
| Stripe Connect test mode differs from live | Medium | High | Use Stripe CLI for local webhook testing, test with real test cards, document known differences |
| Webhook consolidation loses events during transition | Low | High | Deploy Edge Function webhook first, verify it handles all event types, then remove Next.js webhook; never have zero handlers |
| Expo SDK 50 compatibility with new native modules (expo-location, expo-notifications) | Medium | Medium | Check expo SDK 50 compatibility table before installing; use expo-compatible alternatives; pin versions |
| Supabase Storage bucket policies too permissive | Low | High | Migration includes explicit RLS policies; integration test verifies unauthorized upload is rejected |
| Google Maps API costs exceed free tier | Medium | Low | Implement caching for geocoding results; use distance matrix sparingly; set billing alerts |
| Real-time subscriptions cause connection issues at scale | Low | Medium | Implement reconnection logic in Realtime subscriptions; fallback to polling on disconnect |
| Push notification token expiry | Medium | Low | Re-register token on each app launch; handle expired token errors in send_notification |
| Large image uploads slow down app | Medium | Medium | Client-side resize to max 1200px before upload; show progress indicator; abort on navigate away |
| Driver location updates drain battery | Medium | Medium | Foreground-only GPS (no background tracking); update every 15 seconds during active delivery; stop tracking immediately when delivery marked DELIVERED |
| Adding auth gate to checkout breaks existing guest order flow | Medium | Medium | Web middleware redirects to login with return URL to checkout; cart contents preserved in localStorage across login |

## Open Questions

- Which email service provider to use for transactional emails (Resend recommended for simplicity, SendGrid for scale)?
- Should chef onboarding require identity verification beyond Stripe Connect KYC?
- Should there be a minimum order amount or minimum delivery distance?
- What should happen when a driver doesn't accept a delivery within X minutes (auto-reassign)?

### Deferred Ideas

- Scheduled/pre-orders for future delivery times
- In-app chat between customer ↔ chef or customer ↔ driver
- Loyalty points / rewards program
- Multi-language support (i18n)
- Dark mode
- Desktop PWA
- Chef availability scheduling (operating hours)
- Promo code system (no schema exists — migration 6 is the commission system with `commission_records`, `payouts`, `platform_settings` tables)
