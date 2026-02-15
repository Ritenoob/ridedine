# Home Chef Delivery - Supabase Unified System

## 🎯 System Overview

This is a **unified Supabase-only** system. Legacy non-Vercel hosting configs have been removed. ### Infrastructure

- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Real-time (for order tracking)

## 📁 Folder Structure

```
ridendine-demo/
├── apps/
│   ├── admin/          # Next.js admin dashboard (PWA-enabled)
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── orders/    # Order management
│   │   │   │   └── page.tsx   # Dashboard home
│   │   │   ├── login/         # Admin login (with dev bypass)
│   │   │   ├── tracking/      # Public order tracking
│   │   │   └── page.tsx       # App entry point
│   │   ├── lib/
│   │   │   └── supabase.ts    # Supabase clients (server & browser)
│   │   └── public/
│   │       ├── manifest.json  # PWA manifest
│   │       ├── sw.js          # Service worker
│   │       └── offline.html   # Offline fallback
│   │
│   └── mobile/         # React Native (Expo) mobile app
│       ├── app/
│       │   ├── (customer)/
│       │   │   ├── browse.tsx    # Browse chefs
│       │   │   ├── dishes.tsx    # Browse dishes
│       │   │   ├── orders.tsx    # Order history
│       │   │   └── tracking.tsx  # Order tracking
│       │   ├── (chef)/           # Chef dashboard
│       │   ├── (driver)/         # Driver dashboard
│       │   └── (auth)/           # Authentication
│       └── lib/
│           └── supabase.ts       # Supabase client
│
├── backend/
│   └── supabase/
│       └── migrations/
│           ├── 20240101000000_initial_schema.sql
│           ├── 20240102000000_enhanced_schema.sql  # Dishes table, tracking tokens
│           └── 20240103000000_seed_data.sql        # 10 chefs, 50 dishes, 5 drivers
│
└── packages/           # Shared packages (if needed)
```

## 🔐 Environment Variables

### Required for All Apps

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# For mobile app, use EXPO_PUBLIC_ prefix
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development Only

```bash
# Dev Auth Bypass (DEVELOPMENT ONLY - NEVER in production!)
NEXT_PUBLIC_DEV_AUTH_BYPASS=true    # Admin app
EXPO_PUBLIC_DEV_AUTH_BYPASS=true    # Mobile app
```

## 🗄️ Database Schema

### Core Tables

1. **profiles** - User profiles (all roles)
2. **chefs** - Chef-specific data (links to profiles)
3. **dishes** - Simplified dish catalog (replaces menu/menu_items)
4. **orders** - Orders with tracking tokens
5. **order_items** - Order line items
6. **drivers** - Driver information
7. **deliveries** - Delivery tracking

### Key Features

- **Tracking Tokens**: Auto-generated on order creation (`TRK-XXXXX`)
- **RLS Policies**: Row-level security enabled on all tables
- **Auto-timestamps**: `created_at` and `updated_at` managed by triggers

## 🚀 Setup Instructions

### 1. Supabase Setup

```bash
# Run migrations in Supabase SQL editor
# Execute in order:
# 1. 20240101000000_initial_schema.sql
# 2. 20240102000000_enhanced_schema.sql
# 3. 20240103000000_seed_data.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy .env.example files
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# Update with your Supabase credentials
```

### 4. Run Apps

```bash
# Admin dashboard
npm run dev:admin

# Mobile app
npm run dev:mobile
```

## 🔄 Order Flow

### Customer Journey

1. **Browse** → View chefs and dishes
2. **Order** → Add dishes to cart, checkout
3. **Track** → Receive tracking token, monitor status

### Status Timeline

```
placed → accepted → preparing → ready → picked_up → delivered
```

### Admin Management

- View all orders at `/dashboard/orders`
- Update order status with dropdown
- Changes reflect immediately in tracking page (polls every 10s)

## 🔒 Authentication

### Production Mode

- Standard Supabase Auth
- Email/password login
- Role-based access control

### Development Mode (DEV_AUTH_BYPASS)

- **Admin App**: Auto-redirects to dashboard
- **Mobile App**: Can test without auth
- **Safety**: Only works when `NODE_ENV=development`
- **Never** enable in production!

## 📱 PWA Features

### Admin Dashboard

- **Manifest**: Installable as app
- **Service Worker**: Offline support
- **Offline Page**: Shown when no connection
- **Mobile-Optimized**: Proper viewport settings

## 🧪 Testing

### Manual Testing Checklist

- [ ] Admin login works
- [ ] Dashboard loads without errors
- [ ] Orders page displays correctly
- [ ] Can update order status
- [ ] Tracking page works without auth
- [ ] Mobile app loads chefs
- [ ] Mobile app loads dishes
- [ ] Order tracking polls correctly
- [ ] PWA can be installed
- [ ] Offline mode shows fallback

### Dev Auth Bypass Testing

```bash
# Set in .env.local
NEXT_PUBLIC_DEV_AUTH_BYPASS=true

# Should auto-login to dashboard
# Should show "DEV MODE" badge
```

## 📊 Sample Data

The seed file includes:

- **10 Chefs**: Various cuisines (Mexican, Chinese, Indian, Korean, etc.)
- **50 Dishes**: 5 dishes per chef with realistic pricing
- **5 Drivers**: Ready to handle deliveries
- All chefs are pre-approved
- All dishes are available

## 🛠️ Removed Infrastructure

### What Was Removed

- ❌ Railway configuration (`railway.json`)
- ❌ Render configuration (`render.yaml`)
- ❌ `/server` backend folder (Express.js)
- ❌ Duplicate API endpoints
- ❌ Conflicting environment variables

### Benefits

- ✅ Single source of truth (Supabase)
- ✅ No backend deployment needed
- ✅ Real-time updates
- ✅ Built-in authentication
- ✅ Simplified architecture

## 🔍 Troubleshooting

### Build Errors

```bash
# Clear node_modules and reinstall
npm run clean
npm install
```

### Supabase Connection Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure RLS policies are properly configured

### Dev Auth Bypass Not Working

- Confirm `NODE_ENV=development`
- Check `.env.local` has `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`
- Restart dev server

## 📝 Next Steps

1. Create real auth users in Supabase
2. Test full order creation flow
3. Add payment integration (Stripe)
4. Implement real-time order updates
5. Add push notifications
6. Deploy to production

## 🚨 Security Notes

- **Never** use `DEV_AUTH_BYPASS` in production
- Ensure RLS policies are tested
- Rotate Supabase keys regularly
- Use environment-specific credentials

