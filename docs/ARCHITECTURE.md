# Home Chef Delivery Marketplace - Architecture

## Overview

Home Chef Delivery is a 3-sided marketplace connecting Customers, Chefs, and Drivers. Built as a monorepo with modern technologies designed for scalability and maintainability.

## Technology Stack

### Mobile App
- **Framework**: React Native with Expo
- **Router**: expo-router (file-based routing)
- **State Management**: React hooks + Supabase realtime
- **Maps**: react-native-maps with Google Maps API
- **Auth**: Supabase Auth
- **Deployment**: EAS Build (iOS/Android app stores)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Row Level Security (RLS)
- **Storage**: Supabase Storage (chef photos, menu images)
- **Functions**: Supabase Edge Functions (Deno runtime)
- **Real-time**: Supabase Realtime subscriptions

### Payments
- **Provider**: Stripe Connect
- **Model**: Marketplace with split payments
- **Platform Fee**: 15% default (configurable)
- **Payouts**: Direct to chef connected accounts

### Admin Dashboard
- **Framework**: Next.js 14 (App Router)
- **Rendering**: Server-side rendering (SSR)
- **Auth**: Supabase Auth with admin role check
- **Deployment**: Vercel

### Shared Packages
- **shared**: TypeScript types, Zod schemas, enums
- **ui** (optional): Shared React components

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                 Mobile App (Expo)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Customer │  │   Chef   │  │  Driver  │          │
│  │  Routes  │  │  Routes  │  │  Routes  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Supabase Client (anon key)
                       │
┌──────────────────────▼──────────────────────────────┐
│              Supabase Backend                        │
│  ┌─────────────────────────────────────────────┐   │
│  │  PostgreSQL with Row Level Security (RLS)   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Edge Functions (Stripe operations)         │   │
│  │  - create_connect_account                   │   │
│  │  - create_checkout_session                  │   │
│  │  - webhook_stripe                           │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Storage Buckets                            │   │
│  │  - chef-photos                              │   │
│  │  - menu-photos                              │   │
│  │  - proof-of-delivery                        │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Admin Service Role
                       │
┌──────────────────────▼──────────────────────────────┐
│           Admin Dashboard (Next.js)                  │
│  - Chef Approval                                     │
│  - Order Management                                  │
│  - Analytics & Reporting                             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              External Services                        │
│  - Stripe Connect (payments & payouts)               │
│  - Google Maps API (geocoding & directions)          │
│  - Expo Push Notifications                           │
└──────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

#### profiles
- Links to Supabase auth.users
- Stores user role and basic info
- RLS: Users can read/update their own profile

#### chefs
- Chef-specific data (bio, cuisine, location)
- Status: pending → approved → active
- Stripe Connect account_id
- RLS: Chefs manage own data, public can view approved

#### dishes
- Chef's menu items (simplified catalog)
- Available/unavailable toggle
- Photo URLs, dietary tags
- RLS: Chefs manage own items, public views available

#### orders
- Customer orders with full details
- Status lifecycle tracking
- Pricing breakdown (subtotal, fees, total)
- RLS: Customers see own orders, chefs see assigned orders

#### order_items
- Line items for each order
- Quantity, price snapshot
- RLS: Access follows parent order

#### deliveries
- Delivery tracking information
- Driver assignment
- Status updates, ETAs
- Proof of delivery photo
- RLS: Drivers manage assigned, customers/chefs view

## Authentication & Authorization

### Roles
- **customer**: Browse, order, track
- **chef**: Manage menu, accept orders, update status
- **driver**: Accept deliveries, update status, proof of delivery
- **admin**: Platform management, approvals, analytics

### Row Level Security (RLS)

All tables have RLS enabled with policies:

1. **Ownership**: Users can manage their own data
2. **Role-based**: Specific actions allowed per role
3. **Public read**: Approved chefs and active menus visible to all
4. **Related access**: Order access extends to order items

### Authentication Flow

1. User signs up with email/password via Supabase Auth
2. Profile created with selected role
3. Mobile app checks role and routes to appropriate section
4. Admin dashboard requires admin role check

## Payment Flow

### Chef Onboarding
1. Chef signs up and creates profile
2. Triggers Stripe Connect account creation
3. Edge function creates Express account
4. Returns onboarding link
5. Chef completes Stripe onboarding
6. Webhook updates payout_enabled status

### Customer Checkout
1. Customer adds items to cart
2. Creates order (status: placed)
3. Edge function creates Stripe Checkout Session
   - Destination charge to chef's connected account
   - Platform fee collected
4. Customer completes payment
5. Webhook confirms payment, updates order status
6. Chef receives notification

### Payouts
- Automatic via Stripe Connect
- Platform fee deducted at transaction time
- Chef receives net amount per payout schedule

## Real-time Features

### Order Status Updates
- Supabase Realtime subscriptions
- Customer sees live order status
- Chef receives new order notifications
- Driver sees assignment notifications

### Live Delivery Tracking (Phase 2)
- Driver location updates via Realtime
- Customer sees driver on map
- ETA calculations

## Security Best Practices

1. **No secrets in client**: Mobile uses anon key only
2. **RLS everywhere**: Database enforces access control
3. **Server-side payments**: All Stripe operations in Edge Functions
4. **Webhook verification**: Stripe signature validation
5. **Environment separation**: Different keys for dev/prod

## Scalability Considerations

### Current Architecture
- Serverless Edge Functions (auto-scale)
- PostgreSQL (vertical scaling)
- Supabase managed infrastructure
- CDN for static assets

### Future Optimizations
- Read replicas for analytics
- Caching layer (Redis)
- Image CDN (Cloudinary)
- Background job queue
- Rate limiting per user role

## Development Workflow

1. **Local Development**
   - Supabase CLI for local backend
   - Expo Go for mobile testing
   - Next.js dev server for admin

2. **Testing**
   - Unit tests for shared logic
   - Integration tests for Edge Functions
   - E2E tests for critical flows

3. **Deployment**
   - Mobile: EAS Build → App Stores
   - Admin: Vercel auto-deploy from main branch
   - Backend: Supabase CLI migrations

## Monitoring & Analytics

### Application Metrics
- Order volume and value
- Chef performance
- Delivery times
- Customer satisfaction

### Technical Metrics
- API response times
- Error rates
- Database query performance
- Function execution times

### Tools
- Supabase Dashboard (built-in metrics)
- Vercel Analytics (admin dashboard)
- Stripe Dashboard (payment metrics)
- Custom analytics in admin dashboard
