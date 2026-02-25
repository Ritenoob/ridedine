# Vercel Setup Testing & Verification Report (Snapshot)

**Run this before the demo to verify your deployment state.**
Note: Historical snapshot for demo planning. Validate against current repo state.

---

## Test Execution Checklist

Run these tests in order, 30 minutes before demo start time.

---

## Test 1: Vercel Project Status (2 minutes)

### Manual Verification

1. Open https://vercel.com/dashboard
2. Look for both projects:
   - [ ] `ridendine-admin` visible in project list
   - [ ] `ridendine-web` visible in project list

3. Click `ridendine-admin`:
   - [ ] Status shows **"Ready"** (not Building, Error, or Failed)
   - [ ] Last deployment timestamp is recent (within last 1 hour)
   - [ ] Green checkmark visible next to deployment

4. Click `ridendine-web`:
   - [ ] Status shows **"Ready"**
   - [ ] Last deployment timestamp is recent
   - [ ] Green checkmark visible

**Expected Result:** Both projects show green "Ready" status

**If Failed:** See troubleshooting section at bottom

---

## Test 2: Environment Variables Verification (3 minutes)

### Admin App

1. Click **ridendine-admin**
2. Go to **Settings → Environment Variables**
3. Verify these variables exist:

```
✓ NEXT_PUBLIC_SUPABASE_URL    [Production, Preview, Development]
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY [Production, Preview, Development]
✗ SUPABASE_SERVICE_ROLE_KEY    [do not set in Vercel apps]
```

All should show as masked (●●●●●●●●)

### Web App

1. Click **ridendine-web**
2. Go to **Settings → Environment Variables**
3. Verify these variables exist:

```
✓ NEXT_PUBLIC_SUPABASE_URL    [Production, Preview, Development]
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY [Production, Preview, Development]
```

All should show as masked

**Expected Result:** All critical variables present in all scopes

**If Missing:** Add them now (takes 2 minutes per app)

---

## Test 3: Admin App Load Test (3 minutes)

### Step 1: Get URL

1. Vercel Dashboard → ridendine-admin → Deployments
2. Copy the URL from "Domains" field (e.g., `ridendine-admin-abc123.vercel.app`)

### Step 2: Load Test

1. **Open NEW incognito/private browser window**
   - This avoids cached data
2. **Paste URL into address bar**
3. **Wait for full page load** (should take 3-5 seconds)

### Step 3: Verify Load

- [ ] Page loads without infinite loading spinner
- [ ] No "500 Internal Server Error" page
- [ ] No blank white page
- [ ] Admin gate or login screen visible
- [ ] All images/CSS loaded (page looks complete, not broken)

### Step 4: Check Console

1. Press **F12** (Developer Tools)
2. Click **Console** tab
3. Look at console output:
   - [ ] No red error messages
   - [ ] No "Cannot find module" warnings
   - [ ] No "Unexpected token" syntax errors

### Step 5: Check Network

1. Go to **Network** tab
2. Reload page (Ctrl+R)
3. Look for requests to `supabase.co`:
   - [ ] At least one request visible (e.g., `/rest/v1/...`)
   - [ ] Status is **200** or **201** (not 403, 401, or 500)

**Expected Result:** Page loads in under 5 seconds, no console errors, Supabase connection succeeds

**If Failed:** See troubleshooting section

---

## Test 4: Web App Load Test (3 minutes)

### Step 1: Get URL

1. Vercel Dashboard → ridendine-web → Deployments
2. Copy the URL from "Domains" field (e.g., `ridendine-web-xyz789.vercel.app`)

### Step 2: Load Test

1. **Open NEW incognito/private browser window**
2. **Paste URL into address bar**
3. **Wait for full page load** (should take 3-5 seconds)

### Step 3: Verify Load

- [ ] Page loads without infinite loading spinner
- [ ] No "500 Internal Server Error" page
- [ ] No blank white page
- [ ] Home page content visible
- [ ] Navigation menu visible and clickable

### Step 4: Check Console

1. Press **F12**
2. Click **Console** tab
3. Verify:
   - [ ] No red error messages
   - [ ] No "Cannot find module" warnings

