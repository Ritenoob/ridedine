---
name: ridendine-modular-architecture
description: |
  Master RidenDine's modular monorepo architecture with three independent apps. Use when:
  (1) understanding project structure, (2) adding new apps to monorepo, (3) configuring
  shared packages, (4) deploying apps independently, (5) debugging cross-app dependencies.
  Key insight: Admin, Web, and Mobile are separate apps with independent deployments but
  share packages via pnpm workspace (packages/shared, packages/data).
author: Claude Code
version: 1.0.0
---

# RidenDine Modular Architecture

## Problem

RidenDine is built as a modular monorepo where three separate applications (Admin, Web, Mobile) share common code but deploy independently. Each app serves a different user persona and has its own deployment pipeline.

## Context / Trigger Conditions

Use this skill when:
- Understanding RidenDine's project structure
- Adding a new application to the monorepo
- Configuring shared code packages
- Debugging "module not found" errors across apps
- Setting up independent deployment pipelines
- Understanding which features belong to which app

## Architecture Overview

```
ridendine-demo-main/
├── apps/
│   ├── admin/          # Admin Dashboard (Next.js 15)
│   ├── web/            # Customer Web App (Next.js 15)
│   └── mobile/         # Driver Mobile App (Expo/React Native)
├── packages/
│   ├── shared/         # Types, enums, utilities
│   └── data/           # Supabase repositories, data access layer
├── backend/
│   └── supabase/       # Database migrations, Edge Functions
└── pnpm-workspace.yaml # Workspace configuration
```

### Three Independent Apps

| App | Tech Stack | Users | URL | Deployment |
|-----|-----------|-------|-----|------------|
| **Admin** | Next.js 15 | Admins, Chefs | https://ridedine-admin.vercel.app | Vercel (apps/admin root) |
| **Web** | Next.js 15 | Customers | https://ridedine-web.vercel.app | Vercel (apps/web root) |
| **Mobile** | Expo SDK 50 | Drivers | APK/IPA via EAS | EAS Build |

**Key Principle:** Each app is **independently deployable** - you can deploy Admin without touching Web or Mobile.

## Pattern 1: Workspace Configuration

**Location:** `pnpm-workspace.yaml` (project root)

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Why pnpm workspaces?**
- Fast installs with hard-linked dependencies
- Strict dependency management (no phantom dependencies)
- Built-in monorepo support

**Common commands:**

```bash
# Install all dependencies (run from root)
pnpm install

# Run command in specific app
pnpm --filter admin dev
pnpm --filter web build
pnpm --filter mobile start

# Run command in all apps
pnpm -r dev              # Recursive, all workspaces
pnpm -r --parallel dev   # Parallel execution

# Add dependency to specific app
pnpm --filter admin add @supabase/supabase-js
pnpm --filter web add stripe

# Add shared package dependency to app
pnpm --filter admin add @home-chef/shared --workspace
pnpm --filter mobile add @home-chef/data --workspace
```

## Pattern 2: Shared Packages

### Package 1: `@home-chef/shared`

**Location:** `packages/shared/`

**Contains:**
- TypeScript types (`Chef`, `Order`, `Delivery`, `MenuItem`)
- Enums (`OrderStatus`, `DeliveryStatus`, `PaymentStatus`, `UserRole`)
- Utility functions (distance calculations, formatting)

**Usage across apps:**

```typescript
// In apps/admin/src/components/ChefApproval.tsx
import { Chef, ChefStatus } from '@home-chef/shared';

// In apps/web/app/checkout/page.tsx
import { Order, OrderStatus } from '@home-chef/shared';

// In apps/mobile/app/(driver)/jobs.tsx
import { DeliveryStatus, calculateDistance } from '@home-chef/shared';
```

**Why shared?** Ensures type consistency across all apps - when you update `Order` type, all apps get the change.

### Package 2: `@home-chef/data`

**Location:** `packages/data/`

**Contains:**
- Supabase repository classes (`OrdersRepository`, `DeliveriesRepository`, `ChefsRepository`)
- Data access patterns (CRUD operations, queries)
- Real-time subscriptions

**Usage:**

