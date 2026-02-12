const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const orderService = require('../services/orders');
const demoData = require('../services/demoData');

// Check if demo mode is enabled
const isDemoMode = () => process.env.DEMO_MODE === 'true';

// Order status progression (updated for production)
const { ORDER_STATUS, STATUS_FLOW } = orderService;

// Get order details (admin only)
router.get('/:orderId', requireAuth, (req, res) => {
  const order = isDemoMode() ? 
    demoData.getOrder(req.params.orderId) : 
    orderService.getOrder(req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ 
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      }
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// Get redacted tracking info (public endpoint)
router.get('/:orderId/tracking', (req, res) => {
  const order = isDemoMode() ? 
    demoData.getOrder(req.params.orderId) : 
    orderService.getOrder(req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ 
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      }
    });
  }

  // Calculate customer-friendly status and ETA
  let customerStatus = 'Order received';
  let driverStatus = null;
  let etaMinutes = null;

  switch (order.status) {
    case ORDER_STATUS.CREATED:
    case 'pending':
      customerStatus = 'Order received';
      etaMinutes = '45-60';
      break;
    case ORDER_STATUS.CONFIRMED:
    case 'paid':
      customerStatus = 'Payment confirmed';
      etaMinutes = '40-50';
      break;
    case ORDER_STATUS.PREPARING:
    case 'preparing':
      customerStatus = 'Being prepared';
      etaMinutes = '30-40';
      break;
    case ORDER_STATUS.READY:
    case 'ready':
      customerStatus = 'Ready for pickup';
      etaMinutes = '20-30';
      driverStatus = 'Driver assigned';
      break;
    case ORDER_STATUS.PICKED_UP:
    case 'picked_up':
      customerStatus = 'Picked up by driver';
      driverStatus = 'Driver has your order';
      etaMinutes = '15-25';
      break;
    case ORDER_STATUS.EN_ROUTE:
    case 'on_route':
      customerStatus = 'Out for delivery';
      driverStatus = 'Driver en route to you';
      etaMinutes = '5-15';
      break;
    case ORDER_STATUS.DELIVERED:
    case 'delivered':
      customerStatus = 'Delivered';
      driverStatus = 'Delivered';
      etaMinutes = '0';
      break;
    case ORDER_STATUS.COMPLETED:
      customerStatus = 'Completed';
      driverStatus = 'Completed';
      etaMinutes = '0';
      break;
    default:
      customerStatus = 'Processing';
      etaMinutes = '45-60';
  }

  // Redacted tracking response - NO chef address or precise coordinates
  res.json({
    success: true,
    data: {
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
      lastUpdated: new Date().toISOString()
      // NO chef address, NO coordinates, NO internal routing data
    }
  });
});

// Create order
router.post('/', async (req, res) => {
  try {
    const { items, chefId, customerInfo, deliveryAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Items are required'
        }
      });
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
        data: {
          orderId: order.id,
          order
        }
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
        data: {
          orderId: order.orderId,
          order
        }
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'CREATE_ORDER_ERROR',
        message: 'Failed to create order'
      }
    });
  }
});

// Update order status (admin only)
router.patch('/:orderId/status', requireAuth, (req, res) => {
  const { status, message } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  // Validate status
  if (!Object.values(ORDER_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const order = isDemoMode() ?
    demoData.updateOrderStatus(req.params.orderId, status) :
    orderService.updateOrderStatus(req.params.orderId, status, message);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({ success: true, order });
});

// Advance order to next status (admin only)
router.post('/:orderId/advance', requireAuth, (req, res) => {
  const order = isDemoMode() ?
    null : // Demo data service doesn't support this yet
    orderService.advanceOrderStatus(req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found or already at final status' });
  }
  
  res.json({ success: true, order });
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
    res.json({ 
      success: true,
      data: {
        orders: ordersList
      }
    });
  } else {
    const ordersList = orderService.listOrders();
    res.json({ 
      success: true,
      data: {
        orders: ordersList
      }
    });
  }
});

module.exports = router;
