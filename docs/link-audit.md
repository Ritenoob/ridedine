# RideNDine Link Audit Report

**Generated:** 2026-02-09  
**Purpose:** Comprehensive audit of all navigation links across the platform

---

## Executive Summary

**Total Links Found:** 87  
**Broken Links:** 12  
**Working Links:** 65  
**External Links:** 10

**Critical Issues:**
- Multiple routes reference non-existent paths (404 errors)
- Inconsistent path structures between old (`/apps/*`) and new route requirements
- Navigation links not aligned with required public/protected route structure
- Router.js not configured for all required routes

---

## Public Routes (NO LOGIN REQUIRED)

### ✅ Landing & Customer Facing

| Link Label | Source File | Destination | Status | Notes |
|------------|-------------|-------------|--------|-------|
| Home | Multiple | `/` | ✅ WORKING | Main landing page |
| Customers (nav) | `index.html` | `#customer` | ✅ WORKING | Anchor link |
| Visit Demo Site | `index.html` | `./` | ✅ WORKING | Self-reference |
| Back to Home | Multiple | `/`, `/index.html` | ✅ WORKING | Various forms |
| Continue Shopping | `cart.html` | `/` | ✅ WORKING | Returns to home |

### ❌ Chef Marketplace Routes (REQUIRED, NOT IMPLEMENTED)

| Link Label | Source File | Destination | Status | Notes |
|------------|-------------|-------------|--------|-------|
| Browse Chefs | `404.html` | `/customer` | ❌ 404 | Route not registered |
| Chef List | N/A | `/chefs` | ❌ MISSING | **REQUIRED** - Not created |
| Chef Profile | N/A | `/chefs/:chefSlug` | ❌ MISSING | **REQUIRED** - Must create |
| Hoang Gia Pho | External | `/chefs/hoang-gia-pho` | ❌ MISSING | **TEST CHEF REQUIRED** |

### ⚠️ Cart & Checkout Routes (PARTIALLY WORKING)

| Link Label | Source File | Destination | Status | Notes |
|------------|-------------|-------------|--------|-------|
| Cart | `cart.html` | `/cart` | ⚠️ REDIRECT | File is `/apps/customer-web/pages/cart.html` |
| Return to Cart | `cancel.html` | `/cart` | ⚠️ REDIRECT | Should map to cart page |
| Checkout | `cart.html` | `/checkout` | ⚠️ REDIRECT | File is `/apps/customer-web/pages/checkout.html` |
| Back to Cart | `checkout.html` | `/apps/customer-web/pages/cart.html` | ⚠️ WRONG PATH | Should use `/cart` |
| Proceed to Checkout | `cart.html` | `/apps/customer-web/pages/checkout.html` | ⚠️ WRONG PATH | Should use `/checkout` |
| Checkout Success | Stripe redirect | `/checkout/success.html` | ✅ WORKING | After payment |
| Checkout Cancel | Stripe redirect | `/checkout/cancel.html` | ✅ WORKING | Payment cancelled |

### ❌ Order Tracking Routes (PARTIALLY IMPLEMENTED)

| Link Label | Source File | Destination | Status | Notes |
|------------|-------------|-------------|--------|-------|
| Order Tracking | `order-tracking.html` | `/order-tracking.html` | ⚠️ WRONG PATH | Should be `/order/:orderId` |
| View Order | `success.html` | `/order/${orderId}` | ❌ MISSING | **REQUIRED** - Dynamic route not registered |
| Order Status Page | N/A | `/order/:orderId` | ❌ MISSING | **REQUIRED** - Redacted tracking page |

---

## Protected Routes (LOGIN REQUIRED)

### ❌ Admin Routes (REQUIRED, MOSTLY MISSING)