### Step 5: Test Navigation

1. Click a navigation link (if available)
2. Page should load without 404 error
3. URL in address bar should change

**Expected Result:** Page loads fast, navigation works, no console errors

**If Failed:** See troubleshooting section

---

## Test 5: Supabase Connectivity (2 minutes)

### For Admin App

1. Keep admin URL open from Test 3
2. Press **F12 → Network tab**
3. Hard-refresh: **Ctrl+F5** (or **Cmd+Shift+R** on Mac)
4. In Network tab, look for requests with `supabase.co` in URL
5. Click on one of those requests
6. Check **Status** column:
   - [ ] Shows **200** or **201** (success)
   - NOT 403 (forbidden) or 401 (unauthorized)

### For Web App

1. Keep web URL open from Test 4
2. Repeat same as admin
3. Verify Supabase requests return 200 status

**Expected Result:** Supabase API requests return 200 status

**If Getting 403/401:** Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct value (not placeholder)

---

## Test 6: Response Time Benchmark (2 minutes)

### Admin App

1. Open admin URL again in incognito window
2. Press **F12 → Network tab**
3. Clear network (circle-slash icon)
4. Hard-refresh: **Ctrl+F5**
5. Look at **"Finish"** time at bottom of Network tab
   - [ ] Under 3 seconds = Excellent
   - [ ] Under 5 seconds = Good
   - [ ] Under 10 seconds = Acceptable
   - [ ] Over 10 seconds = Check logs for issues

### Web App

1. Repeat same test for web app
2. Compare response times

**Expected:** Both apps load in under 5 seconds (cold start may be 3-8 seconds first time)

---

## Test 7: Production vs Preview Environment (2 minutes)

### Verify Production Scope Settings

1. Vercel Dashboard → ridendine-admin → Settings → Environment Variables
2. Look at each variable:
   - [ ] Check it shows "Production" scope (not just Preview/Development)
3. Same for ridendine-web

**Why this matters:** If env vars are only set for Preview, production deploys will fail

**Expected:** All critical variables show "Production" checkbox is checked

---

## Test 8: Recent Deployment Validation (2 minutes)

### Check Deployment History

1. Vercel Dashboard → ridendine-admin → Deployments
2. Look at the list:
   - [ ] Top deployment has green checkmark
   - [ ] Shows **"Current"** label
   - [ ] Timestamp is recent (within last 1 hour)
   - [ ] No "Failed" label
3. Same for ridendine-web

**Expected:** Both projects have recent successful deployments marked as "Current"

---

## Test 9: Custom Domain Check (Optional - 1 minute)

If you configured custom domains:

1. Vercel Dashboard → [Project] → Settings → Domains
2. Check if custom domain shows:
   - [ ] Domain name listed
   - [ ] Status shows "Valid" or "Verifying"
   - [ ] Not showing error message

If using custom domains:
- [ ] Test loading page via custom domain URL (not vercel.app URL)

**Note:** Custom domains take 5-30 minutes to activate after configuration

---

## Test 10: Rollback Readiness (1 minute)

Before demo, verify you can rollback if needed:

1. Vercel Dashboard → ridendine-admin → Deployments
2. Look at previous deployments (2-3 up from top):
   - [ ] Find one with green checkmark
   - [ ] Hover over it
   - [ ] Click **⋮** menu
   - [ ] See **"Promote to Production"** option

This confirms rollback is available (takes 30 seconds if needed)

**Expected:** At least one previous deployment available with working status

---

## Summary Test Form

Fill this out when all tests complete:

