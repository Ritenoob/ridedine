const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// In-memory order storage (shared with payments)
const orders = new Map();

// Order status progression
const STATUS_FLOW = {
  'pending': 'confirmed',
  'confirmed': 'preparing',
  'preparing': 'ready',
  'ready': 'driver_assigned',
  'driver_assigned': 'driver_en_route_pickup',
  'driver_en_route_pickup': 'picked_up',
  'picked_up': 'driver_en_route_delivery',
  'driver_en_route_delivery': 'delivered'
};

// Get order details (admin only)
router.get('/:orderId', requireAuth, (req, res) => {
  const order = Array.from(orders.values()).find(o => o.orderId === req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

// Get redacted tracking info (public endpoint)
router.get('/:orderId/tracking', (req, res) => {
  const order = Array.from(orders.values()).find(o => o.orderId === req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Calculate customer-friendly status and ETA
  let customerStatus = 'Order received';
  let driverStatus = null;
  let etaMinutes = null;

  switch (order.status) {
    case 'pending':
      customerStatus = 'Order received';
      etaMinutes = '45-60';
      break;
    case 'confirmed':
      customerStatus = 'Order confirmed';
      etaMinutes = '40-50';
      break;
    case 'preparing':
      customerStatus = 'Being prepared';
      etaMinutes = '30-40';
      break;
    case 'ready':
      customerStatus = 'Ready for pickup';
      etaMinutes = '20-30';
      break;
    case 'driver_assigned':
      customerStatus = 'Driver assigned';
      driverStatus = 'Driver en route to pickup';
      etaMinutes = '22-28';
      break;
    case 'driver_en_route_pickup':
      customerStatus = 'Driver picking up';
      driverStatus = 'Driver at chef location';
      etaMinutes = '18-25';
      break;
    case 'picked_up':
      customerStatus = 'Out for delivery';
      driverStatus = 'Driver en route to you';
      etaMinutes = '15-20';
      break;
    case 'driver_en_route_delivery':
      customerStatus = 'Out for delivery';
      driverStatus = 'Driver nearby';
      etaMinutes = '5-10';
      break;
    case 'delivered':
      customerStatus = 'Delivered';
      driverStatus = 'Delivered';
      etaMinutes = '0';
      break;
  }

  // Redacted tracking response - NO chef address or precise coordinates
  res.json({
    orderId: order.orderId,
    status: customerStatus,
    driverStatus,
    etaMinutes,
    estimatedDelivery: order.deliveryWindow || 'Today, 5:00-6:00 PM',
    pickupArea: 'Local chef kitchen', // Generic label
    createdAt: order.createdAt,
    // NO chef address, NO coordinates, NO internal routing data
  });
});

// Create order
router.post('/', async (req, res) => {
  try {
    const { items, chefId, chefSlug, customerInfo } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const orderId = `RD-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    const order = {
      orderId,
      items,
      chefId: chefId || 'unknown',
      chefSlug: chefSlug || 'unknown',
      customerInfo: customerInfo || {},
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      total,
      deliveryWindow: 'Today, 5:00-6:00 PM',
      etaMinutes: 45
    };

    orders.set(orderId, order);

    res.json({ 
      success: true, 
      orderId,
      order 
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (admin/chef only)
router.patch('/:orderId/status', requireAuth, (req, res) => {
  const order = Array.from(orders.values()).find(o => o.orderId === req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  res.json({ success: true, order });
});

// List all orders (admin only)
router.get('/', requireAuth, (req, res) => {
  const ordersList = Array.from(orders.values());
  res.json({ orders: ordersList });
});

module.exports = router;
