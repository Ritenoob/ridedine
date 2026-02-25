# Bug Triage Template - RidenDine Demo

**Purpose:** Standardize bug reporting and prioritization during demo testing
**Usage:** Copy template for each bug found, fill in details, assign priority

---

## Bug Report Template

```markdown
## Bug #[ID]: [Short Title]

**Reported By:** [Name]
**Date Found:** [YYYY-MM-DD]
**Environment:** [Local / Vercel Production / Staging]
**Browser:** [Chrome 120 / Firefox / Safari / Mobile]

### Severity

- [ ] **CRITICAL** - Blocks core demo flow, must fix before demo
- [ ] **MAJOR** - Impacts user experience, should fix before demo
- [ ] **MINOR** - Cosmetic/edge case, fix if time permits

### Priority

- [ ] **P0** - Fix immediately (< 1 hour)
- [ ] **P1** - Fix today (< 24 hours)
- [ ] **P2** - Fix this week
- [ ] **P3** - Backlog

### Category

- [ ] Frontend UI/UX
- [ ] Backend API
- [ ] Database/Data
- [ ] Performance
- [ ] Security
- [ ] Mobile/Responsive
- [ ] Accessibility

---

### Description

[Clear description of what's wrong]

---

### Steps to Reproduce

1. [First step]
2. [Second step]
3. [Third step]

---

### Expected Behavior

[What should happen]

---

### Actual Behavior

[What actually happens]

---

### Screenshots/Videos

[Attach or link to screenshots showing the issue]

---

### Error Messages

```
[Paste full error message from console/logs]
```

---

### Browser Console Logs

```javascript
// Paste relevant console errors
```

---

### Network Tab (if applicable)

- **Request URL:** [URL]
- **Status Code:** [200/404/500]
- **Response Time:** [ms]
- **Response Body:** [Paste if relevant]

---

### Database State (if applicable)

```sql
-- Query to reproduce data state
SELECT * FROM [table] WHERE [condition];
```

---

### Root Cause Analysis

**Initial Hypothesis:**
[What might be causing this?]

**Files/Components Involved:**
- [File path 1]
- [File path 2]

**Related Issues:**
- [Link to similar bugs]

---

### Proposed Fix

**Approach:**
[How to fix this]

**Estimated Effort:**
- [ ] Quick fix (< 30 min)
- [ ] Medium (1-3 hours)
- [ ] Large (> 3 hours)

**Code Changes Required:**
- [File/function to modify]

---

### Workaround (if available)

[Temporary workaround for demo if fix takes too long]

---

### Testing Verification

**How to Verify Fix:**
1. [Verification step 1]
2. [Verification step 2]

**Regression Check:**
- [ ] Original bug fixed
- [ ] Related features still work
- [ ] No new bugs introduced

---

### Status

- [ ] **Open** - Not started
- [ ] **In Progress** - Being fixed
- [ ] **Fixed** - Awaiting verification
- [ ] **Verified** - Tested and confirmed fixed
- [ ] **Closed** - Complete
- [ ] **Won't Fix** - Documented reason below

**Assigned To:** [Developer name]
**Fixed In:** [Commit hash / PR number]
**Verified By:** [QA name]

---

### Notes

[Any additional context, edge cases, or follow-up items]

---
```

---

## Priority Decision Matrix

| Severity | Affects Demo Flow | Visible to Users | Priority |
|----------|-------------------|------------------|----------|
| Critical | Yes | Yes | P0 (Fix immediately) |
| Critical | Yes | No | P1 (Fix today) |
| Major | Yes | Yes | P1 (Fix today) |
| Major | No | Yes | P2 (Fix this week) |
| Minor | Yes | Yes | P2 (Fix this week) |
| Minor | No | Yes | P3 (Backlog) |
| Minor | No | No | P3 (Backlog) |

---

## Severity Definitions

### ⛔ CRITICAL

**Blocks core functionality - must fix before demo**

