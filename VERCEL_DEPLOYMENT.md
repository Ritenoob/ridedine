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

Set the following in the project settings:

**Framework Preset:** Next.js

**Root Directory:** `apps/admin`
- This is critical! Click "Edit" next to "Root Directory" and set it to `apps/admin`

**Build Command:** `npm run build`
- This will automatically run `npm run copy-docs && next build`

**Output Directory:** `.next` (default, leave as is)

**Install Command:** `npm ci`

**Node Version:** 20.x
- Set this in Settings → General → Node.js Version

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
   - Install dependencies from `apps/admin`
   - Copy docs from `/docs` to `apps/admin/public/docs`
   - Build the Next.js app
   - Deploy to production

### 5. Verify Deployment

After deployment completes, verify:

1. **Admin App:** Visit your Vercel domain (e.g., `https://your-app.vercel.app`)
   - Should show the admin login page
   - Login should work with valid Supabase credentials

2. **Docs:** Visit `https://your-app.vercel.app/docs/`
   - Should serve the GitHub Pages documentation
   - All assets (CSS, JS, images) should load correctly

3. **API Routes:** Test that the app can connect to Supabase
   - Try logging in
   - Check dashboard pages load

## Troubleshooting

### Build Fails: "Module not found"
- **Cause:** Root Directory not set to `apps/admin`
- **Fix:** Edit Root Directory in project settings

### Docs 404 Error
- **Cause:** Docs not copied during build
- **Fix:** Check that build command runs `npm run copy-docs`

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
