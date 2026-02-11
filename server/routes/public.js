const express = require('express');
const router = express.Router();
const demoData = require('../services/demoData');
const orderService = require('../services/orders');

// Check if demo mode is enabled
const isDemoMode = () => process.env.DEMO_MODE === 'true';

// Public order tracking endpoint
// Query params: orderId (required), token (optional for future token-based tracking)
router.get('/track', (req, res) => {
  const { orderId, token } = req.query;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_ORDER_ID',
        message: 'Order ID is required'
      }
    });
  }

  try {
    // Get order from appropriate service
    const order = isDemoMode() ? 
      demoData.getOrder(orderId) : 
      orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found. Please check your order ID.'
        }
      });
    }

    // Calculate customer-friendly status and ETA
    let customerStatus = 'Order received';
    let driverStatus = null;
    let etaMinutes = null;
    let statusStep = 0; // For timeline visualization

    switch (order.status) {
      case 'pending':
        customerStatus = 'Order received';
        etaMinutes = '45-60';
        statusStep = 1;
        break;
      case 'paid':
        customerStatus = 'Payment confirmed';
        etaMinutes = '40-50';
        statusStep = 2;
        break;
      case 'preparing':
        customerStatus = 'Being prepared';
        etaMinutes = '30-40';
        statusStep = 3;
        break;
      case 'ready':
        customerStatus = 'Ready for pickup';
        etaMinutes = '20-30';
        driverStatus = 'Driver assigned';
        statusStep = 4;
        break;
      case 'picked_up':
        customerStatus = 'Picked up by driver';
        driverStatus = 'Driver has your order';
        etaMinutes = '15-25';
        statusStep = 5;
        break;
      case 'on_route':
        customerStatus = 'Out for delivery';
        driverStatus = 'Driver en route to you';
        etaMinutes = '5-15';
        statusStep = 6;
        break;
      case 'delivered':
        customerStatus = 'Delivered';
        driverStatus = 'Delivered successfully';
        etaMinutes = '0';
        statusStep = 7;
        break;
      default:
        customerStatus = 'Processing';
        etaMinutes = '45-60';
        statusStep = 1;
    }

    // Build status timeline
    const timeline = [
      {
        step: 1,
        label: 'Order Placed',
        status: statusStep >= 1 ? 'complete' : 'pending',
        timestamp: order.createdAt || order.orderDate
      },
      {
        step: 2,
        label: 'Payment Confirmed',
        status: statusStep >= 2 ? 'complete' : statusStep === 1 ? 'active' : 'pending',
        timestamp: statusStep >= 2 ? order.updatedAt : null
      },
      {
        step: 3,
        label: 'Preparing Your Order',
        status: statusStep >= 3 ? 'complete' : statusStep === 2 ? 'active' : 'pending',
        timestamp: statusStep >= 3 ? order.updatedAt : null
      },
      {
        step: 4,
        label: 'Ready for Pickup',
        status: statusStep >= 4 ? 'complete' : statusStep === 3 ? 'active' : 'pending',
        timestamp: statusStep >= 4 ? order.updatedAt : null
      },
      {
        step: 5,
        label: 'Picked Up',
        status: statusStep >= 5 ? 'complete' : statusStep === 4 ? 'active' : 'pending',
        timestamp: statusStep >= 5 ? order.updatedAt : null
      },
      {
        step: 6,
        label: 'Out for Delivery',
        status: statusStep >= 6 ? 'complete' : statusStep === 5 ? 'active' : 'pending',
        timestamp: statusStep >= 6 ? order.updatedAt : null
      },
      {
        step: 7,
        label: 'Delivered',
        status: statusStep >= 7 ? 'complete' : statusStep === 6 ? 'active' : 'pending',
        timestamp: statusStep >= 7 ? order.deliveredAt || order.updatedAt : null
      }
    ];

    // Return safe tracking data (no chef address, no internal data)
    res.json({
      success: true,
      data: {
        orderId: order.id || order.orderId,
        status: order.status,
        customerStatus,
        driverStatus,
        etaMinutes,
        estimatedDelivery: order.estimatedDelivery || order.deliveryWindow || 'Today, 5:00-6:00 PM',
        timeline,
        items: order.items || [],
        total: order.total,
        createdAt: order.createdAt || order.orderDate,
        lastUpdated: order.updatedAt || order.lastUpdated || new Date().toISOString(),
        supportContact: 'support@ridendine.com',
        supportPhone: '1-800-RIDENDINE'
      }
    });
  } catch (error) {
    console.error('Public tracking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Unable to retrieve order tracking information. Please try again later.'
      }
    });
  }
});

module.exports = router;
