# Quick Start Guide - Production Order Tracking System

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Node.js 18+
- PostgreSQL (optional - works without DB too)
- Git

### 1. Clone and Install
```bash
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo
npm install
```

### 2. Environment Setup

Create `.env` file:
```bash
# For production with database
DATABASE_URL=postgresql://user:password@localhost:5432/ridendine
JWT_SECRET=your-64-character-random-string-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2a$10$YourBcryptHashHere

# For development without database (in-memory)
DEMO_MODE=true
PORT=3000
```

### 3. Run Database Migration (if using database)
```bash
npm run migrate
```

### 4. Start the Server
```bash
npm start
```

Server runs on `http://localhost:3000`

## 📋 Test the Complete Flow

### Customer Flow
1. **Browse & Add to Cart**
   - Visit `http://localhost:3000/chefs`
   - Click on a chef
   - Add items to cart

2. **Checkout**
   - Go to cart → Checkout
   - Enter your name and email
   - Complete order
   - **Save the Order ID and Tracking Token!**

3. **Track Order**
   - Visit `http://localhost:3000/track`
   - Enter Order ID and Tracking Token
   - Watch status update in real-time (15s polling)

### Admin Flow
1. **Login to Admin**
   - Visit `http://localhost:3000/admin`
   - Login with admin credentials (if DEMO_MODE=false)
   - OR automatically logged in if DEMO_MODE=true

2. **Manage Orders**
   - Go to `Orders` tab
   - See all customer orders
   - Click "Update" on any order
   - Change status (e.g., CREATED → PREPARING)
   - Status updates reflect on customer tracking page

## 🧪 API Testing with curl

### Create an Order
```bash
curl -X POST http://localhost:3000/api/public/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "items": [
      {
        "name": "Pizza",
        "price": 15.99,
        "quantity": 1
      }
    ],
    "totalAmount": "15.99"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "orderId": "order_1234567890",
    "trackingToken": "abc123...",
    "status": "CREATED",
    "createdAt": "2026-02-12T00:00:00.000Z"
  }
}
```

### Track Order
```bash
curl "http://localhost:3000/api/public/track?orderId=order_1234567890&token=abc123..."
```

Response:
```json
{
  "success": true,
  "data": {
    "orderId": "order_1234567890",
    "status": "CREATED",
    "eta": "45-60 minutes",
    "total": "15.99",
    "lastUpdated": "2026-02-12T00:00:00.000Z"
  }
}
```

### Update Order Status (Admin - DEMO_MODE only)
```bash
curl -X PATCH http://localhost:3000/api/admin/orders/order_1234567890/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "order_1234567890",
    "status": "PREPARING",
    "updated_at": "2026-02-12T00:05:00.000Z"
  }
}
```

## 🎯 Key Features to Test

### Order Tracking
- ✅ Secure token-based tracking
- ✅ Real-time status updates (15s polling)
- ✅ Visual timeline showing progress
- ✅ ETA updates based on status
- ✅ Stops polling when delivered

### Admin Management
- ✅ List all orders
- ✅ Filter by status
- ✅ Update status with modal
- ✅ Auto-refresh every 30s
- ✅ Real-time updates

### Security
- ✅ Tracking requires both ID and token
- ✅ Admin routes protected (when DEMO_MODE=false)
- ✅ Invalid tokens return 403
- ✅ Rate limiting on API endpoints

## 🐛 Troubleshooting

### "Database not available"
- **Solution**: This is normal if DATABASE_URL is not set. The app uses in-memory storage.
- To use database: Set DATABASE_URL and run `npm run migrate`

### "Authentication required" on admin routes
- **Solution**: Either:
  1. Set `DEMO_MODE=true` in `.env` for development
  2. OR configure proper JWT_SECRET and admin credentials

### CORS errors
- **Solution**: Set `FRONTEND_URL` or `GITHUB_PAGES_ORIGIN` in `.env`

### Port already in use
- **Solution**: Change `PORT=3001` in `.env` or kill existing process

## 🚢 Deploy to Production

### Render (Backend)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables:
   ```
   DATABASE_URL=<postgres connection string>
   JWT_SECRET=<64+ char random string>
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD_HASH=<bcrypt hash>
   FRONTEND_URL=https://yourusername.github.io
   NODE_ENV=production
   ```
4. Deploy!

### GitHub Pages (Frontend)
1. Update `/docs/config.js` with your Render backend URL
2. Push to GitHub
3. Enable GitHub Pages on main branch, `/docs` folder
4. Access at `https://yourusername.github.io/ridendine-demo`

## 📚 Documentation
- See `IMPLEMENTATION_FINAL.md` for complete technical documentation
- See `ENVIRONMENT_VARIABLES.md` for all environment variables
- See `README.md` for project overview

## 🎉 That's It!
You now have a fully functional production-ready order tracking system!
