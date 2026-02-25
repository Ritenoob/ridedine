# RidenDine — Home Chef Delivery Marketplace

> A comprehensive 3-sided marketplace connecting customers, home chefs, and drivers for home-cooked meal delivery.

[![CI](https://github.com/SeanCFAFinlay/ridendine-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/SeanCFAFinlay/ridendine-demo/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Overview

RidenDine is a marketplace platform built with modern technologies in a monorepo architecture. Validate production readiness against current CI and monitoring. It enables:

- **Customers** to browse local chefs, order home-cooked meals, and track deliveries
- **Chefs** to manage menus, accept orders, and receive payments via Stripe Connect
- **Drivers** to accept delivery jobs and navigate to customers (Phase 2)
- **Admins** to approve chefs, manage orders, track commissions, and monitor platform metrics


## 📐 Architecture Model

This repository is built and maintained according to the architecture described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). That document is the canonical reference for:

- System design and technology stack
- Database schema and security model
- Payment and real-time flows
- Development, testing, and deployment workflows

All new features, migrations, and deployments should follow the patterns and best practices outlined in the architecture doc. Please review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making major changes or proposing new features.

---

## 🏗️ Architecture

### Monorepo Structure

```
ridendine-demo/
├── apps/
│   ├── mobile/              # React Native (Expo) app
│   ├── admin/               # Next.js admin dashboard (ridendine-admin)
│   └── web/                 # Customer-facing Next.js web app (ridendine-web)
├── backend/
│   └── supabase/            # Database, Auth, Edge Functions
│       ├── migrations/      # SQL migrations (schema + seed data + commission system)
│       └── functions/       # Serverless Edge Functions (Stripe)
├── packages/
│   └── shared/              # TypeScript types, schemas, enums
├── scripts/
│   └── seed.ts              # Demo data seeder (creates accounts + sample data)
├── docs/                    # Documentation
└── .github/workflows/       # CI/CD
```

### Technology Stack

- **Mobile**: React Native + Expo + expo-router
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Admin**: Next.js 15 (App Router) + React
- **Payments**: Stripe Connect (marketplace payments)
- **Maps**: Google Maps API
- **Deployment**: Vercel (admin + web), EAS (mobile), Supabase Cloud (backend)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0 (see `.node-version`)
- pnpm >= 10.0.0 (`corepack enable && corepack prepare pnpm@10.0.0 --activate`)
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Clone repository
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo

# Install all dependencies (pnpm monorepo)
pnpm install

# Setup environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
# Edit .env.local files with your Supabase credentials
```

### Running Locally

```bash
# Build shared types (required first)
pnpm build:shared

# Run customer web app (ridendine-web)
pnpm --filter @home-chef/web dev
# Opens at http://localhost:3001

# Run admin dashboard (ridendine-admin)
pnpm --filter @home-chef/admin dev
# Opens at http://localhost:3000

# Build all apps
pnpm build

# Lint all apps
pnpm lint
```

### Seeding Demo Data

```bash
# Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a local .env (not committed)
pnpm seed
```

## 👤 Demo Accounts

Demo accounts are created by the seed script if configured.
See `scripts/seed.ts` for the exact emails, roles, and passwords that are inserted.

> **Admin dashboard access**: Admin login uses Supabase Auth (seeded admin user from `pnpm seed`).

## Mobile App

Role-based routing with authentication:
- `(auth)/` - Sign in/up screens
- `(customer)/` - Browse chefs, order, track
- `(chef)/` - Menu management, order processing
- `(driver)/` - Delivery jobs, navigation (Phase 2)

**Tech**: Expo Router, Supabase Auth, React Native Maps

## Admin Dashboard

Server-rendered Next.js app for platform management:
- Chef approval workflow (approve, reject, suspend)
- Order monitoring with real-time updates
- Meal/dish management (feature, toggle availability)
- **Commission tracking** (view records, configure rate, CSV export)
- Analytics and metrics (orders, revenue, active chefs, customers)

**Tech**: Next.js 15 (App Router), Supabase SSR, PWA-enabled

## Database

PostgreSQL with Row Level Security (RLS):
- `profiles` - User accounts (customer, chef, driver, admin roles)
- `chefs` - Chef profiles and verification
- `dishes` - Simplified menu items
- `orders` / `order_items` - Order processing with tracking tokens
- `drivers` - Driver profiles

**Migrations**: Located in `backend/supabase/migrations/`

## Payments

Stripe Connect for marketplace payments:
- Platform collects 15% fee
- Direct payouts to chef connected accounts
- Edge Functions handle all Stripe operations securely

**Edge Functions**:
- `create_connect_account` - Chef onboarding
- `create_checkout_session` - Customer payment
- `webhook_stripe` - Payment webhooks

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - System design and components
- [Environment Variables](docs/ENVIRONMENT.md) - Configuration guide
- [MVP Plan](docs/MVP_PLAN.md) - Development phases and roadmap

## Development

```bash
# Lint all packages
pnpm lint

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Build shared package
pnpm --filter @home-chef/shared build
```

## Deployment

## Deploying to Vercel

This monorepo uses pnpm workspaces. Each Next.js app is deployed as a separate Vercel project
linked to a subdirectory. Use the settings below when creating each project.

### ridendine-web (`apps/web`)

| Setting | Value |
|---|---|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Install Command** | *(leave blank)* |
| **Build Command** | *(leave blank)* |
| **Node.js Version** | 20.x |

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### ridendine-admin (`apps/admin`)

| Setting | Value |
|---|---|
| **Root Directory** | `apps/admin` |
| **Framework Preset** | Next.js |
| **Install Command** | *(leave blank)* |
| **Build Command** | *(leave blank)* |
| **Node.js Version** | 20.x |

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Tip:** You can also use `scripts/vercel-deploy.ps1` to link and deploy both apps via the
> Vercel CLI in one step (see below).

### Deploy Admin on Vercel (legacy manual steps)

These steps are deprecated. Follow the Vercel project settings above (leave install/build commands blank).

### Deploy Web on Vercel (legacy manual steps)

These steps are deprecated. Follow the Vercel project settings above (leave install/build commands blank).

### Deploy Mobile via EAS

- The mobile app is deployed with Expo Application Services (not Vercel).
```bash
cd apps/mobile

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit
```

### Backend (Supabase Cloud)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Migrations**
   ```bash
   cd backend/supabase
   supabase link --project-ref your-project-ref
   supabase db push
   ```
   Or follow `SETUP_SUPABASE.md` for manual execution.

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy
   ```

4. **Configure Stripe Webhooks**
   - Set your Stripe keys in Supabase secrets
   - Configure webhook endpoint: `https://your-project.supabase.co/functions/v1/webhook_stripe`
   - Note: Next.js webhook routes under `apps/web/app/api/webhooks/*` are removed


## 🔒 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ No secrets in client code
- ✅ Server-side Stripe operations only
- ✅ Webhook signature verification
- ✅ Environment-based configuration

## MVP Status

Refer to `FEATURES.md` for the current feature status.
- [ ] Promo codes

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Comprehensive test coverage
- Error tracking (Sentry)
- Performance monitoring
- Accessibility improvements
- Internationalization

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com) - Backend infrastructure
- [Expo](https://expo.dev) - Mobile development
- [Next.js](https://nextjs.org) - Admin dashboard
- [Stripe](https://stripe.com) - Payments
- [Google Maps](https://developers.google.com/maps) - Location services

---

**Note**: This is an MVP implementation. For production deployment, implement additional security measures, testing, monitoring, and compliance requirements.
