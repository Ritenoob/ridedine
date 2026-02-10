require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Trust Railway/Render/Heroku proxy (needed for rate limiting + secure cookies)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/', limiter); // Apply rate limiting to all API routes

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const integrationRoutes = require('./routes/integrations');
const demoRoutes = require('./routes/demo');
const chefRoutes = require('./routes/chefs');

// API routes
app.use('/api/auth', authLimiter, authRoutes); // Stricter rate limit for auth
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/demo', demoRoutes); // Demo mode endpoints
app.use('/api/chefs', chefRoutes); // Chef data endpoints

// Config endpoint - exposes public configuration to frontend
app.get('/api/config', (req, res) => {
  res.json({
    demoMode: process.env.DEMO_MODE === 'true',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    appName: 'RideNDine',
    version: '1.0.0'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    demoMode: process.env.DEMO_MODE === 'true',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, '..', 'docs')));

// SPA fallback - serve index.html for unmatched routes
app.get('*', (req, res) => {
  // Don't send index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`ðŸš€ RideNDine server running on http://localhost:${PORT}`);
  console.log(`ðŸ“¦ Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log(`ðŸ”’ Authentication: ${process.env.DEMO_MODE === 'true' ? 'BYPASSED' : 'REQUIRED'}`);
});

module.exports = app;


