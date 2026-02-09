# GitHub Pages Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Changes Complete
- [x] `.nojekyll` file added to `/docs`
- [x] `router.js` updated with base path detection
- [x] `routes.js` updated to use base path in fetch calls
- [x] `index.html` converted to relative paths
- [x] `404.html` configured as SPA fallback
- [x] `checkout/success.html` updated with base path support
- [x] `checkout/cancel.html` updated with base path support
- [x] Security issues fixed (CodeQL 0 alerts)
- [x] Code review feedback addressed

### ✅ Security Verification
- [x] CodeQL scan passes with 0 alerts
- [x] No XSS vulnerabilities introduced
- [x] Domain validation uses `endsWith()` not `includes()`
- [x] No sensitive data exposed
- [x] Auth guards still function correctly

## GitHub Pages Configuration

### Step 1: Enable GitHub Pages
1. Go to: https://github.com/SeanCFAFinlay/ridendine-demo/settings/pages
2. Under "Source", select: **Deploy from a branch**
3. Select branch: **main** or your PR branch
4. Select folder: **/docs**
5. Click **Save**
6. Wait 1-2 minutes for deployment

### Step 2: Verify Deployment
After deployment completes, GitHub will show the URL:
- **Expected URL:** https://seancfafinlay.github.io/ridendine-demo/

### Step 3: Test Basic Functionality
Visit the following URLs to verify everything works:

#### Public Routes (No Login Required)
- [ ] https://seancfafinlay.github.io/ridendine-demo/
  - Landing page should load
  - Styles should be applied
  - No console errors
  
- [ ] https://seancfafinlay.github.io/ridendine-demo/customer
  - Customer page should load via SPA routing
  - Navigation should work
  
- [ ] https://seancfafinlay.github.io/ridendine-demo/chefs
  - Chef list page should load
  - No 404 errors

#### Deep Link Refresh Test
- [ ] Visit: https://seancfafinlay.github.io/ridendine-demo/customer
  - Press F5 to refresh
  - Should NOT show permanent 404
  - Should redirect through 404.html back to SPA
  - Should show customer page

#### Protected Routes (Should Redirect to Login)
- [ ] https://seancfafinlay.github.io/ridendine-demo/admin
  - Should redirect to `/admin/login` (via auth guard)
  
- [ ] https://seancfafinlay.github.io/ridendine-demo/admin/dashboard
  - Should redirect to `/admin/login` if not authenticated

#### Checkout Pages (Standalone)
- [ ] https://seancfafinlay.github.io/ridendine-demo/checkout/success.html
  - Page should load (may show "No session found" - expected)
  - Styles should be applied
  - "Back to Home" link should work
  
- [ ] https://seancfafinlay.github.io/ridendine-demo/checkout/cancel.html
  - Page should load
  - Styles should be applied
  - Links should work

#### 404 Handling
- [ ] https://seancfafinlay.github.io/ridendine-demo/nonexistent-page
  - Should briefly show "Redirecting..." from 404.html
  - Should redirect to index.html
  - Router should show 404 page (via `*` route)

## Expected Behavior

### ✅ What Should Work
1. **Landing page loads** - Main index.html renders correctly
2. **Navigation works** - Clicking links navigates without page reload
3. **Deep links work** - Visiting routes directly routes correctly after 404 redirect
4. **Browser refresh works** - Refreshing on any route doesn't break the app
5. **Back/forward buttons work** - Browser history navigation works
6. **Auth guards work** - Protected routes redirect to login
7. **Styles load** - CSS is applied correctly
8. **Scripts load** - router.js, routes.js, auth-client.js load

### ⚠️ What Won't Work (Expected Limitations)
1. **API calls** - Backend is not deployed on GitHub Pages
   - `/api/*` endpoints will fail (GitHub Pages only serves static files)
   - Need separate backend deployment (Heroku, Vercel, Railway, etc.)
   
2. **Stripe checkout** - Server-side Stripe integration won't work
   - Checkout flow requires backend server
   - Success/cancel pages will load but won't verify payments
   
3. **Real authentication** - Cookie-based auth requires backend
   - DEMO_MODE should still work (client-side only)
   - Real login will fail without backend
   
4. **Database operations** - No database on GitHub Pages
   - Can't fetch real chef/order data
   - Static pages only

### 🔧 Future Enhancements (Not Required for This PR)
1. Deploy backend to Heroku/Vercel/Railway
2. Update CORS settings to allow GitHub Pages origin
3. Update Stripe redirect URLs to use GitHub Pages domain
4. Consider using environment variables for API_BASE_URL
5. Fix asset image paths in page content (change `/assets/*` to relative)

## Troubleshooting

### Issue: "Site not found" error
**Cause:** GitHub Pages not enabled or wrong settings  
**Fix:** Check Settings → Pages → Source is set to `/docs` from branch

### Issue: Styles not loading (unstyled content)
**Cause:** Base path detection failed or CSS file missing  
**Fix:** 
1. Check browser console for 404 errors
2. Verify `/docs/styles.css` exists in repo
3. Check that `.nojekyll` file exists

### Issue: Page shows 404 permanently (doesn't redirect)
**Cause:** 404.html not being served by GitHub Pages  
**Fix:**
1. Verify `/docs/404.html` exists
2. Check GitHub Pages settings
3. Clear browser cache and try again

### Issue: Navigation doesn't work (page reloads)
**Cause:** JavaScript not loading or errors  
**Fix:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify router.js and routes.js loaded
4. Check network tab for failed script loads

### Issue: Deep links show wrong page
**Cause:** Router base path detection issue  
**Fix:**
1. Check browser console
2. Verify hostname detection: `window.Router.basePath`
3. Should be `/ridendine-demo` on GitHub Pages
4. Should be empty on localhost

### Issue: Auth doesn't work
**Cause:** Backend not deployed (expected)  
**Fix:**
1. For demo: Use DEMO_MODE
2. For production: Deploy backend separately
3. Update API endpoints in code

## Success Criteria

The deployment is successful when:
- [ ] Landing page loads without errors
- [ ] At least one customer route works (e.g., `/customer`)
- [ ] Deep link refresh doesn't show permanent 404
- [ ] Navigation between pages works
- [ ] Checkout pages load correctly
- [ ] No critical console errors (404s for API are expected)

## Post-Deployment

### Share the Live URL
Once verified, the app will be live at:
```
https://seancfafinlay.github.io/ridendine-demo/
```

### Monitor GitHub Actions
- Check: https://github.com/SeanCFAFinlay/ridendine-demo/actions
- Ensure "pages-build-deployment" workflow succeeds
- Look for any deployment errors

### Next Steps (Optional)
1. Set up backend deployment
2. Configure custom domain (if desired)
3. Add HTTPS enforcement (automatic on GitHub Pages)
4. Monitor for issues and user feedback

## Rollback Plan

If deployment fails or causes issues:
1. Go to Settings → Pages
2. Change Source to "None" or previous working branch
3. Wait for deployment to complete
4. Fix issues in branch before re-deploying

---

**Note:** This checklist assumes you're deploying the frontend only. The backend (`/server`) requires separate deployment to a Node.js hosting service.
