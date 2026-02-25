# Vercel Rollback & Recovery Plan

**Emergency procedures for deploying to production with confidence.**

---

## Overview

Rollback is the ability to quickly return to a known-good state if something breaks. Vercel makes this easy because every deployment is immutable and timestamped.

---

## Rollback Options

### Option 1: Promote Previous Deployment (FASTEST - 30 seconds)

**Best for:** Immediate recovery during demo or production incident

**Steps:**

1. Go to https://vercel.com/dashboard
2. Click **ridendine-admin** (or ridendine-web)
3. Click **Deployments** tab
4. Find the **last working deployment**
   - Look for one with a **green checkmark**
   - Typically 1-3 deployments back
5. Hover over it → Click **⋮ menu**
6. Click **Promote to Production**
7. Confirm the prompt

**Result:** Production instantly reverts to that deployment (URL doesn't change, code does)

**Time:** ~30 seconds total

**Verification:**
```bash
# Check status in Vercel dashboard
# You should see the old deployment now active (shows "Current")
```

---

### Option 2: Revert Commit in GitHub (1-2 minutes)

**Best for:** Addressing root cause, preventing re-deployment

**Steps:**

```bash
# From your local machine
cd /home/nygmaee/Desktop/ridendine-demo-main

# View recent commits
git log --oneline -10

# Find the commit that introduced the problem
# Example: "abc1234 Add new feature that broke things"

# Create a revert commit
git revert abc1234

# This opens an editor with auto-generated message
# Just save it (default message is fine)

# Push to main
git push origin main
```

**Result:** GitHub creates a new commit that undoes the bad commit. Vercel auto-detects this and redeploys.

**Time:** ~1-2 minutes (includes Vercel rebuild)

**Verification:**
```bash
# Check Vercel dashboard
# A new deployment should appear and go to "Ready" status
```

---

### Option 3: Manual Deploy with Vercel CLI (3-5 minutes)

**Best for:** Deploying a specific branch or testing before production**

**Prerequisites:**
```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Login to Vercel
vercel login
```

**Steps:**

```bash
# From repository root
cd /home/nygmaee/Desktop/ridendine-demo-main

# For admin app
cd apps/admin
vercel --prod                    # Deploy to production

# For web app
cd ../web
vercel --prod                    # Deploy to production
```

**Result:** Manual upload of current local code to production

**Time:** ~3-5 minutes per app

**⚠️ Warning:** Make sure your local code is in a known-good state before using this

---

### Option 4: Disable Auto-Deploy & Manual Control

**Best for:** High-risk deployments requiring review**

**Steps:**

1. Go to **[Project] → Settings → Git**
2. Uncheck **"Automatic Deployments"**
3. Now only manual `vercel --prod` commands deploy

**When to use:**
- Before major releases
- When doing significant infrastructure changes
- When you want human review before production changes

**Reverse it:**
1. Check **"Automatic Deployments"** again
2. Normal GitHub push-to-deploy resumes

---

## Pre-Rollback Checklist

Before triggering a rollback, ask:

1. **Is the issue reproducible?**
   - Can you see it consistently?
   - Or was it a one-time glitch?

2. **Is it really a deployment issue?**
   - Check: Is Supabase down? (https://status.supabase.com)
   - Check: Are Vercel systems okay? (https://vercel.com/status)
   - Check: Is the user's internet working?

3. **Do you have a known-good deployment to rollback to?**
   - Look at Vercel Deployments list
   - Pick one from the last 1-3 deployments that worked
   - If unsure, ask: "When was the last time this was working?"

---

## Incident Response Procedure

### Scenario 1: Demo Breaks During Live Demo (HIGH PRIORITY)

**Time:** You have 2-3 minutes before demo audience notices

**Step 1: Diagnosis (30 seconds)**
- [ ] Is the page loaded but showing an error?
- [ ] Is the page not loading at all (blank/timeout)?
- [ ] Is the page loading but feature not working?

**Step 2: Quick Fix Options (pick one)**

**Option A: Refresh (browser cache issue)** - 10 seconds
```
Press Ctrl+F5 (or Cmd+Shift+R on Mac) to hard-refresh
If it works, continue demo
If not → proceed to Option B
```

**Option B: Promote Previous Deployment** - 30 seconds
```
Open https://vercel.com/dashboard in another tab
Click the broken project
Go to Deployments
Find the last green checkmark deployment (1-2 back)
Click ⋮ → Promote to Production
Wait 15-20 seconds for status to change to "Current"
Refresh the demo page
```

**Option C: Switch to Backup Plan** - Immediate
```
If Vercel dashboard is slow/down:
1. Tell audience: "Let me show you the local version"
2. Switch to localhost:3000 (your local dev environment)
3. Continue demo from there
```

**Step 3: After Incident**
- Note the broken deployment number
- Don't delete it (forensics needed)
- Schedule 30-min post-mortem

---

### Scenario 2: Build Fails Before Demo Starts (MEDIUM PRIORITY)

**Time:** You have 1-2 hours to fix

**Step 1: Check Build Logs**
```
Vercel Dashboard → [Project] → Deployments → [Failed Build]
Click Logs → Scroll to bottom
Look for the actual error message
```

**Step 2: Identify Root Cause**

| Error | Cause | Fix |
|-------|-------|-----|
| `ENOENT: no such file or directory, scandir 'apps/admin'` | Wrong Root Directory | Settings → General → Set Root Directory to `apps/admin` |
| `Cannot find module '@home-chef/shared'` | Monorepo issue | Verify `pnpm-lock.yaml` is at repo root, commit it, push |
| `env var NEXT_PUBLIC_SUPABASE_URL is not set` | Missing env var | Settings → Environment Variables → Add for Production |
| `SyntaxError: Unexpected token` | Code syntax error | Check recent commits for typos, fix locally, push |

**Step 3: Fix & Redeploy**
```
# If fix is environmental:
1. Go to Settings → Environment Variables
2. Add the missing variable
3. Click Redeploy button

# If fix is code:
1. Fix the issue locally
2. git add . && git commit -m "Fix build"
3. git push origin main
4. Vercel auto-deploys
```

**Step 4: If Can't Fix in Time**
```
1. Promote last working deployment (Option 1 above)
2. Continue demo with older but stable version
3. Fix and redeploy after demo
```

---

### Scenario 3: Production Error After Deployment (MEDIUM PRIORITY)

**Example:** Page loads but shows "Supabase connection failed"

**Step 1: Determine Scope**
- [ ] Is it affecting both apps or just one?
- [ ] Is it affecting all users or specific pages?
- [ ] Did it happen immediately after deploy or later?

**Step 2: Check Logs**
```
Vercel Dashboard → [Project] → Deployments → [Current]
Click "Logs" tab
Look for error patterns
```

**Step 3: Quick Checks**
```
1. Is Supabase up? https://status.supabase.com
2. Are Vercel systems okay? https://vercel.com/status
3. Check environment variables: Settings → Environment Variables
   - Are all critical vars set?
   - Are they the correct values?
4. Check recent code changes: GitHub → commits
   - What changed in the last commit?
```

**Step 4: Recovery Options**

**If it's an env var issue:**
```
1. Settings → Environment Variables
2. Verify the values
3. Fix if needed
4. Click "Redeploy"
5. Wait 2-3 minutes
```

**If it's a code issue:**
```
Option A: Rollback (fastest)
1. Promote previous working deployment (30 seconds)

Option B: Fix and redeploy (slower)
1. Fix the issue locally
2. git push to main
3. Wait 2-3 minutes for rebuild
```

---

## Rollback Verification

After rolling back, verify:

### 1. Deployment Status
```bash
# Expected: Shows "Current" next to the promoted deployment
# Shows green checkmark
# No error messages
```

### 2. Page Load
```
1. Open the app URL in incognito window
2. Hard refresh: Ctrl+F5
3. Verify page loads
4. Check browser console (F12 → Console)
   - No red errors
   - No "Cannot find module" messages
```

### 3. Functionality
```
1. Try key workflows
2. Admin: Can you navigate to /dashboard?
3. Web: Can you navigate between pages?
4. Check Supabase requests (Network tab)
   - Look for requests to supabase.co
   - Verify they return 200 status
```

### 4. Logs
```
Vercel Dashboard → [Project] → Deployments → [Current]
Logs tab should show:
- No error messages
- Shows "✓ Build cached" or "✓ Built"
- Shows green checkmark on right side
```

---

## Prevention: Best Practices

### Before Deploying to Production

1. **Test locally first**
   ```bash
   cd apps/admin
   pnpm dev              # Verify it runs locally
   pnpm build            # Verify it builds
   ```

2. **Test preview deployment**
   ```bash
   # Make a small commit to a feature branch
   git checkout -b test-feature
   git commit --allow-empty -m "Test preview"
   git push origin test-feature

   # Vercel auto-creates preview deployment
   # Test it at the preview URL
   # Then merge to main only if preview works
   ```

3. **Use branch protection**
   ```
   GitHub → Settings → Branches → main
   Enable: Require status checks before merging
   ```

4. **Require approvals for production changes**
   ```
   Vercel → [Project] → Settings → Deployment Protection
   Enable: Production Deployment Protection
   ```

### During Deployment

1. **Monitor the build**
   ```
   Vercel Dashboard → [Project] → Deployments
   Watch the most recent deployment
   Should go: Building → Ready (in 2-3 minutes)
   If stuck → check Logs tab
   ```

2. **Test immediately after**
   ```
   Refresh the app URL in new incognito window
   Verify page loads and works
   ```

3. **Monitor for the first 5 minutes**
   ```
   Check Vercel Analytics or error tracking
   Look for spikes in errors
   If issues appear, rollback immediately
   ```

---

## Disaster Recovery: Complete Outage

**Scenario:** Both Vercel projects down, all deployments corrupted, GitHub inaccessible

**Recovery Steps:**

1. **Switch to Local Development Mode**
   ```bash
   cd /home/nygmaee/Desktop/ridendine-demo-main
   pnpm install
   pnpm --filter @home-chef/admin dev
   pnpm --filter @home-chef/web dev
   # Apps now run on localhost:3000 and localhost:3001
   # Share screen during demo instead of URLs
   ```

2. **Wait for Services to Recover**
   ```
   - Vercel status: https://vercel.com/status
   - GitHub status: https://www.githubstatus.com
   - Supabase status: https://status.supabase.com
   - Check every 2-3 minutes
   ```

3. **Redeploy Once Services Return**
   ```bash
   # Once Vercel is back:
   vercel --prod                # Trigger manual deployment

   # Wait for "Ready" status
   # Verify URLs work again
   ```

---

## Rollback Timeline

| Time | Action |
|------|--------|
| T+0 | Issue detected during demo or after deploy |
| T+30s | Promote previous deployment (Option 1) |
| T+1m | Verify promotion in Vercel dashboard |
| T+2m | Hard-refresh demo page in new incognito window |
| T+3m | If page loads, continue demo |
| T+5m | Start investigating root cause |
| T+30m | (Post-demo) Fix root cause and redeploy |

---

## Rollback Decision Tree

```
Something broke in production?
│
├─ Did it happen during demo?
│  │
│  ├─ YES → Promote previous deployment immediately (30 sec)
│  │
│  └─ NO → Proceed to next question
│
├─ Can you identify the bad commit?
│  │
│  ├─ YES → git revert and push (1-2 min)
│  │
│  └─ NO → Go to next question
│
├─ Is the issue environment-related (env var)?
│  │
│  ├─ YES → Fix env var + redeploy (2-3 min)
│  │
│  └─ NO → Promote previous deployment (30 sec)
│
└─ All recovered? Monitor for next 24 hours
```

---

## Post-Rollback Analysis

After rolling back, schedule 30 minutes to understand what happened:

1. **Review the bad deployment**
   - What code changed?
   - What environment changes were made?
   - Were any secrets rotated?

2. **Identify root cause**
   - Code bug?
   - Configuration issue?
   - Third-party service failure?
   - User error?

3. **Implement prevention**
   - Add tests to catch this in future?
   - Add monitoring alert?
   - Change deployment procedure?
   - Add approvals for this type of change?

4. **Document lesson learned**
   - Add to team knowledge base
   - Update deployment runbooks
   - Share with team

---

## Emergency Contacts

- **Vercel Support:** https://vercel.com/support
- **Supabase Status:** https://status.supabase.com
- **GitHub Status:** https://www.githubstatus.com

---

## Quick Reference Cards

### For Demo Breaks
```
1. https://vercel.com/dashboard
2. Click [Project Name]
3. Deployments tab
4. Click ⋮ on last green checkmark deployment
5. Click "Promote to Production"
6. Refresh demo page
7. Continue demo
```

### For Code Breaks
```
# Identify bad commit
git log --oneline -5

# Create revert
git revert [commit-hash]

# Push
git push origin main

# Wait 2-3 minutes for Vercel to redeploy
```

### For Env Var Breaks
```
1. Vercel Dashboard → Settings → Environment Variables
2. Find the broken variable
3. Verify the value is correct
4. Click "Redeploy"
5. Wait 2-3 minutes
```

---

**Last Updated:** 2026-02-25
**Version:** 1.0
