# Pre-Deployment Checklist - RidenDine Demo

**Run this checklist AFTER Vercel deployment completes to verify everything is ready.**

---

## ✅ 1. Vercel Deployments (5 minutes)

### Admin Dashboard
- [ ] Visit: https://admin-seancfafinlays-projects.vercel.app
- [ ] Login page displays without errors
- [ ] No "Module not found" in browser console (F12)
- [ ] Supabase connection works (can see login form)

### Web App
- [ ] Visit: https://web-seancfafinlays-projects.vercel.app
- [ ] Homepage loads without errors
- [ ] Chef list displays (or empty state if no data)
- [ ] No "Module not found" in browser console (F12)

**If errors:** Check Vercel deployment logs for build issues.

---

## ✅ 2. Database Seed Data (10 minutes)

Open Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

Run these validation queries from `DATA_VERIFICATION_QUERIES.sql`:

### Core Data Check
```sql
-- Query 1.1: Verify Active Chefs (Expected: >= 10)
SELECT COUNT(*) as total_active_chefs
FROM chefs
WHERE status = 'active';

-- Query 1.3: Verify Menu Items (Expected: >= 50)
SELECT COUNT(*) as total_menu_items
FROM menu_items
WHERE is_available = true;

-- Query 1.6: Verify Drivers (Expected: >= 5)
SELECT COUNT(*) as total_drivers
FROM profiles
WHERE role = 'driver' AND is_active = true;
```

### Expected Results
- ✅ 10+ active chefs
- ✅ 50+ available menu items
- ✅ 5+ active drivers

**If missing:** Run seed scripts from `backend/supabase/seed/` directory.

---

## ✅ 3. Environment Variables (2 minutes)

### Check via Vercel Dashboard

**Admin Project:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] All variables set for: Production, Preview, Development

**Web Project:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] Optional: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (can demo without)
- [ ] Optional: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (can demo without)

**If missing:** Run `bash setup-vercel-env.sh` again and redeploy.

---

## ✅ 4. Mobile App Build (Check Status)

```bash
# Check if EAS build is complete
eas build:list --platform android --limit 1
```

**Expected:** Build status = "finished"

**If still building:** Wait for completion (60-90 minutes from start)

---

## ✅ 5. Performance Metrics Ready (2 minutes)

### Verify Cache Configuration

Check that these files exist with correct TTL settings:

```bash
# Route caching - 5 minute TTL
grep -n "5 minutes" backend/supabase/functions/get_route/index.ts

# Geocoding caching - 30 day TTL
grep -n "30 days" backend/supabase/functions/geocode/index.ts
```

**Expected:** Both files show correct TTL values.

---

## ✅ 6. Test Suite Ready (1 minute)

### Verify Test Files Exist

```bash
ls -lh e2e/complete-order-flow.spec.ts
ls -lh DEMO_TEST_CHECKLIST.md
ls -lh DATA_VERIFICATION_QUERIES.sql
```

**Expected:** All 3 files exist.

---

## ✅ 7. Demo Documentation (1 minute)

### Verify Demo Materials

```bash
ls -lh DEMO_PRESENTATION_SCRIPT.md      # 20-min demo script
ls -lh PERFORMANCE_SUMMARY.md            # 1-page investor brief
ls -lh PERFORMANCE_DEMO_SCRIPT.md        # 3-5 min demo script
ls -lh DEMO_FALLBACK_PROCEDURES.md       # Emergency procedures
```

**Expected:** All 4 files exist.

---

## 🎯 After This Checklist Passes

**Next Steps (in order):**

1. **Run E2E Tests** (Hour 1-3)
   ```bash
   cd /home/nygmaee/Desktop/ridendine-demo-main
   playwright test e2e/complete-order-flow.spec.ts
   ```

2. **Manual Test Checklist** (Hour 1-3)
   - Follow `DEMO_TEST_CHECKLIST.md`
   - 15-20 minute walkthrough
   - Capture screenshots

3. **Database Verification** (Hour 3)
   - Run all 28 queries from `DATA_VERIFICATION_QUERIES.sql`
   - Document any missing data

4. **Demo Dry Run** (Hour 4-5)
   - Follow `DEMO_PRESENTATION_SCRIPT.md`
   - 20-minute full walkthrough
   - Note what works/breaks

5. **Backup Materials** (Hour 5-6)
   - Screenshots of every step
   - Pre-record video backup
   - Print architecture diagrams

---

## 🚨 Critical Issues - Stop and Fix

| Issue | Fix |
|-------|-----|
| Vercel deployment fails | Check build logs, verify Root Directory setting |
| Database empty | Run seed scripts from `backend/supabase/seed/` |
| Env vars missing | Re-run `bash setup-vercel-env.sh` and redeploy |
| Build errors | Check `pnpm install` completed, verify dependencies |

---

## ✅ Success Criteria

- [ ] Both Vercel apps load without errors
- [ ] Database has 10+ chefs, 50+ menu items, 5+ drivers
- [ ] Environment variables configured for both projects
- [ ] Test suite and documentation ready
- [ ] Mobile build completed (or in progress with ETA)

**When all checked:** Ready to proceed with E2E testing (Task #21).
