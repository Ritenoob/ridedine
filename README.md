# RIDENDINE

**Professional delivery sales tracking dashboard for home cooks and local chefs**

RIDENDINE is a comprehensive delivery management platform connecting local chefs with customers in Hamilton, Ontario. The platform provides real-time order tracking, route optimization, payment processing, and business analytics across multiple user roles.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://seancfafinlay.github.io/ridendine-demo/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Features

### Customer Portal
- Browse local home cooks and their menus
- Real-time order tracking with live map
- Secure checkout with Stripe integration
- Order history and reordering

### Chef Dashboard
- Order management and preparation tracking
- Menu editor with pricing controls
- Revenue analytics and insights
- Real-time order notifications

### Driver Application
- Available job board with route optimization
- Turn-by-turn navigation with Leaflet maps
- Proof of delivery capture
- Earnings tracking

### Admin Operations
- Platform-wide analytics dashboard
- Customer, chef, and driver management
- Dispute resolution and refunds
- Integration logs (Cooco, Mealbridge)
- Live delivery map with real-time tracking
- Order lifecycle simulator

## 🏗️ Architecture

### Frontend
- **Framework:** Vanilla JavaScript (no build step required)
- **Routing:** Custom client-side router with GitHub Pages support
- **Maps:** Leaflet.js with OpenStreetMap
- **Styling:** CSS3 with comprehensive design system
- **Deployment:** GitHub Pages (static hosting)

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Payments:** Stripe Checkout & Webhooks
- **Authentication:** Session-based with cookie storage
- **APIs:** RESTful design with role-based access control

### Deployment Architecture
```
┌─────────────────────────────────────┐
│   GitHub Pages (Frontend)           │
│   https://username.github.io/repo   │
└────────────┬────────────────────────┘
             │
             │ CORS-enabled API calls
             │
┌────────────▼────────────────────────┐
│   Backend Server (Node.js)          │
│   Railway / Render / Heroku         │
│   - API endpoints                   │
│   - Payment processing              │
│   - Session management              │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Stripe account (for payment processing)

### Installation

```bash
# Clone the repository
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

**Core Settings:**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DEMO_MODE` | Enable development mode (bypasses auth) | No | `false` |
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment (development/production) | No | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes (production) | `http://localhost:3000` |

**Authentication (JWT-based):**

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing (64+ chars recommended) | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration | No (default: `24h`) |
| `ADMIN_EMAIL` | Admin email for login | Yes |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password | Yes |

**Legacy Auth (Deprecated):**

| Variable | Description | Notes |
|----------|-------------|-------|
| `ADMIN_PASSWORD` | Plain text admin password | ⚠️ Use `ADMIN_PASSWORD_HASH` instead |
| `CHEF_PASSWORD` | Plain text chef password | ⚠️ Deprecated |
| `DRIVER_PASSWORD` | Plain text driver password | ⚠️ Deprecated |

**Payment Integration:**

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |

**Database:**

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | No (uses in-memory fallback) |

**Other:**

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_BASE_URL` | Application base URL | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `DISABLE_RATE_LIMIT` | Disable rate limiting | No (default: `false`) |

### Generating Secure Passwords

To generate a secure bcrypt password hash for admin login:

```bash
# Generate hash for a password
node scripts/generate-password-hash.js YourSecurePassword123

# Copy the output to your .env file:
# ADMIN_PASSWORD_HASH=$2b$10$...generated_hash...
```

**Important:** Never commit password hashes to version control!

### Running Locally

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 🧪 Development & Production Modes

### Development Mode

For local development and testing, you can enable demo mode:

```bash
# In .env
DEMO_MODE=true
```

**When enabled:**
- ✅ Authentication is bypassed for all roles
- ✅ Sample data is automatically loaded
- ✅ Payment simulation is available
- ⚠️ **NOT FOR PRODUCTION USE**

### Production Mode (Recommended)

For production deployment with secure authentication:

```bash
# In .env
DEMO_MODE=false  # or omit this variable
JWT_SECRET=<your-64-char-random-string>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=<bcrypt-hash-from-generator>
FRONTEND_URL=https://yourdomain.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Generate Password Hash:**
```bash
node scripts/generate-password-hash.js YourSecurePassword
```

