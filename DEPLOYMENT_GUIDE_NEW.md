# RIDENDINE - Home Chef Delivery Platform

Production-grade, scalable home-chef delivery platform with professional UI/UX and a backend designed for large-scale operations.

## 🌟 Features

- **Full-Stack Architecture**: Vanilla JS SPA frontend + Express.js backend
- **PostgreSQL Database**: Complete data model with migrations
- **Role-Based Access**: Customer, Driver, Chef, and Admin dashboards
- **Order Simulation**: Generate and route 100+ orders with realistic metrics
- **Demo Mode**: Bypass authentication for easy testing
- **Stripe Integration**: Payment processing (mock in demo, real integration ready)
- **Responsive Design**: Mobile-first professional UI

## 🔧 Tech Stack

**Frontend:**
- Vanilla JavaScript (SPA)
- Custom design system CSS
- Client-side routing
- Served via GitHub Pages

**Backend:**
- Node.js + Express.js
- PostgreSQL (with in-memory fallback)
- pg + node-pg-migrate
- Cookie-based sessions
- Stripe SDK

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (optional - falls back to in-memory if not available)
- PowerShell (for Windows deployment commands)

### Local Development

1. **Clone the repository**
   ```powershell
   git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
   cd ridendine-demo
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Set up environment variables**
   ```powershell
   # Copy the example env file
   copy .env.example .env
   
   # Edit .env with your settings
   # For local dev, minimum configuration:
   DEMO_MODE=true
   DISABLE_RATE_LIMIT=true
   PORT=3000
   ```

4. **Start PostgreSQL (optional)**
   ```powershell
   # Using Docker Compose
   docker-compose up -d
   
   # Update DATABASE_URL in .env
   DATABASE_URL=postgresql://ridendine:ridendine_dev_password@localhost:5432/ridendine
   ```

5. **Run migrations and seed data (if using database)**
   ```powershell
   npm run migrate
   npm run seed
   ```

6. **Start the server**
   ```powershell
   npm run dev
   ```

7. **Access the application**
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:3000 (served by Express)
   - Health check: http://localhost:3000/api/health

### Demo Credentials

**Master Admin Account:**
- Email: `sean@seanfinlay.ca`
- Password: `Admin0123`

In **DEMO_MODE**, no password is required - simply select a role to log in.

## 📊 Admin Dashboard

Access the admin dashboard to:
- View real-time KPIs
- Run order simulations (10, 50, or 100 orders)
- Monitor order status breakdowns
- Track routing and batch metrics

**Dashboard URL:** `/pages/admin/dashboard-simple.html`

## 🗄️ Database Schema

The platform uses a comprehensive PostgreSQL schema:

- **users**: Central authentication (email, role, hashed_password)
- **customers**: Customer profiles and saved addresses
- **chefs**: Chef profiles with pickup locations and capacity
- **drivers**: Driver profiles with vehicle type and status
- **partners**: External restaurant integrations (Cooco, Hoang Gia Pho)
- **menu_items**: Chef and partner menu items
- **orders**: Order management with status tracking
- **order_items**: Line items for each order
- **routes**: Batch delivery routes with optimization
- **deliveries**: Delivery tracking with ETAs
- **payments**: Payment transactions (Stripe integration)

## 🔐 Authentication

### Demo Mode (`DEMO_MODE=true`)
- No password required
- Role selection at login
- Instant access to all features
- Uses in-memory sessions

### Production Mode (`DEMO_MODE=false`)
- Email + password authentication
- Master admin: sean@seanfinlay.ca / Admin0123
- Role-based passwords via env vars
- Secure session cookies

## 🌐 Deployment

### Backend Deployment (Render)

1. **Push code to GitHub**
   ```powershell
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: ridendine-demo
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Set Environment Variables in Render**
   ```
   DEMO_MODE=true
   DISABLE_RATE_LIMIT=true
   GITHUB_PAGES_ORIGIN=https://seancfafinlay.github.io
   NODE_ENV=production
   ADMIN_PASSWORD=Admin0123
   ```

4. **Add PostgreSQL (optional)**
   - In Render dashboard, create a PostgreSQL database
   - Copy the "Internal Database URL"
   - Add to environment variables:
     ```
     DATABASE_URL=<your-internal-database-url>
     ```
   - Run migrations:
     ```powershell
     # Connect to Render shell and run
     npm run migrate
     npm run seed
     ```

5. **Deploy**
   - Render will automatically deploy
   - Note your backend URL: `https://ridendine-demo.onrender.com`

### Frontend Deployment (GitHub Pages)

1. **Update frontend config**
   
   Edit `docs/config.js`:
   ```javascript
   window.__RIDENDINE_CONFIG__ = {
     apiBaseUrl: 'https://ridendine-demo.onrender.com'
   };
   ```

