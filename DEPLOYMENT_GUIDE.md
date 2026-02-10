# Remote Demo Server Deployment Guide

This guide covers deploying RideNDine to a remote demo server with DEMO_MODE enabled, making it accessible without passwords.

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

Railway provides the simplest deployment with automatic HTTPS and environment variable management.

**Steps:**

1. **Install Railway CLI** (optional, can also use web interface)
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy via Web Interface** (Easiest)
   - Visit [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the `SeanCFAFinlay/ridendine-demo` repository
   - Railway will auto-detect Node.js and use the `railway.json` config

3. **Set Environment Variables**
   In the Railway dashboard, add these variables:
   ```env
   DEMO_MODE=true
   ADMIN_PASSWORD=demo-admin
   CHEF_PASSWORD=demo-chef
   DRIVER_PASSWORD=demo-driver
   
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   
   SESSION_SECRET=your_random_string_here
   NODE_ENV=production
   PORT=3000
   ```

4. **Get Your URL**
   - Railway will provide a URL like: `https://ridendine-demo-production.up.railway.app`
   - Add this URL to your environment variables as `APP_BASE_URL`

5. **Enable Public Access**
   - In Railway settings, ensure "Public Networking" is enabled
   - Your app will be live at the provided URL

**Cost:** Free tier available with generous limits

---

### Option 2: Render

Render offers a git-based deployment with a free tier.

**Steps:**

1. **Sign up at** [render.com](https://render.com)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `SeanCFAFinlay/ridendine-demo`
   
3. **Configure Build Settings**
   - **Name:** ridendine-demo
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables**
   Click "Advanced" and add:
   ```env
   DEMO_MODE=true
   ADMIN_PASSWORD=demo-admin
   CHEF_PASSWORD=demo-chef
   DRIVER_PASSWORD=demo-driver
   
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   
   APP_BASE_URL=https://your-app-name.onrender.com
   SESSION_SECRET=your_random_string_here
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your app will be live at `https://your-app-name.onrender.com`

**Note:** Render's free tier may spin down after inactivity. First request after downtime takes 30-60 seconds.

**Cost:** Free tier available (with limitations)

---

### Option 3: Heroku

**Steps:**

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create ridendine-demo
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set DEMO_MODE=true
   heroku config:set ADMIN_PASSWORD=demo-admin
   heroku config:set CHEF_PASSWORD=demo-chef
   heroku config:set DRIVER_PASSWORD=demo-driver
   heroku config:set STRIPE_SECRET_KEY=sk_test_your_key
   heroku config:set STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_secret
   heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Open App**
   ```bash
   heroku open
   ```

**Cost:** Free tier discontinued, paid plans start at $5/month

---

## Environment Variables Explained

### Required for Demo Mode

| Variable | Demo Value | Description |
|----------|------------|-------------|
| `DEMO_MODE` | `true` | **CRITICAL** - Bypasses authentication for all roles |
| `ADMIN_PASSWORD` | `demo-admin` | Not used in demo mode, but required |
| `CHEF_PASSWORD` | `demo-chef` | Not used in demo mode, but required |
| `DRIVER_PASSWORD` | `demo-driver` | Not used in demo mode, but required |
| `SESSION_SECRET` | Random string | Used for session encryption |
| `NODE_ENV` | `production` | Sets production mode |

### Stripe Configuration (Optional for Demo)

For demo purposes, you can use test values:

```env
STRIPE_SECRET_KEY=sk_test_demo
STRIPE_PUBLISHABLE_KEY=pk_test_demo
STRIPE_WEBHOOK_SECRET=whsec_demo
```

For real payments, get actual test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).

### Optional Integrations

These can be set to placeholder values for demo:

```env
COOCO_WEBHOOK_SECRET=demo_cooco
MEALBRIDGE_API_KEY=demo_mealbridge
MEALBRIDGE_BASE_URL=https://api.mealbridge.example
```

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] App loads at your deployment URL
- [ ] **DEV BUILD** banner is NOT showing (production mode)
- [ ] **DEMO MODE** indicator IS showing in the header
- [ ] Role switcher allows switching between Customer/Admin/Chef/Driver
- [ ] Admin dashboard loads without login
- [ ] Chef portal loads without login
- [ ] Driver app loads without login
- [ ] Customer pages load (chef listing, cart, etc.)
- [ ] Demo data can be seeded via `/api/demo/seed` endpoint

---

## Testing Your Deployment

1. **Access Landing Page**
   ```
   https://your-app-url/
   ```

2. **Test Admin Dashboard**
   ```
   https://your-app-url/admin
   ```
   Should load directly without login prompt

3. **Test Role Switching**
   - Use the dropdown in the top-right to switch between roles
   - Each role should load its respective dashboard

4. **Seed Demo Data** (Optional)
   Use curl or Postman:
   ```bash
   curl -X POST https://your-app-url/api/demo/seed
   ```

---

## Security Notes

⚠️ **IMPORTANT:** This configuration is for DEMO/DEVELOPMENT ONLY

- `DEMO_MODE=true` **disables all authentication**
- Anyone with the URL can access all features
- Do NOT use this configuration for production
- Do NOT store sensitive real data
- For production, set `DEMO_MODE=false` and use strong passwords

---

## Troubleshooting

### App Not Loading

1. Check deployment logs in your platform dashboard
2. Verify all environment variables are set
3. Ensure `PORT` matches platform requirements (usually 3000 or auto-detected)

### DEMO MODE Not Working

1. Verify `DEMO_MODE=true` (case-sensitive)
2. Check server logs for startup message: "Demo Mode: ENABLED"
3. Restart the app after changing environment variables

### Stripe Errors

If you see Stripe errors but don't need payments:
- Use placeholder values: `sk_test_demo`, `pk_test_demo`, `whsec_demo`
- Or get real test keys from Stripe (free)

### Static Demo Banner Showing

This means the frontend can't reach the backend API. Solutions:
- Ensure backend is deployed and running
- Check `APP_BASE_URL` is set correctly
- Verify CORS settings allow frontend origin

---

## Updating Your Deployment

### Railway
- Push to GitHub, Railway auto-deploys

### Render
- Push to GitHub, Render auto-deploys
- Or click "Manual Deploy" in Render dashboard

### Heroku
```bash
git push heroku main
```

---

## Cost Comparison

| Platform | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Railway** | 500 hrs/month | Easiest setup, auto HTTPS | Credit card required |
| **Render** | 750 hrs/month | No credit card needed | Spins down after inactivity |
| **Heroku** | None | Mature platform | No free tier anymore |

---

## Next Steps

After deploying:

1. Share your demo URL (e.g., `https://ridendine-demo.up.railway.app`)
2. Switch roles using the dropdown to demo different user perspectives
3. Test order flows, payments (with Stripe test mode), and delivery simulation
4. Use the admin simulator to advance orders through their lifecycle

For polishing the UI further, see the main README for customization options.
