# Render + GitHub Pages Implementation Guide

## Overview

This implementation enables RideNDine to work seamlessly on both Render (production backend) and GitHub Pages (static frontend) with proper deep route support, mock payments, and a functional order/driver simulator.

## Key Features Implemented

### 1. Enhanced API Configuration (`docs/config.js`)

The configuration file now includes:

- **Environment Detection**: Automatically detects if running on GitHub Pages or localhost
- **API Base URL**: Sets the correct API endpoint based on environment
  - GitHub Pages: `https://ridendine-demo.onrender.com`
  - Localhost/Render: Same-origin (empty string)
- **`window.apiFetch()`**: Unified fetch wrapper for API calls
  - Handles JSON serialization
  - Manages CORS credentials
  - Provides consistent error handling
- **`window.checkBackendHealth()`**: Health check function to verify backend connectivity

### 2. Payment Utilities (`docs/js/payments.js`)

Comprehensive payment flow helpers:

- **`createCheckoutSession(cart)`**: Creates Stripe checkout session (or mock in demo mode)
- **`createPaymentIntent(cart)`**: Creates payment intent for embedded forms
- **`startMockCheckout(cart)`**: Handles complete mock payment flow
- **`showMockPaymentSuccess(session)`**: Displays success UI with toast notification
- **`verifyPayment(sessionId)`**: Verifies payment status

**Demo Mode Behavior**:
- Returns mock session IDs
- Shows success notifications
- Creates orders immediately
- Redirects to success page

### 3. Order & Driver Simulator (`docs/pages/simulator/index.html`, `docs/js/simulator.js`)

A fully functional, deterministic simulator with:

**Features**:
- ✅ 100 pre-generated orders
- ✅ 10 drivers with random starting positions
- ✅ Speed multiplier: 1x, 2x, 5x, 10x, 50x
- ✅ Nearest-driver assignment algorithm
- ✅ Drivers unavailable while busy
- ✅ Order lifecycle: created → assigned → pickup → delivered
- ✅ Deterministic PRNG (seed: 12345) for reproducible results
- ✅ Real-time statistics and status tracking
- ✅ Live order and driver tables

**How it Works**:
1. Orders are created with random delivery locations (0-100, 0-100)
2. Each tick, available drivers are assigned to pending orders
3. Driver-order distance determines trip duration
4. Orders progress through states automatically
5. Drivers become available after delivery

**Access**: Navigate to `/simulator` in the app

### 4. Deep Route Handling (`server/index.js`)

The Express server now explicitly handles deep routes for SPA:

```javascript
// Customer routes: /, /customer, /marketplace, /chefs, /cart, /checkout, /simulator
// Admin routes: /admin, /admin/*
// Chef portal: /chef-portal, /chef-portal/*
// Driver portal: /driver, /driver/*
```

All routes return `index.html` which then uses the client-side router to load the correct page.

### 5. Navigation Updates

**Landing Page Footer** (`docs/pages/landing.html`):
- Added "📊 Simulator" link
- Added "🍜 Partner: Hoang Gia Pho" external link
- Links to legal pages, GitHub repo

**Routing** (`docs/routes.js`):
- Added `/simulator` route to load simulator page

## Environment Variables

### Required for Production (Render)

