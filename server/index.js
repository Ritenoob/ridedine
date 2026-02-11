require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://seancfafinlay.github.io");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(cors({
  origin: ["https://seancfafinlay.github.io"],
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.options("*", cors());

// ✅ IMPORTANT: Railway runs behind a proxy. This MUST be set before rate-limit.
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT || 8080);

// Robust env parsing
const DEMO_MODE = ['true', '1', 'yes', 'y', 'on'].includes(String(process.env.DEMO_MODE || '').toLowerCase());
const DISABLE_RATE_LIMIT = ['true', '1', 'yes', 'y', 'on'].includes(String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS: allow GitHub Pages and localhost to call this API
// Use environment variable for GitHub Pages origin (makes it portable)
// No default - must be explicitly configured for production
const githubPagesOrigin = process.env.GITHUB_PAGES_ORIGIN;
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:3000"
];

// Only add GitHub Pages origin if explicitly configured
if (githubPagesOrigin) {
  allowedOrigins.unshift(githubPagesOrigin);
  console.log(`✅ GitHub Pages CORS enabled: ${githubPagesOrigin}`);
} else {
  console.log('⚠️  GitHub Pages CORS not configured (set GITHUB_PAGES_ORIGIN env var)');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Use exact matching to prevent malicious origins like evil.com/seancfafinlay.github.io
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting (can be disabled)
if (!DISABLE_RATE_LIMIT) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    // ✅ Stops the Railway X-Forwarded-For validation crash entirely
    validate: { xForwardedForHeader: false }
  });

  app.use('/api/', limiter);
  console.log('✅ Rate limiting: ENABLED');
} else {
  console.log('⚠️ Rate limiting: DISABLED (DISABLE_RATE_LIMIT=true)');
}

// Auth-specific rate limiter (also disabled when DISABLE_RATE_LIMIT is true)
const authLimiter = DISABLE_RATE_LIMIT 
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many login attempts, please try again later.',
      skipSuccessfulRequests: true,
      validate: { xForwardedForHeader: false }
    });

// Import services
const dataService = require('./services/dataService');
const simulationService = require('./services/simulationService');

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const integrationRoutes = require('./routes/integrations');
const demoRoutes = require('./routes/demo');
const chefRoutes = require('./routes/chefs');
const simulatorRoutes = require('./routes/simulator');

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    demoMode: DEMO_MODE,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    appName: 'RideNDine',
    version: '1.0.0'
  });
});

// Health check (shows raw env so you can confirm Railway vars are injected)
app.get('/api/health', async (req, res) => {
  const dbConnected = dataService.isDbAvailable();
  
app.get('/api/version', (req, res) => res.json({ version: 'ed995bd' }));
res.json({
    status: 'ok',
    demoMode: DEMO_MODE,
    demoModeRaw: process.env.DEMO_MODE ?? null,
    disableRateLimitRaw: process.env.DISABLE_RATE_LIMIT ?? null,
    portRaw: process.env.PORT ?? null,
    database: dbConnected ? 'connected' : 'fallback-to-memory',
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  });
});

// New simulation and dashboard endpoints
app.post('/api/simulate', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 100;
    const windowMinutes = parseInt(req.query.windowMinutes) || 360;
    const results = await simulationService.generateSimulation(count, windowMinutes);
    res.json(results);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const metrics = await simulationService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/routes/:id', async (req, res) => {
  try {
    if (!dataService.isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const db = require('./db');
    const result = await db.query('SELECT * FROM routes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Route fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/simulator', simulatorRoutes);

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, '..', 'docs')));

// SPA fallback with specific route handling for deep routes
// This ensures that deep routes like /admin/customers load the correct index.html

// Customer/public routes
app.get([
  '/',
  '/customer',
  '/customer/*',
  '/marketplace',
  '/chefs',
  '/chefs/*',
  '/cart',
  '/checkout',
  '/checkout/*',
  '/order-tracking',
  '/order/*',
  '/legal/*',
  '/simulator',
  '/simulator/*',
], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Admin routes
app.get([
  '/admin',
  '/admin/*',
], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Chef portal routes
app.get([
  '/chef-portal',
  '/chef-portal/*',
], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Driver portal routes
app.get([
  '/driver',
  '/driver/*',
], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Generic SPA fallback for any other routes (non-API)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 RideNDine server running on port ${PORT}`);
  console.log(`📦 Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'} (raw=${process.env.DEMO_MODE})`);
  console.log(`🔒 Authentication: ${DEMO_MODE ? 'BYPASSED' : 'REQUIRED'}`);
  console.log(`🧯 Rate limiting: ${DISABLE_RATE_LIMIT ? 'DISABLED' : 'ENABLED'}`);
  
  // Check database connectivity
  await dataService.checkDatabase();
});

module.exports = app;








