---
name: nextjs-supabase-ssr
description: |
  Master Supabase SSR patterns for Next.js 15 App Router in RidenDine. Use when: (1) setting up
  Supabase clients, (2) implementing server-side auth, (3) protecting routes with middleware,
  (4) handling auth state changes, (5) debugging "user not defined" or session issues. Key insight:
  Different Supabase client factories for Server Components, Server Actions, Route Handlers, and
  Client Components - each with different cookie handling.
author: Claude Code
version: 1.0.0
---

# Next.js 15 + Supabase SSR Patterns

## Problem

RidenDine web and admin apps use Next.js 15 App Router with Supabase Auth. Supabase auth uses HTTP-only cookies for session management. Different contexts (Server Components, Client Components, Server Actions, Route Handlers) require different Supabase client configurations to correctly read/write cookies.

**Wrong approach:** Single `supabaseClient.ts` file breaks SSR or leaks cookies to client.

**Right approach:** Context-specific client factories.

## Context / Trigger Conditions

Use this skill when:
- Setting up Supabase Auth in Next.js app
- "User is undefined" errors in Server Components
- Auth cookies not persisting after login
- Session not available in middleware
- Debugging auth state issues
- Implementing protected routes

## RidenDine Supabase Architecture

**Apps:**
- **web:** Customer-facing Next.js 15 app (`apps/web/`)
- **admin:** Admin dashboard Next.js 15 app (`apps/admin/`)

**Auth Flow:**
1. User logs in via Supabase Auth
2. Supabase sets HTTP-only cookie with session token
3. Server Components read cookie to fetch user data
4. Middleware checks cookie to protect routes
5. Client Components use cookie-based client for real-time subscriptions

## Pattern 1: Server Component Client (Read-Only Cookies)

**Location:** `apps/web/lib/supabase/server.ts`

**Use Cases:**
- Fetch data in Server Components
- Read user session server-side
- Access user metadata (role, email)

**Example Implementation:**

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component (read-only) - ignore set attempts
          }
        },
      },
    }
  );
}
```

**Usage in Server Component:**

```typescript
// apps/web/app/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user-specific data (RLS automatically filters by auth.uid())
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <OrdersList orders={orders} />
    </div>
  );
}
```

## Pattern 2: Server Action Client (Read-Write Cookies)

**Location:** `apps/web/lib/supabase/server.ts` (same file, different function)

**Use Cases:**
- Form submissions
- Server Actions that modify auth state
- Sign up, sign in, sign out actions

**Example Implementation:**

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createActionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

**Usage in Server Action:**

```typescript
// apps/web/app/login/actions.ts
'use server';

import { createActionClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = await createActionClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createActionClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signout() {
  const supabase = await createActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

**Form Component (Client Component):**

```typescript
// apps/web/app/login/page.tsx
'use client';

import { login } from './actions';
import { useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Log in</button>
    </form>
  );
}
```

## Pattern 3: Route Handler Client

**Location:** `apps/web/lib/supabase/route-handler.ts`

**Use Cases:**
- API routes
- Webhook handlers
- Third-party integrations (Stripe, etc.)

**Example Implementation:**

```typescript
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export function createClient(request: NextRequest) {
  // Create response (for setting cookies)
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, supabaseResponse };
}
```

**Usage in Route Handler:**

```typescript
// apps/web/app/api/profile/route.ts
import { createClient } from '@/lib/supabase/route-handler';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return Response.json(profile, {
    headers: supabaseResponse.headers, // Include cookie updates
  });
}
```

## Pattern 4: Client Component Client

**Location:** `apps/web/lib/supabase/client.ts`

**Use Cases:**
- Real-time subscriptions
- Client-side auth state changes
- Interactive features

**Example Implementation:**

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Usage in Client Component:**

```typescript
// apps/web/components/OrdersRealtime.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function OrdersRealtime({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? payload.new : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>{order.status}</li>
      ))}
    </ul>
  );
}
```

## Pattern 5: Middleware for Route Protection

**Location:** `apps/web/middleware.ts`

**Purpose:** Redirect unauthenticated users to login

**Example Implementation:**

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from login page
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## Pattern 6: Role-Based Access Control

**Using RLS + Server Components:**

```typescript
// apps/web/app/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/'); // Not authorized
  }

  // Admin-specific data (RLS policies enforce role-based access)
  const { data: chefs } = await supabase.from('chefs').select('*');

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ChefsList chefs={chefs} />
    </div>
  );
}
```

## Pattern 7: Auth State Listener (Client Component)

**Location:** `apps/web/lib/AuthProvider.tsx`

**Purpose:** Listen for auth state changes (login, logout) and sync across tabs

**Example Implementation:**

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }

      // Refresh Server Component data
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  return <>{children}</>;
}
```

**Add to Root Layout:**

```typescript
// apps/web/app/layout.tsx
import { AuthProvider } from '@/lib/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

## Debugging Common Issues

### Issue: "User is undefined" in Server Component

**Symptom:** `user` is always null in Server Components

**Cause:** Using wrong Supabase client or cookies not accessible

**Fix:**
1. Use `createClient()` from `lib/supabase/server.ts`
2. Ensure `await cookies()` is called (Next.js 15 requirement)
3. Check cookies are set after login (DevTools → Application → Cookies)
4. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Issue: Auth cookies not persisting

**Symptom:** User logged out after page refresh

**Cause:** Server Action client not setting cookies

**Fix:**
1. Use `createActionClient()` in Server Actions (not `createClient()`)
2. Check `setAll()` implementation allows cookie writes
3. Verify Supabase session cookie exists in DevTools

### Issue: Middleware redirect loop

**Symptom:** Infinite redirects between login and dashboard

**Cause:** Middleware logic error or session not refreshing

**Fix:**
1. Check `matcher` config excludes static assets
2. Verify `supabase.auth.getUser()` is awaited
3. Use `request.nextUrl.clone()` to avoid mutating original URL
4. Add logging to debug redirect conditions

### Issue: Real-time subscriptions not working

**Symptom:** Client Component doesn't receive database changes

**Cause:** Using server client instead of browser client

**Fix:**
1. Use `createClient()` from `lib/supabase/client.ts` (not server.ts)
2. Check Supabase Realtime is enabled in dashboard
3. Verify RLS policies allow SELECT on subscribed table
4. Add error handler to subscription:
   ```typescript
   .on('postgres_changes', ..., (payload) => { ... })
   .subscribe((status) => {
     if (status === 'SUBSCRIBED') {
       console.log('Subscribed!');
     }
   });
   ```

## Testing Auth Flow

**Manual Testing:**

1. **Sign Up:**
   - Fill form → Submit
   - Check cookie set in DevTools
   - Redirect to dashboard

2. **Sign In:**
   - Enter credentials → Submit
   - Check cookie set
   - Redirect to dashboard

3. **Protected Route:**
   - Log out
   - Navigate to `/dashboard` → Redirect to `/login`

4. **Session Refresh:**
   - Log in
   - Close tab
   - Reopen app → Still logged in

5. **Multi-Tab Sync:**
   - Open app in two tabs
   - Log out in tab 1
   - Tab 2 automatically redirects to login

## Environment Variables

**Required (both development and production):**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Optional (for Server Actions with service role access)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## References

- Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side-rendering
- Next.js 15 App Router: https://nextjs.org/docs/app
- Supabase Auth: https://supabase.com/docs/guides/auth
- RidenDine web: `apps/web/`
- RidenDine admin: `apps/admin/`
