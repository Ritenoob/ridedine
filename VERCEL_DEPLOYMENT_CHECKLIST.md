# Vercel Deployment Verification Checklist

**Use this checklist immediately before the demo to verify everything is working.**

---

## Pre-Demo Verification (15 min before go-live)

### Phase 1: Build Status Check (2 min)

#### Admin Dashboard
- [ ] Go to https://vercel.com/dashboard
- [ ] Click **ridendine-admin**
- [ ] Status shows **Ready** (not Building, Failed, or Error)
- [ ] Last deployment shows **green checkmark**
- [ ] Deployment timestamp is recent (within last 1 hour)

#### Web App
- [ ] Click **ridendine-web**
- [ ] Status shows **Ready**
- [ ] Last deployment shows **green checkmark**
- [ ] Deployment timestamp is recent

**If either shows Failed/Error:**
- Click on failing deployment
- Go to **Logs** tab
- Look for error messages (scroll to bottom)
- Common causes:
  - Missing environment variables
  - Wrong Root Directory
  - Supabase URL/key incorrect

### Phase 2: Environment Variables Check (2 min)

#### Admin Dashboard
- [ ] Go to **ridendine-admin → Settings → Environment Variables**
- [ ] Verify these exist in **Production** scope:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] All three show as "●●●●●●●●" (masked, indicating they're set)

#### Web App
- [ ] Go to **ridendine-web → Settings → Environment Variables**
- [ ] Verify these exist in **Production** scope:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Both show as "●●●●●●●●" (masked)

**If any are missing:**
- Add them now (See **VERCEL_SETUP_FULL.md** Phase 3)
- Click **Redeploy** to apply changes

### Phase 3: Deployment URLs Check (2 min)

#### Admin App
- [ ] Go to **ridendine-admin → Deployments**
- [ ] Find most recent deployment
- [ ] Copy the **Domains** URL (should be something like `ridendine-admin-[hash].vercel.app`)
- [ ] **Note this URL** for demo

#### Web App
- [ ] Go to **ridendine-web → Deployments**
- [ ] Find most recent deployment
- [ ] Copy the **Domains** URL (should be something like `ridendine-web-[hash].vercel.app`)
- [ ] **Note this URL** for demo

### Phase 4: Load & Accessibility Test (4 min)

#### Admin Dashboard Load Test
1. [ ] Open a **new incognito/private browser window**
2. [ ] Paste the admin URL into address bar
3. [ ] Wait for page to fully load (should take 3-5 seconds)
4. [ ] Verify:
   - [ ] Page loads without white screen or 500 errors
   - [ ] Admin gate/login screen is visible
   - [ ] No red error messages in console (press F12, check Console tab)
   - [ ] All images/CSS loaded (no broken elements)

**If page doesn't load or shows 500 error:**
- Click **Deployments** in Vercel
- Click the failing deployment
- Go to **Logs** tab
- Note the error message
- See **Rollback Procedure** below

#### Web App Load Test
1. [ ] Open a **new incognito/private window**
2. [ ] Paste the web URL into address bar
3. [ ] Wait for page to fully load
4. [ ] Verify:
   - [ ] Home page displays
   - [ ] Navigation menu visible and clickable
   - [ ] No 404 or 500 errors
   - [ ] No console errors (press F12)

### Phase 5: Functionality Test (5 min)

#### Admin Dashboard
1. [ ] Navigate to `/dashboard` (append to admin URL)
   - [ ] Page loads
   - [ ] No 404 errors
2. [ ] Try navigating to `/dashboard/orders`
   - [ ] Page loads
   - [ ] Shows order table (may be empty if no seed data)
3. [ ] Check browser console (F12 → Console tab)
   - [ ] No red error messages
   - [ ] No "Cannot find module" warnings

#### Web App
1. [ ] Click on navigation links:
   - [ ] Home → loads
   - [ ] Chefs (if route exists) → loads
   - [ ] Cart (if route exists) → loads
2. [ ] Check browser console
   - [ ] No red errors
   - [ ] No network errors (Network tab)

### Phase 6: Response Time Check (1 min)

#### First Contentful Paint (FCP)

1. [ ] Open admin app in new incognito window
2. [ ] Press F12 → Network tab
3. [ ] Reload page
4. [ ] Check "Finish" time in Network tab
   - [ ] ✅ Under 5 seconds = good
   - [ ] ⚠️ 5-10 seconds = acceptable
   - [ ] ❌ Over 10 seconds = investigate logs

**Same for web app**

### Phase 7: Supabase Connectivity (2 min)

#### Admin App
1. [ ] Open admin URL in browser
2. [ ] Press F12 → Network tab
3. [ ] Look for requests to `supabase.co`
   - [ ] Should see requests like `/rest/v1/...`
   - [ ] Status should be 200, 201, or 204
4. [ ] If you see **403 or 401 errors:**
   - Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
   - Verify Supabase project allows public access

#### Web App
1. [ ] Same as admin
2. [ ] Verify Supabase requests are working

---

## Critical Issue Resolution

### Issue: "Deployment Status is Failed"

**Step 1: Check Build Logs**
```
1. Vercel Dashboard → [Project] → Deployments → [Failed Deploy]
2. Click "Logs" tab
3. Scroll to bottom to find error
```

**Common Build Errors & Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `ENOENT: no such file or directory, scandir 'apps/admin'` | Wrong Root Directory | Go to Settings → General → Root Directory → Set to `apps/admin` |
| `Cannot find module '@home-chef/shared'` | Missing pnpm-lock.yaml or monorepo issue | Check pnpm-lock.yaml exists at repo root |
| `env var NEXT_PUBLIC_SUPABASE_URL is not set` | Missing env vars | Settings → Environment Variables → Add vars for Production |
| `502 Bad Gateway` after deployment | Runtime error | Check Vercel Logs during deployment; likely Supabase connection issue |

**Step 2: Redeploy After Fixing**
```
1. Click "Redeploy" button in Vercel
OR
2. Push a commit to main branch (GitHub)
```

### Issue: "Page Loads But Shows Blank Screen"

**Cause:** Supabase connection failure or missing environment variables

**Fix:**
```bash
# Open browser console (F12 → Console tab)
# Look for errors like:
# "Failed to authenticate"
# "Supabase client initialization failed"
# "env NEXT_PUBLIC_SUPABASE_URL is undefined"

# Then:
1. Go to Vercel Settings → Environment Variables
2. Verify vars are set for Production (not just Preview)
3. Click "Redeploy"
```

### Issue: "404 Not Found on Admin Routes"

**Cause:** Admin app not deployed correctly or routes not built

**Fix:**
```
1. Verify Root Directory is apps/admin in Vercel
2. Check that apps/admin/vercel.json exists and contains:
   { "framework": "nextjs" }
3. Push a commit to trigger rebuild
4. Wait for "Ready" status
```

### Issue: "Stripe/Google Maps Not Working"

**Cause:** Optional env vars not set

**Fix:**
```
1. These are optional; app should still load
2. If you want Stripe/Maps:
   - Get keys from Stripe/Google Cloud console
   - Settings → Environment Variables → Add vars
   - Redeploy
3. If you don't need them, leave blank (app continues to work)
```

---

## Rollback Procedure (If Something Breaks)

**Option 1: Promote Previous Deployment (Fastest)**

```
1. Vercel Dashboard → [Project] → Deployments
2. Find last working deployment (look for green checkmark)
3. Hover over it → Click "⋮" menu → "Promote to Production"
4. Confirm
```

**Expected:** Page reloads with previous version (30 seconds)

**Option 2: Revert in GitHub**

```bash
# From local machine
git log --oneline                    # Find the commit before the bad change
git revert [commit-hash]             # Create revert commit
git push origin main                 # Push to GitHub
```

**Expected:** Vercel auto-deploys the reverted code (1-2 minutes)

**Option 3: Manual Deployment Rollback**

```bash
# From your local machine
cd apps/admin
vercel --prod                        # Triggers manual admin deployment

cd ../web
vercel --prod                        # Triggers manual web deployment
```

---

## Demo Day Confidence Check

### 30 Minutes Before Demo

- [ ] **Phase 1:** Both projects show "Ready" status
- [ ] **Phase 2:** All critical env vars are set
- [ ] **Phase 3:** You have both deployment URLs written down
- [ ] **Phase 4:** Both apps load in incognito window without errors
- [ ] **Phase 5:** You can navigate to key pages without 404s
- [ ] **Phase 6:** Page load times are under 10 seconds
- [ ] **Phase 7:** Supabase connectivity shows 200 status codes

### 10 Minutes Before Demo

- [ ] Open both URLs again in fresh incognito window
- [ ] Verify they still load
- [ ] Note any slow loading or errors
- [ ] If something changed, run Phase 4-7 again

### During Demo

- [ ] Keep both URLs in separate browser tabs
- [ ] Use incognito mode to avoid cached data
- [ ] If a page doesn't load, try refreshing once
- [ ] If issues persist, switch to the rollback link (previous working deployment)

---

## After Demo

### Collect Feedback
- [ ] Demo participants liked the UI/UX
- [ ] No technical issues reported
- [ ] Supabase data loads correctly
- [ ] Admin dashboard functional
- [ ] Web app responsive and fast

### Post-Demo Actions
- [ ] Review Vercel logs for any warnings
- [ ] Check error tracking (if Sentry configured)
- [ ] Monitor uptime in first 24 hours
- [ ] Update custom domains if provided

---

## Troubleshooting Checklist

If something goes wrong **during the demo**:

1. **Check Vercel Status:** https://vercel.com/dashboard
   - Is the project still showing "Ready"?
   - Has it been redeployed in the last 5 minutes?

2. **Check Browser Cache:**
   - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Clear all cache
   - Reload page

3. **Check Supabase Status:** https://status.supabase.com
   - Are there any outages?
   - If so, this is the issue (not your deployment)

4. **Check Network Connectivity:**
   - Is the internet working?
   - Try opening another website

5. **If All Else Fails:**
   - Use the rollback link (last working deployment)
   - Or switch to local development mode
   - Or reschedule with note: "Vercel infrastructure issue"

---

## Success Indicators

✅ **All of these should be true:**

- Both Vercel projects show "Ready" status
- Admin app URL loads and shows login screen
- Web app URL loads and shows home page
- No red console errors
- Supabase requests return 200 status
- Pages load in under 10 seconds
- Navigation between pages works
- No 404 errors on main routes

✅ **Demo is ready to proceed**

---

**Last Updated:** 2026-02-25
**Estimated Check Time:** 15 minutes
