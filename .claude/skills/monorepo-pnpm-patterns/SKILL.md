---
name: monorepo-pnpm-patterns
description: |
  Master pnpm workspace management for RidenDine monorepo. Use when: (1) adding new packages
  or apps, (2) managing dependencies across workspace, (3) debugging module resolution, (4)
  running tasks across packages, (5) optimizing builds. Key insight: pnpm workspaces with
  "workspace:*" protocol for internal packages, strict dependency hoisting disabled.
author: Claude Code
version: 1.0.0
---

# pnpm Monorepo Patterns

## Problem

RidenDine uses a pnpm monorepo with 3 apps (web, admin, mobile) and 3 packages (shared, data, ui). Managing dependencies, ensuring type safety across packages, and running tasks efficiently requires proper workspace configuration and patterns.

## Context / Trigger Conditions

Use this skill when:
- Adding new app or package to monorepo
- Resolving "Cannot find module" errors
- Adding dependencies to specific workspace
- Running scripts across multiple packages
- Debugging TypeScript path resolution
- Optimizing monorepo builds
- Setting up CI/CD for monorepo

## RidenDine Monorepo Structure

```
ridendine-demo-main/
├── apps/
│   ├── web/              # Next.js 15 customer app
│   ├── admin/            # Next.js 15 admin dashboard
│   └── mobile/           # React Native/Expo 50 mobile app
├── packages/
│   ├── shared/           # Shared types, utilities
│   ├── data/             # Database client, repositories
│   └── ui/               # Shared UI components
├── backend/
│   └── supabase/         # Supabase migrations, Edge Functions
├── pnpm-workspace.yaml   # Workspace configuration
├── package.json          # Root package.json
└── turbo.json            # Turbo configuration (if using Turbo)
```

## Pattern 1: Workspace Configuration

**Location:** `pnpm-workspace.yaml`

**Example Implementation:**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root `package.json`:**

```json
{
  "name": "ridendine-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel run dev",
    "build": "pnpm --filter \"./apps/**\" run build",
    "test": "pnpm --recursive run test",
    "lint": "pnpm --recursive run lint",
    "clean": "pnpm --recursive exec rm -rf node_modules .next dist out"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

## Pattern 2: Internal Package Dependencies

**Using `workspace:*` Protocol:**

**Example:** `apps/web/package.json` depends on `packages/shared`:

```json
{
  "name": "@ridendine/web",
  "dependencies": {
    "@home-chef/shared": "workspace:*",
    "@home-chef/data": "workspace:*",
    "@home-chef/ui": "workspace:*"
  }
}
```

**Why `workspace:*`:**
- Always uses local version (no npm registry lookup)
- Automatically resolves to latest workspace version
- Ensures type safety across packages
- Supports hot-reloading in development

**Package Names:**

```json
// packages/shared/package.json
{
  "name": "@home-chef/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}

// packages/data/package.json
{
  "name": "@home-chef/data",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}

// packages/ui/package.json
{
  "name": "@home-chef/ui",
  "version": "1.0.0",
  "main": "./src/index.tsx",
  "types": "./src/index.tsx"
}
```

## Pattern 3: TypeScript Path Resolution

**Root `tsconfig.json` (base configuration):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

**App `tsconfig.json` (extends base):**

```json
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@home-chef/shared": ["../../packages/shared/src"],
      "@home-chef/data": ["../../packages/data/src"],
      "@home-chef/ui": ["../../packages/ui/src"]
    },
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Package `tsconfig.json`:**

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Pattern 4: Adding Dependencies

**Install to root (applies to all packages):**

```bash
pnpm add -D typescript @types/node -w
# -w flag installs to workspace root
```

**Install to specific package:**

```bash
# Add to web app
pnpm add --filter @ridendine/web next react react-dom

# Add to mobile app
pnpm add --filter @ridendine/mobile expo expo-router

# Add to shared package
pnpm add --filter @home-chef/shared zod
```

**Add workspace dependency:**

```bash
# Add shared package to web app
pnpm add --filter @ridendine/web @home-chef/shared@workspace:*
```

**Update all dependencies:**

```bash
pnpm update --recursive
```

## Pattern 5: Running Scripts

**Run script in specific package:**

```bash
# Run dev server in web app
pnpm --filter @ridendine/web dev

# Run tests in shared package
pnpm --filter @home-chef/shared test

# Build admin app
pnpm --filter @ridendine/admin build
```

**Run script in multiple packages:**

```bash
# Run dev in all apps (parallel)
pnpm --filter "./apps/**" --parallel dev

# Build all packages first, then all apps
pnpm --filter "./packages/**" build
pnpm --filter "./apps/**" build

# Test everything
pnpm --recursive test
```

**pnpm Filtering:**

| Filter | Matches |
|--------|---------|
| `--filter @ridendine/web` | Specific package by name |
| `--filter "./apps/**"` | All packages in apps directory |
| `--filter "./packages/**"` | All packages in packages directory |
| `--filter "!@ridendine/mobile"` | All except mobile |
| `--filter "...@home-chef/shared"` | Shared package + all dependents |
| `--recursive` | All packages in workspace |

## Pattern 6: Shared Package Exports

**Example:** `packages/shared/src/index.ts`