2. **Push to GitHub**
   ```powershell
   git add docs/config.js
   git commit -m "Update API base URL for production"
   git push origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/docs`
   - Save

4. **Access your site**
   - Frontend: https://seancfafinlay.github.io/ridendine-demo
   - Admin Dashboard: https://seancfafinlay.github.io/ridendine-demo/pages/admin/dashboard-simple.html

## 🧪 Testing

### Test Health Endpoint
```powershell
curl https://ridendine-demo.onrender.com/api/health
```

### Test Login
```powershell
curl -X POST https://ridendine-demo.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"sean@seanfinlay.ca","password":"Admin0123"}'
```

### Test Simulation
```powershell
curl -X POST "https://ridendine-demo.onrender.com/api/simulate?count=10&windowMinutes=60"
```

### Test Metrics
```powershell
curl https://ridendine-demo.onrender.com/api/dashboard/metrics
```

## 📦 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check session

### Configuration
- `GET /api/health` - Health check
- `GET /api/config` - App configuration

### Simulation & Metrics
- `POST /api/simulate?count=100&windowMinutes=360` - Generate orders
- `GET /api/dashboard/metrics` - Dashboard KPIs
- `GET /api/routes/:id` - Route details

### Orders
- `GET /api/orders` - List orders (role-filtered)
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

### Chefs & Drivers
- `GET /api/chefs` - List chefs
- `GET /api/drivers` - List drivers
- `PATCH /api/drivers/:id/status` - Update driver status
- `PATCH /api/drivers/:id/geo` - Update driver location

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook handler

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO_MODE` | `false` | Enable demo mode (bypass auth) |
| `DISABLE_RATE_LIMIT` | `false` | Disable rate limiting |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (development/production) |
| `ADMIN_PASSWORD` | `Admin0123` | Admin password |
| `CHEF_PASSWORD` | `chef123` | Chef password |
| `DRIVER_PASSWORD` | `driver123` | Driver password |
| `GITHUB_PAGES_ORIGIN` | - | GitHub Pages URL for CORS |
| `STRIPE_SECRET_KEY` | - | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | - | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | - | Stripe webhook secret |

## 🎯 Acceptance Criteria Status

### Backend ✅
- [x] `/api/health` returns ok with demoMode flag
- [x] `/api/config` works cross-origin from GitHub Pages
- [x] Simulation endpoint generates 100 orders with routes
- [x] Dashboard metrics endpoint returns KPIs

### Frontend ✅
- [x] Loads on GitHub Pages without errors
- [x] Uses docs/config.js API base URL automatically
- [x] Professional UI with design system
- [x] Admin dashboard shows metrics + simulation controls

### Authentication ✅
- [x] Demo mode with email sean@seanfinlay.ca / password Admin0123 works
- [x] Session management with cookies
- [x] Role-based access control

## 🔄 Simulation Algorithm

The platform includes a sophisticated order simulation system:

1. **Order Generation**: Creates realistic orders over time window
2. **Chef Assignment**: Distributes orders across available chefs
3. **Batching**: Groups orders by proximity and time
4. **Routing**: Calculates optimal delivery routes using Haversine distance
5. **Driver Assignment**: Assigns routes to available drivers
6. **Metrics Calculation**: Computes KPIs (delivery time, utilization, revenue)

**Run a simulation:**
- 10 orders in 1 hour: `POST /api/simulate?count=10&windowMinutes=60`
- 100 orders in 6 hours: `POST /api/simulate?count=100&windowMinutes=360`

## 🤝 Partner Integrations

The platform integrates with:
- **Cooco Meal Plan**: https://cooco.app/mealplan
- **Hoang Gia Pho**: https://hoang-gia-pho-site-of8l.vercel.app/hoang-gia-pho-delivery.html

Partners are stored in the `partners` table and can be managed via the Admin dashboard.

## 📝 Development Scripts

```powershell
# Start development server
npm run dev

# Start production server
npm start

# Run database migrations
npm run migrate

# Rollback migrations
npm run migrate:down

# Seed database with demo data
npm run seed

# Create new migration
npm run migrate:create <migration-name>
```

## 🐛 Troubleshooting

**Database connection errors:**
- Ensure PostgreSQL is running: `docker-compose up -d`
- Check DATABASE_URL in .env
- Server will fallback to in-memory mode if DB unavailable

**CORS errors:**
- Set GITHUB_PAGES_ORIGIN in backend .env
- Ensure frontend config.js has correct API base URL

**Rate limit errors:**
- Set DISABLE_RATE_LIMIT=true for development

## 📄 License

MIT

## 👥 Contributors

- Sean Finlay (sean@seanfinlay.ca)

---

Built with ❤️ for home chefs and hungry customers