**Examples:**
- Chefs list doesn't load at all (empty page)
- Add to cart button doesn't work (orders impossible)
- Checkout redirects to 500 error
- Database connection fails
- Authentication completely broken
- Payment processing fails for all transactions

**Impact:** Demo cannot proceed, core user flow blocked

**SLA:** Fix within 1 hour or prepare backup plan

---

### ⚠️ MAJOR

**Impacts user experience - should fix before demo**

**Examples:**
- Chef images not loading (broken image icons)
- Cart total calculated incorrectly
- Search functionality broken
- Mobile layout completely broken
- Slow page loads (> 10 seconds)
- Console errors visible to users
- Missing navigation elements

**Impact:** Demo can proceed but looks unprofessional

**SLA:** Fix within 24 hours or document workaround

---

### ℹ️ MINOR

**Cosmetic or edge case - fix if time permits**

**Examples:**
- Button hover state slightly off-color
- Spacing inconsistency on one page
- Typo in non-critical text
- Missing favicon
- Inconsistent font sizes
- Footer link slightly misaligned
- Toast notification dismisses too quickly

**Impact:** Barely noticeable, doesn't affect functionality

**SLA:** Fix in next sprint or document as known issue

---

## Common Bug Patterns & Quick Fixes

### Pattern 1: "Data Not Loading"

**Symptoms:** Empty lists, infinite spinners, "No data found"

**Common Causes:**
1. Supabase RLS policy blocking read access
2. API endpoint returning 401/403
3. Frontend not handling loading state
4. Database table empty (seed data not run)

**Quick Fix Checklist:**
- [ ] Check browser Network tab for 200 status
- [ ] Verify RLS policies allow `anon` read access
- [ ] Run seed data SQL script
- [ ] Check Supabase logs for errors

---

### Pattern 2: "Feature Works Locally, Fails in Production"

**Symptoms:** Works on `localhost`, broken on Vercel

**Common Causes:**
1. Environment variables not set in Vercel
2. CORS issues (different domain)
3. API base URL hardcoded to `localhost`
4. Build output missing files (`.env` not copied)

**Quick Fix Checklist:**
- [ ] Verify all `NEXT_PUBLIC_*` vars in Vercel dashboard
- [ ] Check Supabase project allows Vercel domain
- [ ] Search code for `localhost:` hardcodes
- [ ] Check Vercel build logs for errors

---

### Pattern 3: "Works in Desktop, Broken on Mobile"

**Symptoms:** UI broken on phone, works on desktop

**Common Causes:**
1. Fixed widths instead of responsive units
2. Touch events not handled (only `onClick`)
3. Viewport meta tag missing
4. CSS media queries not working

**Quick Fix Checklist:**
- [ ] Test in Chrome DevTools mobile emulator
- [ ] Add `<meta name="viewport" content="width=device-width">`
- [ ] Replace `px` with `rem`/`%` where needed
- [ ] Test touch events (tap, swipe)

---

### Pattern 4: "Console Errors But App Still Works"

**Symptoms:** Red errors in console, app functional

**Common Causes:**
1. Deprecation warnings (not blocking)
2. 404s on optional resources (fonts, analytics)
3. React hydration mismatches (SSR/CSR difference)
4. Third-party script errors (safe to ignore)

**Quick Fix Checklist:**
- [ ] Identify error source (own code vs. library)
- [ ] Assess impact (blocking vs. warning)
- [ ] Fix if ours, ignore if third-party
- [ ] Document known non-blocking errors

---

### Pattern 5: "Slow Performance"

**Symptoms:** Pages take > 5 seconds to load

**Common Causes:**
1. Fetching too much data at once
2. No pagination/lazy loading
3. Large images not optimized
4. Database queries missing indexes
5. Supabase project on free tier (cold start)

**Quick Fix Checklist:**
- [ ] Check Network tab for large responses (> 1MB)
- [ ] Add `loading="lazy"` to images
- [ ] Implement pagination for lists
- [ ] Check Supabase query performance

---

