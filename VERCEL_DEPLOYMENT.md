# Vercel Deployment Instructions

This guide provides step-by-step instructions for deploying the Home Chef Admin and Web apps to Vercel.

---

## CLI Linking Workflow (Recommended for Local Development)

Use these exact terminal commands to link your local project to existing Vercel projects and deploy.

### Step 1 — Install Vercel CLI

```bash
# Using pnpm (matches this project's package manager)
pnpm add -g vercel

# Or using npm
npm install -g vercel
```

### Step 2 — Login

Skip this step if you are already logged in. The Vercel CLI stores credentials globally.

```bash
vercel login
```

Follow the prompt to authenticate via browser (GitHub, GitLab, email, etc.).
Verify you are logged in with:

```bash
vercel whoami
```

### Step 3 — Link Each App to Its Existing Vercel Project

Each Next.js app is a separate Vercel project. Run `vercel link` **from inside each app directory**.

**Link the Web app:**

```bash
cd apps/web
vercel link
```

When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → select your Vercel team/account
- **Link to existing project?** → `Y`
- **What's the name of your existing project?** → type the exact project name (e.g. `ridendine-web`)

**Link the Admin app:**

```bash
cd ../admin
vercel link
```

Repeat the same prompts, providing the admin project name (e.g. `ridendine-admin`).

Each linked app creates a `.vercel/project.json` inside its directory (already ignored by `.gitignore`).

### Step 4 — Pull Environment Variables

Pull the environment variables from Vercel into a local `.env.local` file for each app.

```bash
# Web app
cd apps/web
vercel env pull .env.local

# Admin app
cd ../admin
vercel env pull .env.local
```

> **Tip:** Run `vercel env pull --environment=preview .env.local` or `--environment=development`
> to pull variables for a specific Vercel environment.

### Step 5 — Deploy

**Deploy to production:**

```bash
# Web app
cd apps/web
vercel --prod

# Admin app
cd ../admin
vercel --prod
```

**Deploy a preview (e.g. for a feature branch):**

```bash
cd apps/web
vercel
```

Vercel prints the preview URL when the deployment finishes.

---

## Prerequisites

- Vercel account (free tier works)
- GitHub repository access
- Supabase project set up
- Vercel CLI installed (see CLI Linking Workflow above)

## Deployment Steps

### 1. Create Two Vercel Projects

Import the GitHub repo twice so you have **two separate projects**:

- **ridendine-admin project**
  - Root Directory: `apps/admin` ← **REQUIRED — must be set in Vercel project settings**
  - Framework: Next.js (auto-detected via `apps/admin/vercel.json`)
  - Install Command: *(leave blank — Vercel auto-detects pnpm and installs from repo root)*
  - Build Command: *(leave blank — Vercel uses its built-in Next.js framework builder)*
  - Output Directory: `.next`
  - Node.js Version: 20.x

- **ridendine-web project**
  - Root Directory: `apps/web` ← **REQUIRED — must be set in Vercel project settings**
  - Framework: Next.js (auto-detected via `apps/web/vercel.json`)
  - Install Command: *(leave blank — Vercel auto-detects pnpm and installs from repo root)*
  - Build Command: *(leave blank — Vercel uses its built-in Next.js framework builder)*
  - Output Directory: `.next`
  - Node.js Version: 20.x

> **Important:** Root Directory **must** be set for each project. The per-app `vercel.json` is
> minimal — just `{ "framework": "nextjs" }` — which tells Vercel's framework builder to handle
> the Next.js build automatically. No `installCommand` or `buildCommand` overrides are needed.
>
> **Do NOT specify Install Command in the dashboard** — leave it blank so Vercel auto-detects pnpm
> and runs install from the repository root (where `pnpm-lock.yaml` lives).

### 2. Configure Environment Variables (Admin)

Go to Settings → Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Optional (Development/Demo Only):**
```
NEXT_PUBLIC_ADMIN_MASTER_PASSWORD=your-secure-password
```
⚠️ **WARNING:** Never commit real passwords. Use Vercel environment variables for secrets.

### 3. Configure Environment Variables (Web)

Go to Settings → Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Server-only (never use NEXT_PUBLIC for these):**
```
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Deploy

1. Click "Deploy" in each project
2. Vercel will:
   - Install workspace dependencies using pnpm from the repository root
   - Build the Next.js app from the configured Root Directory (`apps/admin` or `apps/web`)
   - Deploy to production

### 5. Verify Deployment

After deployment completes, verify:

1. **Admin App:** Visit your admin Vercel domain (e.g., `https://ridendine-admin.vercel.app`)
   - Should show the admin login/gate screen
   - Dashboard pages should load correctly

2. **Web App:** Visit your web Vercel domain (e.g., `https://ridendine-web.vercel.app`)
   - Home page should load successfully

## Troubleshooting

### Build Fails: Wrong app being built or "cannot find module"
- **Cause:** Root Directory not set correctly in Vercel project settings
- **Fix:** Edit Root Directory in project settings:
  - Admin project: `apps/admin`
  - Web project: `apps/web`

### Build Fails: "Command 'next build' exited with 1" or custom command errors
- **Cause:** `buildCommand` override in `vercel.json` caused Vercel to run the command without proper framework context
- **Fix:** Keep `vercel.json` minimal: `{ "framework": "nextjs" }`. No `buildCommand` override. Vercel's built-in Next.js framework builder handles the build correctly.

### Build Fails: "ERR_PNPM_NO_LOCKFILE" or "Lockfile not found"
- **Cause:** Install Command was set to run from the app subdirectory where no `pnpm-lock.yaml` exists
- **Fix:** Leave Install Command **blank** in both the Vercel dashboard and `vercel.json`

### Build Fails: "pnpm: command not found" or install errors
- **Cause:** Package manager not detected or overridden by a wrong Install Command
- **Fix:** Leave Install Command blank — Vercel detects `pnpm-lock.yaml` at repo root and uses pnpm automatically

### Build Fails: "npm ci can only install packages when your package.json and package-lock.json are in sync"
- **Cause:** This project uses pnpm, not npm
- **Fix:** Clear the Install Command field in Vercel settings (leave blank)

### Supabase Connection Error at Runtime
- **Cause:** Missing environment variables in Vercel project settings
- **Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to all Vercel environments (Production, Preview, Development)

### Node Version Error
- **Cause:** Using incompatible Node version
- **Fix:** Set Node.js Version to 20.x in Settings → General


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
