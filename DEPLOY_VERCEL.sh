#!/bin/bash

# RidenDine Vercel Deployment Script
# Deploys admin dashboard and customer web app to Vercel

set -e  # Exit on error

echo "🚀 RidenDine Vercel Deployment"
echo "================================"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo ""
echo "📋 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

echo "✅ Authenticated with Vercel"

# Deploy Admin Dashboard
echo ""
echo "🏗️  Deploying Admin Dashboard..."
echo "--------------------------------"
cd apps/admin

# Create .env.production if not exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found. Creating from template..."
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" > .env.production
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.production
    echo "⚠️  Please update .env.production with actual values before deploying"
    exit 1
fi

# Build admin dashboard
echo "📦 Building admin dashboard..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

ADMIN_URL=$(vercel ls --prod | grep -o 'https://[^ ]*' | head -1)
echo "✅ Admin dashboard deployed: $ADMIN_URL"

# Deploy Customer Web App
echo ""
echo "🏗️  Deploying Customer Web App..."
echo "--------------------------------"
cd ../web

# Create .env.production if not exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found. Creating from template..."
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" > .env.production
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.production
    echo "⚠️  Please update .env.production with actual values before deploying"
    exit 1
fi

# Build web app
echo "📦 Building web app..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

WEB_URL=$(vercel ls --prod | grep -o 'https://[^ ]*' | head -1)
echo "✅ Web app deployed: $WEB_URL"

# Summary
echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "Admin Dashboard: $ADMIN_URL"
echo "Customer Web:    $WEB_URL"
echo ""
echo "Next steps:"
echo "1. Test admin login at $ADMIN_URL/login"
echo "2. Test customer browsing at $WEB_URL"
echo "3. Verify Supabase connection"
echo "4. Check Vercel logs for any errors"
echo ""
