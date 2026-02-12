const crypto = require('crypto');

// Order storage - shared between routes (replace with database in production)
const orders = new Map();

// Production-grade order status flow
const ORDER_STATUS = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  PICKED_UP: 'PICKED_UP',
  EN_ROUTE: 'EN_ROUTE',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Status progression map
const STATUS_FLOW = {
  CREATED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'PICKED_UP',
  PICKED_UP: 'EN_ROUTE',
  EN_ROUTE: 'DELIVERED',
  DELIVERED: 'COMPLETED'
};

// Generate unique order ID
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `RD-${timestamp}${random}`.toUpperCase();
}

// Generate tracking token (for public order tracking)
function generateTrackingToken() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// Get order by ID
function getOrder(orderId) {
  return orders.get(orderId);
}

// Get order by tracking token
function getOrderByTrackingToken(trackingToken) {
  for (const [orderId, order] of orders.entries()) {
    if (order.trackingToken === trackingToken) {
      return order;
    }
  }
  return null;
}

// Find order by session ID (for Stripe payments)
function findOrderBySessionId(sessionId) {
  for (const [orderId, order] of orders.entries()) {
    if (order.sessionId === sessionId) {
      return order;
    }
  }
  return null;
}

// Create order
function createOrder(orderData) {
  const orderId = generateOrderId();
  const trackingToken = generateTrackingToken();
  const now = new Date().toISOString();
  
  const order = {
    orderId,
    trackingToken,
    status: ORDER_STATUS.CREATED,
    ...orderData,
    createdAt: orderData.createdAt || now,
    updatedAt: now,
    statusHistory: [
      {
        status: ORDER_STATUS.CREATED,
        timestamp: now,
        message: 'Order created'
      }
    ]
  };
  
  orders.set(orderId, order);
  return order;
}

// Update order status
function updateOrderStatus(orderId, newStatus, message = null) {
  const order = orders.get(orderId);
  if (!order) {
    return null;
  }
  
  const now = new Date().toISOString();
  const statusEntry = {
    status: newStatus,
    timestamp: now,
    message: message || `Order ${newStatus.toLowerCase()}`
  };
  
  const updatedOrder = {
    ...order,
    status: newStatus,
    updatedAt: now,
    statusHistory: [...(order.statusHistory || []), statusEntry]
  };
  
  // Update estimated delivery time based on status
  if (newStatus === ORDER_STATUS.CONFIRMED) {
    updatedOrder.estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000).toISOString();
  } else if (newStatus === ORDER_STATUS.DELIVERED) {
    updatedOrder.actualDeliveryTime = now;
  }
  
  orders.set(orderId, updatedOrder);
  return updatedOrder;
}

// Update order
function updateOrder(orderId, updates) {
  const order = orders.get(orderId);
  if (!order) {
    return null;
  }
  
  const updatedOrder = {
    ...order,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  orders.set(orderId, updatedOrder);
  return updatedOrder;
}

// List all orders
function listOrders(filters = {}) {
  let orderList = Array.from(orders.values());
  
  // Apply filters
  if (filters.status) {
    orderList = orderList.filter(o => o.status === filters.status);
  }
  
  if (filters.customerId) {
    orderList = orderList.filter(o => o.customerId === filters.customerId);
  }
  
  // Sort by creation date (newest first)
  orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return orderList;
}

// Advance order to next status
function advanceOrderStatus(orderId) {
  const order = orders.get(orderId);
  if (!order) {
    return null;
  }
  
  const nextStatus = STATUS_FLOW[order.status];
  if (!nextStatus) {
    return null; // Already at final status or invalid status
  }
  
  return updateOrderStatus(orderId, nextStatus);
}

module.exports = {
  ORDER_STATUS,
  STATUS_FLOW,
  generateOrderId,
  generateTrackingToken,
  getOrder,
  getOrderByTrackingToken,
  findOrderBySessionId,
  createOrder,
  updateOrder,
  updateOrderStatus,
  advanceOrderStatus,
  listOrders,
  // Expose orders Map for backward compatibility (temporary)
  orders
};
