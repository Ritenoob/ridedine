# RidenDine Recurring Errors - Root Cause Analysis

**Generated:** 2026-02-25
**Investigation Period:** Last 346 commits (2 weeks)
**Status:** Active development with multiple unresolved structural issues

---

## Critical Finding: Merge Conflict in CI Workflow

**File:** `.github/workflows/ci.yml`
**Status:** UNRESOLVED MERGE CONFLICT (lines 1-230)

### Evidence
- File contains Git conflict markers: `<<<<<<< HEAD` and `>>>>>>> fix/ci-vercel-secrets`
- Two versions present: pnpm v10 (HEAD) vs pnpm v9 (branch)
- Different test commands: `pnpm test` vs `pnpm test:coverage`

### Root Cause
Incomplete merge between branches:
- `copilot/apply-pnpm-lockfile-fixes` (not merged to main)
- `copilot/audit-vercel-deployment-issues` (not merged to main)
- Current HEAD is at commit `2c0d6d8` but newer fixes exist on unmerged branches

### Impact
- CI pipeline cannot run (file is invalid YAML due to conflict markers)
- All builds, tests, and deployments blocked
- Multiple developers continuing work without functional CI

### Why It Keeps Recurring
**This isn't a recurring issue - it's an unresolved state.** The conflict was introduced in commit `ffe047f` which attempted to "resolve CI conflict" but actually left conflict markers in the file.

### Permanent Solution
```bash
# Resolve conflict by accepting one version
git checkout main
# Choose pnpm v10 version (lines 1-114) OR pnpm v9 version (lines 115-230)
# Remove conflict markers
git add .github/workflows/ci.yml
git commit -m "fix: resolve CI workflow merge conflict"
```

---

## Issue 1: Missing TypeScript Types - Favorite & Dish

**File:** `apps/mobile/app/(customer)/favorites.tsx:14`
**Error:** `Module '@home-chef/shared' has no exported member 'Favorite'` and `'Dish'`

### Evidence
- Database table exists: `favorites` table created in migration `20240108000000_add_favorites.sql`
- Table uses polymorphic pattern: `favoritable_type` can be 'chef' or 'dish'
- TypeScript package `@home-chef/shared` exports 151 lines of types but missing these two

### Root Cause Analysis
**Structural mismatch between database schema and TypeScript definitions:**

1. **Database schema** (20240108000000_add_favorites.sql):
   ```sql
   favoritable_type TEXT CHECK (favoritable_type IN ('chef', 'dish'))
   ```

2. **TypeScript exports** (packages/shared/src/types.ts):
   - Exports: `Chef`, `MenuItem`, `Menu`, `Order`, etc.
   - **Missing:** `Favorite` interface, `Dish` type alias

3. **What exists vs what's needed:**
   - `Chef` interface ✓ (exists)
   - `MenuItem` interface ✓ (exists, but code expects `Dish`)
   - `Favorite` interface ✗ (missing completely)

### Why It Keeps Recurring
**Inconsistent naming conventions across layers:**
- **Database layer:** Uses `menu_items` table
- **TypeScript layer:** Exports `MenuItem` interface
- **Application layer:** Code imports `Dish` (doesn't exist)
- **No validation:** TypeScript paths pointing to unbuilt `src` instead of compiled `dist`

### Permanent Solution

1. **Add missing types** to `packages/shared/src/types.ts`:
```typescript
// Add after Review interface (line 151)
export interface Favorite {
  id: string;
  user_id: string;
  favoritable_type: 'chef' | 'dish';
  favoritable_id: string;
  created_at: string;
}

// Add type alias for backwards compatibility
export type Dish = MenuItem;
```

2. **Rebuild shared package:**
```bash
cd packages/shared
pnpm build
```

3. **Update mobile app imports** if using `Dish`:
```typescript
// Either use MenuItem directly
import type { MenuItem } from '@home-chef/shared';

// Or use the Dish alias
import type { Dish } from '@home-chef/shared';
```

---

## Issue 2: Missing Expo Module Type Declarations

**Files:**
- `apps/mobile/app/(driver)/jobs.tsx:17`
- `apps/mobile/lib/location.ts:1`
- `apps/mobile/lib/notifications.ts:1,2`

**Errors:**
```
Cannot find module 'expo-location'
Cannot find module 'expo-notifications'
Cannot find module 'expo-device'
Cannot find module 'expo-constants'
```

### Evidence
- Packages ARE installed in `node_modules` (verified via `pnpm install` success)
- TypeScript can't find them because they're not in the project's type resolution path
- Mobile app `tsconfig.json` only has paths for `@/*` and `@home-chef/shared`

### Root Cause
**Missing `@types/node` causes TypeScript to not recognize native modules:**

1. `lib/supabase.ts:4,5` shows: "Cannot find name 'process'"
2. This indicates Node.js types are missing
3. Without Node types, TypeScript's module resolution is incomplete
4. Expo modules rely on Node module resolution patterns

### Why It Keeps Recurring
**Never fixed at the root - only symptoms addressed:**

From commit history:
- `edd9864`: "resolve TypeScript compilation and missing dependencies" (didn't actually resolve)
- `c3c57f3`: "migrate to pnpm workspaces and repair broken imports" (imports still broken)
- `93f31cb`: "resolve CI workflow and build issues" (CI still broken)

Each commit claims to fix TypeScript issues but doesn't address:
1. Missing `@types/node` in mobile package
2. Incorrect `tsconfig.json` module resolution
3. Reliance on `process.env` without Node types

### Permanent Solution

1. **Add Node types** to `apps/mobile/package.json`:
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.3.0"
  }
}
```

2. **Update tsconfig.json**:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "types": ["node"],
    "moduleResolution": "node",
    "paths": {
      "@/*": ["./*"],
      "@home-chef/shared": ["../../packages/shared/src"]
    }
  }
}
```

