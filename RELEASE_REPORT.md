# RidenDine Production Release Report

**Organisation:** STM TECH  
**Date:** 2026-02-25  
**Release commit:** `3e2de9dde685aa762961839c0a282b2a7a8bc84d`

---

## 1. Vercel Project Settings

Both projects are imported from the same GitHub repository
(`SeanCFAFinlay/ridendine-demo`) with **separate Root Directories**.

| Setting            | ridendine-web      | ridendine-admin     |
|--------------------|--------------------|---------------------|
| Root Directory     | `apps/web`         | `apps/admin`        |
| Framework          | Next.js (auto)     | Next.js (auto)      |
| Install Command    | *(blank — Vercel auto-detects pnpm from repo root)* | *(blank)* |
| Build Command      | *(blank — Vercel Next.js framework builder)* | *(blank)* |
| Output Directory   | `.next`            | `.next`             |
| Node.js Version    | **20.x**           | **20.x**            |

> The per-app `vercel.json` for both projects contains only
> `{ "framework": "nextjs" }`.  No `buildCommand` or `installCommand`
> overrides are set — Vercel detects `pnpm-lock.yaml` at the repository
> root and runs `pnpm install` automatically.

---

## 2. Deployment Source

Both projects deploy from the latest commit on the `main` branch:

```
Commit: 3e2de9dde685aa762961839c0a282b2a7a8bc84d
Message: Initial plan
Branch:  main
```

Vercel is configured for continuous deployment: every push to `main`
triggers a production deployment automatically for both projects.

---

## 3. CLI Deployment Script

For manual / emergency releases use the provided PowerShell script
(`deploy-production.ps1`) from the repository root:

```powershell
.\deploy-production.ps1
```

The script performs the following steps in order:

1. `Remove-Item apps/web/.vercel` — clears any stale link
2. `vercel link --project ridendine-web` (inside `apps/web`)
3. `vercel --prod --force` — promotes to production
4. `Remove-Item apps/admin/.vercel` — clears any stale link
5. `vercel link --project ridendine-admin` (inside `apps/admin`)
6. `vercel --prod --force` — promotes to production

Prerequisites: Vercel CLI installed (`pnpm add -g vercel`) and
authenticated (`vercel login`).

---

## 4. Production Environment Variables

The following variables **must** be set in each Vercel project under
**Settings → Environment Variables → Production**:

### ridendine-web

| Variable                         | Required | Notes                              |
|----------------------------------|----------|------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | ✅ Yes   | Supabase project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | ✅ Yes   | Supabase anon/public key           |
| `SUPABASE_SERVICE_ROLE_KEY`      | ✅ Yes   | Server-side only (webhooks)        |
| `STRIPE_SECRET_KEY`              | ✅ Yes   | Server-side only (`sk_live_…`)     |
| `STRIPE_WEBHOOK_SECRET`          | ✅ Yes   | Webhook signature (`whsec_…`)      |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes | Client-side (`pk_live_…`)      |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`| Optional | Delivery tracking map              |
| `NEXT_PUBLIC_WEB_URL`            | Optional | Set after first deploy             |
| `NEXT_PUBLIC_ADMIN_URL`          | Optional | Set after first deploy             |

### ridendine-admin

| Variable                         | Required | Notes                  |
|----------------------------------|----------|------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | ✅ Yes   | Same Supabase project  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | ✅ Yes   | Same anon key          |

---

## 5. Production Validation Checklist

Run these checks immediately after each deployment.

### 5.1 ridendine-web

| Check                                          | Expected result         | Status |
|------------------------------------------------|-------------------------|--------|
| Home page loads (`/`)                          | Chef listing visible    | [ ]    |
| Chefs page loads (`/chefs`)                    | No blank/empty section  | [ ]    |
| Cart adds an item                              | Cart count increments   | [ ]    |
| Checkout page loads (`/checkout`)              | Stripe form renders     | [ ]    |
| Orders page loads (`/orders`)                  | Requires auth, no 404   | [ ]    |
| Order tracking page loads (`/orders/[id]/track`)| Map/status renders     | [ ]    |
| No 404 on `/api/health`                        | `{"status":"ok",...}`   | [ ]    |
| No JavaScript console errors                   | Browser console clean   | [ ]    |

### 5.2 ridendine-admin

| Check                                          | Expected result               | Status |
|------------------------------------------------|-------------------------------|--------|
| Admin gate / login loads (`/`)                 | Login screen renders          | [ ]    |
| Dashboard loads (`/dashboard`)                 | Metrics/cards visible         | [ ]    |
| Chefs list loads (`/chefs`)                    | Table rows, no blank section  | [ ]    |
| Meals list loads (`/meals`)                    | Table rows, no blank section  | [ ]    |
| Orders list loads (`/orders`)                  | Table rows, no blank section  | [ ]    |
| Promos list loads (`/promos`)                  | Table rows, no blank section  | [ ]    |
| Users list loads (`/users`)                    | Table rows, no blank section  | [ ]    |
| No 404 on any navigation link                  | All sidebar links resolve     | [ ]    |
| No JavaScript console errors                   | Browser console clean         | [ ]    |

---

## 6. Deployed URLs

Fill in after deployment:

| Project         | Vercel URL                                        |
|-----------------|---------------------------------------------------|
| ridendine-web   | `https://ridendine-web.vercel.app` *(placeholder)*  |
| ridendine-admin | `https://ridendine-admin.vercel.app` *(placeholder)*|

> Update with the actual URLs printed by `vercel --prod` or visible in
> the Vercel dashboard under **Deployments → Production**.

---

## 7. Sign-off

- [ ] Both projects deployed from commit `3e2de9dde685aa762961839c0a282b2a7a8bc84d`
- [ ] All required environment variables present in Production
- [ ] Web app checklist (§ 5.1) fully green
- [ ] Admin app checklist (§ 5.2) fully green
- [ ] No 404s on key routes
- [ ] No blank data sections