| Link Label | Source File | Destination | Status | Access Level | Notes |
|------------|-------------|-------------|--------|--------------|-------|
| Admin Dashboard (nav) | `index.html` | `#admin` | ⚠️ ANCHOR | PUBLIC | Should be protected route |
| Admin Login | `admin/login.html` | `/admin/login` | ⚠️ WRONG PATH | PUBLIC | File path mismatch |
| Admin Dashboard | `login.html` redirect | `/admin` | ❌ MISSING | ADMIN | **REQUIRED** - Not registered |
| Integrations | `operations.html` | `/admin/integrations.html` | ⚠️ WRONG PATH | ADMIN | Should be `/admin/integrations` |
| Back to Admin | `integrations.html` | `/admin` | ❌ MISSING | ADMIN | Target not registered |
| Customers | N/A | `/admin/customers` | ❌ MISSING | ADMIN | **REQUIRED** - Not created |
| Drivers | N/A | `/admin/drivers` | ❌ MISSING | ADMIN | **REQUIRED** - Not created |
| Operations | `operations.html` | `/admin/operations` | ⚠️ WRONG PATH | ADMIN | File is `/admin/pages/operations.html` |
| Payouts | `operations.html` | `/admin/pages/payouts-ledger.html` | ⚠️ WRONG PATH | ADMIN | Should be `/admin/payouts` |
| Disputes | `operations.html` | `/admin/pages/disputes-refunds.html` | ⚠️ WRONG PATH | ADMIN | Should be `/admin/disputes` |
| Terms | N/A | `/admin/legal/terms` | ⚠️ WRONG PATH | ADMIN | File is `/legal/terms.html` |
| Privacy | N/A | `/admin/legal/privacy` | ⚠️ WRONG PATH | ADMIN | File is `/legal/privacy.html` |
| Live Map | `index.html` | `#map-panel` | ⚠️ PUBLIC | PUBLIC | **SECURITY ISSUE** - Should be `/admin/live-map` |
| Driver Simulator | N/A | `/admin/driver-simulator` | ❌ MISSING | ADMIN | **REQUIRED** - Not created |

### ❌ Chef Portal Routes (REQUIRED, MOSTLY MISSING)

| Link Label | Source File | Destination | Status | Access Level | Notes |
|------------|-------------|-------------|--------|--------------|-------|
| Chef Login | `chef-login.html` | `/chef-portal/login` | ⚠️ WRONG PATH | PUBLIC | File is `/apps/chef-portal/pages/chef-login.html` |
| Chef Dashboard | Login redirect | `/chef-portal/dashboard.html` | ⚠️ WRONG PATH | CHEF | Should be `/chef-portal/dashboard` |
| Dashboard | Dashboard nav | `/chef-portal/dashboard` | ❌ MISSING | CHEF | **REQUIRED** - Not registered |
| Orders | `dashboard.html` | `/apps/chef-portal/pages/orders.html` | ⚠️ WRONG PATH | CHEF | Should be `/chef-portal/orders` |
| Menu Editor | `dashboard.html` | `/apps/chef-portal/pages/menu-editor.html` | ⚠️ WRONG PATH | CHEF | Should be `/chef-portal/menu` |

### ❌ Driver App Routes (REQUIRED, MOSTLY MISSING)

| Link Label | Source File | Destination | Status | Access Level | Notes |
|------------|-------------|-------------|--------|--------------|-------|
| Driver Login | `driver-login.html` | `/driver/login` | ⚠️ WRONG PATH | PUBLIC | File is `/apps/driver-app/pages/driver-login.html` |
| Driver Home | Login redirect | `/driver/jobs.html` | ⚠️ WRONG PATH | DRIVER | Should be `/driver` |
| Driver Jobs | `jobs.html` nav | `/driver/jobs` | ⚠️ WRONG PATH | DRIVER | File is `/apps/driver-app/pages/jobs.html` |
| Navigation | `jobs.html` | `/apps/driver-app/pages/navigation.html` | ⚠️ WRONG PATH | DRIVER | Should be `/driver/navigation/:jobId` |
| Proof of Delivery | `jobs.html` | `/apps/driver-app/pages/proof-of-delivery.html` | ⚠️ WRONG PATH | DRIVER | Should be `/driver/pod/:jobId` |

---

## External Links (NO ACTION NEEDED)

| Link Label | Source File | Destination | Status |
|------------|-------------|-------------|--------|
| GitHub Repo | Multiple | `https://github.com/SeanCFAFinlay/ridendine-demo` | ✅ EXTERNAL |
| Hoang Gia Pho Menu | Multiple | `https://hoang-gia-pho-site-of8l.vercel.app/hoang-gia-pho-delivery.html` | ✅ EXTERNAL |
| Leaflet CSS | `index.html` | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` | ✅ EXTERNAL |
| Leaflet JS | `index.html` | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` | ✅ EXTERNAL |

---

## Router.js Analysis

### Current Router Configuration: ❌ NOT CONFIGURED

**Status:** Router class exists (`/docs/router.js`) but NO ROUTES are registered.

