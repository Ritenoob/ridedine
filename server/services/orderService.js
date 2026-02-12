const crypto = require('crypto');
const db = require('../db');
const dataService = require('./dataService');

// In-memory order storage when database is not available
const inMemoryOrders = new Map();

// Valid order statuses
const VALID_STATUSES = ['CREATED', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'EN_ROUTE', 'DELIVERED'];

/**
 * Generate a secure random tracking token
 */
function generateTrackingToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate ETA based on order status
 */
function calculateETA(status) {
  switch (status) {
    case 'CREATED':
    case 'CONFIRMED':
      return '45-60 minutes';
    case 'PREPARING':
      return '30-40 minutes';
    case 'READY':
      return '20-30 minutes';
    case 'PICKED_UP':
      return '15-25 minutes';
    case 'EN_ROUTE':
      return '5-15 minutes';
    case 'DELIVERED':
      return 'Delivered';
    default:
      return '45-60 minutes';
  }
}

/**
 * Create a new order with tracking token
 * Supports both guest checkout (with name/email) and authenticated users
 */
async function createOrder({ customerName, customerEmail, items, totalAmount, customerId = null, chefId = null, partnerId = null }) {
  if (!dataService.isDbAvailable()) {
    // Fallback for no database - use in-memory storage
    const orderId = `order_${Date.now()}`;
    const trackingToken = generateTrackingToken();
    
    const order = {
      id: orderId,
      orderId,
      trackingToken,
      customerName,
      customerEmail,
      items,
      total: parseFloat(totalAmount).toFixed(2),
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in memory
    inMemoryOrders.set(orderId, order);
    
    return {
      success: true,
      data: {
        orderId,
        trackingToken,
        status: 'CREATED',
        createdAt: order.createdAt
      }
    };
  }

  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Generate tracking token
    const trackingToken = generateTrackingToken();
    
    // Calculate totals
    const subtotal = parseFloat(totalAmount);
    const fees = (subtotal * 0.10).toFixed(2); // 10% delivery fee
    const tax = (subtotal * 0.13).toFixed(2); // 13% tax
    const total = (parseFloat(subtotal) + parseFloat(fees) + parseFloat(tax)).toFixed(2);
    
    // Default delivery address if not provided
    const deliveryAddress = {
      street: '123 Default St',
      city: 'Hamilton',
      province: 'ON',
      postalCode: 'L8P 4R5'
    };
    
    // If customerId is not provided, try to find or create customer
    let finalCustomerId = customerId;
    if (!finalCustomerId && customerEmail) {
      // Try to find existing customer by email
      const userResult = await client.query(
        'SELECT id FROM users WHERE email = $1 AND role = $2',
        [customerEmail, 'customer']
      );
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        const customerResult = await client.query(
          'SELECT id FROM customers WHERE user_id = $1',
          [userId]
        );
        if (customerResult.rows.length > 0) {
          finalCustomerId = customerResult.rows[0].id;
        }
      }
      
      // If still no customer, create one
      if (!finalCustomerId) {
        const userInsert = await client.query(
          'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING id',
          [customerEmail, customerName, 'customer']
        );
        const userId = userInsert.rows[0].id;
        
        const customerInsert = await client.query(
          'INSERT INTO customers (user_id) VALUES ($1) RETURNING id',
          [userId]
        );
        finalCustomerId = customerInsert.rows[0].id;
      }
    }
    
    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (
        customer_id, 
        chef_id, 
        partner_id,
        customer_name,
        customer_email,
        status, 
        delivery_address, 
        subtotal, 
        fees, 
        tax, 
        total,
        tracking_token
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, tracking_token, created_at
    `, [
      finalCustomerId,
      chefId,
      partnerId,
      customerName,
      customerEmail,
      'CREATED',
      JSON.stringify(deliveryAddress),
      subtotal,
      fees,
      tax,
      total,
      trackingToken
    ]);
    
    const order = orderResult.rows[0];
    
    // For now, we're not creating order_items as we may not have menu_item_id
    // In a real implementation, you'd need to link items to menu_items
    
    await client.query('COMMIT');
    
    return {
      success: true,
      data: {
        orderId: order.id,
        trackingToken: order.tracking_token,
        status: 'CREATED',
        createdAt: order.created_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get order tracking information by orderId and token
 */
async function getOrderTracking(orderId, token) {
  if (!dataService.isDbAvailable()) {
    // Use in-memory storage
    const order = inMemoryOrders.get(orderId);
    
    if (!order) {
      return {
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }
    
    // Validate tracking token
    if (order.trackingToken !== token) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid tracking token'
        }
      };
    }
    
    return {
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        eta: calculateETA(order.status),
        total: order.total,
        lastUpdated: order.updatedAt
      }
    };
  }
  
  try {
    const result = await db.query(`
      SELECT 
        id,
        status,
        customer_name,
        customer_email,
        total,
        created_at,
        updated_at,
        tracking_token
      FROM orders
      WHERE id = $1
    `, [orderId]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      };
    }
    
    const order = result.rows[0];
    
    // Validate tracking token
    if (order.tracking_token !== token) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid tracking token'
        }
      };
    }
    
    return {
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        eta: calculateETA(order.status),
        lastUpdated: order.updated_at || order.created_at
      }
    };
  } catch (error) {
    console.error('Get order tracking error:', error);
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve tracking information'
      }
    };
  }
}

/**
 * Update order status (admin only)
 */
async function updateOrderStatus(orderId, newStatus) {
  if (!dataService.isDbAvailable()) {
    // Use in-memory storage
    const order = inMemoryOrders.get(orderId);
    
    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }
    
    if (!VALID_STATUSES.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      };
    }
    
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    inMemoryOrders.set(orderId, order);
    
    return {
      success: true,
      data: {
        id: order.id,
        status: order.status,
        updated_at: order.updatedAt
      }
    };
  }
  
  if (!VALID_STATUSES.includes(newStatus)) {
    return {
      success: false,
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    };
  }
  
  try {
    const result = await db.query(`
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, updated_at
    `, [newStatus, orderId]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Order not found'
      };
    }
    
    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.error('Update order status error:', error);
    return {
      success: false,
      error: 'Failed to update order status'
    };
  }
}

/**
 * List all orders (admin only)
 */
async function listOrders(filters = {}) {
  if (!dataService.isDbAvailable()) {
    // Use in-memory storage
    let orders = Array.from(inMemoryOrders.values());
    
    // Apply status filter
    if (filters.status) {
      orders = orders.filter(order => order.status === filters.status);
    }
    
    // Sort by created_at descending
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Transform to match database format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      status: order.status,
      total: order.total,
      created_at: order.createdAt,
      updated_at: order.updatedAt
    }));
    
    return {
      success: true,
      data: formattedOrders.slice(0, 100) // Limit to 100
    };
  }
  
  try {
    let query = `
      SELECT 
        id,
        customer_name,
        customer_email,
        status,
        total,
        created_at,
        updated_at
      FROM orders
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const result = await db.query(query, params);
    
    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error('List orders error:', error);
    return {
      success: false,
      error: 'Failed to retrieve orders'
    };
  }
}

module.exports = {
  createOrder,
  getOrderTracking,
  updateOrderStatus,
  listOrders
};
