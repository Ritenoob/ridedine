# Security Policy

## Architecture Overview

RidenDine uses a modern Supabase-based architecture with built-in security features:

- **Frontend:** Next.js 15 (web/admin) + React Native/Expo 50 (mobile)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Authentication:** Supabase Auth (JWT tokens, email/password)
- **Authorization:** Row Level Security (RLS) policies on all tables
- **Payments:** Stripe Connect with webhook signature verification
- **Deployment:** Vercel (web/admin), EAS (mobile), Supabase Cloud (backend)

---

## Security Measures Implemented

### Authentication & Authorization

✅ **Supabase Auth**
- JWT-based authentication (not session-based)
- Email/password authentication with secure password hashing (bcrypt)
- Role-based access control via `profiles.role` column (`admin`, `chef`, `driver`, `customer`)
- Protected routes via Supabase session validation
- Server-side middleware validates sessions on protected routes

✅ **Row Level Security (RLS)**
- All database tables have RLS enabled
- Policies enforce role-based data access:
  - Customers can only see their own orders
  - Chefs can only manage their own dishes and orders
  - Drivers can only see assigned deliveries
  - Admins have elevated access for management functions
- RLS policies defined in migration files (`backend/supabase/migrations/`)

✅ **Protected Routes**
- Admin dashboard requires `profiles.role === 'admin'`
- Chef/Driver screens validate role before rendering
- Checkout requires authenticated user (auth gate added in Task 9)

### Data Protection

✅ **Sensitive Data Redaction**
- Chef addresses not exposed to customers via RLS policies
- Order tracking API returns only necessary data
- Profile emails/phones protected by RLS
- Delivery driver location only visible during active deliveries

✅ **Secrets Management**
- Supabase credentials (URL, anon key, service role key) stored in environment variables
- Stripe keys (secret, publishable, webhook secret) in environment variables
- **⚠️ Admin master password:** Hardcoded password removed in Task 3 (replaced with Supabase Auth)
- Never commit secrets to version control (`.env.local` gitignored)

✅ **Storage Security**
- Supabase Storage buckets (`chef-photos`, `dish-photos`, `delivery-proof`)
- RLS policies on storage:
  - Public read for `chef-photos` and `dish-photos`
  - Authenticated-only for `delivery-proof`
  - Chefs can upload to their own folders only

### Payment Security

✅ **Stripe Connect Integration**
- Stripe Checkout for PCI-compliant payment processing
- No payment card data stored on server
- Platform fee (15%) deducted automatically
- Direct payouts to chef Stripe Connect accounts

✅ **Webhook Security**
- **Edge Function webhook:** `backend/supabase/functions/webhook_stripe/index.ts`
  - Proper Stripe signature verification via `stripe.webhooks.constructEvent()`
  - Validates `Stripe-Signature` header before processing events
- **⚠️ Dual webhook architecture eliminated:** Next.js webhook at `apps/web/app/api/webhooks/payment/` had security bypass (`if (!webhookSecret) return true`) — removed in Task 9

✅ **Payment Validation**
- Server-side order validation before creating Stripe session
- Order totals recalculated server-side (not trusted from client)
- Payment status tracked in database (`payment_status` column)

### API Security

✅ **Edge Functions (Deno Runtime)**
- `create_checkout_session`: Creates Stripe payment sessions
- `create_connect_account`: Onboards chefs to Stripe Connect
- `webhook_stripe`: Handles Stripe webhook events
- All Edge Functions validate Supabase Auth tokens before processing

✅ **CORS Configuration**
- Supabase automatically handles CORS for Edge Functions
- Next.js API routes (if any) configured with proper CORS headers

---

## Known Limitations (MVP/Beta)

### Rate Limiting
⚠️ **Status:** Partially implemented (Task 9)
**Current State:**
- Supabase has built-in rate limiting on Edge Functions
- Next.js middleware adds rate limiting on auth endpoints (Task 9)
- General rate limits: 100 req/15min per IP
- Auth endpoints: 5 req/15min per IP

**Production Mitigation:**
- Add rate limiting middleware to all Next.js routes
- Implement per-user rate limits in addition to per-IP
- Use Vercel's Edge Config for distributed rate limiting
- Monitor rate limit violations in Supabase dashboard

