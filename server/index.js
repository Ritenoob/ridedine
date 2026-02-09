require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const integrationRoutes = require('./routes/integrations');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/integrations', integrationRoutes);

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
  console.log(`🚀 RideNDine server running on http://localhost:${PORT}`);
  console.log(`📦 Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔒 Authentication: ${process.env.DEMO_MODE === 'true' ? 'BYPASSED' : 'REQUIRED'}`);
});

module.exports = app;