3. **Replace `process.env` in React Native:**
```typescript
// Instead of:
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

// Use Expo's constants:
import Constants from 'expo-constants';
const url = Constants.expoConfig?.extra?.supabaseUrl;
```

---

## Issue 3: Delivery Type Mismatch (Schema vs Code)

**File:** `apps/mobile/app/(driver)/jobs.tsx:75-95`
**Errors:** 14 TypeScript errors about missing properties on `Delivery` type

### Evidence
**TypeScript definition** (`packages/shared/src/types.ts:98-108`):
```typescript
export interface Delivery {
  id: string;
  order_id: string;
  driver_id?: string;
  status: DeliveryStatus;
  pickup_eta?: string;
  dropoff_eta?: string;
  proof_url?: string;
  created_at: string;
  updated_at?: string;
}
```

**Database schema usage** (`packages/data/src/deliveries-repository.ts:226-233`):
```typescript
.insert({
  order_id: orderId,
  status: DeliveryStatus.PENDING,  // ← PENDING doesn't exist in enum!
  pickup_address: pickupAddress,    // ← Not in TypeScript interface
  pickup_lat: pickupLat,            // ← Not in TypeScript interface
  pickup_lng: pickupLng,            // ← Not in TypeScript interface
  dropoff_address: dropoffAddress,  // ← Not in TypeScript interface
  dropoff_lat: dropoffLat,          // ← Not in TypeScript interface
  dropoff_lng: dropoffLng,          // ← Not in TypeScript interface
  delivery_fee_cents: deliveryFeeCents, // ← Not in TypeScript interface
})
```

### Root Cause
**Database migrations were updated but TypeScript types were not synced:**

1. Database schema (20240101000000_initial_schema.sql:203+) likely contains:
   - `pickup_address`, `pickup_lat`, `pickup_lng`
   - `dropoff_address`, `dropoff_lat`, `dropoff_lng`
   - `delivery_fee_cents`

2. TypeScript types are stale - only have `pickup_eta` and `dropoff_eta`

3. Enum mismatch: `DeliveryStatus.PENDING` doesn't exist in `enums.ts`
   - Available: ASSIGNED, EN_ROUTE_TO_PICKUP, etc.
   - Missing: PENDING

### Why It Keeps Recurring
**No type generation from database schema.**

This is a manual sync problem:
1. Developer updates database migration SQL
2. Developer forgets to update TypeScript types
3. Code continues to compile (workspace uses `src` paths, not built types)
4. Runtime errors occur in production

### Permanent Solution

1. **Add missing enum value** to `packages/shared/src/enums.ts:49`:
```typescript
export enum DeliveryStatus {
  PENDING = 'pending',          // ← ADD THIS
  ASSIGNED = 'assigned',
  EN_ROUTE_TO_PICKUP = 'en_route_to_pickup',
  // ... rest
}
```

2. **Update Delivery interface** in `packages/shared/src/types.ts:98`:
```typescript
export interface Delivery {
  id: string;
  order_id: string;
  driver_id?: string;
  status: DeliveryStatus;

  // Add location fields
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address?: string;
  dropoff_lat?: number;
  dropoff_lng?: number;

  // Add fee field
  delivery_fee_cents?: number;

  // Keep existing
  pickup_eta?: string;
  dropoff_eta?: string;
  proof_url?: string;
  created_at: string;
  updated_at?: string;
}
```

3. **Long-term: Use Supabase type generation:**
```bash
# Generate types from database
npx supabase gen types typescript --project-id <id> > packages/shared/src/database.types.ts
```

---

## Issue 4: Missing ImageUpload Component

