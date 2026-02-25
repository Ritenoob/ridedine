# RidenDine Production Deployment Script (PowerShell)
# Deploys ridendine-web and ridendine-admin to Vercel under STM TECH
# Run from the repository root: .\deploy-production.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🚀 RidenDine Production Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Confirm current directory is the repo root
if (-not (Test-Path "pnpm-workspace.yaml")) {
    Write-Error "Run this script from the repository root (where pnpm-workspace.yaml lives)."
    exit 1
}

# ── Web App ────────────────────────────────────────────────────────────────────
Write-Host "🌐 Deploying ridendine-web..." -ForegroundColor Green

Set-Location apps/web

# Remove any stale .vercel link
if (Test-Path ".vercel") { Remove-Item -Recurse -Force ".vercel" }

# Link to the existing Vercel project
vercel link --yes --project ridendine-web

# Deploy to production
vercel --prod --force

Set-Location ../..

# ── Admin App ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔧 Deploying ridendine-admin..." -ForegroundColor Green

Set-Location apps/admin

# Remove any stale .vercel link
if (Test-Path ".vercel") { Remove-Item -Recurse -Force ".vercel" }

# Link to the existing Vercel project
vercel link --yes --project ridendine-admin

# Deploy to production
vercel --prod --force

Set-Location ../..

# ── Done ───────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "✅ Production deployment complete." -ForegroundColor Cyan
Write-Host "   See RELEASE_REPORT.md for the validation checklist." -ForegroundColor Cyan
