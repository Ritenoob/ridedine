# Deployment Guide

This document describes everything needed to deploy and maintain the ridendine-demo monorepo from scratch.

## Overview

This is a pnpm workspace monorepo containing:

| App | Path | Vercel Project | Description |
|-----|------|----------------|-------------|
| Web (customer site) | `apps/web` | `ridendine-web` | Next.js customer-facing app |
| Admin dashboard | `apps/admin` | `ridendine-admin` | Next.js admin panel |
| Mobile (Expo) | `apps/mobile` | Not deployed via Vercel | React Native / Expo app |
| Shared types | `packages/shared` | â€” | TypeScript types and schemas |

---

## Prerequisites

- **Node.js 20.x** (see `.node-version`)
- **pnpm 10.x** — `corepack enable && corepack prepare pnpm@10 --activate`
- **Supabase project** (hosted or local via `supabase start`)
- **Vercel account** with two projects: `ridendine-web` and `ridendine-admin`
- **GitHub repository** connected to both Vercel projects

---

## Local Development

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Copy and fill in env vars (per app)
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
# Edit each .env.local with real Supabase credentials

# 3. Start web app (port 3001)
pnpm --filter @home-chef/web dev

# 4. Start admin app (port 3000, in a separate terminal)
pnpm --filter @home-chef/admin dev
```

---

## Environment Variables

### Both Apps

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | âœ… | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | âœ… | Your Supabase anon/public key |

### Web App Only (`apps/web`)

| Variable | Required | Notes |
|----------|----------|-------|
| `STRIPE_SECRET_KEY` | âš ï¸ Optional | Server-only. Never use `NEXT_PUBLIC_` prefix |
| `STRIPE_WEBHOOK_SECRET` | âš ï¸ Optional | Server-only stripe webhook secret |

### Admin App Only (`apps/admin`)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD` | âš ï¸ Optional | Demo/dev password override for admin gate |

> **Security rule:** Never put secret keys (Stripe, Supabase service role) in `NEXT_PUBLIC_` variables.
> They would be exposed in the browser bundle.

---

## Vercel Project Setup

### Create Two Vercel Projects

Import the GitHub repo **twice** â€” once for each app:

#### ridendine-admin (admin dashboard)

