# Vercel Complete Setup Guide - 30 Minutes

**For detailed Vercel + Supabase configuration with all production settings.**

---

## Architecture Overview

```
GitHub Repository (ridendine-demo)
│
├── apps/admin          → Vercel Project: ridendine-admin
│   ├── vercel.json     (contains: { "framework": "nextjs" })
│   └── package.json    (@home-chef/admin)
│
└── apps/web            → Vercel Project: ridendine-web
    ├── vercel.json     (contains: { "framework": "nextjs" })
    └── package.json    (@home-chef/web)

Shared packages:
├── packages/shared     (TypeScript types, utilities)
└── pnpm-lock.yaml      (monorepo lock file at root)
```

---

## Phase 1: Prepare Vercel Projects (10 min)

### 1.1 Create Vercel Account

- Go to https://vercel.com
- Sign up with GitHub (recommended for seamless integration)
- Authorize GitHub access to your repositories

### 1.2 Create Admin Dashboard Project

1. **Dashboard → Add New → Project**
2. **Select Repository:**
   - Search: "ridendine-demo"
   - Click **Import**

3. **Configure Project:**
   - **Project Name:** `ridendine-admin` (custom name, must be unique)
   - **Root Directory:** `apps/admin` ← **CRITICAL: Must be set!**
   - **Framework:** Next.js (auto-detected)
   - **Node.js Version:** 20.x (matches `.node-version`)

4. **Click Deploy** (initial build will happen)

**Expected Output:**
```
✓ Deployment complete at https://ridendine-admin-[hash].vercel.app
```

### 1.3 Create Web App Project

1. **Dashboard → Add New → Project**
2. **Select Repository:**
   - Search: "ridendine-demo"
   - Click **Import** (same repo, second time)

3. **Configure Project:**
   - **Project Name:** `ridendine-web` (custom name)
   - **Root Directory:** `apps/web` ← **CRITICAL: Must be set!**
   - **Framework:** Next.js (auto-detected)
   - **Node.js Version:** 20.x

4. **Click Deploy**

**Expected Output:**
```
✓ Deployment complete at https://ridendine-web-[hash].vercel.app
```

---

## Phase 2: Configure Supabase (5 min)

### 2.1 Get Supabase Credentials

1. Go to **https://supabase.com/dashboard**
2. Select your project (or create one if needed)
3. Go to **Settings → API**
4. Copy these values:
- **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Key** (starts with `eyJ...`)
   - **Service Role Key** (secret, for admin app only)

### 2.2 Verify Supabase Setup

```bash
# Test connection (optional, from your local machine)
curl -i -X POST "https://your-project.supabase.co/rest/v1/rpc/head" \
  -H "apikey: YOUR_ANON_KEY"

# Expected: 204 No Content (success)
```

---

## Phase 3: Set Environment Variables (8 min)

### 3.1 Admin Dashboard Environment Variables

1. Go to **Vercel Dashboard → ridendine-admin**
2. **Settings → Environment Variables**

3. **Add these variables:**

| Key | Value | Scope |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (do not set in Vercel) | Use Supabase secrets for Edge Functions |

4. **Save & Deploy** (redeploy with new vars)

### 3.2 Web App Environment Variables

1. Go to **Vercel Dashboard → ridendine-web**
2. **Settings → Environment Variables**

3. **Add these variables:**

| Key | Value | Scope |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |

4. **Save & Deploy**

### 3.3 Optional: Stripe (for payment processing)

If you have Stripe configured:

1. Get from **Stripe Dashboard → Developers → API Keys**
2. Add to **ridendine-web only:**

| Key | Value | Scope |
|-----|-------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Supabase secrets (Edge Functions only) |

### 3.4 Optional: Google Maps (for delivery tracking)

If using location features:

1. Get from **Google Cloud Console → APIs & Services → Credentials**
2. Add to **ridendine-web:**

| Key | Value | Scope |
|-----|-------|-------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIza...` | Production, Preview, Development |

---

## Phase 4: Verify Deployments (5 min)

### 4.1 Check Deployment Status

1. **Vercel Dashboard**
2. Each project should show **Ready** status
3. Click on each to view deployment logs

### 4.2 Test Admin App

1. Visit: `https://ridendine-admin-[hash].vercel.app`
2. Verify:
   - [ ] Page loads without errors
   - [ ] Admin gate/login screen appears
   - [ ] Dashboard routes respond (try `/dashboard/orders`)

### 4.3 Test Web App

1. Visit: `https://ridendine-web-[hash].vercel.app`
2. Verify:
   - [ ] Home page loads
   - [ ] Navigation works (`/chefs`, `/cart`, `/checkout`)
   - [ ] No console errors

### 4.4 Automated Smoke Test

```bash
# From repository root
WEB_URL=https://ridendine-web-[hash].vercel.app \
ADMIN_URL=https://ridendine-admin-[hash].vercel.app \
node scripts/smoke-test.mjs
```

Expected output: All checks pass (HTTP 200).

---

## Phase 5: Advanced Configuration (7 min)

### 5.1 Custom Domain (Optional)

