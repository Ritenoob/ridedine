const express = require('express');
const router = express.Router();
const demoData = require('../services/demoData');

// Middleware to ensure demo mode is enabled
function requireDemoMode(req, res, next) {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(403).json({ 
      error: 'Demo endpoints are only available when DEMO_MODE is enabled' 
    });
  }
  next();
}

// Apply demo mode check to all routes
router.use(requireDemoMode);

// Reset demo data
router.post('/reset', (req, res) => {
  try {
    const result = demoData.resetDemoData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed demo data
router.post('/seed', (req, res) => {
  try {
    const result = demoData.seedDemoData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advance order lifecycle
router.post('/advance-order/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const result = demoData.advanceOrder(orderId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Simulate payment
router.post('/simulate-payment/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const result = demoData.simulatePayment(orderId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all demo data (for admin/debugging)
router.get('/data', (req, res) => {
  try {
    const data = demoData.getAllDemoData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders with filters
router.get('/orders', (req, res) => {
  try {
    const { status, chefId, driverId, customerId } = req.query;
    const orders = demoData.getOrders({ status, chefId, driverId, customerId });
    res.json({ orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/orders/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = demoData.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
