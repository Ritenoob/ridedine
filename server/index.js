require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    demoMode: DEMO_MODE,
    demoModeRaw: process.env.DEMO_MODE ?? null,
    disableRateLimitRaw: process.env.DISABLE_RATE_LIMIT ?? null,
    portRaw: process.env.PORT ?? null,
    timestamp: new Date().toISOString()
  });
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

// SPA fallback
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

app.listen(PORT, () => {
  console.log(`🚀 RideNDine server running on port ${PORT}`);
  console.log(`📦 Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'} (raw=${process.env.DEMO_MODE})`);
  console.log(`🔒 Authentication: ${DEMO_MODE ? 'BYPASSED' : 'REQUIRED'}`);
  console.log(`🧯 Rate limiting: ${DISABLE_RATE_LIMIT ? 'DISABLED' : 'ENABLED'}`);
});

module.exports = app;

