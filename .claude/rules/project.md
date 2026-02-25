# Project: Home Chef Delivery Marketplace

**Last Updated:** 2026-02-24

## Overview

A 3-sided marketplace connecting customers, home chefs, and drivers for home-cooked meal delivery. Validate production readiness against current CI and monitoring.

## Technology Stack

- **Language:** TypeScript
- **Frontend:** Next.js 15 (web/admin), React Native with Expo (mobile)
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Payments:** Stripe Connect (marketplace split payments)
- **Package Manager:** pnpm 10.x
- **Node:** >=20
- **Testing:** Bun (mobile), Vitest (packages), Deno (Edge Functions)

## Directory Structure

```
apps/
├── mobile/              # React Native (Expo) - customer & driver apps
├── admin/               # Next.js - admin dashboard
└── web/                 # Next.js - customer-facing web app
backend/
└── supabase/
    ├── migrations/      # SQL migrations
    └── functions/       # Deno Edge Functions (assign_driver, get_route)
packages/
├── shared/              # Types, schemas, enums, utilities
├── data/                # Data access layer (repositories)
└── ui/                  # Shared UI components
docs/                    # Architecture, deployment guides
```

## Key Files

- **Monorepo:** `pnpm-workspace.yaml`
- **Main Config:** `package.json` (root + each app/package)
- **Supabase:** `backend/supabase/config.toml`
- **Migrations:** `backend/supabase/migrations/*.sql`
- **Edge Functions:** `backend/supabase/functions/*/index.ts`

## Development Commands

- **Install:** `pnpm install`
- **Build:** `pnpm build` (all workspaces)
- **Test:** `pnpm test` (all workspaces)
- **Typecheck:** `pnpm typecheck` (all workspaces)
- **Lint:** `pnpm lint` (all workspaces)
- **Mobile:** `cd apps/mobile && pnpm start` (Expo)
- **Web:** `cd apps/web && pnpm dev` (Next.js dev server)
- **Admin:** `cd apps/admin && pnpm dev` (Next.js dev server)

## Architecture Notes

- **Monorepo:** pnpm workspaces with shared packages for types and UI
- **Database:** PostgreSQL with Row Level Security (RLS) policies for multi-tenant auth
- **Realtime:** Supabase Broadcast channels for live driver GPS tracking
- **Edge Functions:** Deno runtime for assign_driver (auto-dispatch) and get_route (multi-provider routing)
- **Mobile:** Expo Router for file-based routing, separate (customer) and (driver) route groups
- **Payments:** Stripe Connect with split payments to chefs (90%) and platform (10%)
- **Auth:** Supabase Auth with role-based access (customer, chef, driver, admin)
