require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ✅ IMPORTANT: Railway runs behind a proxy. This MUST be set before rate-limit.
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT || 3000);

// Robust env parsing - DEMO_MODE is FALSE by default (production-first)
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DISABLE_RATE_LIMIT = ['true', '1', 'yes', 'y', 'on'].includes(String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS: Support environment-based origins for flexible deployment
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.GITHUB_PAGES_ORIGIN;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080'
];

// Add production frontend URL if configured
if (FRONTEND_URL) {
  allowedOrigins.unshift(FRONTEND_URL);
  console.log(`✅ Production CORS enabled: ${FRONTEND_URL}`);
} else {
  console.log('⚠️  Production frontend URL not configured (set FRONTEND_URL env var)');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list (exact match for security)
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure OPTIONS requests are handled properly
app.options('*', cors());
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
const publicRoutes = require('./routes/public');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const integrationRoutes = require('./routes/integrations');
const demoRoutes = require('./routes/demo');
const chefRoutes = require('./routes/chefs');
const simulatorRoutes = require('./routes/simulator');
const adminRoutes = require('./routes/admin');

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      demoMode: DEMO_MODE,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      appName: 'RideNDine',
      version: '1.0.0'
    }
  });
});

// Health check (shows raw env so you can confirm Railway vars are injected)
app.get('/api/health', async (req, res) => {
  const dbConnected = dataService.isDbAvailable();
  res.json({
    success: true,
    data: {
      status: 'ok',
      demoMode: DEMO_MODE,
      database: dbConnected ? 'connected' : 'fallback-to-memory',
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/version', (req, res) => {
  res.json({ 
    success: true, 
    data: { version: 'ed995bd' } 
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
app.use('/api/public', publicRoutes); // Public endpoints (no auth required)
app.use('/api/admin', adminRoutes); // Admin endpoints (requires admin role)
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/simulator', simulatorRoutes);

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, '..', 'docs')));

// Middleware to handle SPA routing - only serve index.html for non-static file requests
// This prevents JS/CSS/image requests from getting index.html instead of 404
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // List of static file extensions that should NOT get the SPA fallback
  const staticExtensions = ['.js', '.css', '.html', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webmanifest', '.map'];
  const isStaticFile = staticExtensions.some(ext => req.path.endsWith(ext));
  
  // If it's a static file request and the file doesn't exist, let it 404
  // Otherwise, serve index.html for SPA routing
  if (isStaticFile) {
    return next();
  }
  
  // This is a route request (no file extension or not a static extension)
  // Serve index.html for client-side routing
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Error handling
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 RideNDine server running on port ${PORT}`);
  console.log(`📦 Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'} (raw=${process.env.DEMO_MODE})`);
  console.log(`🔒 Authentication: ${DEMO_MODE ? 'BYPASSED' : 'REQUIRED'}`);
  console.log(`🧯 Rate limiting: ${DISABLE_RATE_LIMIT ? 'DISABLED' : 'ENABLED'}`);
  
  // Check database connectivity
  await dataService.checkDatabase();
});

module.exports = app;