### Login Credentials

**Production Mode:**
- Email: (from `ADMIN_EMAIL` env var)
- Password: (the password you used to generate `ADMIN_PASSWORD_HASH`)
- Login URL: `/admin/login`

**Development Mode (DEMO_MODE=true):**
- Any email/password will work
- Or click the demo bypass button on login page

**Driver:**
- Username: driver
- Password: (from `DRIVER_PASSWORD` env var)

## 📦 Deployment

### GitHub Pages (Frontend Only)

The `/docs` directory is automatically deployed to GitHub Pages:

1. Enable GitHub Pages in repository settings
2. Select source: GitHub Actions (or branch: main, folder: /docs)
3. Access at: `https://username.github.io/ridendine-demo/`

**Note:** GitHub Pages deployment runs in standalone mode without backend. For full functionality, deploy the backend separately.

### Backend Deployment

#### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up

# Add environment variables in Railway dashboard
```

#### Option 2: Render

1. Connect your GitHub repository
2. Create a new Web Service
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables
6. Set `GITHUB_PAGES_ORIGIN` to your GitHub Pages URL

#### Option 3: Heroku

```bash
# Create app
heroku create ridendine-api

# Set environment variables
heroku config:set DEMO_MODE=false
heroku config:set STRIPE_SECRET_KEY=sk_live_...
# ... set all required env vars

# Deploy
git push heroku main
```

### Connecting Frontend to Backend

Update `/docs/config.js` with your backend URL:

```javascript
window.__RIDENDINE_CONFIG__ = {
  apiBaseUrl: 'https://your-backend-url.com'
};
```

Or set via environment variable on your backend:

```bash
GITHUB_PAGES_ORIGIN=https://username.github.io
```

## 🧭 Route Structure

### Public Routes
- `/` - Landing page
- `/marketplace` - Browse home cooks
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/order/:orderId` - Order tracking (public)
- `/legal/terms` - Terms of service
- `/legal/privacy` - Privacy policy

### Protected Routes

**Admin** (requires admin role):
- `/admin` - Dashboard
- `/admin/customers` - Customer management
- `/admin/drivers` - Driver management
- `/admin/operations` - Operations panel
- `/admin/payouts` - Financial management
- `/admin/disputes` - Dispute resolution
- `/admin/integrations` - Integration logs
- `/admin/live-map` - Live delivery tracking
- `/admin/driver-simulator` - Order simulator

**Chef** (requires chef role):
- `/chef-portal/dashboard` - Chef dashboard
- `/chef-portal/orders` - Order management
- `/chef-portal/menu` - Menu editor

**Driver** (requires driver role):
- `/driver` - Driver dashboard
- `/driver/jobs` - Available deliveries
- `/driver/navigation/:jobId` - Turn-by-turn navigation
- `/driver/pod/:jobId` - Proof of delivery

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check session status

### Orders
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders/:orderId/tracking` - Public tracking info
- `POST /api/orders` - Create new order

### Payments
- `POST /api/payments/create-checkout-session` - Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/verify/:sessionId` - Verify payment

### Integrations
- `POST /api/integrations/cooco/orders` - Cooco webhook
- `POST /api/integrations/mealbridge/dispatch` - Mealbridge dispatch
- `GET /api/integrations/logs` - Integration logs (admin only)

### Simulator
- `POST /api/demo/seed` - Populate demo data
- `POST /api/demo/reset` - Clear all data
- `POST /api/demo/advance-order/:orderId` - Advance order state
- `GET /api/demo/orders` - Get demo orders

## 🎨 Design System

RIDENDINE uses a comprehensive design system with CSS custom properties:

### Color Tokens
- **Primary:** #ff7a18 (orange)
- **Secondary:** #19b7b1 (teal)
- **Success:** #10b981
- **Warning:** #f59e0b
- **Error:** #ef4444
- **Info:** #3b82f6