## Bug Tracking During Demo Day

### Pre-Demo (30 mins before)

1. Run through **DEMO_TEST_CHECKLIST.md**
2. Document all bugs found (use template above)
3. Triage bugs using priority matrix
4. Fix all P0/P1 bugs OR prepare workarounds
5. Brief demo presenter on known P2/P3 issues

### During Demo

**If bug occurs live:**
1. Stay calm, acknowledge briefly
2. Use prepared workaround if available
3. Say: "This is a known edge case we're addressing"
4. Move to next feature quickly
5. Document exact repro steps immediately after

**Post-Demo Debrief:**
1. Review all bugs encountered
2. Prioritize for sprint planning
3. Update documentation with lessons learned

---

## Emergency Contacts & Resources

**Supabase Status:** https://status.supabase.com
**Vercel Status:** https://www.vercel-status.com
**Backup Demo Video:** `[link-to-backup-recording.mp4]`

**Emergency Hotfixes:**
- Restart Supabase project: [Dashboard → Settings → Pause → Restart]
- Redeploy Vercel: [Dashboard → Deployments → Redeploy]
- Clear cache: `Ctrl+Shift+R` (hard refresh)

---

## Bug Report Examples

### Example 1: Critical Bug

```markdown
## Bug #001: Chefs List Page Returns 500 Error

**Reported By:** QA Team
**Date Found:** 2026-02-25
**Environment:** Vercel Production
**Browser:** Chrome 120

### Severity
- [x] **CRITICAL** - Blocks core demo flow

### Priority
- [x] **P0** - Fix immediately

### Category
- [x] Backend API

### Description
Navigating to `/chefs` results in a 500 Internal Server Error. Page shows "Something went wrong" error boundary.

### Steps to Reproduce
1. Open production URL: https://ridendine.vercel.app
2. Click "Browse Chefs" in navigation
3. Error page displayed

### Expected Behavior
Chef list page loads with 10+ chef cards displayed

### Actual Behavior
Error boundary catches exception, shows generic error page

### Error Messages
```
Error: Failed to fetch chefs
at ChefsPage (/app/chefs/page.tsx:45:10)
```

### Root Cause Analysis
**Initial Hypothesis:** Supabase RLS policy blocking anonymous reads

**Files Involved:**
- `/app/chefs/page.tsx` (fetching logic)
- Supabase `chefs` table RLS policies

### Proposed Fix
Add RLS policy allowing public read access to active chefs:

```sql
CREATE POLICY "Allow public read access to active chefs"
ON chefs FOR SELECT
USING (status = 'active');
```

### Status
- [x] **Fixed** - Policy added, verified working
**Fixed In:** Supabase Migration #003
**Verified By:** QA Team
```

---

### Example 2: Major Bug

```markdown
## Bug #002: Cart Total Calculation Incorrect

**Reported By:** Developer
**Date Found:** 2026-02-25
**Environment:** Local Development
**Browser:** Chrome 120

### Severity
- [x] **MAJOR** - Impacts user experience

### Priority
- [x] **P1** - Fix today

### Category
- [x] Frontend UI/UX

### Description
Cart shows incorrect total. Doesn't include delivery fee in final total.

### Steps to Reproduce
1. Add item ($12.00) to cart
2. Navigate to `/cart`
3. Observe: Subtotal $12.00, Delivery $5.00, **Total $12.00**

### Expected Behavior
Total should be $12.00 + $5.00 = $17.00

### Actual Behavior
Total only shows subtotal, ignoring delivery fee

### Root Cause Analysis
**Files Involved:**
- `/app/cart/page.tsx` (calculation logic)

**Issue:** Total calculation missing `+ deliveryFee`

### Proposed Fix
```typescript
const total = subtotal + deliveryFee + platformFee;
```

### Status
- [x] **Fixed** - Calculation corrected
**Fixed In:** Commit abc123
**Verified By:** Developer
```

---

**Last Updated:** 2026-02-25
**Version:** 1.0
