# Vercel Deployment Instructions

This guide provides step-by-step instructions for deploying the Home Chef Admin and Web apps to Vercel.

## Prerequisites

- Vercel account (free tier works)
- GitHub repository access
- Supabase project set up

## Deployment Steps

### 1. Create Two Vercel Projects

Import the GitHub repo twice so you have **two separate projects**:

- **Admin project**
  - Root Directory: `apps/admin`
  - Framework: Next.js
  - Install Command: `npm ci`
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Node.js Version: 20.x
- **Web project**
  - Root Directory: `apps/web`
  - Framework: auto-detect (Next.js)
  - Install Command: `npm ci`
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Node.js Version: 20.x

No `vercel.json` files are required when Root Directory is set in project settings.

### 2. Configure Environment Variables (Admin)

Go to Settings → Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Optional (Development Only):**
```
NEXT_PUBLIC_DEV_AUTH_BYPASS=false
```
⚠️ **WARNING:** Never set `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` in production!

### 3. Deploy

1. Click "Deploy" in each project
2. Vercel will:
   - Install dependencies using npm workspaces from repository root
   - Build the Next.js app from the configured Root Directory
   - Deploy to production

### 4. Verify Deployment

After deployment completes, verify:

1. **Admin App:** Visit your admin Vercel domain (e.g., `https://your-app-admin.vercel.app`)
   - Should redirect to `/dashboard` (or `/dashboard/orders`)
   - Dashboard pages should load correctly
   - Login via Supabase authentication should work
2. **Web App:** Visit your web Vercel domain (e.g., `https://your-app-web.vercel.app`)
   - Home should redirect to `/dashboard`
   - Placeholder dashboard page renders successfully

## Troubleshooting

### Build Fails: "Module not found" or dependency errors
- **Cause:** Root Directory not set to `apps/admin` or `apps/web`
- **Fix:** Edit Root Directory in project settings to the correct app folder

### Build Fails: "npm ci can only install packages when your package.json and package-lock.json are in sync"
- **Cause:** package-lock.json out of sync or corrupted
- **Fix:** Run `npm install` locally and commit the updated package-lock.json

### Build Fails: Workspace errors
- **Cause:** Vercel not running install from repository root
- **Fix:** Ensure Install Command is `npm ci` (run from root) and Build Command is `npm run build` (run from apps/admin)

### Supabase Connection Error
- **Cause:** Missing environment variables
- **Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Node Version Error
- **Cause:** Using incompatible Node version
- **Fix:** Set Node.js Version to 20.x in Settings

## Continuous Deployment

Once configured, Vercel will automatically deploy:
- **Production:** Every push to `main` branch
- **Preview:** Every pull request

## Environment-Specific Deployments

For staging/production splits:
1. Create separate Vercel projects
2. Link to different branches (e.g., `develop` vs `main`)
3. Use different environment variables per project

## Domain Configuration

To use a custom domain:
1. Go to Settings → Domains
2. Add your domain
3. Follow Vercel's DNS configuration instructions

## Access Control

For production, use Supabase Row Level Security (RLS) and authentication:
- Admin users must have `role='admin'` in the `profiles` table
- Never rely on auth bypass in production

## Support

For issues:
- Check Vercel deployment logs
- Review GitHub Actions CI status
- Consult [Vercel Documentation](https://vercel.com/docs)
