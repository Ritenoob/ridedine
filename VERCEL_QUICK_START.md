# Vercel Quick Start - 5 Minutes

**Goal:** Deploy RidenDine admin + web apps to Vercel in 5 minutes.

---

## Prerequisites (Check First)

- [ ] GitHub account with access to the ridendine-demo repository
- [ ] Vercel account (free tier OK) at https://vercel.com
- [ ] Supabase project URL and anon key (from `.env.production.template`)

---

## Step 1: Create Two Vercel Projects (3 min)

### Project 1: Admin Dashboard

1. Go to **https://vercel.com/dashboard**
2. Click **Add New → Project**
3. Import the **ridendine-demo** GitHub repository
4. Select **apps/admin** as the **Root Directory** (critical!)
5. Click **Deploy**

**Expected:** Vercel detects Next.js framework automatically.

### Project 2: Web App

1. Go back to **https://vercel.com/dashboard**
2. Click **Add New → Project**
3. Import the **ridendine-demo** GitHub repository (same repo)
4. Select **apps/web** as the **Root Directory** (critical!)
5. Click **Deploy**

**Expected:** Both projects show in dashboard.

---

## Step 2: Set Environment Variables (2 min)

For **EACH project** (admin + web):

1. Go to **Project Settings → Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL     = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```

3. Repeat for both Production, Preview, and Development environments

**Get these values from:**
- Supabase Dashboard → Project Settings → API → URLs and Keys
- Copy: Project URL and `anon` key (not the service role key)

---

## Step 3: Verify Deployments (2 min)

1. Go to **Vercel Dashboard**
2. Click on **ridendine-admin** → Check for **Ready** status
3. Click on **ridendine-web** → Check for **Ready** status
4. Click the deployment URL for each app to verify it loads

**Expected:**
- Admin: Login/gate screen appears
- Web: Home page loads with navigation working

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Build fails immediately** | Check Root Directory is set to `apps/admin` or `apps/web` (not `.`) |
| **"Cannot find module" errors** | Verify env vars are set in Production environment (not just preview) |
| **Page loads but shows errors** | Check Vercel logs: click deployment → **Logs** tab. Look for missing env vars. |
| **Supabase connection fails** | Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (copy from Supabase dashboard, not template) |

---

## Demo URLs

Once deployed, share these URLs:

- **Admin Dashboard:** https://ridendine-admin-[hash].vercel.app
- **Customer Web:** https://ridendine-web-[hash].vercel.app

---

## What's Next

After verification:

1. **Test admin login** at the admin URL
2. **Run seed data script** (if needed) to populate demo data
3. **Share links** with stakeholders

See **VERCEL_SETUP_FULL.md** for advanced configuration (custom domains, analytics, etc.).

---

**Total Time:** ~5 minutes ⏱️
