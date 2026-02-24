# Home Chef Delivery Marketplace

> A comprehensive 3-sided marketplace connecting customers, home chefs, and drivers for home-cooked meal delivery.

[![CI](https://github.com/SeanCFAFinlay/ridendine-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/SeanCFAFinlay/ridendine-demo/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Overview

Home Chef Delivery is a production-ready marketplace platform built with modern technologies in a monorepo architecture. It enables:

- **Customers** to browse local chefs, order home-cooked meals, and track deliveries
- **Chefs** to manage menus, accept orders, and receive payments via Stripe Connect
- **Drivers** to accept delivery jobs and navigate to customers (Phase 2)
- **Admins** to approve chefs, manage orders, and monitor platform metrics


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
home-chef-delivery/
├── apps/
│   ├── mobile/              # React Native (Expo) app
│   ├── admin/               # Next.js admin dashboard
│   └── web/                 # Customer-facing Next.js web app
├── backend/
│   └── supabase/            # Database, Auth, Edge Functions
│       ├── migrations/      # SQL migrations
│       └── functions/       # Serverless Edge Functions
├── packages/
│   ├── shared/              # TypeScript types, schemas, enums
│   └── ui/                  # Shared UI components (optional)
├── docs/                    # Documentation
└── .github/workflows/       # CI/CD
```

### Technology Stack

- **Mobile**: React Native + Expo + expo-router
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Admin**: Next.js 14 (App Router) + React
- **Payments**: Stripe Connect (marketplace payments)
- **Maps**: Google Maps API
- **Deployment**: Vercel (admin + web), EAS (mobile), Supabase Cloud (backend)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0 (see `.nvmrc`)
- npm >= 9.0.0
- Supabase account
- Stripe account (for payments)
- Expo account (for mobile deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo

# Install all dependencies (monorepo with npm workspaces)
npm ci

# Setup environment variables
cp apps/admin/.env.example apps/admin/.env.local
# Edit apps/admin/.env.local with your Supabase credentials
```

### Running Locally

```bash
# Run admin dashboard (Next.js)
npm run dev:admin
# Opens at http://localhost:3000

# Build admin app
npm run build:admin

# Build web app
npm run build:web

# Lint all workspaces
npm run lint

# Test all workspaces
npm run test
```

## 📱 Mobile App

Role-based routing with authentication:
- `(auth)/` - Sign in/up screens
- `(customer)/` - Browse chefs, order, track
- `(chef)/` - Menu management, order processing
- `(driver)/` - Delivery jobs, navigation (Phase 2)

**Tech**: Expo Router, Supabase Auth, React Native Maps

## 🎛️ Admin Dashboard

Server-rendered Next.js app for platform management:
- Chef approval workflow
- Order monitoring
- Analytics and metrics
- Dispute resolution

**Tech**: Next.js 14 (App Router), Supabase SSR

## 💾 Database

PostgreSQL with Row Level Security (RLS):
- `profiles` - User accounts
- `chefs` - Chef profiles and verification
- `menus` / `menu_items` - Menu management
- `orders` / `order_items` - Order processing
- `deliveries` - Delivery tracking

**Migrations**: Located in `backend/supabase/migrations/`

## 💳 Payments

Stripe Connect for marketplace payments:
- Platform collects 15% fee
- Direct payouts to chef connected accounts
- Edge Functions handle all Stripe operations securely

**Edge Functions**:
- `create_connect_account` - Chef onboarding
- `create_checkout_session` - Customer payment
- `webhook_stripe` - Payment webhooks

## 📖 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - System design and components
- [Environment Variables](docs/ENVIRONMENT.md) - Configuration guide
- [MVP Plan](docs/MVP_PLAN.md) - Development phases and roadmap

## 🧪 Development

```bash
# Lint all packages
npm run lint

# Build all packages
npm run build

# Type check
cd apps/mobile && npx tsc --noEmit
cd apps/admin && npx tsc --noEmit

# Build shared package
npm run build --workspace=packages/shared
```

## 🚢 Deployment

### Deploy Admin on Vercel

- Create a **Vercel project** with **Root Directory** set to `apps/admin`
- Framework preset: **Next.js**
- Install Command: `npm ci`
- Build Command: `npm run build`
- Node.js Version: **20.x**
- Set environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
  ```

### Deploy Web on Vercel

- Create a **separate Vercel project** with **Root Directory** `apps/web`
- Framework: auto-detect (Next.js)
- Install Command: `npm ci`
- Build Command: `npm run build`
- Node.js Version: **20.x**
- No Vercel config files are required in the repo; use project settings instead.

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

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy
   ```

4. **Configure Stripe Webhooks**
   - Set your Stripe keys in Supabase dashboard
   - Configure webhook endpoint: `https://your-project.supabase.co/functions/v1/webhook_stripe`


## 🔒 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ No secrets in client code
- ✅ Server-side Stripe operations only
- ✅ Webhook signature verification
- ✅ Environment-based configuration

## 🎯 MVP Status

### Completed ✅
- [x] Monorepo structure
- [x] Shared TypeScript types and schemas
- [x] Database schema with RLS
- [x] Edge Functions (Stripe integration)
- [x] Mobile app scaffold with role routing
- [x] Admin dashboard scaffold
- [x] CI/CD workflow

### In Progress 🚧
- [ ] Customer order flow
- [ ] Chef menu management
- [ ] Payment processing
- [ ] Order status updates

### Phase 2 ⏳
- [ ] Driver functionality
- [ ] Real-time tracking
- [ ] Push notifications
- [ ] Reviews and ratings

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
# RidenDine - Live Production
