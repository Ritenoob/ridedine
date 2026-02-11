const db = require('../db');
const demoData = require('./demoData');

// Check if database is available
let dbAvailable = false;

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL configured - using in-memory data');
    return false;
  }
  
  try {
    await db.query('SELECT 1');
    dbAvailable = true;
    console.log('✅ Database connected and ready');
    return true;
  } catch (error) {
    console.warn('⚠️  Database not available, falling back to in-memory:', error.message);
    return false;
  }
}

// Initialize on load
checkDatabase();

// User operations
async function findUserByEmail(email) {
  if (!dbAvailable) {
    // Fallback to demo data
    if (email === 'sean@seanfinlay.ca') {
      return { id: 1, email, name: 'Sean Finlay', role: 'admin' };
    }
    return null;
  }

  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function createUser(email, name, phone, role) {
  if (!dbAvailable) {
    return { id: Math.floor(Math.random() * 10000), email, name, phone, role };
  }

  const result = await db.query(
    `INSERT INTO users (email, name, phone, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [email, name, phone, role]
  );
  return result.rows[0];
}

// Chef operations
async function getAllChefs() {
  if (!dbAvailable) {
    return demoData.getChefs();
  }

  const result = await db.query(`
    SELECT c.*, u.email, u.name, u.phone 
    FROM chefs c 
    JOIN users u ON c.user_id = u.id 
    WHERE u.role = 'chef'
    ORDER BY c.display_name
  `);
  return result.rows;
}

async function getChefBySlug(slug) {
  if (!dbAvailable) {
    return demoData.getChefBySlug(slug);
  }

  const result = await db.query(`
    SELECT c.*, u.email, u.name, u.phone 
    FROM chefs c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.slug = $1
  `, [slug]);
  return result.rows[0] || null;
}

async function getMenuItems(chefId) {
  if (!dbAvailable) {
    const chef = demoData.getChefs().find(c => c.id === chefId);
    return chef?.menu || [];
  }

  const result = await db.query(
    'SELECT * FROM menu_items WHERE chef_id = $1 AND active = true',
    [chefId]
  );
  return result.rows;
}

// Order operations
async function createOrder(customerId, chefId, items, address, totals) {
  if (!dbAvailable) {
    return {
      id: Math.floor(Math.random() * 10000),
      customer_id: customerId,
      chef_id: chefId,
      status: 'pending',
      delivery_address: address,
      ...totals,
      created_at: new Date()
    };
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (customer_id, chef_id, status, delivery_address, subtotal, fees, tax, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [customerId, chefId, 'pending', JSON.stringify(address), totals.subtotal, totals.fees, totals.tax, totals.total]);

    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [order.id, item.menu_item_id, item.quantity, item.unit_price]);
    }

    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getOrdersByCustomer(customerId) {
  if (!dbAvailable) {
    return [];
  }

  const result = await db.query(`
    SELECT o.*, c.display_name as chef_name
    FROM orders o
    LEFT JOIN chefs c ON o.chef_id = c.id
    WHERE o.customer_id = $1
    ORDER BY o.created_at DESC
  `, [customerId]);
  return result.rows;
}

async function getOrdersByChef(chefId) {
  if (!dbAvailable) {
    return [];
  }

  const result = await db.query(`
    SELECT o.*, cu.user_id, u.name as customer_name, u.phone as customer_phone
    FROM orders o
    JOIN customers cu ON o.customer_id = cu.id
    JOIN users u ON cu.user_id = u.id
    WHERE o.chef_id = $1
    ORDER BY o.created_at DESC
  `, [chefId]);
  return result.rows;
}

async function updateOrderStatus(orderId, status) {
  if (!dbAvailable) {
    return { id: orderId, status, updated_at: new Date() };
  }

  const result = await db.query(`
    UPDATE orders 
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `, [status, orderId]);
  return result.rows[0];
}

// Driver operations
async function getAllDrivers() {
  if (!dbAvailable) {
    return [];
  }

  const result = await db.query(`
    SELECT d.*, u.email, u.name, u.phone
    FROM drivers d
    JOIN users u ON d.user_id = u.id
    WHERE u.role = 'driver'
    ORDER BY u.name
  `);
  return result.rows;
}

async function updateDriverStatus(driverId, status) {
  if (!dbAvailable) {
    return { id: driverId, status };
  }

  const result = await db.query(`
    UPDATE drivers
    SET status = $1
    WHERE id = $2
    RETURNING *
  `, [status, driverId]);
  return result.rows[0];
}

async function updateDriverGeo(driverId, lat, lng) {
  if (!dbAvailable) {
    return { id: driverId, current_geo: { lat, lng } };
  }

  const result = await db.query(`
    UPDATE drivers
    SET current_geo = $1
    WHERE id = $2
    RETURNING *
  `, [JSON.stringify({ lat, lng }), driverId]);
  return result.rows[0];
}

module.exports = {
  checkDatabase,
  findUserByEmail,
  createUser,
  getAllChefs,
  getChefBySlug,
  getMenuItems,
  createOrder,
  getOrdersByCustomer,
  getOrdersByChef,
  updateOrderStatus,
  getAllDrivers,
  updateDriverStatus,
  updateDriverGeo,
  isDbAvailable: () => dbAvailable
};