```typescript
// In apps/admin/src/lib/orders.ts
import { OrdersRepository } from '@home-chef/data';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(/* ... */);
const ordersRepo = new OrdersRepository(supabase);
const orders = await ordersRepo.getPendingOrders();

// In apps/mobile/app/(driver)/jobs.tsx
import { DeliveriesRepository } from '@home-chef/data';

const repo = new DeliveriesRepository(supabase);
const availableDeliveries = await repo.getAvailableDeliveries(50);
```

**Why shared?** Prevents duplicate data access logic - all apps use the same database queries.

## Pattern 3: App-Specific Features

Each app has distinct features that **do not** overlap:

### Admin App (`apps/admin`)

**Purpose:** Chef/driver approval, order monitoring, platform management

**Key Features:**
- Chef application approval/rejection
- Driver verification
- Order monitoring dashboard
- Platform analytics
- User management

**Tech Stack:**
- Next.js 15 App Router
- React 18
- Supabase Auth (admin role check)
- TailwindCSS

**Entry Point:** `apps/admin/app/page.tsx`

**Deployment:**
```bash
cd apps/admin
npm run build
# Deploy to Vercel with Root Directory: apps/admin
```

### Web App (`apps/web`)

**Purpose:** Customer-facing marketplace for ordering food

**Key Features:**
- Browse chefs and menus
- Add items to cart
- Checkout with Stripe
- Order tracking
- Chef reviews

**Tech Stack:**
- Next.js 15 App Router
- React 18
- Supabase Auth (customer accounts)
- Stripe Checkout
- TailwindCSS

**Entry Point:** `apps/web/app/page.tsx`

**Deployment:**
```bash
cd apps/web
npm run build
# Deploy to Vercel with Root Directory: apps/web
```

### Mobile App (`apps/mobile`)

**Purpose:** Driver app for accepting and completing deliveries

**Key Features:**
- View available delivery jobs
- Accept deliveries
- GPS tracking during delivery
- Multi-step delivery progression
- Proof of delivery photo upload
- Earnings tracking (Phase 2)

**Tech Stack:**
- Expo SDK 50
- React Native
- Expo Router (file-based routing)
- react-native-maps (MapView)
- expo-location (GPS tracking)
- expo-image-picker (proof photos)

**Entry Point:** `apps/mobile/app/_layout.tsx`

**Deployment:**
```bash
cd apps/mobile
eas build --profile production --platform android
eas submit --platform android --latest
```

## Pattern 4: Independent Deployment

**Key Principle:** Each app deploys independently without affecting others.

### Vercel Deployment (Admin + Web)

**Configuration per app:**

```json
// apps/admin/vercel.json
{
  "framework": "nextjs"
}

// apps/web/vercel.json
{
  "framework": "nextjs"
}
```

**Vercel Project Settings:**
- **Admin:** Root Directory = `apps/admin`
- **Web:** Root Directory = `apps/web`

**Environment Variables (per project):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Admin only
```

**Deploy triggers:**
- Push to `main` branch → Auto-deploys both apps
- Changes in `apps/admin/` → Only Admin rebuilds
- Changes in `apps/web/` → Only Web rebuilds
- Changes in `packages/` → Both Admin and Web rebuild

### EAS Deployment (Mobile)

**Configuration:** `apps/mobile/eas.json`

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "channel": "production" }
  }
}
```

**Deployment:**
```bash
cd apps/mobile
eas build --profile production --platform all
eas submit --platform ios --latest
eas submit --platform android --latest
```

**Environment Variables (in eas.json):**
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
}
```

## Pattern 5: Shared Backend (Supabase)

**All three apps connect to the same Supabase backend:**

```
backend/supabase/
├── migrations/          # Database schema
│   ├── 20240101_init.sql
│   ├── 20240102_add_chefs.sql
│   └── 20240103_add_deliveries.sql
├── functions/           # Edge Functions (serverless)
│   ├── create_checkout_session/
│   ├── create_connect_account/
│   ├── webhook_stripe/
│   ├── geocode_address/
│   └── get_route/
└── seed/                # Test data
```

**Row Level Security (RLS) enforces app boundaries:**

```sql
-- Admin can view all orders
CREATE POLICY "admin_can_view_all_orders"
ON orders FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Customers can only view their own orders
CREATE POLICY "customers_can_view_own_orders"
ON orders FOR SELECT TO authenticated
USING (customer_id = auth.uid());

