# RideNDine Deployment Guide

This document provides step-by-step instructions for deploying the RideNDine platform.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Stripe Configuration](#stripe-configuration)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] GitHub repository access
- [ ] Stripe account (test and live keys)
- [ ] Backend hosting platform account (Railway, Render, Heroku, etc.)
- [ ] Domain name (optional, but recommended)
- [ ] SSL certificate configured (HTTPS required for Stripe)
- [ ] Strong passwords generated for all roles
- [ ] Session secret generated (random 32+ character string)

---

## Environment Setup

### Required Environment Variables

Create these environment variables in your deployment platform:

**Production Environment:**
```bash
# Security
DEMO_MODE=false                           # CRITICAL: Disable demo mode in production
SESSION_SECRET=<64-char-random-string>    # Generate with: openssl rand -base64 48

# Authentication
ADMIN_PASSWORD=<strong-password>          # Use password manager
CHEF_PASSWORD=<strong-password>
DRIVER_PASSWORD=<strong-password>

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
APP_BASE_URL=https://api.yourdomain.com   # Your backend URL
NODE_ENV=production
PORT=3000                                  # Or platform default

# Integrations (Optional)
COOCO_WEBHOOK_SECRET=<your-secret>
MEALBRIDGE_API_KEY=<your-api-key>
MEALBRIDGE_BASE_URL=https://api.mealbridge.com
```

**Development/Staging Environment:**
```bash
DEMO_MODE=true                            # Allow bypass for testing
STRIPE_SECRET_KEY=sk_test_...             # Test keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
APP_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### Generating Secure Passwords

```bash
# Generate session secret
openssl rand -base64 48

# Generate admin password
openssl rand -base64 32

# Or use password manager to generate strong passwords
```

---

## Frontend Deployment

The frontend is a static SPA (Single Page Application) that can be deployed to various platforms.

### Option 1: GitHub Pages (Free, Easiest)

**Automatic Deployment:**

1. Your `/docs` folder is already configured for GitHub Pages
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select branch: `main`
5. Select folder: `/docs`
6. Save

**URL:** `https://yourusername.github.io/ridendine-demo/`

**Dev/Staging Branch:**
- Repeat for `dev` branch to create staging environment
- Dev will show DEV BUILD banner automatically

### Option 2: Netlify

1. Create Netlify account
2. Connect GitHub repository
3. Configure:
   - **Build command:** (leave empty)
   - **Publish directory:** `docs`
   - **Branch:** `main` (or `dev` for staging)
4. Deploy

**Custom Domain:**
- Add custom domain in Netlify dashboard
- Configure DNS records
- Enable HTTPS (automatic)

### Option 3: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from docs folder
cd docs
vercel --prod
```

### Option 4: Cloudflare Pages

1. Connect GitHub repository
2. Configure:
   - **Build output directory:** `docs`
   - **Branch:** `main`
3. Deploy

**Note:** The frontend will need to connect to your backend API. Update API endpoints if needed.

---

## Backend Deployment

The backend is a Node.js/Express API server that needs to run continuously.

### Option 1: Railway (Recommended - Easiest)

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

**Step 2: Initialize Project**
```bash
cd /path/to/ridendine-demo
railway login
railway init
```

**Step 3: Set Environment Variables**

In Railway dashboard:
1. Go to your project → Variables
2. Add all environment variables (see Environment Setup above)
3. Set `DEMO_MODE=false` for production

**Step 4: Deploy**
```bash
railway up
```

**Step 5: Get Public URL**
- Railway provides a public URL: `https://your-app.up.railway.app`
- Use this as your `APP_BASE_URL`

**Cost:** Free tier available, $5/month for hobby plan

### Option 2: Render

**Step 1: Create Account**
- Sign up at https://render.com

**Step 2: Create Web Service**
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name:** `ridendine-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Branch:** `main`

**Step 3: Environment Variables**
- Add all variables in Render dashboard
- Set `DEMO_MODE=false`

**Step 4: Deploy**
- Automatic deployment on git push

**Cost:** Free tier available (sleeps after inactivity), $7/month for always-on

### Option 3: Heroku

**Step 1: Install Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from heroku.com
```

**Step 2: Login**
```bash
heroku login
```

**Step 3: Create App**
```bash
cd /path/to/ridendine-demo
heroku create ridendine-api
```

**Step 4: Set Environment Variables**
```bash
heroku config:set DEMO_MODE=false
heroku config:set ADMIN_PASSWORD=<password>
heroku config:set STRIPE_SECRET_KEY=sk_live_...
# ... repeat for all variables
```

**Step 5: Deploy**
```bash
git push heroku main
```

**Step 6: Check Logs**
```bash
heroku logs --tail
```

**Cost:** $7/month for Eco dynos (basic plan)

### Option 4: DigitalOcean App Platform

**Step 1: Create Account**
- Sign up at https://cloud.digitalocean.com

**Step 2: Create App**
1. Click "Create" → "Apps"
2. Connect GitHub repository
3. Select branch: `main`
4. Auto-detect as Node.js app

**Step 3: Configure**
- **Build Command:** `npm install`
- **Run Command:** `npm start`
- **HTTP Port:** `3000`

**Step 4: Environment Variables**
- Add in App Settings → Environment Variables
- Set `DEMO_MODE=false`

**Step 5: Deploy**
- Auto-deploys on git push

**Cost:** $5/month for basic plan

---

## Stripe Configuration

### Step 1: Get API Keys

**For Testing (Staging/Dev):**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

**For Production:**
1. Activate your account
2. Go to https://dashboard.stripe.com/apikeys
3. Copy:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

### Step 2: Configure Webhook

**For Production:**
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-backend-url.com/api/payments/webhook`
4. Select events:
   - `checkout.session.completed`
5. Copy webhook signing secret: `whsec_...`
6. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

**For Development/Testing:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# Copy webhook secret from output
```

### Step 3: Test Payment Flow

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry date and CVC

**Test Flow:**
1. Browse to `/chefs/hoang-gia-pho`
2. Add items to cart
3. Proceed to checkout
4. Enter test card: `4242 4242 4242 4242`
5. Expiry: `12/34`, CVC: `123`
6. Complete payment
7. Verify redirect to success page
8. Check order in admin dashboard

---

## Post-Deployment Testing

### Automated Checks

Use this checklist after each deployment:

```bash
# Health check
curl https://your-backend-url.com/api/health
# Expected: {"status":"ok","demoMode":false,"timestamp":"..."}

# Check CORS (from frontend domain)
curl -H "Origin: https://your-frontend-url.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend-url.com/api/auth/login
```

### Manual Testing Checklist

- [ ] Landing page loads
- [ ] DEV BUILD banner NOT showing (production only)
- [ ] DEV BUILD banner IS showing (dev/staging only)
- [ ] Browse chefs page works
- [ ] Hoang Gia Pho chef page loads
- [ ] Add to cart functionality
- [ ] Checkout creates Stripe session
- [ ] Payment with test card succeeds
- [ ] Success page shows order ID
- [ ] Admin login requires password (DEMO_MODE=false)
- [ ] Admin dashboard loads
- [ ] Admin live map is protected
- [ ] Chef portal login works
- [ ] Driver app login works
- [ ] Order tracking shows redacted data only
- [ ] Webhook updates order status
- [ ] Integration logs are accessible (admin only)

### Security Verification

- [ ] `DEMO_MODE=false` in production
- [ ] Strong passwords set for all roles
- [ ] Stripe LIVE keys (not test keys)
- [ ] HTTPS enabled everywhere
- [ ] Webhook signature verification working
- [ ] Session secret is random and secure
- [ ] No secrets in client-side code
- [ ] Admin routes require authentication
- [ ] Customer tracking doesn't leak chef addresses
- [ ] Map is admin-only

---

## Monitoring & Maintenance

### Uptime Monitoring

Set up monitoring with:
- **UptimeRobot** (free): Monitor `/api/health` endpoint
- **Pingdom**: 5-minute checks
- **Render/Railway**: Built-in monitoring

### Log Monitoring

**View Logs:**
```bash
# Railway
railway logs

# Render
# View in dashboard

# Heroku
heroku logs --tail
```

**Important Logs to Watch:**
- Payment errors: `Stripe checkout error`
- Webhook failures: `Webhook signature verification failed`
- Authentication issues: `Session verification failed`

### Stripe Dashboard

Monitor in Stripe Dashboard:
- **Payments** → View all transactions
- **Disputes** → Handle chargebacks
- **Webhooks** → Monitor webhook delivery
- **Logs** → Debug API errors

### Regular Maintenance

**Weekly:**
- [ ] Check Stripe webhook delivery success rate
- [ ] Review error logs
- [ ] Test checkout flow
- [ ] Verify uptime monitoring

**Monthly:**
- [ ] Review payment reconciliation
- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Rotate session secret (optional)

**Quarterly:**
- [ ] Review and update passwords
- [ ] Update Node.js version if needed
- [ ] Review Stripe fee structure
- [ ] Backup order data (if using database)

---

## Rollback Procedure

If deployment fails or issues arise:

**Frontend Rollback (GitHub Pages):**
```bash
git checkout main
git reset --hard <previous-commit-sha>
git push --force
```

**Backend Rollback:**

**Railway:**
```bash
railway rollback
```

**Render:**
- Go to dashboard → Deploys
- Click "Rollback" on previous deployment

**Heroku:**
```bash
heroku rollback
```

---

## Common Issues & Solutions

### Issue: "L is not defined" Error
**Cause:** Leaflet CDN not loading  
**Solution:** Check CSP headers, ensure CDN is accessible

### Issue: Webhook Not Receiving Events
**Cause:** Incorrect endpoint URL or signature verification  
**Solution:** 
1. Check Stripe webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Check webhook delivery logs in Stripe

### Issue: DEMO_MODE Still Enabled
**Cause:** Environment variable not set correctly  
**Solution:**
1. Verify `DEMO_MODE=false` in deployment platform
2. Restart server
3. Check `/api/health` response

### Issue: Payment Redirect Fails
**Cause:** Incorrect `APP_BASE_URL`  
**Solution:**
1. Set `APP_BASE_URL` to actual backend URL
2. Update Stripe success/cancel URLs
3. Redeploy

---

## Support & Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Railway Documentation:** https://docs.railway.app
- **Render Documentation:** https://render.com/docs
- **Heroku Documentation:** https://devcenter.heroku.com

For platform-specific issues, open an issue on GitHub.

---

**Last Updated:** 2026-02-09
