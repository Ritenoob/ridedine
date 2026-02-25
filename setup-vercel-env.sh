#!/bin/bash

# Setup Vercel Environment Variables
# Run this script after creating Vercel projects via GitHub integration

set -e

echo "🔐 Vercel Environment Variable Setup"
echo "====================================="
echo ""

# Load local environment variables
if [ ! -f apps/admin/.env.production ]; then
    echo "❌ apps/admin/.env.production not found"
    exit 1
fi

if [ ! -f apps/web/.env.production ]; then
    echo "❌ apps/web/.env.production not found"
    exit 1
fi

# Source the env files
export $(grep -v '^#' apps/admin/.env.production | xargs)

echo "📋 Loaded environment variables from local .env.production files"
echo ""

# Function to add environment variable to Vercel
add_env() {
    local project=$1
    local key=$2
    local value=$3
    local env_type=$4  # production, preview, development

    if [ -z "$value" ]; then
        echo "⚠️  Skipping $key (empty value)"
        return
    fi

    echo "Adding $key to $project ($env_type)..."
    cd "apps/$project"
    echo "$value" | vercel env add "$key" "$env_type" --yes 2>/dev/null || echo "  (may already exist)"
    cd ../..
}

# Setup Admin Dashboard
echo "🏗️  Setting up Admin Dashboard environment..."
echo ""

add_env "admin" "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production"
add_env "admin" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "production"
add_env "admin" "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production"

echo ""
echo "✅ Admin dashboard environment variables configured"
echo ""

# Setup Web App
echo "🌐 Setting up Web App environment..."
echo ""

add_env "web" "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production"
add_env "web" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "production"

# Check for optional variables
if [ -n "$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" ]; then
    add_env "web" "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "production"
else
    echo "⚠️  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set - add manually via dashboard"
fi

if [ -n "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    add_env "web" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "production"
else
    echo "⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set - add manually via dashboard"
fi

if [ -n "$STRIPE_SECRET_KEY" ]; then
    add_env "web" "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "production"
else
    echo "⚠️  STRIPE_SECRET_KEY not set - add manually via dashboard"
fi

echo ""
echo "✅ Web app environment variables configured"
echo ""

echo "====================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Verify variables: vercel env ls"
echo "2. Redeploy admin: cd apps/admin && vercel --prod"
echo "3. Redeploy web: cd apps/web && vercel --prod"
echo ""
echo "Or trigger automatic deployment: git push origin main"
echo ""
