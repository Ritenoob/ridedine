---
name: ridendine-testing
description: |
  Master testing patterns for RidenDine across web, admin, and mobile apps. Use when: (1) writing
  tests for new features, (2) debugging test failures, (3) setting up test infrastructure, (4)
  mocking Supabase client, (5) testing auth flows, (6) E2E testing. Key insight: Vitest for
  web/admin (faster, better ESM), Jest for mobile (Expo ecosystem), different Supabase mocks
  for different contexts.
author: Claude Code
version: 1.0.0
---

# RidenDine Testing Patterns

## Problem

RidenDine uses different test frameworks across apps (Vitest for Next.js, Jest for React Native). Testing requires mocking Supabase clients, auth state, and API responses. Each layer (components, hooks, Server Actions, Edge Functions) needs different testing approaches.

## Context / Trigger Conditions

Use this skill when:
- Writing tests for new features
- Debugging test failures
- Mocking Supabase auth or database queries
- Testing Server Components or Server Actions
- Setting up E2E tests with Playwright
- Testing mobile app with Jest
- Achieving 80%+ code coverage

## Testing Stack

| App                | Framework | Test Runner | Location                     |
| ------------------ | --------- | ----------- | ---------------------------- |
| **web**            | Vitest    | Vitest      | `apps/web/__tests__/`        |
| **admin**          | Vitest    | Vitest      | `apps/admin/__tests__/`      |
| **mobile**         | Jest      | Jest        | `apps/mobile/__tests__/`     |
| **packages/***     | Vitest    | Vitest      | `packages/*/src/__tests__/`  |
| **Edge Functions** | Deno Test | Deno        | `backend/supabase/functions/*/test.ts` |

## Pattern 1: Vitest Configuration (Web/Admin)

**Location:** `apps/web/vitest.config.ts`

**Example Implementation:**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom', // Faster than jsdom
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.ts',
        '.next/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Test Setup:** `apps/web/__tests__/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client (see Pattern 3)
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}));
```

## Pattern 2: Jest Configuration (Mobile)

**Location:** `apps/mobile/jest.config.js`

**Example Implementation:**

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
```

**Test Setup:** `apps/mobile/__tests__/setup.ts`

```typescript
import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));
```

## Pattern 3: Mocking Supabase Client

**For Unit Tests (Vitest):**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createClient } from '@/lib/supabase/client';

// Mock at module level
vi.mock('@/lib/supabase/client');

describe('useOrders hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches orders for current user', async () => {
    // Mock Supabase response
    const mockOrders = [
      { id: '1', status: 'placed', total_cents: 1500 },
      { id: '2', status: 'delivered', total_cents: 2000 },
    ];

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({ data: mockOrders, error: null })
            ),
          })),
        })),
      })),
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-123' } },
            error: null,
          })
        ),
      },
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    const { result } = renderHook(() => useOrders());

    // Wait for hook to fetch data
    await vi.waitFor(() => {
      expect(result.current.orders).toHaveLength(2);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('orders');
  });
});
```

**For Integration Tests (Real Supabase Test Instance):**

```typescript
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const supabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_ANON_KEY!
);

describe('Orders Repository Integration', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const { data } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpass123',
    });
    testUserId = data.user!.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('orders').delete().eq('customer_id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('creates order with items', async () => {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: testUserId,
        chef_id: 'chef-123',
        total_cents: 1500,
        status: 'draft',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('draft');
  });
});
```

## Pattern 4: Testing React Components

**Example:** Testing CartContext (Completed in Task 1)

```typescript
import { describe, it, expect } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/lib/CartContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  it('should start with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.chefId).toBeNull();
  });

  it('should add an item to the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBeCloseTo(15.99, 2);
  });

  it('should increment quantity when adding the same item twice', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem);
      result.current.addItem(testItem);
    });

    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBeCloseTo(31.98, 2); // Use toBeCloseTo for floats
  });
});
```

## Pattern 5: Testing Server Actions

**Example:** Testing login action

```typescript
import { describe, it, expect, vi } from 'vitest';
import { login } from '@/app/login/actions';
import { createActionClient } from '@/lib/supabase/server';

// Mock Supabase server client
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('login action', () => {
  it('signs in user with valid credentials', async () => {
    const mockSignIn = vi.fn(() =>
      Promise.resolve({ data: { user: { id: '123' } }, error: null })
    );

    vi.mocked(createActionClient).mockResolvedValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    } as any);

    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');

    await login(formData);

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('returns error for invalid credentials', async () => {
    const mockSignIn = vi.fn(() =>
      Promise.resolve({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      })
    );

    vi.mocked(createActionClient).mockResolvedValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    } as any);

    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'wrongpassword');

    const result = await login(formData);

    expect(result).toEqual({ error: 'Invalid credentials' });
  });
});
```

## Pattern 6: Testing Edge Functions (Deno)

**Location:** `backend/supabase/functions/create_checkout_session/test.ts`

**Example Implementation:**

```typescript
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';

Deno.test('createCheckoutSession - validates order exists', async () => {
  const req = new Request('http://localhost:54321/functions/v1/create_checkout_session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: 'invalid-id' }),
  });

  // Mock Supabase environment
  Deno.env.set('SUPABASE_URL', 'http://localhost:54321');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
  Deno.env.set('STRIPE_SECRET_KEY', 'sk_test_123');

  // Import function handler
  const { handler } = await import('./index.ts');

  const response = await handler(req);
  const data = await response.json();

  assertEquals(response.status, 404);
  assertEquals(data.error, 'Order not found');
});

Deno.test('createCheckoutSession - creates Stripe session', async () => {
  // Mock successful flow
  const req = new Request('http://localhost:54321/functions/v1/create_checkout_session', {
    method: 'POST',
    body: JSON.stringify({ order_id: 'order-123' }),
  });

  const { handler } = await import('./index.ts');
  const response = await handler(req);
  const data = await response.json();

  assertEquals(response.status, 200);
  assertEquals(typeof data.url, 'string'); // Stripe checkout URL
});
```

**Run Deno tests:**

```bash
cd backend/supabase/functions/create_checkout_session
deno test --allow-net --allow-env test.ts
```

## Pattern 7: E2E Testing with Playwright

**Location:** `apps/web/__tests__/e2e/checkout.spec.ts`

**Example Implementation:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('completes checkout successfully', async ({ page }) => {
    // Browse chefs
    await page.goto('/chefs');
    await page.click('[data-testid="chef-card"]'); // First chef

    // Add dish to cart
    await page.click('[data-testid="add-to-cart"]');

    // Go to checkout
    await page.click('[data-testid="cart-button"]');
    await page.click('[data-testid="checkout-button"]');

    // Wait for Stripe redirect (or mock)
    await expect(page).toHaveURL(/stripe.com/);

    // In test mode, complete payment
    await page.fill('[name="cardnumber"]', '4242 4242 4242 4242');
    await page.fill('[name="exp-date"]', '12/34');
    await page.fill('[name="cvc"]', '123');
    await page.click('[data-testid="submit-button"]');

    // Verify success page
    await expect(page).toHaveURL(/\/order\/.*\?success=true/);
    await expect(page.locator('text=Order Placed')).toBeVisible();
  });

  test('shows validation errors for empty cart', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page.locator('text=Your cart is empty')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-button"]')).toBeDisabled();
  });
});
```

**Run Playwright tests:**

```bash
cd apps/web
pnpm exec playwright test
pnpm exec playwright test --ui # Interactive mode
```

## Pattern 8: Testing Mobile Components (React Native)

**Example:** Testing OrderCard component

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OrderCard } from '@/components/OrderCard';

describe('OrderCard', () => {
  it('renders order details correctly', () => {
    const order = {
      id: 'order-123',
      status: 'placed',
      total_cents: 1500,
      created_at: '2024-01-01T00:00:00Z',
    };

    const { getByText } = render(<OrderCard order={order} />);

    expect(getByText('Order #order-12')).toBeTruthy(); // Truncated ID
    expect(getByText('$15.00')).toBeTruthy();
    expect(getByText('placed')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const order = {
      id: 'order-123',
      status: 'placed',
      total_cents: 1500,
    };

    const onPress = jest.fn();
    const { getByTestId } = render(<OrderCard order={order} onPress={onPress} />);

    fireEvent.press(getByTestId('order-card'));

    expect(onPress).toHaveBeenCalledWith('order-123');
  });
});
```

## Running Tests

**Web/Admin (Vitest):**

```bash
cd apps/web
pnpm test                    # Run all tests
pnpm test -- --watch         # Watch mode
pnpm test -- --coverage      # Coverage report
pnpm test -- CartContext     # Run specific file
```

**Mobile (Jest):**

```bash
cd apps/mobile
pnpm test                    # Run all tests
pnpm test -- --watch         # Watch mode
pnpm test -- --coverage      # Coverage report
```

**Edge Functions (Deno):**

```bash
cd backend/supabase/functions/<function-name>
deno test --allow-net --allow-env test.ts
```

## Coverage Goals

**Minimum 80% across all metrics:**

| Metric      | Target |
| ----------- | ------ |
| Statements  | ≥ 80%  |
| Branches    | ≥ 80%  |
| Functions   | ≥ 80%  |
| Lines       | ≥ 80%  |

**Generate coverage reports:**

```bash
# Vitest
pnpm test -- --coverage

# Jest
pnpm test -- --coverage

# View HTML report
open coverage/index.html
```

## Debugging Test Failures

### Issue: "Cannot find module '@home-chef/shared'"

**Symptom:** Import error in tests

**Cause:** TypeScript path not resolved

**Fix:**
1. Add `moduleNameMapper` to Jest config:
   ```javascript
   moduleNameMapper: {
     '^@home-chef/(.*)$': '<rootDir>/../../packages/$1/src',
   },
   ```

2. Or add Vitest alias:
   ```typescript
   resolve: {
     alias: {
       '@home-chef/shared': path.resolve(__dirname, '../../packages/shared/src'),
     },
   },
   ```

### Issue: "ReferenceError: window is not defined"

**Symptom:** Test fails trying to access window object

**Cause:** Running in Node environment, not browser

**Fix:**
1. Use `happy-dom` or `jsdom` environment in Vitest
2. Mock window globals if needed:
   ```typescript
   vi.stubGlobal('window', {
     location: { href: 'http://localhost:3000' },
   });
   ```

### Issue: Async tests timing out

**Symptom:** Test hangs and eventually times out

**Cause:** Missing await or unresolved promise

**Fix:**
1. Ensure all async calls are awaited
2. Use `vi.waitFor()` for async state updates:
   ```typescript
   await vi.waitFor(() => {
     expect(result.current.data).toBeDefined();
   });
   ```

3. Increase timeout for slow tests:
   ```typescript
   it('slow test', async () => { ... }, { timeout: 10000 });
   ```

## References

- Vitest docs: https://vitest.dev/
- Jest docs: https://jestjs.io/
- Testing Library React: https://testing-library.com/docs/react-testing-library/intro/
- Testing Library React Native: https://callstack.github.io/react-native-testing-library/
- Playwright: https://playwright.dev/
- Deno testing: https://docs.deno.com/runtime/manual/basics/testing/
- RidenDine test setup: `apps/*/vitest.config.ts`, `apps/*/jest.config.js`
