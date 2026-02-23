---
name: expo-router-patterns
description: |
  Master Expo Router file-based routing for RidenDine mobile app. Use when: (1) adding new
  screens/routes, (2) implementing navigation patterns, (3) setting up auth guards, (4) debugging
  navigation issues, (5) configuring deep links. Key insight: Expo Router uses file-system based
  routing like Next.js App Router - file structure defines route structure.
author: Claude Code
version: 1.0.0
---

# Expo Router Patterns

## Problem

RidenDine mobile app (React Native/Expo SDK 50) uses Expo Router for navigation. Traditional React Navigation requires manual route configuration. Expo Router uses file-system based routing for:
- Automatic route generation
- Type-safe navigation
- Deep linking
- Nested layouts
- Authentication guards

## Context / Trigger Conditions

Use this skill when:
- Adding new mobile screens
- Setting up tab navigation or stack navigation
- Implementing authentication guards (protect routes)
- Debugging "Cannot GET /" or navigation errors
- Configuring deep links
- Migrating from React Navigation to Expo Router

## RidenDine Mobile App Structure

**App Directory:** `apps/mobile/app/`

**Role-Specific Navigation:**
- **Customer:** Browse chefs → Select dishes → Checkout → Track order
- **Chef:** View orders → Update status → Manage dishes
- **Driver:** View deliveries → Update location → Mark delivered

**Route Structure:**

```
apps/mobile/app/
├── (auth)/               # Auth group (requires login)
│   ├── _layout.tsx       # Auth layout (checks user session)
│   ├── (tabs)/           # Tabbed navigation
│   │   ├── _layout.tsx   # Tabs layout (customer role)
│   │   ├── index.tsx     # Home tab (browse chefs)
│   │   ├── orders.tsx    # Orders tab
│   │   └── profile.tsx   # Profile tab
│   ├── chef/             # Chef-specific routes
│   │   ├── _layout.tsx   # Chef layout
│   │   ├── orders.tsx    # Chef's orders
│   │   └── dishes.tsx    # Manage dishes
│   └── driver/           # Driver-specific routes
│       ├── _layout.tsx   # Driver layout
│       └── deliveries.tsx # Driver's deliveries
├── login.tsx             # Login screen (public)
├── signup.tsx            # Signup screen (public)
└── _layout.tsx           # Root layout (wraps entire app)
```

## Pattern 1: File-Based Routing

**File → Route Mapping:**

| File Path                        | Route URL            | Description                |
| -------------------------------- | -------------------- | -------------------------- |
| `app/index.tsx`                  | `/`                  | Landing/home screen        |
| `app/login.tsx`                  | `/login`             | Login screen               |
| `app/(auth)/profile.tsx`         | `/profile`           | Profile (auth required)    |
| `app/(auth)/(tabs)/orders.tsx`   | `/orders`            | Orders tab                 |
| `app/(auth)/chef/orders.tsx`     | `/chef/orders`       | Chef's orders              |
| `app/chefs/[id].tsx`             | `/chefs/:id`         | Chef detail (dynamic)      |
| `app/orders/[orderId]/track.tsx` | `/orders/:orderId/track` | Order tracking         |

**Route Groups:**
- `(auth)` - Requires authentication, enforced by `_layout.tsx`
- `(tabs)` - Tab navigation (bottom tabs)
- No prefix in URL (groups are organizational only)

## Pattern 2: Root Layout with Navigation

**Location:** `apps/mobile/app/_layout.tsx`

**Purpose:**
- Initialize Expo Router
- Wrap app with providers (Supabase Auth, Cart Context)
- Configure navigation container

**Example Implementation:**

```typescript
import { Stack } from 'expo-router';
import { SessionProvider } from '@/lib/SessionContext';
import { CartProvider } from '@/lib/CartContext';

export default function RootLayout() {
  return (
    <SessionProvider>
      <CartProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' },
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </CartProvider>
    </SessionProvider>
  );
}
```

## Pattern 3: Authentication Guard

**Location:** `apps/mobile/app/(auth)/_layout.tsx`

**Purpose:** Redirect to login if user is not authenticated

**Example Implementation:**

```typescript
import { useEffect } from 'react';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { useSession } from '@/lib/SessionContext';

export default function AuthLayout() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for session check

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && !inAuthGroup) {
      // Redirect to home if already authenticated
      router.replace('/(auth)/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return null; // Or show loading spinner
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chef" />
      <Stack.Screen name="driver" />
    </Stack>
  );
}
```

**SessionContext Example:**

```typescript
// apps/mobile/lib/SessionContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
```

## Pattern 4: Tab Navigation

**Location:** `apps/mobile/app/(auth)/(tabs)/_layout.tsx`

**Purpose:** Bottom tab navigation for customer role

**Example Implementation:**

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Pattern 5: Dynamic Routes

**Location:** `apps/mobile/app/chefs/[id].tsx`

**Purpose:** Chef detail page with dynamic ID

**Example Implementation:**