### Typography Scale
- Font family: Inter, Segoe UI, system-ui
- Scale: 12px to 36px (xs to 4xl)
- Weights: 400 (normal) to 700 (bold)

### Spacing Scale
Based on 4px grid (4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px)

### Components
- Buttons (primary, secondary, ghost)
- Cards and surfaces
- Forms and inputs
- Tables and lists
- Modals and toasts
- Navigation (sidebar, header, bottom nav)

## 🔒 Security

### Authentication
- Session-based with httpOnly cookies
- 24-hour session expiry
- Timing-safe password comparison
- CSRF protection via same-site cookies

### CORS Configuration
- Whitelist-based origin validation
- Credentials support for cross-origin requests
- Configurable via environment variables

### Rate Limiting
- 100 requests per 15 minutes (general)
- 5 login attempts per 15 minutes
- Skip successful requests for login limiter

### Stripe Integration
- Webhook signature verification
- Test mode for development
- Production keys for live payments

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions
- **[GitHub Pages Setup](GITHUB_PAGES_DEPLOYMENT.md)** - Static site deployment
- **[Payment Integration](PAYMENT_DEMO_GUIDE.md)** - Stripe setup and testing
- **[Simulator Guide](SIMULATOR_GUIDE.md)** - Order simulation features
- **[Integrations](INTEGRATIONS_GUIDE.md)** - External API integrations
- **[Security](SECURITY.md)** - Security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Maps powered by [Leaflet](https://leafletjs.com/) and OpenStreetMap
- Payments by [Stripe](https://stripe.com/)
- Icons from emoji sets

## 📧 Support

For issues, questions, or feature requests, please [open an issue](https://github.com/SeanCFAFinlay/ridendine-demo/issues) on GitHub.

---

**Made with ❤️ for the Hamilton food community**

## 📡 API Documentation

### Authentication Endpoints

**POST /api/auth/login**
- Authenticate user and receive JWT token
- Body: `{ email: string, password: string, role?: string }`
- Response: `{ success: true, data: { token, user, redirect } }`

**POST /api/auth/logout**
- Clear session and logout
- Response: `{ success: true, data: { redirect } }`

**GET /api/auth/session**
- Check current session status
- Response: `{ success: true, data: { authenticated, user, demoMode } }`

### Public Endpoints (No Auth Required)

**GET /api/public/track?orderId=XXX**
- Track order status publicly
- Query params: `orderId` (required)
- Response: `{ success: true, data: { orderId, status, timeline, ... } }`

**GET /api/config**
- Get public app configuration
- Response: `{ demoMode, stripePublishableKey, appName, version }`

**GET /api/health**
- Server health check
- Response: `{ status, demoMode, database, timestamp }`

**GET /api/chefs**
- List all chefs
- Response: Array of chef objects

**GET /api/chefs/:chefId**
- Get chef details
- Response: Chef object with menu items

### Protected Endpoints (Require Auth)

**GET /api/orders**
- List all orders (admin only)
- Headers: `Cookie: sessionId=...` or `Authorization: Bearer <token>`
- Response: `{ orders: [...] }`

**GET /api/orders/:orderId**
- Get order details (admin only)
- Response: Order object

**PATCH /api/orders/:orderId/status**
- Update order status (admin/chef only)
- Body: `{ status: string }`
- Response: `{ success: true, order: {...} }`

**POST /api/payments/create-checkout-session**
- Create Stripe checkout session
- Body: `{ items, customerId, chefId }`
- Response: `{ sessionId, url }`

### Response Format

All endpoints follow a consistent response envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }  // Optional
  }
}
```

### Authentication

The API supports two authentication methods:

1. **JWT Tokens (Recommended):**
   - Include in Authorization header: `Authorization: Bearer <token>`
   - Tokens expire after 24 hours (configurable via `JWT_EXPIRES_IN`)

2. **Session Cookies (Legacy):**
   - Automatically sent with requests when using `credentials: 'include'`

### Rate Limiting

API endpoints are rate-limited to prevent abuse:
- General endpoints: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- Can be disabled with `DISABLE_RATE_LIMIT=true` (dev only)

