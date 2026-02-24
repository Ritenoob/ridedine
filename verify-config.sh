#!/bin/bash
# RidenDine Configuration Verification Script
# Run this before production deployment to check all settings

set -e

echo "🔍 RidenDine Configuration Verification"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    echo "  ✅ Node.js v$(node -v) (>= 20 required)"
else
    echo "  ❌ Node.js v$(node -v) - Version 20+ required!"
    ERRORS=$((ERRORS + 1))
fi

# Check pnpm
echo ""
echo "📦 Checking pnpm..."
if command -v pnpm &> /dev/null; then
    echo "  ✅ pnpm $(pnpm -v) installed"
else
    echo "  ❌ pnpm not installed. Run: npm install -g pnpm"
    ERRORS=$((ERRORS + 1))
fi

# Check Vercel CLI
echo ""
echo "☁️  Checking Vercel CLI..."
if command -v vercel &> /dev/null; then
    echo "  ✅ Vercel CLI installed"
    if vercel whoami &> /dev/null; then
        echo "  ✅ Logged in as: $(vercel whoami)"
    else
        echo "  ⚠️  Not logged in to Vercel. Run: vercel login"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ❌ Vercel CLI not installed. Run: npm install -g vercel"
    ERRORS=$((ERRORS + 1))
fi

# Check Supabase CLI
echo ""
echo "🗄️  Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "  ✅ Supabase CLI installed"
else
    echo "  ⚠️  Supabase CLI not installed (optional for Edge Functions)"
    echo "     Install: npm install -g supabase"
    WARNINGS=$((WARNINGS + 1))
fi

# Check if packages build successfully
echo ""
echo "🏗️  Testing builds..."

echo "  Building shared package..."
if pnpm --filter @home-chef/shared build &> /dev/null; then
    echo "  ✅ Shared package builds successfully"
else
    echo "  ❌ Shared package build failed!"
    ERRORS=$((ERRORS + 1))
fi

echo "  Building web app..."
if pnpm --filter @home-chef/web build &> /dev/null; then
    echo "  ✅ Web app builds successfully"
else
    echo "  ❌ Web app build failed!"
    ERRORS=$((ERRORS + 1))
fi

echo "  Building admin app..."
if pnpm --filter @home-chef/admin build &> /dev/null; then
    echo "  ✅ Admin app builds successfully"
else
    echo "  ❌ Admin app build failed!"
    ERRORS=$((ERRORS + 1))
fi

# Check environment files
echo ""
echo "🔐 Checking environment configuration..."

if [ -f "apps/web/.env.production" ]; then
    echo "  ✅ Web app .env.production exists"

    # Check for required variables
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" apps/web/.env.production; then
        echo "  ✅ Supabase URL configured"
    else
        echo "  ❌ Supabase URL missing!"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "STRIPE_SECRET_KEY=sk_" apps/web/.env.production; then
        echo "  ✅ Stripe secret key configured"
    else
        echo "  ⚠️  Stripe secret key not set (required for payments)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "  ⚠️  Web app .env.production not found"
    echo "     Copy from: .env.production.template"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "apps/admin/.env.production" ]; then
    echo "  ✅ Admin app .env.production exists"
else
    echo "  ⚠️  Admin app .env.production not found"
    echo "     Copy from: .env.production.template"
    WARNINGS=$((WARNINGS + 1))
fi

# Check git status
echo ""
echo "📝 Checking git status..."
if [ -z "$(git status --porcelain)" ]; then
    echo "  ✅ Working directory clean"
else
    echo "  ⚠️  Uncommitted changes detected"
    echo "     Consider committing before deployment"
    WARNINGS=$((WARNINGS + 1))
fi

# Check database schema file
echo ""
echo "🗄️  Checking database setup..."
if [ -f "SETUP_SUPABASE.sql" ]; then
    echo "  ✅ Database schema file exists"
else
    echo "  ❌ SETUP_SUPABASE.sql not found!"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "========================================"
echo "📊 Verification Summary"
echo "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Ready for deployment."
    echo ""
    echo "Next steps:"
    echo "1. Upgrade Vercel account"
    echo "2. Run: ./deploy-production.sh"
    echo "3. Follow DEPLOYMENT-CHECKLIST.md for post-deployment"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found - review before deploying"
    echo ""
    echo "You can proceed with deployment, but address warnings first."
    exit 0
else
    echo "❌ $ERRORS error(s) found - fix before deploying"
    echo ""
    echo "Fix the errors above before attempting deployment."
    exit 1
fi
