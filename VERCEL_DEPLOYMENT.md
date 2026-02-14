# Vercel Deployment Instructions

This guide provides step-by-step instructions for deploying the Home Chef Admin app to Vercel.

## Prerequisites

- Vercel account (free tier works)
- GitHub repository access
- Supabase project set up

## Deployment Steps

### 1. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository `SeanCFAFinlay/ridendine-demo`
4. Vercel will auto-detect it as a monorepo

### 2. Configure Build Settings

**CRITICAL: Monorepo Configuration**

Since this is a monorepo with the admin app at `apps/admin`, you MUST configure the Root Directory:

**Root Directory:** `apps/admin`
- Click "Edit" next to "Root Directory" in project settings
- Set it to `apps/admin`
- This tells Vercel to treat `apps/admin` as the project root

**Framework Preset:** Next.js (auto-detected)

**Build Command:** `npm run build` (auto-detected)

**Output Directory:** `.next` (default)

**Install Command:** `npm ci`
- Vercel will run this from the repository root
- The root package.json contains workspace configuration
- Dependencies for apps/admin will be installed via npm workspaces

**Node Version:** 20.x
- Set in Settings → General → Node.js Version
- Or ensure `.nvmrc` file at repo root contains `20`

### 3. Configure Environment Variables

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

### 4. Deploy

1. Click "Deploy"
2. Vercel will:
   - Install dependencies using npm workspaces from repository root
   - Build the Next.js app from `apps/admin`
   - Deploy to production

### 5. Verify Deployment

After deployment completes, verify:

1. **Admin App:** Visit your Vercel domain (e.g., `https://your-app.vercel.app`)
   - Should redirect to `/dashboard` (or `/dashboard/orders`)
   - Dashboard pages should load correctly
   - Login via Supabase authentication should work

## Troubleshooting

### Build Fails: "Module not found" or dependency errors
- **Cause:** Root Directory not set to `apps/admin`
- **Fix:** Edit Root Directory in project settings to `apps/admin`

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
