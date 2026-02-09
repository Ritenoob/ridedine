// Demo Data Service
// Provides in-memory mock data for demo mode simulations

let demoData = {
  customers: [],
  chefs: [],
  drivers: [],
  orders: [],
  payments: []
};

// Generate unique IDs
let idCounter = {
  customer: 1000,
  chef: 2000,
  driver: 3000,
  order: 4000,
  payment: 5000
};

function generateId(type) {
  return `${type}_${idCounter[type]++}`;
}

// Reset all demo data to empty state
function resetDemoData() {
  demoData = {
    customers: [],
    chefs: [],
    drivers: [],
    orders: [],
    payments: []
  };
  
  idCounter = {
    customer: 1000,
    chef: 2000,
    driver: 3000,
    order: 4000,
    payment: 5000
  };
  
  return { success: true, message: 'Demo data reset successfully' };
}

// Seed demo data with realistic entities
function seedDemoData() {
  resetDemoData();
  
  // Seed Customers
  const customerNames = [
    'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'James Wilson',
    'Sophia Martinez', 'David Kim', 'Olivia Brown', 'Daniel Lee'
  ];
  
  customerNames.forEach(name => {
    const id = generateId('customer');
    demoData.customers.push({
      id,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
      address: `${Math.floor(100 + Math.random() * 900)} Main St, Hamilton, ON`,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    });
  });
  
  // Seed Chefs
  const chefData = [
    { name: 'Maria Garcia', specialty: 'Mexican', rating: 4.8 },
    { name: 'John Smith', specialty: 'Italian', rating: 4.9 },
    { name: 'Lisa Wong', specialty: 'Chinese', rating: 4.7 },
    { name: 'Ahmed Hassan', specialty: 'Middle Eastern', rating: 4.6 }
  ];
  
  chefData.forEach(chef => {
    const id = generateId('chef');
    demoData.chefs.push({
      id,
      name: chef.name,
      email: `${chef.name.toLowerCase().replace(/\s+/g, '.')}@chef.ridendine.com`,
      specialty: chef.specialty,
      rating: chef.rating,
      status: 'active',
      totalOrders: Math.floor(50 + Math.random() * 200),
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    });
  });
  
  // Seed Drivers
  const driverNames = [
    'Robert Taylor', 'Jennifer Anderson', 'William Thomas', 'Jessica Moore'
  ];
  
  driverNames.forEach(name => {
    const id = generateId('driver');
    demoData.drivers.push({
      id,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@driver.ridendine.com`,
      phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicle: ['Honda Civic', 'Toyota Camry', 'Ford Focus', 'Mazda 3'][Math.floor(Math.random() * 4)],
      status: Math.random() > 0.5 ? 'available' : 'busy',
      rating: 4.5 + Math.random() * 0.5,
      totalDeliveries: Math.floor(100 + Math.random() * 400),
      createdAt: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString()
    });
  });
  
  // Seed Orders with various statuses
  const orderStatuses = ['pending', 'paid', 'preparing', 'ready', 'picked_up', 'delivered'];
  const now = Date.now();
  
  for (let i = 0; i < 15; i++) {
    const id = generateId('order');
    const customerId = demoData.customers[Math.floor(Math.random() * demoData.customers.length)].id;
    const chefId = demoData.chefs[Math.floor(Math.random() * demoData.chefs.length)].id;
    const driverId = Math.random() > 0.3 ? demoData.drivers[Math.floor(Math.random() * demoData.drivers.length)].id : null;
    const statusIndex = Math.floor(Math.random() * orderStatuses.length);
    const status = orderStatuses[statusIndex];
    const createdAt = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    const total = (15 + Math.random() * 50).toFixed(2);
    
    demoData.orders.push({
      id,
      customerId,
      chefId,
      driverId,
      status,
      items: [
        {
          name: ['Tacos', 'Pasta', 'Noodles', 'Falafel', 'Pizza'][Math.floor(Math.random() * 5)],
          quantity: Math.floor(1 + Math.random() * 3),
          price: (8 + Math.random() * 12).toFixed(2)
        }
      ],
      total,
      deliveryAddress: demoData.customers.find(c => c.id === customerId).address,
      createdAt,
      updatedAt: createdAt,
      estimatedDelivery: new Date(new Date(createdAt).getTime() + 45 * 60 * 1000).toISOString()
    });
    
    // Create payment if order is paid or beyond
    if (statusIndex >= 1) {
      const paymentId = generateId('payment');
      demoData.payments.push({
        id: paymentId,
        orderId: id,
        amount: total,
        status: 'succeeded',
        method: 'card',
        createdAt: new Date(new Date(createdAt).getTime() + 60 * 1000).toISOString()
      });
    }
  }
  
  return {
    success: true,
    message: 'Demo data seeded successfully',
    stats: {
      customers: demoData.customers.length,
      chefs: demoData.chefs.length,
      drivers: demoData.drivers.length,
      orders: demoData.orders.length,
      payments: demoData.payments.length
    }
  };
}

// Advance an order through lifecycle states
function advanceOrder(orderId) {
  const order = demoData.orders.find(o => o.id === orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  const lifecycle = ['pending', 'paid', 'preparing', 'ready', 'picked_up', 'delivered'];
  const currentIndex = lifecycle.indexOf(order.status);
  
  if (currentIndex === -1 || currentIndex === lifecycle.length - 1) {
    throw new Error('Cannot advance order from current status');
  }
  
  order.status = lifecycle[currentIndex + 1];
  order.updatedAt = new Date().toISOString();
  
  // If advancing to paid, create payment
  if (order.status === 'paid' && !demoData.payments.find(p => p.orderId === orderId)) {
    const paymentId = generateId('payment');
    demoData.payments.push({
      id: paymentId,
      orderId,
      amount: order.total,
      status: 'succeeded',
      method: 'card',
      createdAt: new Date().toISOString()
    });
  }
  
  return {
    success: true,
    order,
    message: `Order advanced to ${order.status}`
  };
}

// Simulate payment for an order
function simulatePayment(orderId) {
  const order = demoData.orders.find(o => o.id === orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Check if payment already exists
  const existingPayment = demoData.payments.find(p => p.orderId === orderId);
  if (existingPayment) {
    return {
      success: true,
      payment: existingPayment,
      message: 'Payment already exists for this order'
    };
  }
  
  // Create payment
  const paymentId = generateId('payment');
  const payment = {
    id: paymentId,
    orderId,
    amount: order.total,
    status: 'succeeded',
    method: 'card',
    createdAt: new Date().toISOString()
  };
  
  demoData.payments.push(payment);
  
  // Update order status to paid if it's pending
  if (order.status === 'pending') {
    order.status = 'paid';
    order.updatedAt = new Date().toISOString();
  }
  
  return {
    success: true,
    payment,
    message: 'Payment simulated successfully'
  };
}

// Get all demo data (for debugging/admin view)
function getAllDemoData() {
  return {
    ...demoData,
    stats: {
      customers: demoData.customers.length,
      chefs: demoData.chefs.length,
      drivers: demoData.drivers.length,
      orders: demoData.orders.length,
      payments: demoData.payments.length
    }
  };
}

// Get orders with filters
function getOrders(filters = {}) {
  let orders = [...demoData.orders];
  
  if (filters.status) {
    orders = orders.filter(o => o.status === filters.status);
  }
  
  if (filters.chefId) {
    orders = orders.filter(o => o.chefId === filters.chefId);
  }
  
  if (filters.driverId) {
    orders = orders.filter(o => o.driverId === filters.driverId);
  }
  
  if (filters.customerId) {
    orders = orders.filter(o => o.customerId === filters.customerId);
  }
  
  // Enrich orders with related data
  return orders.map(order => ({
    ...order,
    customer: demoData.customers.find(c => c.id === order.customerId),
    chef: demoData.chefs.find(c => c.id === order.chefId),
    driver: order.driverId ? demoData.drivers.find(d => d.id === order.driverId) : null,
    payment: demoData.payments.find(p => p.orderId === order.id)
  }));
}

// Get single order
function getOrder(orderId) {
  const order = demoData.orders.find(o => o.id === orderId);
  
  if (!order) {
    return null;
  }
  
  return {
    ...order,
    customer: demoData.customers.find(c => c.id === order.customerId),
    chef: demoData.chefs.find(c => c.id === order.chefId),
    driver: order.driverId ? demoData.drivers.find(d => d.id === order.driverId) : null,
    payment: demoData.payments.find(p => p.orderId === order.id)
  };
}

module.exports = {
  resetDemoData,
  seedDemoData,
  advanceOrder,
  simulatePayment,
  getAllDemoData,
  getOrders,
  getOrder
};
