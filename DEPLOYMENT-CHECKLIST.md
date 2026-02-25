# RidenDine Production Deployment Checklist

**Status: Code Ready âœ… | Infrastructure Ready on Payment ðŸ’³**

---

## ðŸš€ Quick Start (After Vercel Upgrade)

Once you upgrade your Vercel account, run:

```bash
# Deploy Web App
cd /home/nygmaee/Desktop/ridendine-demo-main
vercel deploy --prod --cwd apps/web

# Deploy Admin App
vercel deploy --prod --cwd apps/admin
```

**Expected Result:** Both apps will be live in ~3-5 minutes.

---

## ðŸ“‹ Pre-Launch Checklist

### 1. Vercel Account (ðŸ”´ REQUIRED - Action Needed)

- [ ] Upgrade Vercel account to paid tier
- [ ] Verify deployment limit is removed
- [ ] Confirm both projects exist:
  - `seancfafinlays-projects/web`
  - `seancfafinlays-projects/admin` (if separate project)

**Action:** Visit https://vercel.com/account/billing and upgrade

---

### 2. Supabase Setup (âœ… READY)

**Database URL:** `https://exzccczfixfoscgdxebbz.supabase.co`

#### 2.1 Execute Database Schema (One-Time Setup)

```bash
# Navigate to Supabase SQL Editor: https://supabase.com/dashboard/project/exzccczfixfoscgdxebbz/sql/new

# Copy and paste the entire contents of:
cat SETUP_SUPABASE.sql

# Click "Run" to execute
```

**Verify Tables Created:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Expected tables:
- profiles
- chefs
- menus
- menu_items
- orders
- order_items
- deliveries
- reviews
- notifications
- promo_codes
- support_tickets

#### 2.2 Enable Email Auth

1. Go to: https://supabase.com/dashboard/project/exzccczfixfoscgdxebbz/auth/providers
2. Enable "Email" provider
3. **Disable email confirmation** for easier testing (optional)
4. Set redirect URLs:
   - `https://your-web-domain.vercel.app/auth/callback`
   - `https://your-admin-domain.vercel.app/auth/callback`

#### 2.3 Storage Buckets

Create three public buckets in Supabase Storage:

```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public) VALUES
  ('chef-photos', 'chef-photos', true),
  ('dish-photos', 'dish-photos', true),
  ('delivery-proof', 'delivery-proof', true);
```

Or use UI: https://supabase.com/dashboard/project/exzccczfixfoscgdxebbz/storage/buckets

---

### 3. Stripe Setup (âš ï¸ Action Required)

**Current Status:** Stripe credentials needed

#### 3.1 Get Stripe Keys

1. Login to Stripe: https://dashboard.stripe.com
2. Navigate to Developers â†’ API Keys
3. Get both sets of keys:
   - **Test Keys** (for testing)
   - **Live Keys** (for production)

**Keys Needed:**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### 3.2 Configure Stripe Connect (for Chef Payouts)

1. Enable Connect: https://dashboard.stripe.com/settings/applications
2. Set Connect settings:
   - Platform name: "RidenDine"
   - Support email: your-email@domain.com
3. Add redirect URL: `https://your-web-domain.vercel.app/become-chef/callback`

#### 3.3 Set Up Webhooks

**Webhook Endpoint:** `https://exzccczfixfoscgdxebbz.supabase.co/functions/v1/webhook_stripe`

Events to subscribe to:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

**Get Webhook Secret:** After creating webhook, copy `whsec_...` value

---

### 4. Environment Variables

#### 4.1 Vercel Web App Environment Variables

Set these in Vercel Dashboard â†’ Project â†’ Settings â†’ Environment Variables:

```bash
# Supabase (ALREADY SET âœ…)
NEXT_PUBLIC_SUPABASE_URL=https://exzccczfixfoscgdxebbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

# Stripe (NEEDS VALUES - see section 3.1)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Google Maps (OPTIONAL - for delivery tracking)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# App URLs (UPDATE after deployment)
NEXT_PUBLIC_WEB_URL=https://your-web-domain.vercel.app
NEXT_PUBLIC_ADMIN_URL=https://your-admin-domain.vercel.app
```

#### 4.2 Vercel Admin App Environment Variables

Same as Web App (copy all variables)

#### 4.3 Supabase Edge Functions Secrets

```bash
# Set Stripe secret in Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

Or via UI: https://supabase.com/dashboard/project/exzccczfixfoscgdxebbz/settings/functions

---

### 5. Deploy Supabase Edge Functions

```bash
cd /home/nygmaee/Desktop/ridendine-demo-main/backend/supabase

# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref exzccczfixfoscgdxebbz

