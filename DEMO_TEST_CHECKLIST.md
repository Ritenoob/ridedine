# RidenDine Demo - Manual Test Checklist (Snapshot)

**Purpose:** Pre-demo dry run checklist for manual verification
**Duration:** 15-20 minutes
**When to Use:** Before investor demo, after Vercel deployment
**Note:** Historical snapshot for demo planning. Validate against current repo state.

---

## Pre-Demo Setup (5 minutes)

### Environment Check

- [ ] Vercel deployment successful (check deployment URL)
- [ ] Supabase backend accessible (check project dashboard)
- [ ] Demo data seeded (run verification queries below)
- [ ] All environment variables configured
- [ ] No console errors in browser DevTools

### Quick Verification Queries

```sql
-- Verify demo data exists
SELECT COUNT(*) as chef_count FROM chefs WHERE status = 'active';
-- Expected: >= 10

SELECT COUNT(*) as menu_count FROM menu_items WHERE is_available = true;
-- Expected: >= 50

SELECT COUNT(*) as user_count FROM profiles WHERE role IN ('customer', 'chef', 'driver');
-- Expected: >= 15
```

### Browser Setup

- [ ] Open in Chrome/Edge (primary)
- [ ] Open DevTools (F12) - keep Console tab visible
- [ ] Clear browser cache and cookies
- [ ] Disable browser extensions (Incognito mode recommended)
- [ ] Set window to 1920x1080 resolution

---

## Critical Path Testing (10 minutes)

### ✅ 1. Customer Journey

#### 1.1 Browse Chefs

- [ ] Navigate to `/chefs`
- [ ] Verify: At least 8-10 chef cards visible
- [ ] Verify: Each card shows name, photo, cuisine types, rating
- [ ] Verify: Page loads in < 3 seconds
- [ ] Check: No console errors

**Expected Result:** Professional-looking chef grid with filtering options

**Screenshot:** Save as `demo-01-chefs-list.png`

---

#### 1.2 View Chef Menu

- [ ] Click on first chef card
- [ ] Verify: Chef detail page loads
- [ ] Verify: At least 3-5 menu items displayed
- [ ] Verify: Each item shows photo, name, price, description
- [ ] Verify: "Add to Cart" buttons enabled

**Expected Result:** Appetizing menu with clear pricing

**Screenshot:** Save as `demo-02-chef-menu.png`

---

#### 1.3 Add to Cart

- [ ] Click "Add to Cart" on first item
- [ ] Verify: Cart badge/counter increments to 1
- [ ] Click "Add to Cart" on second item
- [ ] Verify: Cart badge shows 2

**Expected Result:** Instant visual feedback on cart updates

---

#### 1.4 View Cart

- [ ] Navigate to `/cart`
- [ ] Verify: 2 items in cart
- [ ] Verify: Subtotal calculated correctly
- [ ] Verify: Delivery fee shown ($5.00)
- [ ] Verify: Platform fee shown (10% of subtotal)
- [ ] Verify: Total = Subtotal + Delivery + Platform fee
- [ ] Verify: "Checkout" button visible and enabled

**Expected Result:** Clear pricing breakdown, professional cart UI

**Screenshot:** Save as `demo-03-cart.png`

---

#### 1.5 Checkout Flow

- [ ] Click "Checkout" button
- [ ] Verify: Redirects to signin/auth page (auth gate working)
- [ ] Verify: Signin form shows email/password fields
- [ ] Verify: No errors, professional auth UI

**Expected Result:** Smooth redirect to authentication

**Screenshot:** Save as `demo-04-auth-gate.png`

**Note:** For demo, stopping at auth gate is acceptable. Full order placement requires backend integration.

---

### ✅ 2. Chef Dashboard

#### 2.1 Access Chef View

- [ ] Navigate to `/chef/dashboard` (or chef entry point)
- [ ] Verify: Dashboard accessible
- [ ] Verify: Shows pending orders section
- [ ] Verify: Shows active orders section
- [ ] Verify: No console errors

**Expected Result:** Professional chef management interface

**Screenshot:** Save as `demo-05-chef-dashboard.png`

---

#### 2.2 Order Management UI

- [ ] Verify: Order cards show customer name, items, total
- [ ] Verify: Action buttons visible (Accept, Start Cooking, Mark Ready)
- [ ] Verify: Order status clearly displayed

**Expected Result:** Clear, actionable order management

---

### ✅ 3. Admin Dashboard

#### 3.1 Access Admin View

- [ ] Navigate to admin dashboard (port 3000 or deployed URL)
- [ ] Verify: Dashboard loads successfully
- [ ] Verify: Shows key metrics (orders, revenue, active users)
- [ ] Verify: Charts/graphs visible (if implemented)

**Expected Result:** Executive-level overview dashboard

**Screenshot:** Save as `demo-06-admin-dashboard.png`

---

#### 3.2 Data Display

- [ ] Verify: Order list shows recent orders
- [ ] Verify: Chef approval section visible
- [ ] Verify: Data refreshes (check timestamps)

**Expected Result:** Real-time data monitoring

---

## Visual Quality Check (3 minutes)

### UI/UX Polish

