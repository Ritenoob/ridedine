#!/usr/bin/env pwsh
# scripts/vercel-deploy.ps1
# Links and deploys ridendine-web and ridendine-admin to Vercel production.
# Requires the Vercel CLI to be installed: npm i -g vercel

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot

function Deploy-App {
    param(
        [string]$AppName,
        [string]$AppPath
    )

    Write-Host "`n==> Deploying $AppName ..." -ForegroundColor Cyan

    # Remove stale .vercel link so the next link is clean
    $vercelDir = Join-Path $RepoRoot '.vercel'
    if (Test-Path $vercelDir) {
        Remove-Item -Recurse -Force $vercelDir
        Write-Host "    Cleaned .vercel directory"
    }

    # Link to the correct Vercel project
    Push-Location $AppPath
    try {
        vercel link --yes
        vercel --prod
    } finally {
        Pop-Location
    }

    Write-Host "==> $AppName deployed successfully." -ForegroundColor Green
}

Deploy-App -AppName 'ridendine-web'   -AppPath (Join-Path $RepoRoot 'apps' 'web')
Deploy-App -AppName 'ridendine-admin' -AppPath (Join-Path $RepoRoot 'apps' 'admin')

# Final cleanup
$vercelDir = Join-Path $RepoRoot '.vercel'
if (Test-Path $vercelDir) {
    Remove-Item -Recurse -Force $vercelDir
}

Write-Host "`nAll apps deployed." -ForegroundColor Green
