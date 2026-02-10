const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const orderService = require('../services/orders');
const demoData = require('../services/demoData');

// Check if demo mode is enabled
const isDemoMode = () => process.env.DEMO_MODE === 'true';

// Order status progression
const STATUS_FLOW = {
  'pending': 'paid',
  'paid': 'preparing',
  'preparing': 'ready',
  'ready': 'picked_up',
  'picked_up': 'on_route',
  'on_route': 'delivered'
};

// Get order details (admin only)
router.get('/:orderId', requireAuth, (req, res) => {
  const order = isDemoMode() ? 
    demoData.getOrder(req.params.orderId) : 
    orderService.getOrder(req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

// Get redacted tracking info (public endpoint)
router.get('/:orderId/tracking', (req, res) => {
  const order = isDemoMode() ? 
    demoData.getOrder(req.params.orderId) : 
    orderService.getOrder(req.params.orderId);
  
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
    case 'paid':
      customerStatus = 'Payment confirmed';
      etaMinutes = '40-50';
      break;
    case 'preparing':
      customerStatus = 'Being prepared';
      etaMinutes = '30-40';
      break;
    case 'ready':
      customerStatus = 'Ready for pickup';
      etaMinutes = '20-30';
      driverStatus = 'Driver assigned';
      break;
    case 'picked_up':
      customerStatus = 'Picked up by driver';
      driverStatus = 'Driver has your order';
      etaMinutes = '15-25';
      break;
    case 'on_route':
      customerStatus = 'Out for delivery';
      driverStatus = 'Driver en route to you';
      etaMinutes = '5-15';
      break;
    case 'delivered':
      customerStatus = 'Delivered';
      driverStatus = 'Delivered';
      etaMinutes = '0';
      break;
    default:
      customerStatus = 'Processing';
      etaMinutes = '45-60';
  }

  // Redacted tracking response - NO chef address or precise coordinates
  res.json({
    orderId: order.id || order.orderId,
    status: order.status,
    customerStatus,
    driverStatus,
    etaMinutes,
    estimatedDelivery: order.estimatedDelivery || order.deliveryWindow || 'Today, 5:00-6:00 PM',
    pickupArea: 'Local chef kitchen', // Generic label
    createdAt: order.createdAt,
    items: order.items,
    total: order.total,
    // NO chef address, NO coordinates, NO internal routing data
  });
});

// Create order
router.post('/', async (req, res) => {
  try {
    const { items, chefId, customerInfo, deliveryAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const total = items.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0).toFixed(2);
    const prepTime = items.reduce((sum, item) => sum + (item.prepTime || 15), 0);

    if (isDemoMode()) {
      // Use demo data service
      const order = demoData.createOrder({
        customerId: customerInfo?.id || 'customer_1000',
        chefId: chefId || 'chef_2000',
        items,
        total,
        deliveryAddress: deliveryAddress || customerInfo?.address || '123 Main St',
        prepTime
      });

      res.json({ 
        success: true, 
        orderId: order.id,
        order 
      });
    } else {
      // Use regular order service
      const order = orderService.createOrder({
        items,
        chefId: chefId || 'unknown',
        customerInfo: customerInfo || {},
        status: 'pending',
        paymentStatus: 'pending',
        total,
        deliveryWindow: 'Today, 5:00-6:00 PM',
        etaMinutes: 45
      });

      res.json({ 
        success: true, 
        orderId: order.orderId,
        order 
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (admin/chef only)
router.patch('/:orderId/status', requireAuth, (req, res) => {
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  if (isDemoMode()) {
    // Use demo data advance function
    try {
      const result = demoData.advanceOrder(req.params.orderId);
      res.json({ success: true, order: result.order });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    const order = orderService.getOrder(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = orderService.updateOrder(req.params.orderId, { status });
    res.json({ success: true, order: updatedOrder });
  }
});

// List all orders (admin only)
router.get('/', requireAuth, (req, res) => {
  if (isDemoMode()) {
    const filters = {
      status: req.query.status,
      chefId: req.query.chefId,
      driverId: req.query.driverId,
      customerId: req.query.customerId
    };
    const ordersList = demoData.getOrders(filters);
    res.json({ orders: ordersList });
  } else {
    const ordersList = orderService.listOrders();
    res.json({ orders: ordersList });
  }
});

module.exports = router;
