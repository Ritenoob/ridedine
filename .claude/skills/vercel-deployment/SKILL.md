---
name: vercel-deployment
description: |
  Master Vercel deployment for RidenDine web and admin Next.js apps. Use when: (1) deploying
  to production, (2) configuring environment variables, (3) setting up preview deployments,
  (4) debugging build failures, (5) configuring domains. Key insight: Vercel auto-deploys on
  git push, environment variables set via dashboard, separate projects for web and admin.
author: Claude Code
version: 1.0.0
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

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

## Pattern 2: Environment Variables

**Web App (.env.production):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
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

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile"
}
```

## Debugging Build Failures

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
