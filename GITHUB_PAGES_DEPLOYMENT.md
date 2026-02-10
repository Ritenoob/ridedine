# GitHub Pages Deployment Guide

## Overview

This guide explains how to deploy the RideNDine application to GitHub Pages. The application uses a split architecture:

- **Frontend (Static SPA)**: Deployed to GitHub Pages
- **Backend (Node.js/Express API)**: Must be deployed separately to a platform like Railway, Render, or Heroku

## Quick Start

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. GitHub will automatically build and deploy using the workflow in `.github/workflows/deploy-pages.yml`

### 2. Access Your Deployed App

After a few minutes, your app will be available at:
```
https://[username].github.io/ridendine-demo/
```

For example: `https://seancfafinlay.github.io/ridendine-demo/`

## Understanding the Deployment

### Static Frontend (GitHub Pages)

GitHub Pages serves the static files from the `/docs` directory:

- ✅ HTML, CSS, JavaScript files
- ✅ Images, icons, and assets
- ✅ Client-side routing (SPA)
- ✅ Leaflet maps
- ❌ Backend API endpoints
- ❌ Database operations
- ❌ Server-side authentication
- ❌ Stripe payment processing

### What Works on GitHub Pages (Without Backend)

When deployed to GitHub Pages without a backend:

1. **Public Pages**: 
   - Landing page (`/`)
   - Customer portal (`/customer`)
   - Chef marketplace (`/chefs`)
   - Browse and view menus
   - Shopping cart (stored in browser)

2. **Static Demo Mode**:
   - App automatically detects GitHub Pages deployment
   - Shows "STATIC DEMO" banner
   - Disables features requiring backend
   - Allows browsing the UI

