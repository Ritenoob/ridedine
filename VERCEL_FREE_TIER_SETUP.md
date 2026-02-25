# Vercel Free Tier Setup Guide

**RidenDine Monorepo Deployment on Vercel Free Tier**

The free tier allows **2 projects** (admin + web) with automatic deployments from GitHub.

---

## Prerequisites

- [x] GitHub repository connected: https://github.com/SeanCFAFinlay/ridendine-demo
- [x] Vercel account authenticated (seancfafinlay)
- [x] Both apps build successfully locally
- [x] Production environment variables configured locally

---

## Option 1: GitHub Integration (Recommended - Auto-Detects Monorepo)

### Step 1: Import via Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select: **SeanCFAFinlay/ridendine-demo**

### Step 2: Configure Admin Dashboard

Vercel will detect multiple apps. Configure the first one:

**Project Settings:**
- **Project Name:** ridendine-admin
- **Root Directory:** `apps/admin` ← CRITICAL for monorepo
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** `pnpm build` (auto-detected)
- **Install Command:** `pnpm install` (auto-detected)
- **Output Directory:** `.next` (default)

**Environment Variables** (click "Add" for each):

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

Check ✓ **Production**, **Preview**, **Development** for both variables.

Click **Deploy** → Wait 2-3 minutes

### Step 3: Configure Web App

After admin deploys, go back to https://vercel.com/new and repeat:

**Project Settings:**
- **Project Name:** ridendine-web
- **Root Directory:** `apps/web` ← CRITICAL for monorepo
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** `pnpm build`
- **Install Command:** `pnpm install`
- **Output Directory:** `.next`

**Environment Variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
```

Check ✓ **Production**, **Preview**, **Development** for all variables.

Click **Deploy** → Wait 2-3 minutes

---

## Option 2: CLI with Root Directory Fix (If Projects Already Exist)

If you already created projects via CLI and got "No Next.js version detected" error:

### Admin Dashboard

1. Go to https://vercel.com/seancfafinlays-projects/admin/settings/general
2. Scroll to **Root Directory** section
3. Click **Edit**
4. Change from current to: `apps/admin`
5. Click **Save**
6. Go to **Deployments** tab → Click **Redeploy** on latest deployment

### Web App

1. Go to https://vercel.com/seancfafinlays-projects/web/settings/general (or create project first)
2. Set Root Directory: `apps/web`
3. Save and redeploy

---

## Verification

After both projects deploy successfully:

### Admin Dashboard

Visit: https://ridendine-admin.vercel.app (or your assigned URL)

- [ ] Login page loads without errors
- [ ] Middleware redirects unauthenticated users to `/`
- [ ] No "Module not found" errors in build logs
- [ ] Environment variables loaded (check Vercel logs)

### Web App

Visit: https://ridendine-web.vercel.app (or your assigned URL)

- [ ] Homepage loads without errors
- [ ] Chef browsing works
- [ ] Supabase connection established
- [ ] Google Maps API loads (check browser console)

---

## Free Tier Limits

**What You Get:**
- 2 projects (admin + web) ✓
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic preview deployments for PRs
- SSL certificates included
- Edge Functions: 100k invocations/day

**What Counts Against Quota:**
- Each git push → 1 production deployment (unlimited)
- Each PR → 1 preview deployment (unlimited)
- Bandwidth for page loads

**You're well within the free tier for a demo/MVP.**

---

## Troubleshooting

### "No Next.js version detected"

**Cause:** Root Directory not configured for monorepo subdirectory

**Fix:** Follow Option 2 above to set Root Directory via dashboard

### "Module not found: @supabase/ssr"

**Cause:** Missing dependency in package.json

**Fix:** Already added in commit 10c3ebc, pull latest from main

### Build succeeds but pages show 500 errors

**Cause:** Missing environment variables

**Fix:** Add all env vars via Vercel dashboard → Redeploy

### "Maximum repositorysecond: reached free plan limit"

**Cause:** Too many simultaneous deployments

**Fix:** Wait 1 minute between deployments or cancel queued builds

---

## Post-Deployment Configuration

### Custom Domains (Optional)

Free tier allows custom domains:

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `admin.ridendine.com` and `ridendine.com`
3. Update DNS records as shown
4. Vercel auto-provisions SSL certificate

### Production URLs (After Setup)

Update these in your Supabase dashboard → Authentication → Site URL:
- Admin: https://ridendine-admin.vercel.app
- Web: https://ridendine-web.vercel.app

---

## Next Steps

1. Complete GitHub integration setup above
2. Verify both apps deploy successfully
3. Test production deployments with a small commit
4. Configure custom domains (optional)
5. Update Supabase redirect URLs with production domains
