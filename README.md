# RideNDine Demo

Home chef delivery platform with integrated routing, payments, and delivery management.

## Overview

RideNDine connects local chefs with customers in Hamilton, Ontario. This platform includes:
- **Customer-facing**: Browse chefs, order meals, track deliveries
- **Chef Portal**: Manage menus, orders, and prep status
- **Driver App**: View jobs, navigate routes, complete deliveries
- **Admin Dashboard**: Operations, payouts, disputes, live map
- **Integrations**: Cooco (incoming orders) and Mealbridge (delivery outsourcing)

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript served from `/docs`
- **Backend**: Node.js/Express API server
- **Payments**: Stripe Checkout integration
- **Maps**: Leaflet.js with OpenStreetMap
- **Deployment**: GitHub Pages (frontend) + server deployment required

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Stripe account (for payment testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# - Add your Stripe keys from https://dashboard.stripe.com/test/apikeys
# - Set DEMO_MODE=true for development (bypasses authentication)
# - Set DEMO_MODE=false for production (requires passwords)
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEMO_MODE` | Enable bypass for protected routes (dev only) | Yes |
| `ADMIN_PASSWORD` | Password for admin access | Yes |
| `CHEF_PASSWORD` | Password for chef portal | Yes |
| `DRIVER_PASSWORD` | Password for driver app | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `APP_BASE_URL` | Base URL for redirects (e.g., http://localhost:3000) | Yes |
| `COOCO_WEBHOOK_SECRET` | Cooco integration webhook secret | No |
| `MEALBRIDGE_API_KEY` | Mealbridge API key | No |
| `MEALBRIDGE_BASE_URL` | Mealbridge API base URL | No |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `PORT` | Server port (default: 3000) | No |

### Running Locally

```bash
# Development mode (auto-reload with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Demo Mode

### Overview

RideNDine includes a **Demo Mode** that allows you to explore the platform without authentication and with simulated live data. This is perfect for:
- Development and testing
- Demonstrations and presentations
- Exploring the full functionality without setting up real accounts
- Testing order workflows end-to-end

### Enabling Demo Mode

Set `DEMO_MODE=true` in your `.env` file:

```env
DEMO_MODE=true
```

When demo mode is enabled, the application will:
- ✅ Bypass password authentication for all roles
- ✅ Display a "DEMO MODE" indicator in the UI
- ✅ Show a role switcher to easily change between roles
- ✅ Provide mock data (customers, chefs, drivers, orders)
- ✅ Simulate live order workflows

### Using Demo Mode

**1. Start the application:**
```bash
npm run dev
```

**2. Navigate to any protected route:**
- Admin Dashboard: `http://localhost:3000/admin`
- Chef Portal: `http://localhost:3000/chef-portal/dashboard`
- Driver Jobs: `http://localhost:3000/driver/jobs`

**3. Use the Role Switcher:**
The purple "DEMO MODE" badge in the top bar indicates demo mode is active. Use the role switcher dropdown to switch between:
- 👤 Customer
- 🔐 Admin
- 👨‍🍳 Chef
- 🚗 Driver

**4. Explore Demo Data:**
Demo mode automatically seeds the system with:
- 8 sample customers
- 4 sample chefs with different specialties
- 4 sample drivers
- 15 sample orders in various states
- Mock payment records

### Demo Mode API Endpoints

When `DEMO_MODE=true`, additional API endpoints become available:

#### Seed Demo Data
```bash
POST /api/demo/seed
```
Populates the system with sample customers, chefs, drivers, and orders.

Response:
```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "stats": {
    "customers": 8,
    "chefs": 4,
    "drivers": 4,
    "orders": 15,
    "payments": 13
  }
}
```

#### Reset Demo Data
```bash
POST /api/demo/reset
```
Clears all demo data back to empty state.

#### Advance Order Lifecycle
```bash
POST /api/demo/advance-order/:orderId
```
Moves an order through its lifecycle states:
`pending` → `paid` → `preparing` → `ready` → `picked_up` → `delivered`

#### Simulate Payment
```bash
POST /api/demo/simulate-payment/:orderId
```
Simulates a successful payment for an order without calling Stripe.

#### Get Orders
```bash
GET /api/demo/orders?status=pending&chefId=chef_2000
```
Retrieves orders with optional filters (status, chefId, driverId, customerId).

#### Get All Demo Data
```bash
GET /api/demo/data
```
Returns all demo data (customers, chefs, drivers, orders, payments).

### Demo Mode Features

#### Admin Dashboard
- View real-time metrics (orders, revenue, active drivers/chefs)
- See order pipeline visualization
- Monitor recent activity
- Advance orders through lifecycle with "Advance" buttons

#### Chef Portal
- View incoming orders in real-time
- Start preparing orders
- Mark orders as ready for pickup
- Track completed orders today

#### Driver App
- View available delivery jobs
- Accept jobs
- Complete deliveries
- Track earnings and statistics

### Disabling Demo Mode

For production or testing real authentication:

**1. Update `.env`:**
```env
DEMO_MODE=false
```

**2. Restart the server:**
```bash
npm start
```

**3. Login with credentials:**
- Admin: Use `ADMIN_PASSWORD` from `.env`
- Chef: Use `CHEF_PASSWORD` from `.env`  
- Driver: Use `DRIVER_PASSWORD` from `.env`

### Security Note

⚠️ **NEVER use `DEMO_MODE=true` in production!**

Demo mode bypasses all authentication and should only be used in development, staging, or demo environments. Always set `DEMO_MODE=false` for production deployments.

### Accessing the Application

**Public Routes** (no authentication required):
- `/` - Landing page
- `/customer` - Customer portal
- `/chefs` - Chef marketplace
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/order/:orderId` - Order tracking

**Protected Routes** (require login unless `DEMO_MODE=true`):
- `/admin` - Admin dashboard
- `/admin/live-map` - Live delivery map
- `/admin/integrations` - Integration logs
- `/chef-portal` - Chef dashboard
- `/driver` - Driver app

### Branch Workflow

This repository uses a three-tier branch strategy to ensure stable releases:

- **`main`**: Production branch
  - Deployed to production environment
  - Only accepts merges from `stable`
  - Must pass all tests and reviews
  
- **`stable`**: Release candidate branch
  - Staging/pre-production environment
  - Feature-complete releases ready for final testing
  - Merges from `dev` after thorough testing
  
- **`dev`**: Active development branch
  - Development/staging environment
  - Shows **DEV BUILD** banner automatically
  - Feature branches merge here first
  - Continuous integration testing

**Development Process:**

1. **Create Feature Branch**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Test Locally**
   - Make changes with `DEMO_MODE=true`
   - Test all affected functionality
   - Run linting and tests

3. **Submit Pull Request**
   - Create PR from feature branch → `dev`
   - Include description of changes
   - Wait for review and CI checks

4. **Test on Dev Deployment**
   - Once merged to `dev`, test on staging environment
   - Verify DEV BUILD banner is visible
   - Perform end-to-end testing

5. **Promote Through Branches**
   ```bash
   # After dev is stable, promote to stable
   git checkout stable
   git merge dev
   git push origin stable
   
   # After stable testing, promote to main
   git checkout main
   git merge stable
   git push origin main
   ```

**DEV BUILD Banner:**
- Automatically shown on `localhost`, `dev`, and `staging` environments
- Hidden on production domains
- Helps identify non-production environments
- Styled with purple gradient banner at top of page

### Testing Stripe Payments

1. Get test API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Add keys to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)
4. Test webhook locally with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Login (admin/chef/driver)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check session

#### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/verify/:sessionId` - Verify payment

#### Orders
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders/:orderId/tracking` - Get redacted tracking info
- `POST /api/orders` - Create order

#### Integrations
- `POST /api/integrations/cooco/orders` - Cooco webhook
- `POST /api/integrations/mealbridge/dispatch` - Dispatch to Mealbridge
- `GET /api/integrations/logs` - View integration logs (admin only)

### Security Notes

- **NEVER commit `.env` file** - it contains secrets
- For production, set `DEMO_MODE=false` to enforce authentication
- Use strong passwords in production
- Keep Stripe keys secure
- Use HTTPS in production
- Regularly rotate `SESSION_SECRET`

### Deployment

📚 **For detailed deployment instructions, see [GITHUB_PAGES_DEPLOYMENT.md](GITHUB_PAGES_DEPLOYMENT.md)**

This application uses a split architecture:
- **Frontend**: Deployed to GitHub Pages (free, automatic)
- **Backend**: Deployed separately to Railway, Render, or Heroku

#### Quick Start - GitHub Pages

1. Enable GitHub Pages in Settings → Pages
2. Select Source: GitHub Actions
3. Push to `main` branch
4. Access at: `https://username.github.io/ridendine-demo/`

The app will work in "static demo mode" without a backend. To enable full functionality (login, payments, etc.), deploy the backend server and configure `docs/config.js` with your backend URL.

For complete setup instructions, troubleshooting, and backend deployment guides, see the [deployment documentation](GITHUB_PAGES_DEPLOYMENT.md).

#### Frontend Configuration for GitHub Pages

The frontend automatically detects the backend API URL using a smart priority system:

**1. Edit `docs/config.js` (Recommended for GitHub Pages):**
```javascript
window.__RIDENDINE_CONFIG__ = {
  // Set to your Railway backend URL for GitHub Pages deployment
  apiBaseUrl: 'https://ridendine-demo-production.up.railway.app'
};
```

**2. Query String Override (Quick Testing):**
Add `?api=https://your-backend-url.com` to any page URL:
```
https://username.github.io/ridendine-demo/?api=https://ridendine-demo-production.up.railway.app
```

**3. localStorage Override (Developer Console):**
```javascript
localStorage.setItem('API_BASE_URL', 'https://ridendine-demo-production.up.railway.app');
```

**4. Same-Origin Default:**
When frontend and backend are served from the same domain (e.g., Railway serves /docs), no configuration is needed.

**Priority Order:**
1. Query string `?api=...` (highest priority)
2. `window.__RIDENDINE_CONFIG__.apiBaseUrl` from config.js
3. localStorage `API_BASE_URL`
4. Same-origin default (empty string)

**Environment Banner:**
A small banner appears in the top-right corner showing:
- Current API base URL
- Demo Mode status (if enabled)

This helps debug deployment issues without opening browser DevTools.

---

#### Detailed Deployment Information

This application requires both frontend and backend deployment.

#### Frontend Deployment (Static SPA)

**GitHub Pages (Automatic):**
The `/docs` folder is automatically served as a static site:
- `main` branch → Production (https://yourusername.github.io/ridendine-demo/)
- Automatic deployment via GitHub Actions
- Works in static demo mode without backend
- Shows STATIC DEMO banner when backend is not configured

**Alternative Static Hosts:**
- **Netlify**: Connect GitHub repo, set build dir to `docs`
- **Vercel**: Deploy static site from `docs` folder
- **Cloudflare Pages**: Deploy from GitHub with `docs` as output

**Configuration:**
- Ensure `index.html` is in `/docs` root
- All pages are loaded dynamically via client-side router
- Edit `docs/config.js` to set backend URL

#### Backend Deployment (Node.js/Express API)

**Recommended Platforms:**

1. **Railway** (Easiest)
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   
   # Add environment variables in Railway dashboard
   ```

2. **Render**
   - Connect GitHub repository
   - Select "Web Service"
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables in Render dashboard

3. **Heroku**
   ```bash
   # Install Heroku CLI
   heroku create ridendine-api
   heroku config:set STRIPE_SECRET_KEY=sk_test_...
   # ... set all environment variables
   git push heroku main
   ```

4. **DigitalOcean App Platform**
   - Connect repository
   - Configure as Node.js app
   - Set environment variables
   - Auto-deploys on git push

**Environment Variables (Production):**
Set these in your deployment platform:
```bash
DEMO_MODE=false                     # Disable bypass in production
ADMIN_PASSWORD=<strong-password>    # Use strong passwords
CHEF_PASSWORD=<strong-password>
DRIVER_PASSWORD=<strong-password>
STRIPE_SECRET_KEY=sk_live_...      # Use live keys in production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_BASE_URL=https://yourdomain.com
SESSION_SECRET=<random-string>      # Generate secure random string
NODE_ENV=production
PORT=3000                           # Or use platform default
```

**Stripe Webhook Setup (Production):**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend-url.com/api/payments/webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**Health Check:**
- Endpoint: `GET /api/health`
- Returns: `{ status: 'ok', demoMode: false, timestamp: '...' }`
- Use for uptime monitoring

#### Connecting Frontend to Backend

Update the frontend to point to your deployed backend:

**For GitHub Pages deployment:**
- Frontend: `https://yourusername.github.io/ridendine-demo/`
- Backend: Set CORS headers in Express to allow frontend origin
- Update API calls in frontend to use backend URL

**For same-domain deployment:**
- Deploy both frontend and backend together
- Serve frontend from Express static middleware
- API routes automatically available at `/api/*`

#### Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] `DEMO_MODE=false` in production
- [ ] Stripe webhook configured and tested
- [ ] HTTPS enabled (required for Stripe and security)
- [ ] Strong passwords set for all roles
- [ ] SESSION_SECRET is random and secure
- [ ] CORS configured properly
- [ ] Health check endpoint responding
- [ ] DEV BUILD banner NOT showing (production only)
- [ ] Test login flows for admin/chef/driver
- [ ] Test Stripe checkout end-to-end
- [ ] Test order tracking
- [ ] Verify map is admin-only
- [ ] Check integration logs accessible

## Additional Documentation

RideNDine includes detailed guides for specific features:

- **[Simulator Guide](SIMULATOR_GUIDE.md)** - Complete guide to the order simulator with 100 orders, stores, drivers, and routing
- **[Payment Demo Guide](PAYMENT_DEMO_GUIDE.md)** - Payment integration with demo mode and Stripe support
- **[Integrations Guide](INTEGRATIONS_GUIDE.md)** - External integrations (Cooco, Hoang Gia Pho, Stripe, Mealbridge)

## Features

### Order Simulator
- Generate 100 realistic orders with full lifecycle
- 5 stores including Hoang Gia Pho (Vietnamese restaurant)
- 10 drivers with real-time routing
- Haversine distance calculation with road factors
- Batch order support
- Adjustable simulation speed (1x, 5x, 20x)
- Complete KPI tracking (on-time %, utilization, etc.)

### Integrations
- **Cooco** - Menu import from meal planning app
- **Hoang Gia Pho** - Featured chef site integration
- **Stripe** - Payment processing with auto demo mode
- **Mealbridge** - Internal dispatch system via simulator

### Payments
- Auto-detection of demo vs live mode
- Mock payments in demo mode (instant success)
- Full Stripe integration for live payments
- Automatic order creation and status updates
- Webhook handling for payment confirmation

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request to `dev` branch

### License

MIT License - see LICENSE file for details

### Support

For issues or questions, please open an issue on GitHub.