3. **Limitations**:
   - No authentication (login pages won't work)
   - No order placement or checkout
   - No live data or database
   - No API calls

### What Requires a Backend

These features require deploying the backend server:

- ✅ User authentication (admin, chef, driver login)
- ✅ Order creation and management
- ✅ Stripe payment processing
- ✅ Database operations
- ✅ Demo mode with live data
- ✅ Integration webhooks (Cooco, Mealbridge)

## Deploying the Backend

To enable full functionality, deploy the backend API server to a hosting platform:

### Option 1: Railway (Recommended)

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Set environment variables in Railway dashboard:
   ```
   DEMO_MODE=false
   ADMIN_PASSWORD=<your-password>
   CHEF_PASSWORD=<your-password>
   DRIVER_PASSWORD=<your-password>
   STRIPE_SECRET_KEY=<your-stripe-key>
   STRIPE_PUBLISHABLE_KEY=<your-stripe-key>
   STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
   APP_BASE_URL=https://your-railway-url.railway.app
   SESSION_SECRET=<random-string>
   NODE_ENV=production
   PORT=3000
   ```

4. Note your Railway URL (e.g., `https://ridendine-api.up.railway.app`)

### Option 2: Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: ridendine-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add environment variables (same as above)
6. Click **Create Web Service**
7. Note your Render URL

### Option 3: Heroku

```bash
# Install Heroku CLI
heroku create ridendine-api
heroku config:set DEMO_MODE=false
heroku config:set ADMIN_PASSWORD=<password>
# ... set all other env vars
git push heroku main
```

## Connecting Frontend to Backend

Once your backend is deployed, you need to configure the frontend to use it:

### Method 1: Update config.js (Recommended)

Edit `/docs/config.js` and set your backend URL:

```javascript
window.RideNDineConfig = {
  // Set to your deployed backend URL
  apiBaseUrl: 'https://ridendine-api.railway.app',
  // ...
};
```

Commit and push:
```bash
git add docs/config.js
git commit -m "Configure backend API URL"
git push origin main
```

GitHub Pages will automatically redeploy with the new configuration.

### Method 2: Environment-Specific Configuration

For more advanced setups, you can detect the environment and set different backends:

```javascript
window.RideNDineConfig = {
  apiBaseUrl: (() => {
    const hostname = window.location.hostname;
    
    // Production GitHub Pages
    if (hostname === 'seancfafinlay.github.io') {
      return 'https://ridendine-api.railway.app';
    }
    
    // Staging deployment
    if (hostname.includes('staging')) {
      return 'https://ridendine-staging.railway.app';
    }
    
    // Local development
    return 'http://localhost:3000';
  })(),
};
```

## Testing the Deployment

### 1. Test Frontend Only (Static Demo)

Visit: `https://[username].github.io/ridendine-demo/`

Expected behavior:
- ✅ Landing page loads
- ✅ "STATIC DEMO" banner appears
- ✅ Can browse chefs and menus
- ✅ No login functionality
- ✅ No checkout/payment

### 2. Test Frontend + Backend

After configuring the backend URL:

Visit: `https://[username].github.io/ridendine-demo/admin/login`

Expected behavior:
- ✅ Login page loads
- ✅ Can enter password
- ✅ Redirects to admin dashboard on success
- ✅ All API calls work
- ✅ Demo mode works (if enabled)

### 3. Test Checkout Flow

1. Browse chefs: `https://[username].github.io/ridendine-demo/chefs`
2. Add items to cart
3. Go to checkout: `https://[username].github.io/ridendine-demo/checkout`
4. Complete Stripe payment (use test card: `4242 4242 4242 4242`)
5. Verify redirect back to success page

## Troubleshooting

### Issue: "STATIC DEMO" banner always shows

**Cause**: Backend URL not configured or backend is down

**Solution**:
1. Check `docs/config.js` has correct `apiBaseUrl`
2. Verify backend is running: `curl https://your-backend-url/api/health`
3. Check browser console for errors

### Issue: Login fails with "Backend API not available"

**Cause**: Frontend cannot reach backend

**Solution**:
1. Verify backend URL is correct in `config.js`
2. Check CORS is enabled on backend for your GitHub Pages domain
3. Add to backend `server/index.js`:
   ```javascript
   app.use(cors({
     origin: 'https://seancfafinlay.github.io',
     credentials: true
   }));
   ```

### Issue: Stripe checkout redirects to wrong URL

**Cause**: Backend `APP_BASE_URL` not configured correctly

**Solution**:
1. Set `APP_BASE_URL` environment variable on backend to your GitHub Pages URL:
   ```
   APP_BASE_URL=https://seancfafinlay.github.io/ridendine-demo
   ```
2. Restart backend server

### Issue: Deep links show 404

**Cause**: GitHub Pages doesn't support SPA routing out of the box

**Solution**: The app includes a `404.html` that handles SPA routing. Ensure it's deployed:
1. Check `/docs/404.html` exists
2. Verify it contains the redirect script
3. Test by visiting: `https://[username].github.io/ridendine-demo/admin/dashboard`

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         GitHub Pages (Frontend)         │
│  https://username.github.io/ridendine/  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Static Files (HTML/CSS/JS)     │   │
│  │  - Landing page                 │   │
│  │  - Chef marketplace             │   │
│  │  - Customer portal              │   │
│  │  - Admin/Chef/Driver pages      │   │
│  └─────────────────────────────────┘   │
└───────────────┬─────────────────────────┘
                │
                │ API Calls
                │ (fetch)
                ↓
┌─────────────────────────────────────────┐
│     Backend API Server (Node.js)        │
│   https://ridendine-api.railway.app     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Express API Server             │   │
│  │  - /api/auth/*                  │   │
│  │  - /api/orders/*                │   │
│  │  - /api/payments/*              │   │
│  │  - /api/demo/*                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Services                       │   │
│  │  - Stripe integration           │   │
│  │  - Session management           │   │
│  │  - Data storage                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                │
                │ Webhooks
                ↓
┌─────────────────────────────────────────┐
│      External Services                  │
│  - Stripe (payments)                    │
│  - Cooco (order integration)            │
│  - Mealbridge (delivery)                │
└─────────────────────────────────────────┘
```

## Security Considerations

### GitHub Pages (Public)

- ✅ All files in `/docs` are publicly accessible
- ⚠️ Never commit secrets or API keys to `/docs`
- ✅ Use backend for sensitive operations

### Backend (Private)

- ✅ Keep environment variables secure
- ✅ Use strong passwords
- ✅ Enable HTTPS (required by Stripe)
- ✅ Configure CORS to allow only your frontend domain
- ✅ Rotate `SESSION_SECRET` regularly

## Maintenance

### Updating the Frontend

1. Make changes in `/docs`
2. Commit and push to `main` branch
3. GitHub Actions automatically deploys
4. Changes live in ~1-2 minutes

### Updating the Backend

Depends on your hosting platform:

**Railway**:
```bash
railway up
```

**Render**:
- Automatically deploys on git push

**Heroku**:
```bash
git push heroku main
```

## Cost Estimate

**Note**: Pricing information is subject to change. Please verify current pricing on respective platforms' websites.

- **GitHub Pages**: Free (unlimited for public repos)
- **Backend Hosting** (as of early 2026):
  - Railway: Free tier available (check current limits at railway.app)
  - Render: Free tier available (check current limits at render.com)
  - Heroku: Starting from $5-7/month (check current pricing at heroku.com)
- **Stripe**: No monthly fee, only transaction fees (2.9% + 30¢ per transaction)

## Summary

✅ **Frontend on GitHub Pages**: Free, fast, and easy to deploy
✅ **Backend on Railway/Render**: Free tier available, auto-deploys
✅ **Split Architecture**: Frontend and backend deployed separately
✅ **Configuration**: Use `config.js` to connect them
✅ **Demo Mode**: Works without backend for showcasing UI

For questions or issues, open an issue on GitHub.
