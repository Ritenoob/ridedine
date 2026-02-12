const express = require('express');
const router = express.Router();
const simulator = require('../services/simulator');
const revenue = require('../services/revenue');

// Initialize simulator
router.post('/initialize', (req, res) => {
  try {
    simulator.initializeSimulator();
    res.json({ success: true, message: 'Simulator initialized' });
  } catch (error) {
    console.error('Simulator initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize simulator' });
  }
});

// Generate 100 orders
router.post('/generate-orders', (req, res) => {
  try {
    const orders = simulator.generate100Orders();
    simulator.state.orders = orders;
    res.json({ 
      success: true, 
      message: `Generated ${orders.length} orders`,
      orderCount: orders.length
    });
  } catch (error) {
    console.error('Order generation error:', error);
    res.status(500).json({ error: 'Failed to generate orders' });
  }
});

// Start simulator
router.post('/start', (req, res) => {
  try {
    const { speed } = req.body;
    simulator.startSimulator(speed || 1);
    res.json({ success: true, message: 'Simulator started', speed: speed || 1 });
  } catch (error) {
    console.error('Simulator start error:', error);
    res.status(500).json({ error: 'Failed to start simulator' });
  }
});

// Pause simulator
router.post('/pause', (req, res) => {
  try {
    simulator.pauseSimulator();
    res.json({ success: true, message: 'Simulator paused' });
  } catch (error) {
    console.error('Simulator pause error:', error);
    res.status(500).json({ error: 'Failed to pause simulator' });
  }
});

// Reset simulator
router.post('/reset', (req, res) => {
  try {
    simulator.resetSimulator();
    res.json({ success: true, message: 'Simulator reset' });
  } catch (error) {
    console.error('Simulator reset error:', error);
    res.status(500).json({ error: 'Failed to reset simulator' });
  }
});

// Get simulator state
router.get('/state', (req, res) => {
  try {
    const state = simulator.getSimulatorState();
    res.json(state);
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({ error: 'Failed to get simulator state' });
  }
});

// Get specific order
router.get('/orders/:orderId', (req, res) => {
  try {
    const order = simulator.state.orders.find(o => o.id === req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Get all orders (with filters)
router.get('/orders', (req, res) => {
  try {
    let orders = simulator.state.orders;
    
    // Filter by status
    if (req.query.status) {
      orders = orders.filter(o => o.status === req.query.status);
    }
    
    // Filter by store
    if (req.query.storeId) {
      orders = orders.filter(o => o.storeId === req.query.storeId);
    }
    
    // Filter by driver
    if (req.query.driverId) {
      orders = orders.filter(o => o.driverId === req.query.driverId);
    }
    
    res.json({ orders, total: orders.length });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get all drivers
router.get('/drivers', (req, res) => {
  try {
    res.json({ drivers: simulator.state.drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
});

// Get all stores
router.get('/stores', (req, res) => {
  try {
    res.json({ stores: simulator.state.stores });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to get stores' });
  }
});

// Revenue Simulator Endpoints

// Get revenue overview
router.get('/revenue/overview', (req, res) => {
  try {
    const overview = revenue.getRevenueOverview();
    res.json(overview);
  } catch (error) {
    console.error('Revenue overview error:', error);
    res.status(500).json({ error: 'Failed to get revenue overview' });
  }
});

// Get daily revenue
router.get('/revenue/daily', (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const daily = revenue.calculateDailyRevenue(date);
    res.json(daily);
  } catch (error) {
    console.error('Daily revenue error:', error);
    res.status(500).json({ error: 'Failed to calculate daily revenue' });
  }
});

// Get weekly revenue
router.get('/revenue/weekly', (req, res) => {
  try {
    const weekStart = req.query.weekStart ? new Date(req.query.weekStart) : null;
    const weekly = revenue.calculateWeeklyRevenue(weekStart);
    res.json(weekly);
  } catch (error) {
    console.error('Weekly revenue error:', error);
    res.status(500).json({ error: 'Failed to calculate weekly revenue' });
  }
});

// Get monthly revenue
router.get('/revenue/monthly', (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : null;
    const month = req.query.month ? parseInt(req.query.month) - 1 : null; // Convert to 0-indexed
    const monthly = revenue.calculateMonthlyRevenue(year, month);
    res.json(monthly);
  } catch (error) {
    console.error('Monthly revenue error:', error);
    res.status(500).json({ error: 'Failed to calculate monthly revenue' });
  }
});

// Get revenue projection
router.get('/revenue/projection', (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const projection = revenue.projectRevenue(days);
    res.json(projection);
  } catch (error) {
    console.error('Revenue projection error:', error);
    res.status(500).json({ error: 'Failed to calculate revenue projection' });
  }
});

module.exports = router;