**File:** `apps/mobile/app/(driver)/active.tsx:7`
**Error:** `Cannot find module '@/components/ImageUpload'`

### Evidence
- File imports: `import ImageUpload from '@/components/ImageUpload';`
- Path alias `@/*` maps to `apps/mobile/` root
- Component doesn't exist in expected location

### Root Cause
**Component referenced but never created.**

This is a classic case of:
1. Developer writes TODO: "need image upload for proof of delivery"
2. Import added preemptively
3. Component implementation forgotten
4. TypeScript errors ignored (likely suppressed during development)

### Permanent Solution

Create the missing component at `apps/mobile/components/ImageUpload.tsx` OR remove the import if not needed yet.

---

## Issue 5: Bun Test Import in Expo Project

**File:** `apps/mobile/app/(driver)/jobs.test.ts:1`
**Error:** `Cannot find module 'bun:test'`

### Evidence
- File imports: `import { describe, it, expect } from 'bun:test';`
- Project uses: Vitest (configured in package.json)
- Bun is not a dependency

### Root Cause
**Copy-paste error from different project.**

Someone copied a test file from a Bun-based project without updating imports.

### Permanent Solution
```typescript
// Change from:
import { describe, it, expect } from 'bun:test';

// To:
import { describe, it, expect } from 'vitest';
```

---

## Meta-Issue: Why These Keep Recurring

### Pattern Analysis

1. **No CI enforcement** - Merge conflict means CI never runs
2. **No pre-commit hooks** - TypeScript errors committed directly
3. **Workspace misconfiguration** - `tsconfig.json` paths point to `src` not `dist`
4. **Manual type sync** - No automated type generation from database
5. **High velocity without quality gates** - 346 commits in 2 weeks, multiple claiming "fix TypeScript" but not actually fixing

### Structural Problems

| Problem | Evidence | Impact |
|---------|----------|--------|
| **Broken CI** | Merge conflict in workflow file | Zero automated checks |
| **Path misconfiguration** | Points to `src` instead of `dist` | Compiles with wrong types |
| **Missing dev dependencies** | No `@types/node` in mobile | Node APIs untyped |
| **No type generation** | Manual sync between SQL and TS | Constant drift |
| **No pre-commit hooks** | Invalid code committed | Errors accumulate |

---

## Immediate Action Plan

### Step 1: Fix CI (Blocker)
```bash
cd /home/nygmaee/Desktop/ridendine-demo-main
git checkout main
# Edit .github/workflows/ci.yml - remove conflict markers
# Choose pnpm v10, Node 20 version (lines 1-114)
git add .github/workflows/ci.yml
git commit -m "fix: resolve CI workflow merge conflict"
git push origin main
```

### Step 2: Add Missing Types
```bash
# Edit packages/shared/src/types.ts
# Add Favorite interface and Dish type alias
# Update Delivery interface with location fields
cd packages/shared
pnpm build
```

### Step 3: Fix Mobile Dependencies
```bash
cd apps/mobile
# Add @types/node to package.json devDependencies
pnpm install
```

### Step 4: Fix Enum Mismatch
```bash
# Edit packages/shared/src/enums.ts
# Add PENDING to DeliveryStatus enum
cd packages/shared
pnpm build
```

### Step 5: Remove Invalid Imports
```bash
# Fix jobs.test.ts - change bun:test to vitest
# Fix active.tsx - remove ImageUpload import OR create component
```

### Step 6: Verify
```bash
cd /home/nygmaee/Desktop/ridendine-demo-main
pnpm install
pnpm -r exec tsc --noEmit  # Should pass
pnpm test                   # Should pass
```

---

## Prevention Measures

1. **Add Husky pre-commit hook:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm -r exec tsc --noEmit && pnpm test"
    }
  }
}
```

2. **Enable TypeScript strict mode in CI:**
```yaml
- name: Type check with zero tolerance
  run: pnpm -r exec tsc --noEmit --strict
```

3. **Generate types from Supabase:**
```bash
# Add to package.json scripts
"gen-types": "supabase gen types typescript --project-id $PROJECT_ID > packages/shared/src/database.types.ts"
```

4. **Fix workspace tsconfig paths:**
```json
{
  "paths": {
    "@home-chef/shared": ["../../packages/shared/dist"]  // Use dist, not src
  }
}
```

---

## Summary

**None of these are truly "recurring" errors - they are unresolved structural issues.**

The pattern is:
1. Error introduced
2. "Fix" committed that doesn't actually fix root cause
3. Error persists
4. New commit claims to fix it again
5. Cycle repeats

The CI workflow merge conflict is the smoking gun - it shows that quality gates have been broken for multiple commits, allowing invalid code to accumulate.

**Priority:** Fix CI first (blocks everything else), then add type definitions, then add prevention measures.