| Setting | Value |
|---------|-------|
| Root Directory | `apps/admin` â† **must be set** |
| Framework | Next.js (auto-detected via `apps/admin/vercel.json`) |
| Install Command | *(leave blank)* |
| Build Command | *(leave blank â€” Vercel's Next.js builder handles this)* |
| Output Directory | `.next` |
| Node.js Version | `20.x` |

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

#### ridendine-web (customer site)

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` â† **must be set** |
| Framework | Next.js (auto-detected via `apps/web/vercel.json`) |
| Install Command | *(leave blank)* |
| Build Command | *(leave blank â€” Vercel's Next.js builder handles this)* |
| Output Directory | `.next` |
| Node.js Version | `20.x` |

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

> **Important:** Each app has its own minimal `vercel.json` (`apps/admin/vercel.json`,
> `apps/web/vercel.json`) containing only `{ "framework": "nextjs" }`. No `buildCommand` or
> `installCommand` overrides are needed. Vercel's built-in Next.js framework builder handles
> everything:
> - Install: detects `pnpm-lock.yaml` at repo root and runs `pnpm install` from repo root
> - Build: uses `@vercel/next` which properly invokes `next build`
>
> There is **no root-level `vercel.json`** â€” it was removed to prevent the admin Vercel project
> from accidentally using the web app's build command.

---

## Supabase Setup

### Hosted Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from **Settings â†’ API**
3. Add them as environment variables in both Vercel projects

### Local Development

```bash
# Start local Supabase (requires Docker)
npx supabase start

# Apply migrations
npx supabase db push

# Stop local Supabase
npx supabase stop
```

### Applying Migrations to Hosted Supabase

```bash
# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

---

## GitHub Actions CI

The CI workflow (`.github/workflows/ci.yml`) runs on every push to `main` and on every PR:

1. **Install** â€” `pnpm install --frozen-lockfile`
2. **Build shared** â€” `pnpm --filter @home-chef/shared build`
3. **Build web** â€” `pnpm --filter @home-chef/web build`
4. **Build admin** â€” `pnpm --filter @home-chef/admin build`
5. **Lint web** â€” `pnpm --filter @home-chef/web lint`
6. **Lint admin** â€” `pnpm --filter @home-chef/admin lint`
7. **Test admin** â€” `pnpm --filter @home-chef/admin test`

The mobile app (`apps/mobile`) is intentionally excluded from CI to avoid blocking web/admin deployments.

---

## Branch Protection Recommendations

Set up branch protection on `main`:

- âœ… Require status checks before merging
  - Required check: **`build` (CI)**
- âœ… Require branches to be up to date before merging
- âœ… Require pull request reviews before merging (recommended: 1 reviewer)
- âœ… Dismiss stale pull request approvals when new commits are pushed

---

## Smoke Testing

After each deployment, verify:

### Admin App
1. Visit the admin Vercel URL (e.g., `https://ridendine-admin.vercel.app`)
2. Admin gate/login screen should appear
3. Dashboard routes (`/dashboard`, `/dashboard/orders`, etc.) should load

### Web App
1. Visit the web Vercel URL (e.g., `https://ridendine-web.vercel.app`)
2. Home page should load
3. Navigation to `/chefs`, `/cart`, `/checkout` etc. should work

### Automated Smoke Test

```bash
# Check both deployed URLs respond with HTTP 200
node scripts/smoke-test.mjs
```

Set `WEB_URL` and `ADMIN_URL` environment variables before running:

```bash
WEB_URL=https://ridendine-web.vercel.app \
ADMIN_URL=https://ridendine-admin.vercel.app \
node scripts/smoke-test.mjs
```

---

## Why the Admin Build Was Failing

**Root Cause (original):** The root-level `vercel.json` contained:

```json
{
  "buildCommand": "pnpm --filter @home-chef/web build"
}
```

When the `ridendine-admin` Vercel project ran, it read this root `vercel.json` and executed the **web** build command instead of the **admin** build command.

**Root Cause (iteration 2):** After removing the root `vercel.json` and adding per-app `vercel.json` files with `installCommand: "pnpm install --frozen-lockfile"`, the admin build was still failing. When `installCommand` is specified inside a `vercel.json` in a Root Directory, **Vercel runs that command from the Root Directory** (e.g. `apps/admin`), not the repository root. Since `pnpm-lock.yaml` only exists at the repository root, the install fails.

**Root Cause (iteration 3):** Using `buildCommand: "pnpm run build"` caused Vercel to run this command via custom shell context without proper framework integration, leading to environment issues.

**Final Fix Applied:**
1. Removed the root-level `vercel.json`
2. Added per-app `vercel.json` files with only `{ "framework": "nextjs" }` â€” no command overrides
3. Vercel's built-in `@vercel/next` framework builder handles install and build automatically
4. Fixed Node.js version parity: CI now uses Node 20 (matching `.nvmrc` and Vercel's 20.x setting)

---

## Preventing Future Failures

1. **Never add a root-level `vercel.json`** with app-specific build commands in a two-project monorepo.
2. **Keep per-app `vercel.json` minimal** â€” only `{ "framework": "nextjs" }`. Never add `installCommand` or `buildCommand` overrides; Vercel's framework builder handles these correctly.
3. **Never set `installCommand` in a subdirectory's `vercel.json`** â€” it runs from that subdirectory, not the repo root.
4. **Node.js version must match** across local dev (`.nvmrc = 20`), CI (`node-version: 20`), and Vercel (`20.x`).
5. **Set Root Directory correctly** in each Vercel project (`apps/admin` or `apps/web`).
6. **Env vars** must be set in ALL Vercel environments (Production, Preview, Development).

---

## Onboarding a New Developer

1. Clone the repo
2. Run `pnpm install` from the repo root
3. Copy `.env.example` â†’ `apps/web/.env.local` and `apps/admin/.env.local`
4. Fill in Supabase credentials
5. Run `pnpm --filter @home-chef/web dev` and `pnpm --filter @home-chef/admin dev`

That's it. No additional setup required.

