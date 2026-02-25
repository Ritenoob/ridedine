---
name: vercel-deployment
description: |
  Master Vercel deployment for RidenDine web and admin Next.js apps. Use when: (1) deploying
  to production, (2) configuring environment variables, (3) setting up preview deployments,
  (4) debugging build failures, (5) configuring domains, (6) seeing "No Next.js version detected"
  error in Vercel builds, (7) setting up monorepo with separate projects on free tier. Key insight:
  Vercel monorepos require Root Directory configuration via dashboard (not vercel.json), GitHub
  integration auto-detects monorepo structure, free tier allows multiple projects.
author: Claude Code
version: 1.1.0
---

# Vercel Deployment

## Problem

RidenDine has two Next.js 15 apps (web, admin) deployed to Vercel. Each needs separate Vercel projects, environment variables, and domain configuration. Preview deployments for PRs, production deployments on main branch.

## Context / Trigger Conditions

Use this skill when:
- Deploying apps to production
- Setting up new Vercel projects
- Configuring environment variables
- Debugging build failures
- Setting up custom domains
- Configuring preview deployments

## Pattern 1: Vercel Project Setup

**Create Vercel Project:**

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link web app
cd apps/web
vercel link

# Link admin app
cd apps/admin
vercel link
```

**Project Configuration (vercel.json):**

Keep per-app `vercel.json` minimal to allow Vercel's Next.js builder to handle install/build.

```json
{
  "framework": "nextjs"
}
```

## Pattern 2: Environment Variables

**Web App (.env.production):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

**Set via Vercel Dashboard:**

1. Dashboard → Project → Settings → Environment Variables
2. Add each variable for Production, Preview, Development
3. Redeploy to apply changes

**Or via CLI:**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add STRIPE_SECRET_KEY production
```

## Pattern 3: Deployment

**Automatic Deployment:**

```bash
# Push to main → production deployment
git push origin main

# Push to feature branch → preview deployment
git push origin feature/new-feature
```

**Manual Deployment:**

```bash
cd apps/web
vercel --prod  # Deploy to production
vercel         # Deploy to preview
```

## Pattern 4: Build Configuration

**pnpm Monorepo Support:**

```json
// apps/web/package.json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start"
  }
}
```

**Install Command (vercel.json):**

Do not set this in per-app `vercel.json`. Leave install commands blank so Vercel runs pnpm from the repo root.

## Pattern 5: Monorepo Root Directory Configuration (CRITICAL)

**Problem: "No Next.js version detected" error**

When deploying from a monorepo subdirectory, Vercel looks for `next` in the repository root's `package.json`. It cannot be configured via `vercel.json` alone.

**Solution: Set Root Directory via Dashboard**

1. Deploy once (will fail with "No Next.js version detected")
2. Go to Vercel Dashboard → Project → Settings → General
3. Find "Root Directory" section → Click "Edit"
4. Set to subdirectory path: `apps/admin` or `apps/web`
5. Click "Save"
6. Redeploy from Deployments tab

**Alternative: GitHub Integration (Recommended for Free Tier)**

GitHub integration auto-detects monorepo structure:

1. Go to https://vercel.com/new
2. Import GitHub repository
3. Vercel shows "Multiple apps detected"
4. Configure each app:
   - **Name:** admin / web
   - **Root Directory:** apps/admin / apps/web
   - **Framework:** Next.js (auto-detected)
    - **Build Command:** *(leave blank)*
    - **Install Command:** *(leave blank)*
5. Deploy both projects

**Free Tier Strategy:**

- ✅ **Separate projects** (admin + web) - Recommended
  - 2 projects = 2 separate domains
  - Independent deployments
  - Easier environment variable management
  - Both deployments count toward free tier quota

- ❌ **Single project with routing** - NOT recommended
  - Complex routing configuration
  - Harder to manage separate domains
  - No benefit on free tier

## Debugging Build Failures

**Issue: "No Next.js version detected"**

**Cause:** Root Directory not configured for monorepo

**Fix:** Set Root Directory to subdirectory path via Vercel dashboard (see Pattern 5)

**Issue: Module not found**

Fix: Verify workspace dependencies installed, check tsconfig paths

**Issue: Environment variable undefined**

Fix: Add to Vercel dashboard, redeploy

**Issue: Build timeout**

Fix: Optimize build time, increase timeout in Vercel settings

## References

- Vercel docs: https://vercel.com/docs
- Next.js deployment: https://nextjs.org/docs/deployment
- Monorepo deployment: https://vercel.com/docs/concepts/monorepos
