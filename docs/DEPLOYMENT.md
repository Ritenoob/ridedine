# Deployment Guide

## Mobile App Deployment (Expo EAS)

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure project in `apps/mobile/app.json`

### Build for iOS
```bash
cd apps/mobile
eas build --platform ios --profile production
```

### Build for Android
```bash
cd apps/mobile
eas build --platform android --profile production
```

### Submit to App Stores
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Admin Dashboard Deployment (Vercel)

### One-Click Deploy
1. Connect GitHub repo to Vercel
2. Select `apps/admin` as root directory
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### CLI Deploy
```bash
cd apps/admin
vercel
# Follow prompts
```

## Backend Deployment (Supabase)

### Migrations
```bash
cd backend/supabase
supabase link --project-ref your-project-ref
supabase db push
```

### Edge Functions
```bash
cd backend/supabase
supabase functions deploy create_connect_account
supabase functions deploy create_checkout_session
supabase functions deploy webhook_stripe
```

### Set Secrets
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=https://your-app-url.com
```

## Post-Deployment Checklist

- [ ] Test mobile app authentication
- [ ] Test admin login
- [ ] Verify Stripe Connect onboarding
- [ ] Test order creation
- [ ] Verify payment processing
- [ ] Check webhook delivery
- [ ] Test role-based access
- [ ] Monitor error logs
- [ ] Setup monitoring alerts
