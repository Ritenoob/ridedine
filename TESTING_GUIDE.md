# Quick Testing Guide

## Before You Start

Ensure these services are running:
- **Frontend**: https://seancfafinlay.github.io/ridendine-demo/
- **Backend**: https://ridendine-demo.onrender.com

## Quick Test (5 minutes)

### 1. Open Frontend
```
https://seancfafinlay.github.io/ridendine-demo/
```

**Expected:**
- ✅ Page loads
- ✅ Small debug banner in top-right corner showing API info
- ✅ No errors in browser console (F12)

### 2. Check API Connection
Open browser console (F12) and look for:
```
[RideNDine] API_BASE_URL set to: https://ridendine-demo.onrender.com
```

**Expected:**
- ✅ Message appears
- ✅ No CORS errors
- ✅ No 404 errors

### 3. Test Demo Login (Admin)
1. Go to: `https://seancfafinlay.github.io/ridendine-demo/admin/login`
2. Click "Demo Mode: Bypass Login" button
3. Should redirect to admin dashboard

**Expected:**
- ✅ Redirects to `/admin`
- ✅ Shows admin navigation sidebar
- ✅ Logo displays correctly
- ✅ No errors in console

### 4. Test Demo Login (Chef)
1. Go to: `https://seancfafinlay.github.io/ridendine-demo/chef-portal/login`
2. Click "Demo Mode: Bypass Login" button

**Expected:**
- ✅ Redirects to `/chef-portal/dashboard`
- ✅ Shows chef navigation
- ✅ Can click between Dashboard/Orders/Menu

### 5. Test Demo Login (Driver)
1. Go to: `https://seancfafinlay.github.io/ridendine-demo/driver/login`
2. Click "Demo Mode: Bypass Login" button

**Expected:**
- ✅ Redirects to `/driver/jobs`
- ✅ Shows bottom navigation
- ✅ No errors

## Detailed Test (15 minutes)

### Test All Pages Load

```bash
# Home
https://seancfafinlay.github.io/ridendine-demo/

# Admin Pages
/admin/login ✓
/admin ✓
/admin/customers ✓
/admin/drivers ✓
/admin/operations ✓
/admin/payouts ✓
/admin/integrations ✓
/admin/live-map ✓

# Chef Pages
/chef-portal/login ✓
/chef-portal/dashboard ✓
/chef-portal/orders ✓
/chef-portal/menu ✓

# Driver Pages
/driver/login ✓
/driver ✓
/driver/jobs ✓

# Customer Pages
/ ✓
/chefs ✓
/cart ✓
/order-tracking ✓
```

### Check Browser Console

**Should see:**
```javascript
[API Base] Environment: {
  apiBase: "https://ridendine-demo.onrender.com",
  apiDomain: "ridendine-demo.onrender.com",
  isGitHubPages: true,
  isLocalhost: false,
  isCrossOrigin: true
}
```

**Should NOT see:**
- ❌ CORS errors
- ❌ 404 errors for assets
- ❌ JavaScript errors
- ❌ "Backend unavailable" messages (unless backend is actually down)

### Test API Endpoints Directly

Open these URLs in new tabs:

```
https://ridendine-demo.onrender.com/api/health
```
**Expected:** `{"status":"ok","demoMode":true,...}`

```
https://ridendine-demo.onrender.com/api/config
```
**Expected:** `{"demoMode":true,"appName":"RideNDine",...}`

### Test Session Persistence

1. Login to admin portal (demo bypass)
2. Navigate away (click a menu item)
3. Refresh the page

**Expected:**
- ✅ Still logged in
- ✅ Session cookie persists
- ✅ No re-authentication required

## Common Issues

### Issue: "CORS error"
**Cause:** Backend not allowing GitHub Pages origin  
**Fix:** Check `server/index.js` has `https://seancfafinlay.github.io` in `allowedOrigins`

### Issue: "404 for assets"
**Cause:** Using absolute paths instead of relative  
**Fix:** Ensure all asset paths use `./` prefix (e.g., `./assets/logo.svg`)

### Issue: "API calls fail"
**Cause:** Using hardcoded `fetch()` instead of `apiFetch()`  
**Fix:** All API calls should use `window.apiFetch()`

### Issue: "Backend unavailable" shows but backend is up
**Cause:** API health check failing  
**Fix:** Check network tab to see why `/api/health` fails

### Issue: "Demo login doesn't work"
**Cause:** `DEMO_MODE` not set on backend  
**Fix:** Set `DEMO_MODE=true` in Render environment variables

### Issue: "Pages don't load on GitHub Pages"
**Cause:** Base path not detected correctly  
**Fix:** Check `router.js` `detectBasePath()` function

## Debug Commands

### Check API from command line:
```bash
# Health check
curl https://ridendine-demo.onrender.com/api/health

# Config
curl https://ridendine-demo.onrender.com/api/config

# Test login
curl -X POST https://ridendine-demo.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

### Check CORS:
```bash
curl -H "Origin: https://seancfafinlay.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://ridendine-demo.onrender.com/api/auth/login \
  -v
```

**Expected headers in response:**
```
Access-Control-Allow-Origin: https://seancfafinlay.github.io
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Success Criteria

All these should be true:
- ✅ Frontend loads on GitHub Pages
- ✅ Backend API reachable from frontend
- ✅ No CORS errors
- ✅ Demo login works for all roles
- ✅ Assets (logos, images) display correctly
- ✅ Navigation works on all portals
- ✅ Session persists across page loads
- ✅ No JavaScript errors in console
- ✅ Debug banner shows API connection info

## Report Issues

If any tests fail:
1. Open browser console (F12)
2. Copy error messages
3. Check Network tab for failed requests
4. Create issue with:
   - URL where error occurred
   - Error message
   - Network request details
   - Browser and OS version
