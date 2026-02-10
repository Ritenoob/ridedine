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
  
  // Seed Chefs with detailed menus
  const chefData = [
    { 
      name: 'Hoàng Gia Phở', 
      slug: 'hoang-gia-pho',
      specialty: 'Vietnamese', 
      rating: 4.9,
      description: 'Authentic Vietnamese cuisine from generations of family recipes',
      menu: [
        // Phở (Traditional Noodle Soups)
        { name: 'Phở Bò (Beef Noodle Soup)', price: 14.99, category: 'Phở', prepTime: 15 },
        { name: 'Phở Gà (Chicken Noodle Soup)', price: 13.99, category: 'Phở', prepTime: 15 },
        { name: 'Phở Tái (Rare Beef Phở)', price: 15.99, category: 'Phở', prepTime: 15 },
        { name: 'Phở Chín (Well-Done Beef Phở)', price: 15.49, category: 'Phở', prepTime: 15 },
        { name: 'Phở Đặc Biệt (Special Combination Phở)', price: 17.99, category: 'Phở', prepTime: 18 },
        { name: 'Phở Tôm (Shrimp Noodle Soup)', price: 16.99, category: 'Phở', prepTime: 15 },
        { name: 'Phở Chay (Vegetarian Phở)', price: 12.99, category: 'Phở', prepTime: 12 },
        
        // Bánh Mì (Vietnamese Sandwiches)
        { name: 'Bánh Mì Thịt Nướng (Grilled Pork)', price: 8.99, category: 'Bánh Mì', prepTime: 8 },
        { name: 'Bánh Mì Gà (Lemongrass Chicken)', price: 8.99, category: 'Bánh Mì', prepTime: 8 },
        { name: 'Bánh Mì Pâté (Classic Pâté)', price: 7.99, category: 'Bánh Mì', prepTime: 8 },
        { name: 'Bánh Mì Đặc Biệt (Special Combo)', price: 9.99, category: 'Bánh Mì', prepTime: 10 },
        { name: 'Bánh Mì Chay (Veggie Delight)', price: 7.49, category: 'Bánh Mì', prepTime: 7 },
        
        // Bún (Vermicelli Bowls)
        { name: 'Bún Thịt Nướng (Grilled Pork Vermicelli)', price: 13.99, category: 'Bún', prepTime: 12 },
        { name: 'Bún Gà Nướng (Grilled Chicken Vermicelli)', price: 13.99, category: 'Bún', prepTime: 12 },
        { name: 'Bún Bò Huế (Spicy Beef Noodle Soup)', price: 15.99, category: 'Bún', prepTime: 18 },
        { name: 'Bún Chả Giò (Spring Roll Vermicelli)', price: 12.99, category: 'Bún', prepTime: 12 },
        { name: 'Bún Nem Nướng (Grilled Sausage Vermicelli)', price: 14.49, category: 'Bún', prepTime: 12 },
        
        // Cơm (Rice Dishes)
        { name: 'Cơm Gà Xào (Stir-Fried Chicken Rice)', price: 13.49, category: 'Cơm', prepTime: 15 },
        { name: 'Cơm Sườn (Grilled Pork Chop Rice)', price: 14.99, category: 'Cơm', prepTime: 15 },
        { name: 'Cơm Tấm (Broken Rice with Pork)', price: 13.99, category: 'Cơm', prepTime: 15 },
        { name: 'Cơm Chiên Dương Châu (Fried Rice)', price: 12.99, category: 'Cơm', prepTime: 12 },
        { name: 'Cơm Bò Lúc Lắc (Shaking Beef Rice)', price: 16.99, category: 'Cơm', prepTime: 15 },
        
        // Appetizers
        { name: 'Gỏi Cuốn (Fresh Spring Rolls) - 2 pcs', price: 6.99, category: 'Appetizers', prepTime: 8 },
        { name: 'Chả Giò (Fried Spring Rolls) - 4 pcs', price: 7.99, category: 'Appetizers', prepTime: 10 },
        { name: 'Nem Nướng (Grilled Pork Sausage) - 6 pcs', price: 9.99, category: 'Appetizers', prepTime: 12 },
        { name: 'Cánh Gà Chiên Nước Mắm (Fish Sauce Wings) - 6 pcs', price: 10.99, category: 'Appetizers', prepTime: 15 },
        { name: 'Gỏi Cuốn Tôm (Shrimp Summer Rolls) - 2 pcs', price: 7.99, category: 'Appetizers', prepTime: 8 },
        { name: 'Bánh Bột Lọc (Tapioca Dumplings) - 4 pcs', price: 8.49, category: 'Appetizers', prepTime: 10 },
        
        // Desserts
        { name: 'Chè Ba Màu (Three-Color Dessert)', price: 5.99, category: 'Desserts', prepTime: 5 },
        { name: 'Chè Đậu Xanh (Mung Bean Dessert)', price: 4.99, category: 'Desserts', prepTime: 5 },
        { name: 'Bánh Flan (Vietnamese Flan)', price: 5.49, category: 'Desserts', prepTime: 5 },
        
        // Beverages
        { name: 'Cà Phê Sữa Đá (Iced Vietnamese Coffee)', price: 4.99, category: 'Beverages', prepTime: 3 },
        { name: 'Trà Đá (Iced Tea)', price: 2.49, category: 'Beverages', prepTime: 2 },
        { name: 'Sinh Tố Bơ (Avocado Smoothie)', price: 5.99, category: 'Beverages', prepTime: 4 },
        { name: 'Nước Dừa (Fresh Coconut Water)', price: 4.49, category: 'Beverages', prepTime: 2 },
        { name: 'Soda Chanh (Lemon Soda)', price: 3.99, category: 'Beverages', prepTime: 3 }
      ]
    },
    { 
      name: 'Maria Garcia', 
      slug: 'maria-garcia',
      specialty: 'Mexican', 
      rating: 4.8,
      description: 'Traditional Mexican flavors from Oaxaca',
      menu: [
        { name: 'Tacos Al Pastor (3 pcs)', price: 11.99, category: 'Tacos', prepTime: 10 },
        { name: 'Quesadillas', price: 9.99, category: 'Mains', prepTime: 8 },
        { name: 'Burrito Bowl', price: 13.99, category: 'Mains', prepTime: 12 },
        { name: 'Enchiladas (3 pcs)', price: 14.99, category: 'Mains', prepTime: 15 },
        { name: 'Guacamole & Chips', price: 7.99, category: 'Appetizers', prepTime: 5 }
      ]
    },
    { 
      name: 'John Smith', 
      slug: 'john-smith',
      specialty: 'Italian', 
      rating: 4.9,
      description: 'Northern Italian cuisine with modern twists',
      menu: [
        { name: 'Margherita Pizza', price: 14.99, category: 'Pizza', prepTime: 18 },
        { name: 'Spaghetti Carbonara', price: 15.99, category: 'Pasta', prepTime: 15 },
        { name: 'Fettuccine Alfredo', price: 14.99, category: 'Pasta', prepTime: 12 },
        { name: 'Lasagna Bolognese', price: 16.99, category: 'Mains', prepTime: 20 },
        { name: 'Caprese Salad', price: 9.99, category: 'Salads', prepTime: 8 }
      ]
    },
    { 
      name: 'Lisa Wong', 
      slug: 'lisa-wong',
      specialty: 'Chinese', 
      rating: 4.7,
      description: 'Cantonese and Szechuan specialties',
      menu: [
        { name: 'Kung Pao Chicken', price: 13.99, category: 'Mains', prepTime: 15 },
        { name: 'Sweet & Sour Pork', price: 14.99, category: 'Mains', prepTime: 15 },
        { name: 'Mapo Tofu', price: 12.99, category: 'Mains', prepTime: 12 },
        { name: 'Fried Rice', price: 10.99, category: 'Rice', prepTime: 10 },
        { name: 'Spring Rolls (6 pcs)', price: 7.99, category: 'Appetizers', prepTime: 8 }
      ]
    },
    { 
      name: 'Ahmed Hassan', 
      slug: 'ahmed-hassan',
      specialty: 'Middle Eastern', 
      rating: 4.6,
      description: 'Authentic Lebanese and Mediterranean dishes',
      menu: [
        { name: 'Falafel Wrap', price: 10.99, category: 'Wraps', prepTime: 10 },
        { name: 'Shawarma Plate', price: 15.99, category: 'Mains', prepTime: 12 },
        { name: 'Hummus Platter', price: 8.99, category: 'Appetizers', prepTime: 5 },
        { name: 'Tabbouleh Salad', price: 7.99, category: 'Salads', prepTime: 8 },
        { name: 'Baklava (3 pcs)', price: 6.99, category: 'Desserts', prepTime: 5 }
      ]
    }
  ];
  
  chefData.forEach(chef => {
    const id = generateId('chef');
    demoData.chefs.push({
      id,
      name: chef.name,
      slug: chef.slug,
      email: `${chef.slug}@chef.ridendine.com`,
      specialty: chef.specialty,
      description: chef.description,
      menu: chef.menu,
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
  
  // Seed Orders with various statuses (50-150 orders for realistic simulation)
  const orderStatuses = ['pending', 'paid', 'preparing', 'ready', 'picked_up', 'on_route', 'delivered'];
  const now = Date.now();
  const orderCount = 75; // Generate 75 orders for good distribution
  
  for (let i = 0; i < orderCount; i++) {
    const id = `ORD-${String(10000 + i).padStart(5, '0')}`;
    const customerId = demoData.customers[Math.floor(Math.random() * demoData.customers.length)].id;
    const chef = demoData.chefs[Math.floor(Math.random() * demoData.chefs.length)];
    const chefId = chef.id;
    
    // Status distribution: More delivered/completed, fewer pending
    let statusIndex;
    const rand = Math.random();
    if (rand < 0.4) statusIndex = 6; // 40% delivered
    else if (rand < 0.55) statusIndex = 5; // 15% on_route
    else if (rand < 0.70) statusIndex = 4; // 15% picked_up
    else if (rand < 0.82) statusIndex = 3; // 12% ready
    else if (rand < 0.92) statusIndex = 2; // 10% preparing
    else if (rand < 0.97) statusIndex = 1; // 5% paid
    else statusIndex = 0; // 3% pending
    
    const status = orderStatuses[statusIndex];
    
    // Orders spread over last 7 days, with more recent orders having earlier statuses
    const daysAgo = statusIndex >= 5 ? Math.random() * 7 : Math.random() * 2;
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    // Select random items from chef's menu
    const numItems = Math.floor(1 + Math.random() * 3); // 1-3 items per order
    const items = [];
    const selectedMenuItems = chef.menu ? 
      [...chef.menu].sort(() => 0.5 - Math.random()).slice(0, numItems) :
      [{ name: 'Special Dish', price: (15 + Math.random() * 20).toFixed(2), prepTime: 15 }];
    
    let totalPrice = 0;
    selectedMenuItems.forEach(menuItem => {
      const quantity = Math.floor(1 + Math.random() * 2);
      const itemPrice = parseFloat(menuItem.price);
      items.push({
        name: menuItem.name,
        quantity,
        price: menuItem.price,
        category: menuItem.category || 'Main'
      });
      totalPrice += itemPrice * quantity;
    });
    
    const total = totalPrice.toFixed(2);
    
    // Assign driver if status is picked_up or later
    const driverId = statusIndex >= 4 ? 
      demoData.drivers[Math.floor(Math.random() * demoData.drivers.length)].id : 
      null;
    
    // Calculate prep time from items
    const totalPrepTime = items.reduce((sum, item) => {
      const menuItem = chef.menu?.find(m => m.name === item.name);
      return sum + (menuItem?.prepTime || 15);
    }, 0);
    
    // Estimate delivery time based on status
    const baseDeliveryMinutes = totalPrepTime + 30; // prep + delivery time
    const estimatedDelivery = new Date(new Date(createdAt).getTime() + baseDeliveryMinutes * 60 * 1000).toISOString();
    
    // Calculate pickup and delivery windows for batching
    const pickupWindow = new Date(new Date(createdAt).getTime() + totalPrepTime * 60 * 1000).toISOString();
    const deliveryWindow = new Date(new Date(createdAt).getTime() + (totalPrepTime + 45) * 60 * 1000).toISOString();
    
    demoData.orders.push({
      id,
      customerId,
      chefId,
      driverId,
      status,
      items,
      total,
      deliveryAddress: demoData.customers.find(c => c.id === customerId).address,
      createdAt,
      updatedAt: createdAt,
      estimatedDelivery,
      pickupWindow,
      deliveryWindow,
      prepTime: totalPrepTime,
      wave: Math.floor(i / 10) + 1 // Group into waves of 10 for batching
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
  
  const lifecycle = ['pending', 'paid', 'preparing', 'ready', 'picked_up', 'on_route', 'delivered'];
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
  
  // If advancing to picked_up, assign a driver if not already assigned
  if (order.status === 'picked_up' && !order.driverId) {
    const availableDriver = demoData.drivers.find(d => d.status === 'available');
    if (availableDriver) {
      order.driverId = availableDriver.id;
      availableDriver.status = 'busy';
    }
  }
  
  // If delivered, mark driver as available
  if (order.status === 'delivered' && order.driverId) {
    const driver = demoData.drivers.find(d => d.id === order.driverId);
    if (driver) {
      driver.status = 'available';
    }
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

// Get all chefs
function getChefs() {
  return demoData.chefs;
}

// Get chef by slug
function getChefBySlug(slug) {
  return demoData.chefs.find(c => c.slug === slug);
}

// Get chef by ID
function getChefById(chefId) {
  return demoData.chefs.find(c => c.id === chefId);
}

// Create a new order
function createOrder(orderData) {
  const orderId = `ORD-${String(10000 + demoData.orders.length).padStart(5, '0')}`;
  const now = new Date().toISOString();
  
  const order = {
    id: orderId,
    customerId: orderData.customerId,
    chefId: orderData.chefId,
    driverId: null,
    status: 'pending',
    items: orderData.items,
    total: orderData.total,
    deliveryAddress: orderData.deliveryAddress,
    createdAt: now,
    updatedAt: now,
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    pickupWindow: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    deliveryWindow: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    prepTime: orderData.prepTime || 20,
    wave: Math.floor(demoData.orders.length / 10) + 1
  };
  
  demoData.orders.push(order);
  return order;
}

// Get customers
function getCustomers() {
  return demoData.customers;
}

// Get drivers
function getDrivers() {
  return demoData.drivers;
}

module.exports = {
  resetDemoData,
  seedDemoData,
  advanceOrder,
  simulatePayment,
  getAllDemoData,
  getOrders,
  getOrder,
  getChefs,
  getChefBySlug,
  getChefById,
  createOrder,
  getCustomers,
  getDrivers
};
