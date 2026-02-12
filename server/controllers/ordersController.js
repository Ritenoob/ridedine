/**
 * Orders Controller
 * Business logic for order management
 */

const orderService = require('../services/orders');
const { sendSuccess, sendError } = require('../middleware/responseEnvelope');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get order by ID
 */
async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = orderService.getOrder(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
}

/**
 * Get order by tracking token (public)
 */
async function getOrderByTrackingToken(req, res, next) {
  try {
    const { trackingToken } = req.params;
    const order = orderService.getOrderByTrackingToken(trackingToken);
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    // Return sanitized data for public tracking
    const publicOrder = {
      orderId: order.orderId,
      trackingToken: order.trackingToken,
      status: order.status,
      statusHistory: order.statusHistory,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt,
      items: order.items,
      total: order.total
    };
    
    sendSuccess(res, publicOrder);
  } catch (error) {
    next(error);
  }
}

/**
 * List orders (with filters)
 */
async function listOrders(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      customerId: req.query.customerId
    };
    
    const orders = orderService.listOrders(filters);
    sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
}

/**
 * Create order
 */
async function createOrder(req, res, next) {
  try {
    const { items, customerInfo, deliveryAddress, notes } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Items are required', 400);
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * (item.quantity || 1));
    }, 0);
    
    const tax = subtotal * 0.13; // 13% HST
    const fees = 3.99; // Delivery fee
    const total = subtotal + tax + fees;
    
    const orderData = {
      items,
      customerInfo,
      deliveryAddress,
      notes,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      fees: parseFloat(fees.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
    
    const order = orderService.createOrder(orderData);
    sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status, message } = req.body;
    
    if (!status) {
      throw new AppError('Status is required', 400);
    }
    
    // Validate status
    if (!Object.values(orderService.ORDER_STATUS).includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    const order = orderService.updateOrderStatus(orderId, status, message);
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    sendSuccess(res, order, 'Order status updated');
  } catch (error) {
    next(error);
  }
}

/**
 * Advance order to next status
 */
async function advanceOrderStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = orderService.advanceOrderStatus(orderId);
    
    if (!order) {
      throw new AppError('Order not found or already at final status', 404);
    }
    
    sendSuccess(res, order, `Order advanced to ${order.status}`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrder,
  getOrderByTrackingToken,
  listOrders,
  createOrder,
  updateOrderStatus,
  advanceOrderStatus
};