For **admin app:**

1. Go to **ridendine-admin → Settings → Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `admin.ridendine.com`)
4. Follow DNS setup instructions

For **web app:**

1. Go to **ridendine-web → Settings → Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `ridendine.com`)
4. Follow DNS setup instructions

### 5.2 Enable Analytics (Optional)

1. Go to **Project Settings → Analytics**
2. Enable **Vercel Analytics** (for Web Vitals)
3. View dashboard after 24 hours

### 5.3 Configure Deployment Protection

For production safety:

1. Go to **Project Settings → Deployment Protection**
2. Enable **Production Deployment Protection**
3. Require approvals for production deployments

### 5.4 Set Up Notifications (Optional)

1. Go to **Project Settings → Integrations**
2. Enable Slack integration (optional, for deployment alerts)

---

## Phase 6: Automatic Deployments

### How It Works

Once both projects are connected to GitHub:

1. **Any commit to `main` branch** triggers automatic deployment
2. **Pull requests** create preview deployments
3. Each commit gets a unique preview URL

### Disable Auto-Deploy (if needed)

1. **Project Settings → Git**
2. Uncheck **Automatic Deployments**
3. Deploy manually via Vercel CLI: `vercel --prod`

---

## Phase 7: Environment Variable Update Script

### Option A: Use Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to admin app and set env vars
cd apps/admin
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your Supabase URL when prompted

# Redeploy
vercel --prod

# Same for web app
cd ../web
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel --prod
```

### Option B: Use Provided Script

```bash
# From repository root
# First, fill in your credentials in apps/admin/.env.production
# and apps/web/.env.production

./setup-vercel-env.sh
```

The script will:
- Load environment variables from `.env.production` files
- Add them to both Vercel projects
- Skip any empty values
- Report what was configured

---

## Environment Variables Reference

### Critical Variables (Required)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Supabase Dashboard → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (Edge Functions only) | Supabase Dashboard → Settings → API → service role key |

### Optional Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API Keys → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Stripe Dashboard → Developers → API Keys → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard → Developers → Webhooks → Signing secret |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console → APIs & Services → Credentials |

---

## Troubleshooting

### Build Fails with "Cannot find module"

**Cause:** Missing environment variables or wrong Root Directory

**Fix:**
1. Verify Root Directory is set correctly (`apps/admin` or `apps/web`)
2. Verify env vars are added to **ALL three environments** (Production, Preview, Development)
3. Redeploy: click **Redeploy** button in Vercel

### Supabase Connection Fails

**Cause:** Wrong or missing `NEXT_PUBLIC_SUPABASE_URL`

**Fix:**
1. Copy exact URL from Supabase Dashboard (don't use template)
2. Ensure it starts with `https://`
3. Redeploy

### Admin Login Not Working

**Cause:** Missing Supabase configuration or wrong region

**Fix:**
1. Verify Supabase project is running
2. Check admin dashboard logs: **Deployments → Logs**
3. Verify both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Preview Deployments Not Working

**Cause:** Environment variables not set for Preview environment

**Fix:**
1. Go to **Settings → Environment Variables**
2. Ensure variables are set for **Preview** scope, not just Production
3. Commit a new change to trigger preview deployment

---

## Monitoring & Logs

### View Real-Time Logs

1. Go to **Vercel Dashboard → [Project Name]**
2. Click **Deployments**
3. Click most recent deployment
4. Click **Logs** tab

### Monitor Performance

1. Go to **Project Settings → Analytics**
2. View Core Web Vitals, requests, errors
3. Check trends

### Set Up Error Alerts

1. Go to **Project Settings → Integrations**
2. Connect Slack for deployment notifications
3. Configure alert rules

---

## Security Best Practices

1. **Never commit `.env` files** with real secrets
2. **Set environment variables in Vercel**, not in code
3. **Use different keys for different environments:**
   - Development: test keys
   - Preview: test keys
   - Production: live keys
4. **Rotate secrets regularly** (every 90 days)
5. **Use service role key only in backend** (admin app, not web app)
6. **Enable deployment protection** for production changes

---

## Rollback Procedure

If a deployment breaks:

1. **Go to Vercel Dashboard → [Project Name]**
2. **Deployments tab**
3. Find the **last working deployment**
4. Click the **⋮ menu** → **Promote to Production**

OR

1. **Revert the commit** in GitHub
2. Push revert to `main` branch
3. Vercel automatically redeploys

---

## Summary Checklist

- [ ] Two Vercel projects created (ridendine-admin, ridendine-web)
- [ ] Root Directory set correctly for each project
- [ ] Supabase credentials obtained
- [ ] Environment variables set in both projects
- [ ] Both projects show "Ready" status
- [ ] Admin app loads without errors
- [ ] Web app loads without errors
- [ ] Smoke test passes
- [ ] (Optional) Custom domains configured
- [ ] (Optional) Analytics enabled
- [ ] (Optional) Slack notifications configured

---

**Total Setup Time:** ~30 minutes ⏱️

**Next:** See **VERCEL_DEPLOYMENT_CHECKLIST.md** for pre-demo verification.