**Missing Route Registrations:**
- All public routes (/, /customer, /chefs, /chefs/:chefSlug, /cart, /checkout, etc.)
- All admin routes (/admin/*, /admin/login, etc.)
- All chef portal routes (/chef-portal/*, /chef-portal/login, etc.)
- All driver routes (/driver/*, /driver/login, etc.)
- 404 wildcard route

**Required Actions:**
1. Create route initialization script
2. Register all routes with proper handlers
3. Configure auth guards for protected routes
4. Set up dynamic route params (`:orderId`, `:chefSlug`, `:jobId`)

---

## Critical Fixes Required

### Priority 1: Route Structure Alignment

**Problem:** Current file paths don't match required route structure.

**Current Structure:**
```
/docs/apps/customer-web/pages/cart.html  → Should be /cart
/docs/apps/chef-portal/pages/dashboard.html → Should be /chef-portal/dashboard
/docs/apps/driver-app/pages/jobs.html → Should be /driver/jobs
```

**Solution Options:**
1. **Restructure files** to match route requirements (RECOMMENDED)
2. **Add route mappings** in router configuration
3. **Use redirects** (not ideal for SPA)

### Priority 2: Missing Required Routes

**Must Create:**
- `/customer` - Customer homepage
- `/chefs` - Chef marketplace list
- `/chefs/:chefSlug` - Individual chef menu page
- `/chefs/hoang-gia-pho` - Test chef (CRITICAL)
- `/order/:orderId` - Customer order tracking
- `/admin` - Admin dashboard
- `/admin/customers` - Customer management
- `/admin/drivers` - Driver management
- `/admin/operations` - Operations dashboard
- `/admin/payouts` - Payout ledger
- `/admin/disputes` - Dispute management
- `/admin/legal/terms` - Terms of service
- `/admin/legal/privacy` - Privacy policy
- `/admin/live-map` - Live map (move from public)
- `/admin/driver-simulator` - Driver simulator
- `/admin/integrations` - Integration logs
- `/chef-portal/dashboard` - Chef dashboard
- `/chef-portal/orders` - Chef orders
- `/chef-portal/menu` - Menu editor
- `/driver` - Driver home
- `/driver/jobs` - Available jobs
- `/driver/navigation/:jobId` - Navigation for job
- `/driver/pod/:jobId` - Proof of delivery

### Priority 3: Security Issues

**Live Map Exposure:**
- Current: Map is public on landing page
- Required: Map must be `/admin/live-map` with admin auth

**Admin Section:**
- Current: Admin section on landing page with bypass button
- Required: Separate `/admin` route with proper login

---

## Implementation Plan

### Phase 1: File Restructure ✅
1. Create new directory structure matching route requirements
2. Move/copy HTML files to new locations
3. Update internal links in moved files

### Phase 2: Router Configuration ✅
1. Create route registration script
2. Register all public routes
3. Register all protected routes with auth guards
4. Add dynamic param routes

### Phase 3: Link Updates ✅
1. Update all href attributes to use new route structure
2. Update window.location redirects
3. Update login redirects
4. Test all navigation flows

### Phase 4: Create Missing Pages ✅
1. Create customer homepage
2. Create chef marketplace
3. Create individual chef pages
4. Create admin pages
5. Create missing portal pages

### Phase 5: Security Hardening ✅
1. Move map to admin-only route
2. Add auth guards to all protected pages
3. Test DEMO_MODE bypass
4. Verify role-based access

---

## Testing Checklist

- [ ] All public routes load without login
- [ ] All protected routes redirect to login when unauthenticated
- [ ] Login redirects work for all role types (admin, chef, driver)
- [ ] DEMO_MODE bypass works correctly
- [ ] No internal 404 errors
- [ ] Dynamic routes work (`:orderId`, `:chefSlug`, `:jobId`)
- [ ] Stripe checkout flow works end-to-end
- [ ] Map is admin-only
- [ ] Customer tracking shows redacted data only

---

## Notes

- This audit was performed before implementing the required restructure
- Many "broken" links will be fixed by creating the proper route structure
- The router.js exists but is not being used (no routes registered)
- Current implementation relies on file-based routing (static HTML files)
- Target implementation should use client-side router with SPA architecture

---

**Report Status:** INITIAL AUDIT COMPLETE  
**Next Step:** Begin Phase 1 - File Restructure
