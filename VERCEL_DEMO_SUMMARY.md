# Vercel Deployment - Demo Day Summary

**Quick reference for demo execution in the next 6 hours.**

---

## Critical Path (What You Must Do Right Now)

### 1. Create Two Vercel Projects (5 minutes)

Visit https://vercel.com/dashboard and:

1. **Project 1: Admin Dashboard**
   - Add Project → Import repository `ridendine-demo`
   - Set **Root Directory: `apps/admin`** ← CRITICAL
   - Deploy (auto-detects Next.js)

2. **Project 2: Web App**
   - Add Project → Import repository `ridendine-demo`
   - Set **Root Directory: `apps/web`** ← CRITICAL
   - Deploy (auto-detects Next.js)

### 2. Set Environment Variables (5 minutes)

For **each** project, go to Settings → Environment Variables:

**Required for both apps:**
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-key-from-supabase]
```

**Additional for admin only:**
```
SUPABASE_SERVICE_ROLE_KEY = [use Supabase secrets for Edge Functions only]
```

**Set these in ALL three scopes: Production, Preview, Development**

### 3. Verify Deployments (5 minutes)

- [ ] Both projects show **"Ready"** status
- [ ] Open both URLs in incognito windows
- [ ] Admin shows login screen
- [ ] Web shows home page

**Total time: 15 minutes**

---

## For the Demo (6 hours from now)

### 30 Minutes Before Demo

1. **Run the checklist:** See `VERCEL_DEPLOYMENT_CHECKLIST.md`
   - Takes 15 minutes
   - Verifies both apps are live and working
   - Catches any last-minute issues

2. **Open both URLs in browser tabs**
   - Keep them open during demo
   - Switch between them as you present

3. **Have rollback ready**
   - Know how to promote previous deployment (30 seconds)
   - Instructions in `VERCEL_ROLLBACK_PLAN.md`

### During Demo

- **Admin URL:** https://ridendine-admin-[hash].vercel.app
- **Web URL:** https://ridendine-web-[hash].vercel.app
- Use incognito windows to avoid cache issues
- If something breaks, rollback (30 seconds)

### After Demo

- Check Vercel logs for errors
- Keep current deployment live for stakeholders to test
- Plan custom domains if long-term deployment

---

## Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `VERCEL_QUICK_START.md` | 5-minute setup guide | 5 min |
| `VERCEL_SETUP_FULL.md` | Complete 30-minute setup with all options | 15 min |
| `VERCEL_DEPLOYMENT_CHECKLIST.md` | Pre-demo verification checklist | 15 min |
| `VERCEL_ROLLBACK_PLAN.md` | Emergency rollback procedures | 10 min |

---

## Environment Variables You Need

### From Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API → Copy these:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon key** (starts with `eyJ...`)
   - **service role key** (for admin app only)

### Example (DO NOT USE - FOR REFERENCE ONLY)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (Edge Functions only, not for web/admin apps)
```

---

## Deployment Architecture

```
GitHub: ridendine-demo
│
├─ Commit to main branch
│
├─ Vercel Auto-Deploy
│  │
│  ├─ ridendine-admin project
│  │  └─ Root: apps/admin
│  │  └─ URL: ridendine-admin-[hash].vercel.app
│  │
│  └─ ridendine-web project
│     └─ Root: apps/web
│     └─ URL: ridendine-web-[hash].vercel.app
│
└─ Database: Supabase (hosted at supabase.co)
```

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Build fails immediately | Check Root Directory is set to `apps/admin` or `apps/web` |
| Page loads blank/500 error | Verify env vars are set for Production scope |
| Supabase connection fails | Verify `NEXT_PUBLIC_SUPABASE_URL` is exact copy from Supabase, not template |
| Can't see previous deployments | Vercel Dashboard → [Project] → Deployments tab |
| Need to rollback | Click ⋮ on previous deployment → "Promote to Production" |
| App loads slow | Normal for first load (cold start); subsequent loads are faster |

---

## Success Criteria

✅ Both Vercel projects created
✅ Root Directories set correctly (apps/admin, apps/web)
✅ Environment variables set for all three scopes
✅ Both apps deploy to "Ready" status
✅ Admin URL opens without errors
✅ Web URL opens without errors
✅ Supabase connectivity working (check Network tab in browser)
✅ You have rollback plan ready

---

## What Happens Next

1. **Demo proceeds with live deployed apps** (no localhost)
2. **Audience can see real URLs** they can visit later
3. **After demo, apps stay live** for stakeholders to test
4. **You can share links** for review and feedback

---

## Post-Demo Actions

- [ ] Collect feedback from demo
- [ ] Monitor Vercel dashboard for errors (first 24 hours)
- [ ] Plan next steps (custom domains, database migration, etc.)
- [ ] Document deployment process for team

---

## Key Contacts & Resources

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Status:** https://vercel.com/status
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Supabase Status:** https://status.supabase.com
- **GitHub Repo:** ridendine-demo

---

**Deployment Status:** Ready for demo
**Last Updated:** 2026-02-25
**Demo Time:** T-6 hours

---

## 5-Minute Checklist Before Going Live

- [ ] Open Vercel dashboard
- [ ] Both projects show "Ready"
- [ ] Click admin URL - page loads
- [ ] Click web URL - page loads
- [ ] F12 console - no red errors
- [ ] Close dev tools
- [ ] Share URLs with audience
- [ ] Demo starts

**You're ready!**
