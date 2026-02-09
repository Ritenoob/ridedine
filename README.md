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

This application requires both frontend and backend deployment.

#### Frontend Deployment (Static SPA)

**GitHub Pages (Automatic):**
The `/docs` folder is automatically served as a static site:
- `main` branch → Production (https://yourusername.github.io/ridendine-demo/)
- `dev` branch → Can be configured for staging deployment
- Shows DEV BUILD banner on non-production domains

**Alternative Static Hosts:**
- **Netlify**: Connect GitHub repo, set build dir to `docs`
- **Vercel**: Deploy static site from `docs` folder
- **Cloudflare Pages**: Deploy from GitHub with `docs` as output

**Configuration:**
- Ensure `index.html` is in `/docs` root
- All pages are loaded dynamically via client-side router
- Update `APP_BASE_URL` environment variable for backend

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
