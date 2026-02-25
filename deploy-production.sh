#!/bin/bash
# RidenDine Production Deployment Script
# Run this after upgrading Vercel account

set -e

echo "🚀 RidenDine Production Deployment"
echo "=================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "📋 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

echo ""
echo "✅ Vercel authentication confirmed"
echo ""

# Build packages locally first
echo "📦 Building shared packages..."
pnpm install --frozen-lockfile
pnpm build:shared

echo ""
echo "🌐 Deploying Web App..."
echo "------------------------"
cd apps/web
vercel deploy --prod --yes
WEB_URL=$(vercel --prod 2>&1 | grep -oP 'https://[^\s]+' | tail -1)
cd ../..

echo ""
echo "🔧 Deploying Admin App..."
echo "-------------------------"
cd apps/admin
vercel deploy --prod --yes
ADMIN_URL=$(vercel --prod 2>&1 | grep -oP 'https://[^\s]+' | tail -1)
cd ../..

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "🌐 Web App:   $WEB_URL"
echo "🔧 Admin App: $ADMIN_URL"
echo ""
echo "📋 Next Steps:"
echo "1. Verify apps are accessible"
echo "2. Run health checks: curl $WEB_URL/api/health"
echo "3. Test user signup flow"
echo "4. Share URL with Hamilton customers!"
echo ""
echo "📖 See DEPLOYMENT-CHECKLIST.md for complete post-deployment steps"