```typescript
import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Chef } from '@home-chef/shared';

export default function ChefDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chef, setChef] = useState<Chef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChef() {
      const { data, error } = await supabase
        .from('chefs')
        .select('*, profiles(name, email)')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setChef(data);
      }
      setLoading(false);
    }

    fetchChef();
  }, [id]);

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <>
      <Stack.Screen options={{ title: chef?.profiles.name || 'Chef' }} />
      <View>
        <Text>{chef?.profiles.name}</Text>
        <Text>{chef?.bio}</Text>
      </View>
    </>
  );
}
```

**Navigation to Dynamic Route:**

```typescript
import { router } from 'expo-router';

// Navigate to chef detail
<TouchableOpacity onPress={() => router.push(`/chefs/${chefId}`)}>
  <Text>View Chef</Text>
</TouchableOpacity>
```

## Pattern 6: Programmatic Navigation

**Type-Safe Navigation:**

```typescript
import { router, useRouter, Link } from 'expo-router';

// Method 1: router singleton (anywhere in app)
router.push('/orders');
router.replace('/login'); // Replace current route (no back button)
router.back(); // Go back
router.setParams({ orderId: '123' }); // Update params

// Method 2: useRouter hook (inside components)
function MyComponent() {
  const router = useRouter();

  const handlePress = () => {
    router.push('/orders');
  };
}

// Method 3: Link component (declarative)
<Link href="/orders">
  <Text>View Orders</Text>
</Link>

// Dynamic routes
router.push(`/chefs/${chefId}`);
router.push({
  pathname: '/chefs/[id]',
  params: { id: chefId },
});
```

## Pattern 7: Role-Based Navigation

**Problem:** Different roles need different navigation structures

**Solution:** Conditional layout based on user role

**Location:** `apps/mobile/app/(auth)/_layout.tsx`

```typescript
import { useSession } from '@/lib/SessionContext';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { session, user } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  // Redirect based on role
  if (user?.role === 'chef') {
    return <Redirect href="/chef/orders" />;
  } else if (user?.role === 'driver') {
    return <Redirect href="/driver/deliveries" />;
  }

  // Default: customer with tabs
  return <Redirect href="/(auth)/(tabs)" />;
}
```

## Pattern 8: Deep Linking

**Configuration:** `apps/mobile/app.json`

```json
{
  "expo": {
    "scheme": "ridendine",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "ridendine.com",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "associatedDomains": ["applinks:ridendine.com"]
    }
  }
}
```

**Deep Link Examples:**

| Deep Link                           | Opens Screen             |
| ----------------------------------- | ------------------------ |
| `ridendine://chefs/chef-123`        | Chef detail              |
| `ridendine://orders/order-456`      | Order detail             |
| `https://ridendine.com/chefs/chef-123` | Chef detail (universal link) |

**Handling Deep Links:**

```typescript
// Expo Router automatically handles deep links based on file structure
// No additional code needed if routes match URL structure
```

## Debugging Common Issues

### Issue: "Cannot GET /"

**Symptom:** App shows "Cannot GET /" on web or blank screen on mobile

**Cause:** No `index.tsx` file in app directory

**Fix:**
1. Create `apps/mobile/app/index.tsx`
2. Add default export:
   ```typescript
   export { default } from './(auth)/(tabs)/index';
   ```

### Issue: Navigation not working

**Symptom:** `router.push()` does nothing or throws error

**Cause:** File doesn't exist or route group misconfigured

**Fix:**
1. Verify file exists at target path
2. Check route groups: `(auth)` groups don't appear in URL
3. Use correct path:
   - ✅ `router.push('/orders')` (not `/auth/orders`)
   - ❌ `router.push('/(auth)/orders')` (route groups excluded)

### Issue: Auth guard infinite redirect loop

**Symptom:** App keeps redirecting between login and protected routes

**Cause:** Missing `loading` check or incorrect redirect logic

**Fix:**
1. Return early if `loading` is true
2. Check `segments` to avoid unnecessary redirects
3. Use `router.replace()` instead of `router.push()` to avoid back button issues

### Issue: Tab bar not showing

**Symptom:** Bottom tabs don't appear

**Cause:** `_layout.tsx` not using `Tabs` component or wrong nesting

**Fix:**
1. Verify `app/(auth)/(tabs)/_layout.tsx` uses `<Tabs>`
2. Check tab screens are direct children (no nested folders)
3. Ensure `screenOptions.tabBarStyle` not hidden

## Testing Navigation

**Manual Testing:**

1. **Auth Flow:**
   - Start app → Redirect to login
   - Log in → Redirect to home/tabs
   - Log out → Redirect to login

2. **Tab Navigation:**
   - Tap each tab → Screen changes
   - Back button → Returns to previous tab

3. **Dynamic Routes:**
   - Click chef → Opens chef detail with correct ID
   - Back button → Returns to chef list

4. **Deep Links:**
   ```bash
   # iOS Simulator
   xcrun simctl openurl booted ridendine://chefs/chef-123

   # Android Emulator
   adb shell am start -W -a android.intent.action.VIEW -d "ridendine://chefs/chef-123"
   ```

## References

- Expo Router docs: https://docs.expo.dev/router/introduction/
- File-based routing: https://docs.expo.dev/router/create-pages/
- Authentication: https://docs.expo.dev/router/reference/authentication/
- Deep linking: https://docs.expo.dev/guides/deep-linking/
- RidenDine mobile: `apps/mobile/app/`
