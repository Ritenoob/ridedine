require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Trust Railway/Render/Heroku proxy (Railway always sends X-Forwarded-For)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 8080;

// Robust env parsing
const DEMO_MODE = ['true','1','yes','y','on'].includes(String(process.env.DEMO_MODE || '').toLowerCase());
const DISABLE_RATE_LIMIT = ['true','1','yes','y','on'].includes(String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Rate limiting (SAFE on Railway)
// If disabled, we use a no-op middleware so nothing can crash.
const noop = (req, res, next) => next();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  // This prevents the Railway X-Forwarded-For validation from throwing
  validate: { xForwardedForHeader: false }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false }
});

// Apply limiter to API routes (or noop if disabled)
app.use('/api', DISABLE_RATE_LIMIT ? noop : limiter);

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const integrationRoutes = require('./routes/integrations');
const demoRoutes = require('./routes/demo');
const chefRoutes = require('./routes/chefs');

// API routes
app.use('/api/auth', DISABLE_RATE_LIMIT ? noop : authLimiter, authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/chefs', chefRoutes);

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    demoMode: DEMO_MODE,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    appName: 'RideNDine',
    version: '1.0.0'
  });
});

// Health check (includes raw env so we can verify Railway is injecting vars)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    demoMode: DEMO_MODE,
    demoModeRaw: process.env.DEMO_MODE,
    disableRateLimitRaw: process.env.DISABLE_RATE_LIMIT,
    portRaw: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, '..', 'docs')));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 RideNDine server running on port ${PORT}`);
  console.log(`📦 Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔒 Authentication: ${DEMO_MODE ? 'BYPASSED' : 'REQUIRED'}`);
  console.log(`🧯 Rate limiting: ${DISABLE_RATE_LIMIT ? 'DISABLED' : 'ENABLED'}`);
});

module.exports = app;
