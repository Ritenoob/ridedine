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

- **`main`**: Production branch (deployed to GitHub Pages)
- **`stable`**: Release candidate for testing
- **`dev`**: Active development branch

**Development Process:**
1. Create feature branch from `dev`
2. Make changes and test locally
3. Create PR to merge into `dev`
4. Test on dev deployment
5. Promote `dev` → `stable` → `main` for production

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

#### Frontend (GitHub Pages)
The `/docs` folder is automatically deployed to GitHub Pages from the `main` branch.

#### Backend Server
Deploy the backend to:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/GCP/Azure

Ensure environment variables are set in your deployment platform.

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
