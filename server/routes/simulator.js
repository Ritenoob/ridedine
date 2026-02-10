const express = require('express');
const router = express.Router();
const simulator = require('../services/simulator');

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

module.exports = router;
