# RidenDine Demo Deployment - Tomorrow Ready

**Target:** Full working demo by tomorrow
**Current Status:** All features implemented ✅
**Next:** Deploy + Test

## Quick Deployment Plan (3-4 hours)

### Step 1: Deploy Backend (30 min)

**Supabase Production Setup:**
```bash
# 1. Create production project at supabase.com
# 2. Run migrations
cd backend/supabase
supabase db push

# 3. Deploy Edge Functions
supabase functions deploy assign_driver
supabase functions deploy get_route
supabase functions deploy geocode_address
supabase functions deploy create_checkout_session
supabase functions deploy create_connect_account
supabase functions deploy webhook_stripe

# 4. Set production secrets
supabase secrets set GOOGLE_MAPS_API_KEY=your_key
supabase secrets set STRIPE_SECRET_KEY=your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_secret
```

### Step 2: Deploy Admin Dashboard (15 min)

**Vercel Deployment:**
```bash
cd apps/admin

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# ADMIN_PASSWORD=your_secure_password

vercel --prod
```

**URL:** Will be `ridendine-admin.vercel.app` (or custom domain)

### Step 3: Build Mobile App (30 min)

**EAS Build for Testing:**
```bash
cd apps/mobile

# Create .env with production Supabase
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EOF

# Build for internal testing
eas build --profile preview --platform all
```

**Result:** Download APK/IPA for demo devices

### Step 4: Smoke Test (1 hour)

**Critical Path Test:**
1. **Admin:** Approve a chef → Verify in DB
2. **Customer App:**
   - Browse dishes
   - Add to cart
   - Place order with real address (needs lat/lng)
3. **Chef App:**
   - Accept order
   - Mark "Ready" → **VERIFY auto-assignment triggers**
4. **Driver App:**
   - See job in list
   - Accept delivery
   - **VERIFY GPS tracking publishes**
5. **Customer Tracking:**
   - Open tracking page
   - **VERIFY live location updates**

### Step 5: Production Data Seed (30 min)

**Seed production database:**
```sql
-- Run via Supabase SQL Editor
-- Copy from: backend/supabase/migrations/20240103000000_seed_data.sql
-- Creates: 10 chefs, 50 dishes, 5 drivers
```

## Environment Variables Checklist

### Supabase
- [x] Production project created
- [ ] Migrations applied
- [ ] Edge Functions deployed
- [ ] Secrets configured
- [ ] RLS policies verified

### Vercel (Admin)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `ADMIN_PASSWORD`

### Mobile App
- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] EAS builds created

### External Services
- [ ] Google Maps API key (with Directions API enabled)
- [ ] Stripe API keys (test mode OK for demo)
- [ ] Stripe webhook configured → Edge Function URL

## Demo Script (Tomorrow)

**Show this flow:**

1. **Admin Panel** (5 min)
   - Show analytics dashboard
   - Approve a chef
   - Feature meals

2. **Customer Journey** (5 min)
   - Browse chefs
   - Add to cart
   - Checkout with delivery address
   - Place order

3. **Chef Experience** (3 min)
   - See order notification
   - Accept and prepare
   - Mark ready → **Auto-assignment happens**

4. **Driver Dispatch** (5 min)
   - Show driver gets assigned automatically
   - Driver accepts job
   - Start navigation
   - **Live GPS tracking on customer app**

5. **Realtime Magic** (2 min)
   - Show customer tracking page
   - Driver location updates live
   - Mark delivered → Order complete

**Total:** 20 min demo

## Known Issues to Fix Before Demo

1. **TypeScript errors in jobs.tsx** (lines 333-352)
   - Non-blocking but clean them up

2. **Test Supabase Realtime Broadcast**
   - Verify channel subscriptions work in production
   - Test reconnection on network drop

3. **Verify auto_assign_delivery trigger**
   - Test with production data
   - Check Edge Function logs for errors

## Backup Plan

If production deployment hits issues:
- Use Supabase staging project
- Use Expo Go for mobile (no build needed)
- Demo from local dev environment with ngrok for webhooks

## Contact Info

- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- EAS Dashboard: https://expo.dev/accounts/[your-account]/projects/ridendine

---

**Status:** Snapshot. Validate current deployment readiness against CI and live checks.