```
TEST RESULTS - Demo Deployment Verification
=============================================

Date: 2026-02-25
Time: [Your time]

Test 1 - Vercel Status:           [ ] PASS  [ ] FAIL
Test 2 - Env Variables:            [ ] PASS  [ ] FAIL
Test 3 - Admin Load Test:          [ ] PASS  [ ] FAIL
Test 4 - Web Load Test:            [ ] PASS  [ ] FAIL
Test 5 - Supabase Connectivity:    [ ] PASS  [ ] FAIL
Test 6 - Response Time:            [ ] PASS  [ ] FAIL
Test 7 - Production Env Scope:     [ ] PASS  [ ] FAIL
Test 8 - Recent Deployment:        [ ] PASS  [ ] FAIL
Test 9 - Custom Domain:            [ ] PASS  [ ] N/A
Test 10 - Rollback Ready:          [ ] PASS  [ ] FAIL

OVERALL STATUS: [ ] READY FOR DEMO  [ ] NOT READY

Admin URL:  _______________________________________________
Web URL:    _______________________________________________

Issues Found:
_________________________________________________________
_________________________________________________________

Notes:
_________________________________________________________
_________________________________________________________

Tested by: _________________________
```

---

## Automated Test Script

Run this bash script to check basic connectivity:

```bash
#!/bin/bash

ADMIN_URL="${1:-https://ridendine-admin.vercel.app}"
WEB_URL="${2:-https://ridendine-web.vercel.app}"

echo "Testing Vercel Deployments"
echo "=========================="
echo ""

echo "Testing Admin App: $ADMIN_URL"
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL")
if [ "$ADMIN_STATUS" = "200" ]; then
    echo "✓ Admin app responds with HTTP 200"
else
    echo "✗ Admin app returned HTTP $ADMIN_STATUS"
fi

echo ""
echo "Testing Web App: $WEB_URL"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")
if [ "$WEB_STATUS" = "200" ]; then
    echo "✓ Web app responds with HTTP 200"
else
    echo "✗ Web app returned HTTP $WEB_STATUS"
fi

echo ""
if [ "$ADMIN_STATUS" = "200" ] && [ "$WEB_STATUS" = "200" ]; then
    echo "✓ All systems verified for demo"
else
    echo "✗ Some systems not responding correctly"
fi
```

Save as `test-vercel-deployment.sh` and run:

```bash
bash test-vercel-deployment.sh https://ridendine-admin-abc.vercel.app https://ridendine-web-xyz.vercel.app
```

---

## Troubleshooting

### Issue: Vercel shows "Building" status

**Cause:** Deployment still in progress

**Fix:** Wait 2-3 minutes, then refresh Vercel dashboard. If still building after 5 minutes, check Logs tab for errors.

### Issue: Vercel shows "Failed" status

**Cause:** Build or deployment error

**Fix:**
1. Click the failing deployment
2. Go to **Logs** tab
3. Scroll to bottom for error message
4. See "VERCEL_SETUP_FULL.md" troubleshooting section for common errors

### Issue: Page loads but shows blank/error

**Cause:** Missing or incorrect environment variables

**Fix:**
1. Go to Settings → Environment Variables
2. Verify all critical variables are set
3. Verify values are correct (not placeholders)
4. Click "Redeploy" button
5. Wait 2-3 minutes
6. Refresh page

### Issue: Supabase requests return 403 error

**Cause:** Invalid or missing Supabase anon key

**Fix:**
1. Go to Supabase Dashboard
2. Copy exact `anon` key (not service role key)
3. Update Vercel env var `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy

### Issue: Page takes 10+ seconds to load

**Cause:** Normal for cold start, or might be overloaded

**Fix:**
- Refresh page again - second load should be faster
- If consistently slow, check Vercel Analytics for high resource usage
- May need to upgrade Vercel plan

### Issue: Admin URL works but Web URL doesn't

**Cause:** Both projects may have been deployed from same branch; check Root Directory

**Fix:**
1. Verify Web project has Root Directory set to `apps/web`
2. Click "Redeploy" in Vercel
3. Wait 2-3 minutes

---

## Post-Test Checklist

- [ ] All 10 tests passed (or N/A for custom domain)
- [ ] You have both URLs noted down
- [ ] You can access both apps in incognito window
- [ ] Supabase connectivity verified
- [ ] You know how to rollback (promote previous deployment)
- [ ] You have this checklist saved for reference during demo

---

**You are ready for the demo!** ✅

Proceed to **VERCEL_DEMO_SUMMARY.md** for final demo instructions.