```bash
# Demo Mode (bypasses authentication)
DEMO_MODE=true

# Rate Limiting (disable for demo)
DISABLE_RATE_LIMIT=true

# GitHub Pages CORS (optional)
GITHUB_PAGES_ORIGIN=https://seancfafinlay.github.io

# Database (optional - falls back to in-memory)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### For Development (localhost)

```bash
DEMO_MODE=true
DISABLE_RATE_LIMIT=true
PORT=8080
```

## Deployment

### Render Deployment

1. **Build Command**: `npm install`
2. **Start Command**: `node server/index.js`
3. **Environment Variables**: Set `DEMO_MODE=true` and `DISABLE_RATE_LIMIT=true`
4. **Static Files**: Served from `docs/` directory

The server will:
- Serve API endpoints at `/api/*`
- Serve static files from `docs/`
- Handle all SPA routes by returning `index.html`

### GitHub Pages Deployment

1. **Source**: `docs/` directory
2. **Branch**: Main or gh-pages
3. **Configuration**: Already configured in `docs/config.js`

The frontend will:
- Detect GitHub Pages environment
- Use Render backend at `https://ridendine-demo.onrender.com`
- Handle client-side routing with base path `/ridendine-demo`

## API Endpoints

### Health & Config

- `GET /api/health` - Backend health check
  ```json
  {
    "status": "ok",
    "demoMode": true,
    "database": "fallback-to-memory",
    "timestamp": "2026-02-11T21:00:00.000Z"
  }
  ```

- `GET /api/config` - App configuration
  ```json
  {
    "demoMode": true,
    "appName": "RideNDine",
    "version": "1.0.0"
  }
  ```

### Payments (Mock in Demo Mode)

- `POST /api/payments/create-checkout-session`
  ```json
  // Request
  {
    "items": [{"name": "Item", "price": 10, "quantity": 1}],
    "customerInfo": {"email": "test@example.com"},
    "chefId": "chef-1"
  }
  
  // Response
  {
    "sessionId": "demo_session_1234567890",
    "url": "http://localhost:8080/checkout/success.html?session_id=...",
    "orderId": "RD-ABC123",
    "demoMode": true
  }
  ```

- `POST /api/payments/create-intent` - Similar to checkout session, for embedded forms
- `GET /api/payments/verify/:sessionId` - Verify payment status

### Simulator (Backend)

- `POST /api/simulator/initialize` - Initialize simulator
- `POST /api/simulator/generate-orders` - Generate 100 orders
- `POST /api/simulator/start` - Start simulation
- `POST /api/simulator/pause` - Pause simulation
- `POST /api/simulator/reset` - Reset simulation
- `GET /api/simulator/state` - Get current state
- `GET /api/simulator/orders` - Get all orders
- `GET /api/simulator/drivers` - Get all drivers

**Note**: The frontend simulator (`/simulator`) is standalone and doesn't require backend.

## Testing

### Local Testing

1. Start the server:
   ```bash
   DEMO_MODE=true DISABLE_RATE_LIMIT=true PORT=8080 node server/index.js
   ```

2. Open browser to `http://localhost:8080`

3. Test routes:
   - `/` - Landing page
   - `/marketplace` - Browse chefs
   - `/simulator` - Order & driver simulator
   - `/admin` - Admin dashboard (demo mode, no login)
   - `/chef-portal` - Chef portal
   - `/driver` - Driver app

4. Test API:
   ```bash
   curl http://localhost:8080/api/health
   curl http://localhost:8080/api/config
   curl -X POST http://localhost:8080/api/payments/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{"items":[{"name":"Test","price":10,"quantity":1}]}'
   ```

### Verification Checklist

- [ ] Landing page loads
- [ ] Simulator page loads and runs without errors
- [ ] All navigation links work (no 404s)
- [ ] Deep routes load correctly (e.g., `/admin/customers`)
- [ ] API health endpoint returns `status: ok`
- [ ] Mock payment creates orders successfully
- [ ] Simulator can start, pause, reset
- [ ] Speed multiplier changes simulation speed
- [ ] Orders progress through states correctly
- [ ] Drivers become busy/available appropriately

## Architecture

```
ridendine-demo/
├── docs/                       # Frontend (served on both Render & GitHub Pages)
│   ├── config.js              # Environment detection & API config
│   ├── index.html             # SPA entry point
│   ├── routes.js              # Client-side routing
│   ├── js/
│   │   ├── payments.js        # Payment utilities
│   │   └── simulator.js       # Simulator logic
│   └── pages/
│       ├── landing.html       # Landing page
│       ├── simulator/
│       │   └── index.html     # Simulator UI
│       ├── admin/             # Admin pages
│       ├── chef-portal/       # Chef pages
│       └── driver/            # Driver pages
│
├── server/                     # Backend (Render only)
│   ├── index.js               # Express server
│   ├── routes/
│   │   ├── payments.js        # Payment API (mock in demo mode)
│   │   └── simulator.js       # Simulator API
│   └── middleware/
│       └── auth.js            # Auth (bypassed in demo mode)
│
└── package.json               # Dependencies
```

## Security Notes

### Demo Mode

When `DEMO_MODE=true`:
- ✅ Authentication bypassed (all users treated as admin)
- ✅ Payments return mock success immediately
- ✅ No real charges processed
- ⚠️ **NOT for production use**

### CSP (Content Security Policy)

Current policy allows:
- `connect-src`: Self + Render backend
- `script-src`: Self + inline + unpkg.com (for Leaflet)
- `style-src`: Self + inline + unpkg.com

To tighten security, move inline scripts to separate files.

## Troubleshooting

### Issue: "API endpoint not found"

**Solution**: Ensure routes don't conflict. API routes must start with `/api/`.

### Issue: Simulator not loading

**Solution**: Check browser console for errors. Ensure `/js/simulator.js` is loaded.

### Issue: Deep routes return 404

**Solution**: Verify server has explicit route handlers for SPA deep routes.

### Issue: CORS errors from GitHub Pages

**Solution**: Set `GITHUB_PAGES_ORIGIN` environment variable on Render.

## Next Steps for Production

1. **Authentication**: Remove `DEMO_MODE`, implement JWT/session auth
2. **Real Payments**: Configure Stripe keys, remove mock payment logic
3. **Database**: Set up PostgreSQL, remove in-memory fallback
4. **Rate Limiting**: Remove `DISABLE_RATE_LIMIT`, configure appropriate limits
5. **Error Handling**: Add Sentry or similar error tracking
6. **Analytics**: Add Google Analytics or PostHog
7. **Testing**: Add unit tests, integration tests, E2E tests

## Support

For issues or questions:
- Check console logs for errors
- Verify environment variables are set
- Test API endpoints with curl
- Review this guide for configuration steps