```typescript
// Type exports
export type {
  User,
  Profile,
  Chef,
  Driver,
  Order,
  OrderItem,
  Dish,
  Review,
} from './types';

// Utility exports
export { formatCurrency, formatDate } from './utils/format';
export { validateEmail, validatePhone } from './utils/validation';

// Constant exports
export { ORDER_STATUSES, PAYMENT_STATUSES, USER_ROLES } from './constants';
```

**Consuming in apps:**

```typescript
// apps/web/app/page.tsx
import type { Chef, Dish } from '@home-chef/shared';
import { formatCurrency } from '@home-chef/shared';

const price = formatCurrency(1599); // "$15.99"
```

## Pattern 7: Data Package Pattern (Repository Layer)

**Example:** `packages/data/src/repositories/orders.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderItem } from '@home-chef/shared';

export class OrdersRepository {
  constructor(private supabase: SupabaseClient) {}

  async createOrder(data: {
    customer_id: string;
    chef_id: string;
    total_cents: number;
    items: Omit<OrderItem, 'id' | 'order_id'>[];
  }): Promise<Order> {
    const { data: order, error } = await this.supabase
      .from('orders')
      .insert({
        customer_id: data.customer_id,
        chef_id: data.chef_id,
        total_cents: data.total_cents,
        status: 'draft',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Create order items
    const { error: itemsError } = await this.supabase
      .from('order_items')
      .insert(
        data.items.map((item) => ({
          order_id: order.id,
          ...item,
        }))
      );

    if (itemsError) throw itemsError;

    return order;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
```

**Export from package:**

```typescript
// packages/data/src/index.ts
export { OrdersRepository } from './repositories/orders';
export { ChefsRepository } from './repositories/chefs';
export { DriversRepository } from './repositories/drivers';
```

**Use in app:**

```typescript
// apps/web/app/orders/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { OrdersRepository } from '@home-chef/data';

export async function getMyOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const ordersRepo = new OrdersRepository(supabase);
  return ordersRepo.getOrdersByCustomer(user.id);
}
```

## Pattern 8: UI Package Pattern (Shared Components)

**Example:** `packages/ui/src/Button.tsx`

```typescript
import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size}`}
    >
      {children}
    </button>
  );
}
```

**Use in apps:**

```typescript
// apps/web/app/page.tsx
import { Button } from '@home-chef/ui';

export default function HomePage() {
  return <Button variant="primary">Order Now</Button>;
}
```

## Debugging Common Issues

### Issue: "Cannot find module '@home-chef/shared'"

**Symptom:** TypeScript or runtime error about missing module

**Cause:** Workspace dependency not installed or misconfigured

**Fix:**
1. Run `pnpm install` from root
2. Verify `package.json` has `workspace:*` dependency
3. Check `pnpm-workspace.yaml` includes package directory
4. Restart TypeScript server in IDE

### Issue: Types not updating across packages

**Symptom:** TypeScript shows old types from shared package

**Cause:** Build cache or IDE cache

**Fix:**
1. Rebuild shared package: `pnpm --filter @home-chef/shared build`
2. Restart TypeScript server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. Delete `.next`, `dist` folders: `pnpm clean`
4. Run `pnpm install` again

### Issue: Circular dependencies

**Symptom:** Import errors or infinite loops

**Cause:** Package A imports from B, B imports from A

**Fix:**
1. Identify circular dependency: `pnpm why <package>`
2. Extract shared code to new package (e.g., `shared-utils`)
3. Refactor to remove circular imports
4. Use dependency injection to break cycle

### Issue: Scripts not running in order

**Symptom:** Build fails because shared package not built first

**Cause:** No dependency ordering

**Fix:**
Use topological sorting or Turbo:

**Option 1: Manual ordering:**

```json
// Root package.json
{
  "scripts": {
    "build": "pnpm --filter \"./packages/**\" build && pnpm --filter \"./apps/**\" build"
  }
}
```

**Option 2: Turbo (recommended):**

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

Then: `turbo run build` (automatically builds dependencies first)

## CI/CD Patterns

**Build only affected packages:**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build affected packages
        run: pnpm --filter "...[origin/main]" build

      - name: Test affected packages
        run: pnpm --filter "...[origin/main]" test
```

**Filter explanation:**
- `--filter "...[origin/main]"` → Builds only packages changed since main branch

## Performance Tips

**1. Use pnpm's content-addressable store:**
- pnpm installs packages once globally, then hard-links to node_modules
- Saves disk space and speeds up installs

**2. Enable hoisting carefully:**

```yaml
# .npmrc
hoist=false
hoist-pattern[]=*eslint*
hoist-pattern[]=*prettier*
```

**3. Use Turbo for caching:**

```bash
pnpm add -D turbo -w
# Turbo caches build outputs across runs
turbo run build --cache-dir=.turbo
```

**4. Prune node_modules in CI:**

```bash
pnpm install --frozen-lockfile --prod
# Removes devDependencies after build
```

## References

- pnpm workspaces: https://pnpm.io/workspaces
- pnpm filtering: https://pnpm.io/filtering
- Turbo build system: https://turbo.build/repo/docs
- RidenDine workspace: `pnpm-workspace.yaml`, root `package.json`
