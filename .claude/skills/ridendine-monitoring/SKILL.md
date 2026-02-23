---
name: ridendine-monitoring
description: |
  Master monitoring and observability for RidenDine production systems. Use when: (1) setting
  up monitoring dashboards, (2) configuring alerts, (3) debugging performance issues, (4)
  tracking errors, (5) analyzing user behavior. Key insight: Supabase built-in monitoring for
  database and Edge Functions, Vercel Analytics for web apps, Sentry for error tracking.
author: Claude Code
version: 1.0.0
---

# RidenDine Monitoring

## Problem

RidenDine runs on Supabase (database + Edge Functions), Vercel (web + admin), and EAS (mobile). Each platform provides monitoring tools. Centralized error tracking via Sentry, performance monitoring via Vercel Analytics.

## Context / Trigger Conditions

Use this skill when:
- Setting up production monitoring
- Investigating performance degradation
- Tracking error rates
- Analyzing user behavior
- Debugging production issues
- Setting up alerts

## Pattern 1: Supabase Monitoring

**Database Performance:**

Dashboard → Database → Query Performance

Monitor:
- Slow queries (> 1s)
- Connection pool usage
- Active connections
- Table sizes

**Edge Functions:**

Dashboard → Edge Functions → Logs

Monitor:
- Invocation count
- Error rate
- Execution time
- Memory usage

**Alerts:**

Dashboard → Settings → Alerts

Configure:
- Database CPU > 80%
- Connection pool > 90%
- Edge Function error rate > 5%

## Pattern 2: Vercel Analytics

**Setup:**

```bash
cd apps/web
pnpm add @vercel/analytics
```

```typescript
// apps/web/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Monitor:**
- Page views
- Core Web Vitals (LCP, FID, CLS)
- Conversion rates
- Geographic distribution

## Pattern 3: Sentry Error Tracking

**Setup:**

```bash
pnpm add @sentry/nextjs @sentry/react-native -w
```

**Web/Admin (sentry.server.config.ts):**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out known errors
    if (event.exception?.values?.[0]?.type === 'AbortError') {
      return null;
    }
    return event;
  },
});
```

**Mobile (app/_layout.tsx):**

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
});
```

## Pattern 4: Custom Logging

**Supabase Edge Function:**

```typescript
console.log('[INFO]', 'Order created', { orderId, customerId });
console.error('[ERROR]', 'Payment failed', { error, orderId });
```

**Next.js Server Action:**

```typescript
import { logger } from '@/lib/logger';

export async function createOrder() {
  try {
    // ...
    logger.info('Order created', { orderId });
  } catch (error) {
    logger.error('Order creation failed', { error });
    Sentry.captureException(error);
  }
}
```

## Pattern 5: Performance Monitoring

**Database Query Analysis:**

```sql
-- Slow query log
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

**Next.js Performance:**

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60s

export async function GET() {
  const start = Date.now();

  // ... fetch data

  const duration = Date.now() - start;
  console.log(`[PERF] Request took ${duration}ms`);
}
```

## Pattern 6: Uptime Monitoring

**External Services:**
- UptimeRobot: https://uptimerobot.com/
- Pingdom: https://www.pingdom.com/
- BetterUptime: https://betteruptime.com/

**Monitor Endpoints:**
- Web: `https://ridendine.com`
- Admin: `https://admin.ridendine.com`
- API Health: `https://ridendine.com/api/health`

## Key Metrics to Track

**Business Metrics:**
- Daily active users (DAU)
- Order completion rate
- Average order value
- Chef approval rate
- Delivery success rate

**Technical Metrics:**
- API response time (p50, p95, p99)
- Error rate (< 1%)
- Database query time (< 100ms avg)
- Edge Function cold starts
- Page load time (< 3s)

**Alert Thresholds:**
- Error rate > 5% (15min)
- API latency p95 > 2s (5min)
- Database CPU > 85% (10min)
- Failed deployments

## References

- Supabase monitoring: https://supabase.com/docs/guides/platform/metrics
- Vercel Analytics: https://vercel.com/analytics
- Sentry docs: https://docs.sentry.io/
