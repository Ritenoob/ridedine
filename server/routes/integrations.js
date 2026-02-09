const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// In-memory integration logs
const integrationLogs = [];

function logIntegration(source, event, data) {
  integrationLogs.push({
    id: integrationLogs.length + 1,
    source,
    event,
    data,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 100 logs
  if (integrationLogs.length > 100) {
    integrationLogs.shift();
  }
}

// Cooco incoming orders webhook
router.post('/cooco/orders', async (req, res) => {
  try {
    const signature = req.headers['x-cooco-signature'];
    
    // Verify signature if secret is configured
    if (process.env.COOCO_WEBHOOK_SECRET) {
      // TODO: Implement signature verification
      if (!signature) {
        logIntegration('cooco', 'order_rejected', { reason: 'Missing signature' });
        return res.status(401).json({ error: 'Missing signature' });
      }
    }

    const orderData = req.body;
    
    logIntegration('cooco', 'order_received', orderData);
    
    // Create internal order
    const orderId = `RD-${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    // TODO: Create order in system
    console.log(`📦 Cooco order received: ${orderId}`, orderData);
    
    res.json({ 
      success: true, 
      orderId,
      message: 'Order received from Cooco' 
    });
  } catch (error) {
    console.error('Cooco webhook error:', error);
    logIntegration('cooco', 'webhook_error', { error: error.message });
    res.status(500).json({ error: 'Failed to process Cooco order' });
  }
});

// Mealbridge dispatch endpoint
router.post('/mealbridge/dispatch', requireAuth, async (req, res) => {
  try {
    const { orderId, pickupChefId, deliveryWindow, instructions } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Mock Mealbridge API call
    const dispatchData = {
      orderId,
      pickupChefId,
      deliveryWindow,
      instructions,
      pickupArea: 'Local chef kitchen', // Redacted
      // NO chef address in dispatch
    };

    logIntegration('mealbridge', 'dispatch_requested', dispatchData);

    // Simulate API call
    const mockResponse = {
      success: true,
      dispatchId: `MB-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'assigned',
      estimatedPickup: '15-20 minutes'
    };

    console.log(`🚗 Mealbridge dispatch created:`, mockResponse);
    
    logIntegration('mealbridge', 'dispatch_success', mockResponse);

    res.json(mockResponse);
  } catch (error) {
    console.error('Mealbridge dispatch error:', error);
    logIntegration('mealbridge', 'dispatch_error', { error: error.message });
    res.status(500).json({ error: 'Failed to dispatch to Mealbridge' });
  }
});

// Get integration logs (admin only)
router.get('/logs', requireAuth, requireRole('admin'), (req, res) => {
  const { source, limit = 50 } = req.query;
  
  let logs = integrationLogs;
  
  if (source) {
    logs = logs.filter(log => log.source === source);
  }
  
  // Return most recent logs first
  const recentLogs = logs.slice(-limit).reverse();
  
  res.json({ 
    logs: recentLogs,
    total: logs.length 
  });
});

module.exports = router;
