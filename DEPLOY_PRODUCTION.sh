#!/bin/bash
# RidenDine Production Deployment Script
# Run this from the project root directory

set -e  # Exit on error

echo "🚀 RidenDine Production Deployment"
echo "===================================="
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the project root directory"
  exit 1
fi

# Step 1: Deploy Database Migrations
echo "📦 Step 1: Deploying database migrations..."
cd backend/supabase

# Check if linked to production
if ! supabase status &>/dev/null; then
  echo "⚠️  Not linked to Supabase project. Run: supabase link --project-ref your-project-ref"
  exit 1
fi

# Push all migrations (includes new geocode_cache and route_cache tables)
echo "   Pushing migrations to production..."
supabase db push

echo "   ✅ Database migrations deployed"
echo ""

# Step 2: Deploy Edge Functions
echo "🔧 Step 2: Deploying Edge Functions..."

# Deploy all Edge Functions (6 total, including new geocode_address)
functions=(
  "assign_driver"
  "get_route"
  "geocode_address"
  "create_checkout_session"
  "create_connect_account"
  "webhook_stripe"
)

for func in "${functions[@]}"; do
  echo "   Deploying $func..."
  supabase functions deploy "$func" --no-verify-jwt
done

echo "   ✅ All Edge Functions deployed"
echo ""

# Step 3: Set Production Secrets
echo "🔐 Step 3: Configure production secrets..."
echo ""
echo "⚠️  You need to set these secrets manually:"
echo "   supabase secrets set GOOGLE_MAPS_API_KEY=your_key"
echo "   supabase secrets set STRIPE_SECRET_KEY=your_key"
echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=your_secret"
echo "   supabase secrets set ALLOWED_ORIGIN=https://your-domain.com"
echo ""
read -p "Press Enter after you've set the secrets..."

# Step 4: Verify RLS Policies
echo "🔒 Step 4: Verifying RLS policies..."
echo "   Check that Row Level Security is enabled on all tables"
echo "   Visit: https://supabase.com/dashboard/project/YOUR_PROJECT/database/tables"
echo ""

# Step 5: Test Edge Functions
echo "✅ Step 5: Testing Edge Functions..."
echo "   Test get_route:"
echo "   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/get_route \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"coordinates\":[{\"lat\":40.7128,\"lng\":-74.0060},{\"lat\":40.7580,\"lng\":-73.9855}]}'"
echo ""
echo "   Test geocode_address:"
echo "   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/geocode_address \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"address\":\"1600 Amphitheatre Parkway, Mountain View, CA\"}'"
echo ""

cd ../..

echo "🎉 Backend deployment complete!"
echo ""
echo "Next steps:"
echo "1. Deploy admin dashboard: cd apps/admin && vercel --prod"
echo "2. Build mobile app: cd apps/mobile && eas build --profile preview --platform all"
echo "3. Seed production data: Run backend/supabase/migrations/20240103000000_seed_data.sql in SQL Editor"
echo "4. Run E2E smoke test (see DEPLOY_TOMORROW.md)"
