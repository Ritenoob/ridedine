const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const orderService = require('../services/orderService');

// All admin routes require authentication
router.use(requireAuth);
router.use(requireRole('admin'));

// GET /api/admin/orders - List all orders
router.get('/orders', async (req, res) => {
  try {
    const filters = {
      status: req.query.status
    };

    const result = await orderService.listOrders(filters);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders'
    });
  }
});

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const result = await orderService.updateOrderStatus(id, status);

    if (!result.success) {
      const statusCode = result.error === 'Order not found' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

module.exports = router;