-- Drivers can only view orders assigned to them
CREATE POLICY "drivers_can_view_assigned_orders"
ON orders FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deliveries d
    JOIN drivers dr ON d.driver_id = dr.id
    WHERE d.order_id = orders.id AND dr.profile_id = auth.uid()
  )
);
```

## Pattern 6: Adding a New App to Monorepo

**Example: Adding a "Chef Portal" app**

**Step 1: Create app directory**
```bash
mkdir -p apps/chef-portal
cd apps/chef-portal
npx create-next-app@latest . --typescript --tailwind --app
```

**Step 2: Update package.json**
```json
{
  "name": "@home-chef/chef-portal",
  "version": "0.1.0",
  "dependencies": {
    "@home-chef/shared": "workspace:*",
    "@home-chef/data": "workspace:*",
    "next": "15.0.0",
    "react": "18.2.0"
  }
}
```

**Step 3: Verify workspace**
```bash
# From project root
pnpm install
pnpm --filter chef-portal dev
```

**Step 4: Configure deployment**
- Vercel: Create new project, set Root Directory to `apps/chef-portal`
- Environment variables: Copy from Admin or Web
- Deploy

## Common Issues

### Issue: "Cannot find module '@home-chef/shared'"

**Cause:** Shared package not installed or wrong import path

**Fix:**
```bash
# From project root
pnpm install

# Verify workspace structure
pnpm list --depth 0 --filter admin
# Should show @home-chef/shared in dependencies

# If missing, add it
pnpm --filter admin add @home-chef/shared --workspace
```

### Issue: Vercel build fails with "No Next.js version detected"

**Cause:** Root Directory not configured

**Fix:**
1. Go to Vercel Dashboard → Project Settings → General
2. Set "Root Directory" to `apps/admin` or `apps/web`
3. Save and redeploy

### Issue: Changes in shared package not reflected in apps

**Cause:** TypeScript not recompiling shared package

**Fix:**
```bash
# From packages/shared
pnpm build

# Or use watch mode during development
pnpm dev  # (if configured in packages/shared/package.json)
```

### Issue: Mobile app can't find shared package

**Cause:** Expo Metro bundler doesn't follow symlinks by default

**Fix:** Add to `apps/mobile/metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch for changes in shared packages
config.watchFolders = [workspaceRoot];

// Resolve shared packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

## Verification

After setting up or modifying the monorepo structure:

**Verify workspace:**
```bash
# From root
pnpm -r list --depth 0
# Should show all apps and packages

# Verify shared package resolution
pnpm --filter admin why @home-chef/shared
pnpm --filter web why @home-chef/shared
pnpm --filter mobile why @home-chef/shared
```

**Test builds:**
```bash
# Build each app independently
pnpm --filter admin build
pnpm --filter web build
cd apps/mobile && npx expo export  # Check bundling works
```

**Test shared package changes:**
1. Modify `packages/shared/src/types.ts` (add a new field)
2. Use the new field in `apps/admin` and `apps/web`
3. Verify TypeScript shows the new field in autocomplete
4. Build both apps - should succeed

## Migration Notes

**From separate repos to monorepo:**

If Admin, Web, and Mobile were separate repos and you're consolidating:

1. **Identify common code** → Move to `packages/shared`
2. **Identify data access code** → Move to `packages/data`
3. **Update imports** in all apps:
   ```typescript
   // Before
   import { Chef } from '../types/chef';

   // After
   import { Chef } from '@home-chef/shared';
   ```
4. **Update deployment configs** (add Root Directory to Vercel projects)
5. **Consolidate environment variables** (same Supabase URL for all apps)

## References

- pnpm workspaces: https://pnpm.io/workspaces
- Vercel monorepo: https://vercel.com/docs/monorepos
- Expo monorepo: https://docs.expo.dev/guides/monorepos/
- RidenDine deployment: `.claude/skills/vercel-deployment/SKILL.md`
- RidenDine packages: `packages/shared/README.md`, `packages/data/README.md`
