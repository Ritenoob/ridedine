# RidenDine Setup Guide

Complete guide to set up and run the RidenDine marketplace locally and deploy to production.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- **Supabase account** (free tier works)
- **Stripe account** (test mode works)
- **Expo account** (for mobile deployment)

## Part 1: Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (admin, mobile, shared packages).

## Part 2: Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `ridendine-dev` (or your choice)
   - Database Password: (save this securely)
   - Region: Choose closest to you
5. Wait for project creation (~2 minutes)

### 2. Get Your Supabase Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJxxx...`
   - **service_role key**: `eyJxxx...` (keep this secret!)

### 3. Run Database Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
cd backend/supabase
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Verify migrations
supabase db diff
```

#### Option B: Manual SQL Execution

1. Go to Supabase Dashboard → **SQL Editor**
2. Run each migration file in order:
   - `backend/supabase/migrations/20240101000000_initial_schema.sql`
   - `backend/supabase/migrations/20240102000000_enhanced_schema.sql`
   - `backend/supabase/migrations/20240103000000_seed_data.sql`
   - `backend/supabase/migrations/20240104000000_add_missing_features.sql`
   - `backend/supabase/migrations/20240105000000_add_payment_tracking.sql`

### 4. Deploy Edge Functions

```bash
cd backend/supabase

# Deploy all functions
supabase functions deploy create_checkout_session
supabase functions deploy create_connect_account
supabase functions deploy webhook_stripe

# Or deploy all at once
supabase functions deploy
```

### 5. Set Edge Function Secrets

```bash
# Set Stripe keys
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co

# Set app URL
supabase secrets set APP_BASE_URL=http://localhost:3000
```

## Part 3: Stripe Setup

### 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for an account
3. Enable Test Mode (toggle in top right)

### 2. Get Your Stripe Keys

From Stripe Dashboard:

1. Go to **Developers** → **API Keys**
2. Copy:
   - **Publishable key**: `pk_test_xxxxx`
   - **Secret key**: `sk_test_xxxxx` (keep this secret!)

### 3. Set Up Stripe Connect

1. Go to **Connect** → **Settings**
2. Enable Test Mode
3. Under "Integration", choose **Express** platform
4. Save branding settings (optional)

### 4. Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook_stripe
   ```
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)

## Part 4: Admin Dashboard Setup

### 1. Create Environment File

```bash
cd apps/admin
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `apps/admin/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_ADMIN_MASTER_PASSWORD=admin123
```

### 3. Run Development Server

```bash
# From root directory
npm run dev:admin

# Or from apps/admin
cd apps/admin
npm run dev
```

Visit http://localhost:3000

**Default login**: Password is `admin123`

### 4. Build for Production

```bash
npm run build:admin
```

## Part 5: Mobile App Setup

### 1. Create Environment File

```bash
cd apps/mobile
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyxxx... # Optional for now
```

### 3. Run Development Server

```bash
# From root directory
npm run dev:mobile

# Or from apps/mobile
cd apps/mobile
npm run start
```

This opens Expo Dev Tools. You can:
- Press `i` for iOS Simulator (Mac only)
- Press `a` for Android Emulator
- Scan QR code with Expo Go app (iOS/Android)

## Part 6: Testing the Application

### 1. Create Test Accounts

**Option A: Using Seeded Data**

The migrations include seeded test data:
- 10 chefs (all approved)
- 50 dishes
- 5 drivers

**Option B: Manual Creation**

1. **Create Customer Account**:
   - Open mobile app
   - Sign up with email/password
   - Role will be "customer" by default

2. **Create Chef Account**:
   ```sql
   -- Run in Supabase SQL Editor
   
   -- First create a profile
   INSERT INTO profiles (id, role, name, email)
   VALUES (
     gen_random_uuid(),
     'chef',
     'Test Chef',
     'chef@test.com'
   );
   
   -- Then create chef record (get profile_id from above)
   INSERT INTO chefs (profile_id, status, bio, cuisine_types)
   VALUES (
     'PROFILE_ID_FROM_ABOVE',
     'approved',
     'Specializing in Italian cuisine',
     ARRAY['Italian', 'Mediterranean']
   );
   ```

3. **Create Admin Account**:
   - Use admin login page with password `admin123`
   - Or change password in environment variable

### 2. Test Customer Flow

1. Open mobile app
2. Browse dishes
3. Add items to cart
4. Go to checkout
5. Enter delivery address
6. Select tip
7. Place order
8. View in order history

### 3. Test Chef Flow

1. Open mobile app (logged in as chef)
2. View dashboard statistics
3. Check incoming orders
4. Accept an order
5. Update order status (Preparing → Ready → Delivered)
6. Manage menu (create/edit/delete dishes)

### 4. Test Admin Flow

1. Open admin dashboard (http://localhost:3000)
2. Login with password
3. Approve pending chefs
4. Feature meals on homepage
5. View analytics
6. Monitor orders

## Part 7: Deployment

### Deploy Admin Dashboard to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd apps/admin
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD`

