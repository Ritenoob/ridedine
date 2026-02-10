# Quick Start Guide

Get RideNDine running locally in under 2 minutes!

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- npm (comes with Node.js)

## Setup Steps

### 1. Clone the Repository (if you haven't already)

```bash
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`:
- express (web server)
- dotenv (environment variables)
- cookie-parser (session management)
- express-rate-limit (security)
- stripe (payment processing)

### 3. Create Environment File

```bash
cp .env.example .env
```

The default `.env` file is pre-configured for local development with:
- ✅ `DEMO_MODE=true` (bypasses authentication)
- ✅ Test passwords already set
- ✅ Port 3000 configured
- ✅ Development mode enabled

**You can use it as-is without any changes!**

### 4. Start the Server

```bash
npm run dev
```

You should see:
```
🚀 RideNDine server running on http://localhost:3000
📦 Demo Mode: ENABLED
🔒 Authentication: BYPASSED
```

### 5. Open in Browser

Visit: **http://localhost:3000**

The app should load immediately with:
- 🍽️ Landing page with chef marketplace
- 🎮 "DEMO MODE" badge in header
- 📊 Working navigation

## What You Can Do Now

### Explore Different Portals

With DEMO_MODE enabled, you can access all portals without logging in:

- **Customer Portal**: http://localhost:3000/customer
  - Browse chefs
  - View menus
  - Track orders

- **Admin Dashboard**: http://localhost:3000/admin
  - View metrics
  - Monitor orders
  - Manage operations

- **Chef Portal**: http://localhost:3000/chef-portal/dashboard
  - Manage menu
  - View incoming orders
  - Track preparation

- **Driver App**: http://localhost:3000/driver
  - View available jobs
  - Accept deliveries
  - Navigate routes

### Switch Between Roles

In DEMO MODE, use the role switcher dropdown in the header to instantly switch between:
- 👤 Customer
- 🔐 Admin
- 👨‍🍳 Chef
- 🚗 Driver

## Troubleshooting

### Issue: App shows spinner forever

**Cause**: Server not running or dependencies not installed

**Solution**:
```bash
# 1. Make sure you ran npm install
npm install

# 2. Make sure .env file exists
cp .env.example .env

# 3. Start the server
npm run dev

# 4. Check the server is running
curl http://localhost:3000/api/health
# Should return: {"status":"ok","demoMode":true,...}
```

### Issue: Port 3000 already in use

**Cause**: Another app is using port 3000

**Solution**:
```bash
# Option 1: Change port in .env
echo "PORT=3001" >> .env
npm run dev

# Option 2: Kill process on port 3000
# On Mac/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Cannot find module" errors

**Cause**: Dependencies not installed

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: EACCES permission errors

**Cause**: Permission issues with npm

**Solution**:
```bash
# Don't use sudo! Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install
```

## Next Steps

### Enable Real Authentication (Optional)

To test with real login (not demo mode):

1. Edit `.env`:
   ```bash
   DEMO_MODE=false
   ADMIN_PASSWORD=your_secure_password
   ```

2. Restart server:
   ```bash
   npm run dev
   ```

3. Login at http://localhost:3000/admin/login
   - Username: admin
   - Password: your_secure_password

### Set Up Stripe Payments (Optional)

To test checkout flow:

1. Get test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

2. Add to `.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

3. Test with card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

### Learn More

- Read [README.md](README.md) for full documentation
- Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for deployment
- View [SECURITY.md](SECURITY.md) for security guidelines

## Common Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# View server logs
# Logs appear directly in terminal where you ran npm run dev

# Stop server
# Press Ctrl+C in the terminal
```

## Success Checklist

- [x] Node.js 18+ installed
- [x] Repository cloned
- [x] Dependencies installed (`npm install`)
- [x] Environment file created (`.env`)
- [x] Server running on port 3000
- [x] Browser showing landing page
- [x] DEMO MODE badge visible
- [x] No spinner/loading issues

**You're all set! Happy coding! 🚀**
