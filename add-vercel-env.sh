#!/bin/bash
# Quick script to add environment variables to Vercel projects

echo "🔐 Adding environment variables to Vercel projects"
echo ""

# Admin project
echo "📌 Admin Dashboard"
cd apps/admin

echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
echo "https://exzccczfixfoscgdxebbz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4emNjemZpeGZvc2NnZHhlYmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MzgyMjgsImV4cCI6MjA4NjUxNDIyOH0.SvXKuBeao4i5FheRsnQyGPPsF815Isyl1ommkkiDdaM" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>/dev/null

cd ../..

# Web project
echo ""
echo "📌 Web App"
cd apps/web

echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
echo "https://exzccczfixfoscgdxebbz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4emNjemZpeGZvc2NnZHhlYmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MzgyMjgsImV4cCI6MjA4NjUxNDIyOH0.SvXKuBeao4i5FheRsnQyGPPsF815Isyl1ommkkiDdaM" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>/dev/null

cd ../..

echo ""
echo "✅ Done! Environment variables added to both projects"
echo ""
echo "Next step: Redeploy to use new environment variables"
echo "  cd apps/admin && vercel --prod"
echo "  cd ../web && vercel --prod"
