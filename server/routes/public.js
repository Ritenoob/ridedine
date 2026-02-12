const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

// POST /api/public/orders - Create a new order
router.post('/orders', async (req, res) => {
  try {
    const { customerName, customerEmail, items, totalAmount } = req.body;

    // Validate input
    if (!customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and email are required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items are required'
      });
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Total amount must be greater than 0'
      });
    }

    // Create order
    const result = await orderService.createOrder({
      customerName,
      customerEmail,
      items,
      totalAmount
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// GET /api/public/track - Track order by ID and token
router.get('/track', async (req, res) => {
  try {
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

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Tracking token is required'
        }
      });
    }

    const result = await orderService.getOrderTracking(orderId, token);

    if (!result.success) {
      const statusCode = result.error.code === 'ORDER_NOT_FOUND' ? 404 : 
                         result.error.code === 'INVALID_TOKEN' ? 403 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve tracking information'
      }
    });
  }
});

module.exports = router;