4. **Configure Build Settings** (auto-detected):
   - Framework: Next.js
   - Root Directory: `apps/admin`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Deploy Mobile App with EAS

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure Project**:
   ```bash
   cd apps/mobile
   eas build:configure
   ```

4. **Build for iOS** (requires Apple Developer account):
   ```bash
   eas build --platform ios
   ```

5. **Build for Android**:
   ```bash
   eas build --platform android
   ```

6. **Submit to App Stores**:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Part 8: Common Issues & Solutions

### Issue: Supabase Connection Fails

**Solution**: Verify environment variables are correct:
```bash
# Test connection
curl https://YOUR_PROJECT_REF.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

### Issue: Edge Functions Not Working

**Solution**: Check function logs:
```bash
supabase functions logs webhook_stripe
```

### Issue: Stripe Webhooks Not Received

**Solutions**:
1. Verify webhook endpoint URL is correct
2. Check webhook signing secret is set
3. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/webhook_stripe
   ```

### Issue: Mobile App Won't Build

**Solution**: Clear cache and rebuild:
```bash
cd apps/mobile
expo start -c
rm -rf node_modules
npm install
```

### Issue: Database Migration Fails

**Solution**: Check migration order and dependencies:
```bash
# Reset database (CAUTION: Deletes all data)
supabase db reset

# Re-run migrations
supabase db push
```

## Part 9: Development Workflow

### Working on Mobile App

```bash
# Start development server
npm run dev:mobile

# Type checking
cd apps/mobile
npx tsc --noEmit

# Clear cache if needed
expo start -c
```

### Working on Admin Dashboard

```bash
# Start development server
npm run dev:admin

# Type checking
cd apps/admin
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

### Working on Backend

```bash
# Test Edge Function locally
cd backend/supabase
supabase functions serve webhook_stripe

# Deploy single function
supabase functions deploy webhook_stripe

# View logs
supabase functions logs webhook_stripe --tail
```

## Part 10: Environment Variables Reference

### Admin Dashboard (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `NEXT_PUBLIC_ADMIN_MASTER_PASSWORD` - Admin login password (default: admin123)

### Mobile App (`.env`)
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key (optional for now)

### Edge Functions (Supabase Secrets)
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test_...)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (whsec_...)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `APP_BASE_URL` - Your application URL

## Part 11: Next Steps

After successful setup:

1. **Customize Branding**: Update app name, colors, logo
2. **Add Test Data**: Create more dishes and test orders
3. **Configure Stripe Connect**: Set up real bank account (for production)
4. **Set Up Monitoring**: Add error tracking (Sentry)
5. **Enable Analytics**: Track user behavior
6. **Configure Email**: Set up transactional emails
7. **Add Push Notifications**: Configure Expo notifications

## Support

For issues:
1. Check FEATURES.md for known limitations
2. Review Supabase logs in dashboard
3. Check Edge Function logs: `supabase functions logs`
4. Verify environment variables are set correctly

## Security Checklist

Before going to production:

- [ ] Change admin password from default
- [ ] Rotate all API keys
- [ ] Enable Supabase database backups
- [ ] Set up proper CORS policies
- [ ] Add rate limiting
- [ ] Enable Stripe fraud detection
- [ ] Set up SSL certificates
- [ ] Configure proper RLS policies
- [ ] Enable 2FA for admin accounts
- [ ] Set up error monitoring
- [ ] Configure proper logging
- [ ] Review all environment variables

---

## Quick Start Commands

```bash
# Install everything
npm install

# Run admin dashboard
npm run dev:admin

# Run mobile app
npm run dev:mobile

# Build everything
npm run build

# Deploy Edge Functions
cd backend/supabase && supabase functions deploy
```

Congratulations! You now have a fully functional home-cooked meal delivery marketplace! 🎉
