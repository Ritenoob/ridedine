const crypto = require('crypto');

// Order storage - shared between routes (replace with database in production)
const orders = new Map();

// Generate unique order ID
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `RD-${timestamp}${random}`.toUpperCase();
}

// Get order by ID
function getOrder(orderId) {
  return orders.get(orderId);
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
  const order = {
    orderId,
    ...orderData,
    createdAt: orderData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  orders.set(orderId, order);
  return order;
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
function listOrders() {
  return Array.from(orders.values());
}

module.exports = {
  generateOrderId,
  getOrder,
  findOrderBySessionId,
  createOrder,
  updateOrder,
  listOrders,
  // Expose orders Map for backward compatibility (temporary)
  orders
};