- [ ] **Typography:** Clear, readable fonts at all sizes
- [ ] **Colors:** Consistent brand colors, good contrast
- [ ] **Spacing:** No cramped layouts, proper padding/margins
- [ ] **Images:** All chef/food photos load correctly
- [ ] **Buttons:** Clear hover states, professional styling
- [ ] **Forms:** Proper labels, validation messages
- [ ] **Loading States:** Spinners/skeletons show during data fetch
- [ ] **Empty States:** Graceful handling of empty data

### Responsive Check (Mobile)

- [ ] Open DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Set to iPhone 12 Pro (390x844)
- [ ] Navigate through: Home → Chefs → Cart
- [ ] Verify: All content readable, no horizontal scroll
- [ ] Verify: Touch targets large enough (buttons, links)

**Screenshot:** Save as `demo-07-mobile-view.png`

---

## Performance Check (2 minutes)

### Load Times

- [ ] Home page: < 2 seconds
- [ ] Chefs list: < 2 seconds
- [ ] Chef detail: < 1 second
- [ ] Cart page: < 1 second

### Browser Console

- [ ] No red errors in console
- [ ] No 404 network errors (check Network tab)
- [ ] No CORS errors
- [ ] No API authentication failures

**Expected Result:** All requests return 2xx status codes

---

## Deployment Verification (Vercel-Specific)

### Vercel Dashboard Check

- [ ] Deployment status: "Ready"
- [ ] Build logs: No errors
- [ ] Environment variables: All set
- [ ] Domain: Custom domain configured (if applicable)
- [ ] Analytics: Enabled (optional)

### Live URL Check

- [ ] URL accessible publicly (test in incognito)
- [ ] SSL certificate valid (https://)
- [ ] No mixed content warnings
- [ ] CDN caching working (check response headers)

---

## Contingency: Known Issues & Workarounds

### Issue: Chefs not loading

**Symptoms:** Empty chef list, loading spinner forever
**Check:** Supabase RLS policies allow public read on `chefs` table
**Fix:** Run `SELECT * FROM chefs LIMIT 1;` in Supabase SQL Editor
**Workaround:** Show pre-recorded demo video of this section

---

### Issue: Cart not persisting

**Symptoms:** Cart resets on page refresh
**Check:** localStorage accessible (check browser settings)
**Fix:** Clear browser cache, try incognito mode
**Workaround:** Add items again during demo, explain "temporary session storage"

---

### Issue: Images not loading

**Symptoms:** Broken image icons, alt text showing
**Check:** Supabase Storage bucket permissions (public read)
**Fix:** Re-upload images with correct permissions
**Workaround:** Focus on functionality, explain "image CDN optimizations in progress"

---

### Issue: Slow API responses

**Symptoms:** Requests taking > 5 seconds
**Check:** Supabase project not paused, no rate limiting
**Fix:** Restart Supabase project, check billing status
**Workaround:** Explain "demo environment, production will be optimized"

---

## Demo Day Checklist

### 30 Minutes Before Demo

- [ ] Run full manual test (this checklist)
- [ ] Take screenshots of all happy paths
- [ ] Prepare backup slides/video (in case of live demo failure)
- [ ] Check internet connection stable
- [ ] Close unnecessary browser tabs
- [ ] Disable notifications (DND mode)

### 5 Minutes Before Demo

- [ ] Open demo URL in fresh browser window
- [ ] Pre-load chefs page (cache warming)
- [ ] Have DevTools closed (cleaner screen)
- [ ] Set zoom to 100%
- [ ] Test screenshare (if virtual demo)

### During Demo

- **Narration Script:**
  1. "This is our customer marketplace where users browse local chefs..."
  2. "Each chef has a curated menu with pricing and dietary tags..."
  3. "Adding items to cart is instant with real-time updates..."
  4. "Our checkout flow integrates Stripe for secure payments..."
  5. "Chefs manage orders through this intuitive dashboard..."
  6. "Admins monitor platform health and revenue in real-time..."

- **Highlight Key Features:**
  - Clean, professional UI/UX
  - Real-time data updates
  - Mobile-responsive design
  - Secure authentication flow
  - Scalable architecture (mention tech stack)

- **Avoid:**
  - Clicking unimplemented features
  - Showing console errors
  - Admitting "this doesn't work yet" (frame as "roadmap item")

---

## Post-Demo Notes

**What Worked:**
- (List successful features)

**What Failed:**
- (List bugs encountered)

**Investor Questions:**
- (Record questions for follow-up)

**Action Items:**
- (High-priority fixes before next demo)

---

## Success Criteria

✅ **Demo passes if:**
- Customer can browse chefs and add items to cart (core UX flow works)
- No critical console errors during happy path
- UI looks professional and polished
- Performance acceptable (< 3s page loads)
- At least 80% of checklist items pass

❌ **Demo fails if:**
- Chefs list doesn't load at all
- Cart functionality broken
- Major console errors block core features
- UI looks unfinished or broken
- Performance unusable (> 10s page loads)

---

## Emergency Contacts

**Vercel Support:** [Vercel Dashboard](https://vercel.com/dashboard)
**Supabase Support:** [Supabase Dashboard](https://supabase.com/dashboard)
**Backup Demo Video:** `[link-to-backup-video.mp4]`

**Prepared by:** QA Team
**Last Updated:** 2026-02-25
**Version:** 1.0