### Input Validation
⚠️ **Status:** In progress (Task 9)
**Current State:** Basic client-side validation only
**Impact:** Potential injection attacks

**Production Mitigation:**
- **Task 9:** Adds Zod validation on all forms and API inputs
- Validate Edge Function inputs with Zod schemas
- Sanitize user inputs before database queries (Supabase client does this automatically for SQL injection)
- Implement strict TypeScript types throughout

### Error Handling
⚠️ **Status:** In progress (Task 9)
**Current State:** Unhandled errors may expose stack traces
**Impact:** Information disclosure

**Production Mitigation:**
- **Task 9:** Adds error boundaries to web/admin apps
- Never expose stack traces to users in production
- Log errors to Supabase (or external service like Sentry)
- Return generic error messages to clients

### HTTPS
✅ **Enforced in Production**
- Vercel automatically provides HTTPS for web/admin deployments
- Supabase Cloud uses HTTPS for all API requests
- Set `secure: true` for cookies in production (handled by Supabase Auth)
- HSTS headers recommended (Task 9 adds security headers)

### CSRF Protection
⚠️ **Status:** Partially protected
**Current State:** Supabase Auth uses JWTs (not cookies), which are immune to CSRF
**Impact:** Low risk with JWT-based auth

**Production Mitigation:**
- If using cookie-based sessions anywhere, add CSRF tokens
- Set `SameSite=Strict` or `SameSite=Lax` on any cookies
- Supabase Auth handles this automatically for its session cookies

### Admin Authentication
⚠️ **Status:** Fixed in Task 3
**Old Issue:** Admin used hardcoded `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD`
**Resolution:** Replaced with Supabase Auth — admins log in via email/password with `profiles.role === 'admin'`

### Webhook Security
✅ **Fixed in Task 9**
**Old Issue:** Dual webhook architecture with security bypass in Next.js webhook
**Resolution:** Consolidated to single Edge Function webhook with proper Stripe signature verification

---

## Security Best Practices for Production

### Production Checklist

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` to production Supabase project
- [ ] Use production Supabase anon key and service role key
- [ ] Set Stripe keys to live mode (`sk_live_...`, `pk_live_...`)
- [ ] Configure Stripe webhook to point to production Edge Function URL
- [ ] Enable all Supabase RLS policies
- [ ] Set `NODE_ENV=production` in Vercel
- [ ] Configure proper CORS policies in Supabase dashboard
- [ ] Set up Supabase monitoring and logging
- [ ] Implement database backups (Supabase automatic backups enabled)
- [ ] Add security headers via Next.js middleware (Helmet-style headers)
- [ ] Configure rate limiting based on expected traffic
- [ ] Add request logging and audit trail (audit_log table added in Task 9)
- [ ] Implement proper error handling (error boundaries in Task 9)
- [ ] Set up security scanning (`npm audit` in CI/CD - Task 12)
- [ ] Review and test all RLS policies
- [ ] Verify Stripe webhook signature verification is working
- [ ] Test authentication flows end-to-end
- [ ] Audit Supabase Storage bucket policies

### Environment Variables (Production)

**Web/Admin `.env.local`:**
```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>

# Stripe (Live Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Server
NODE_ENV=production
```

**Edge Functions (Supabase Dashboard → Settings → Secrets):**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=<sendgrid-key>  # or RESEND_API_KEY
```

**Mobile (Expo):**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Reporting Security Issues

If you discover a security vulnerability, please email **security@ridendine.com** or create a private GitHub security advisory. Do not create public issues for security vulnerabilities.

---

## Security Updates

- Regular dependency updates via `npm audit` (CI/CD check in Task 12)
- Monitor Supabase security advisories
- Monitor Stripe API changelog for security updates
- Subscribe to security mailing lists for Next.js, React Native, Expo
- Review Supabase RLS policies quarterly

---

## Compliance Notes

- **PCI DSS:** Payment handling delegated to Stripe (PCI Level 1 certified)
- **GDPR:** Customer data minimization implemented via RLS policies
- **Data Retention:** Orders stored in Supabase PostgreSQL with automatic backups
- **Right to Deletion:** Implement user data export and deletion flows (Task 9 adds audit log for deletion tracking)

---

## Last Updated

This security policy was last updated on 2026-02-23 to reflect the actual Supabase + Next.js + React Native architecture.