# Deploy all functions
supabase functions deploy create_connect_account
supabase functions deploy create_checkout_session
supabase functions deploy webhook_stripe
```

**Verify Functions:**
https://supabase.com/dashboard/project/exzccczfixfoscgdxebbz/functions

---

### 6. DNS & Custom Domain (OPTIONAL)

If you have a custom domain (e.g., ridendine.com):

#### 6.1 Add Domain to Vercel

1. Go to Vercel Project â†’ Settings â†’ Domains
2. Add domains:
   - `ridendine.com` â†’ Web App
   - `www.ridendine.com` â†’ Web App
   - `admin.ridendine.com` â†’ Admin App

#### 6.2 Update DNS Records

Add these records in your domain registrar:

```
Type    Name    Value
A       @       76.76.21.21 (Vercel IP - they'll provide)
CNAME   www     cname.vercel-dns.com
CNAME   admin   cname.vercel-dns.com
```

**Wait:** DNS propagation takes 24-48 hours

---

### 7. Final Verification Steps

After all deployments complete:

#### 7.1 Health Checks

```bash
# Web App API
curl https://your-web-domain.vercel.app/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

#### 7.2 Test User Flows

**Customer Flow:**
1. Visit web app
2. Sign up as customer
3. Browse chefs
4. Add items to cart
5. Checkout (use Stripe test card: 4242 4242 4242 4242)

**Chef Flow:**
1. Visit web app
2. Click "Become a Chef"
3. Fill application form
4. Admin approves chef
5. Chef creates menu
6. Chef receives orders

**Admin Flow:**
1. Visit admin app
2. Sign in as admin
3. Approve pending chefs
4. View orders dashboard
5. Check analytics

#### 7.3 Stripe Test Transactions

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**Verify:**
- Orders appear in admin dashboard
- Chef receives payout notification
- Platform fee (15%) is collected

---

### 8. Monitoring & Alerts (OPTIONAL)

#### 8.1 Vercel Analytics

Already enabled by default. View at:
- https://vercel.com/seancfafinlays-projects/web/analytics
- https://vercel.com/seancfafinlays-projects/admin/analytics

#### 8.2 Error Tracking

Consider adding Sentry:

```bash
pnpm add @sentry/nextjs
```

Set `SENTRY_DSN` in Vercel environment variables.

#### 8.3 Uptime Monitoring

Use free service like UptimeRobot:
- Monitor: https://your-web-domain.vercel.app/api/health
- Alert email if down

---

## ðŸŽ¯ Production Launch Day Checklist

**Pre-Launch (T-1 hour):**
- [ ] Verify all environment variables set
- [ ] Database schema executed
- [ ] Edge Functions deployed
- [ ] Stripe webhooks configured
- [ ] Test transactions work

**Launch (T-0):**
- [ ] Deploy web app: `vercel deploy --prod --cwd apps/web`
- [ ] Deploy admin app: `vercel deploy --prod --cwd apps/admin`
- [ ] Verify both apps load
- [ ] Run health checks
- [ ] Test one complete order flow

**Post-Launch (T+1 hour):**
- [ ] Monitor Vercel logs for errors
- [ ] Check Supabase database for orders
- [ ] Verify Stripe payments flowing
- [ ] Share URLs with beta users in Hamilton

---

## ðŸ“± App URLs (After Deployment)

**Customer Web App:**
- Vercel: `https://web-[hash].vercel.app`
- Custom: `https://ridendine.com` (if domain configured)

**Admin Dashboard:**
- Vercel: `https://admin-[hash].vercel.app`
- Custom: `https://admin.ridendine.com` (if domain configured)

**Mobile App:** (Phase 2)
- iOS: Submit to App Store
- Android: Submit to Google Play

---

## ðŸ†˜ Troubleshooting

### "Module not found" errors
```bash
# Rebuild all packages
pnpm install --frozen-lockfile
pnpm build:shared
pnpm --filter @home-chef/web build
pnpm --filter @home-chef/admin build
```

### "Supabase connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- Check Supabase project is not paused: https://supabase.com/dashboard/project/exzccczfixfoscgdxebbz

### "Stripe payment fails"
- Verify `STRIPE_SECRET_KEY` is set in both Vercel and Supabase
- Check webhook endpoint is receiving events: https://dashboard.stripe.com/webhooks
- Ensure webhook secret matches `STRIPE_WEBHOOK_SECRET`

### "Orders not appearing"
- Check Supabase logs: https://supabase.com/dashboard/project/exzccczfixfoscgdxebbz/logs/postgres-logs
- Verify RLS policies allow inserts
- Check browser console for errors

---

## ðŸ“ž Support Contacts

**Vercel Support:** support@vercel.com
**Supabase Support:** https://supabase.com/dashboard/support
**Stripe Support:** https://support.stripe.com

---

## ðŸŽ‰ What Happens After Upgrade?

1. **Immediate:** Deploy web and admin apps (5 minutes)
2. **In 10 minutes:** First customers can sign up in Hamilton
3. **In 30 minutes:** First chef can create menu
4. **In 1 hour:** First order can be placed and paid
5. **Business is LIVE!** ðŸš€

---

**Last Updated:** February 24, 2026
**Status:** Ready for Vercel upgrade and launch

