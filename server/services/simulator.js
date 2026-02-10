/**
 * RideNDine Order Simulator
 * Generates and simulates 100 orders with realistic progression through lifecycle
 */

const crypto = require('crypto');

// Simulator state
let simulatorState = {
  isRunning: false,
  speed: 1, // 1x, 5x, 20x
  currentTime: Date.now(),
  orders: [],
  drivers: [],
  stores: [],
  intervalId: null
};

// Hamilton base coordinates
const HAMILTON_CENTER = { lat: 43.2557, lng: -79.8711 };

// Store definitions (including Hoang Gia Pho)
const STORE_TEMPLATES = [
  {
    id: 'store_hoang_gia_pho',
    name: 'Hoang Gia Pho',
    cuisine: 'Vietnamese',
    lat: 43.2557,
    lng: -79.8711,
    avgPrepTime: 15, // minutes
    website: 'https://hoang-gia-pho-site-of8l.vercel.app/hoang-gia-pho-delivery.html'
  },
  {
    id: 'store_mamas_kitchen',
    name: "Mama's Kitchen",
    cuisine: 'Italian',
    lat: 43.2601,
    lng: -79.8656,
    avgPrepTime: 20
  },
  {
    id: 'store_spice_house',
    name: 'Spice House',
    cuisine: 'Indian',
    lat: 43.2512,
    lng: -79.8798,
    avgPrepTime: 18
  },
  {
    id: 'store_sushi_express',
    name: 'Sushi Express',
    cuisine: 'Japanese',
    lat: 43.2589,
    lng: -79.8745,
    avgPrepTime: 12
  },
  {
    id: 'store_burrito_bar',
    name: 'Burrito Bar',
    cuisine: 'Mexican',
    lat: 43.2534,
    lng: -79.8689,
    avgPrepTime: 10
  }
];

// Menu items by store
const MENU_ITEMS = {
  store_hoang_gia_pho: [
    { name: 'Pho Bo', price: 12.99 },
    { name: 'Pho Ga', price: 11.99 },
    { name: 'Bun Cha', price: 13.99 },
    { name: 'Spring Rolls', price: 6.99 }
  ],
  store_mamas_kitchen: [
    { name: 'Margherita Pizza', price: 14.99 },
    { name: 'Pasta Carbonara', price: 15.99 },
    { name: 'Lasagna', price: 16.99 },
    { name: 'Tiramisu', price: 7.99 }
  ],
  store_spice_house: [
    { name: 'Butter Chicken', price: 14.99 },
    { name: 'Palak Paneer', price: 12.99 },
    { name: 'Biryani', price: 13.99 },
    { name: 'Naan Bread', price: 3.99 }
  ],
  store_sushi_express: [
    { name: 'California Roll', price: 8.99 },
    { name: 'Salmon Sashimi', price: 15.99 },
    { name: 'Spicy Tuna Roll', price: 10.99 },
    { name: 'Miso Soup', price: 4.99 }
  ],
  store_burrito_bar: [
    { name: 'Chicken Burrito', price: 11.99 },
    { name: 'Beef Tacos', price: 9.99 },
    { name: 'Veggie Bowl', price: 10.99 },
    { name: 'Nachos', price: 7.99 }
  ]
};

// Driver templates
const DRIVER_TEMPLATES = [
  { name: 'Alex Chen', vehicle: 'Honda Civic', capacity: 4 },
  { name: 'Sarah Johnson', vehicle: 'Toyota Corolla', capacity: 4 },
  { name: 'Mike Rodriguez', vehicle: 'Ford Focus', capacity: 3 },
  { name: 'Emily Davis', vehicle: 'Mazda 3', capacity: 4 },
  { name: 'James Wilson', vehicle: 'Hyundai Elantra', capacity: 4 },
  { name: 'Lisa Anderson', vehicle: 'Nissan Sentra', capacity: 3 },
  { name: 'David Lee', vehicle: 'Volkswagen Jetta', capacity: 4 },
  { name: 'Maria Garcia', vehicle: 'Kia Forte', capacity: 4 },
  { name: 'Robert Taylor', vehicle: 'Chevrolet Cruze', capacity: 3 },
  { name: 'Jennifer Martinez', vehicle: 'Subaru Impreza', capacity: 4 }
];

// Customer names
const CUSTOMER_NAMES = [
  'John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Williams', 'Charlie Brown',
  'Diana Prince', 'Frank Castle', 'Grace Kelly', 'Henry Ford', 'Iris West',
  'Jack Ryan', 'Kate Bishop', 'Liam Neeson', 'Mary Jane', 'Nathan Drake',
  'Olivia Pope', 'Peter Parker', 'Quinn Fabray', 'Rachel Green', 'Sam Wilson'
];

// Order status lifecycle
const ORDER_STATUSES = [
  'created',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'en_route',
  'delivered'
];

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate random coordinate near Hamilton
 */
function randomNearbyCoordinate(baseLat, baseLng, radiusKm = 5) {
  const radiusInDegrees = radiusKm / 111; // Rough conversion
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return {
    lat: baseLat + x,
    lng: baseLng + y
  };
}

/**
 * Generate order ID
 */
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `SIM-${timestamp}${random}`.toUpperCase();
}

/**
 * Initialize simulator with stores and drivers
 */
function initializeSimulator() {
  // Initialize stores
  simulatorState.stores = STORE_TEMPLATES.map(template => ({
    ...template,
    activeOrders: 0,
    completedOrders: 0,
    totalPrepTime: 0,
    avgActualPrepTime: 0
  }));

  // Initialize drivers
  simulatorState.drivers = DRIVER_TEMPLATES.map((template, idx) => ({
    id: `driver_${idx + 1}`,
    ...template,
    status: 'idle', // idle, assigned, delivering
    currentLat: HAMILTON_CENTER.lat + (Math.random() - 0.5) * 0.02,
    currentLng: HAMILTON_CENTER.lng + (Math.random() - 0.5) * 0.02,
    assignedOrders: [],
    currentRoute: [],
    deliveredCount: 0,
    totalDistance: 0,
    utilization: 0
  }));

  simulatorState.orders = [];
  simulatorState.currentTime = Date.now();
}

/**
 * Generate 100 orders
 */
function generate100Orders() {
  const orders = [];
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const store = STORE_TEMPLATES[Math.floor(Math.random() * STORE_TEMPLATES.length)];
    const menuItems = MENU_ITEMS[store.id];
    
    // Random 1-3 items
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const selectedItems = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const item = menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      selectedItems.push({ ...item, quantity });
      subtotal += item.price * quantity;
    }
    
    const tax = subtotal * 0.13; // 13% HST
    const total = subtotal + tax;
    
    // Generate delivery location within 5km of store
    const deliveryLocation = randomNearbyCoordinate(store.lat, store.lng, 5);
    const distance = haversineDistance(store.lat, store.lng, deliveryLocation.lat, deliveryLocation.lng);
    
    // Calculate estimated times
    const roadFactor = 1.25 + Math.random() * 0.2; // 1.25-1.45
    const roadDistance = distance * roadFactor;
    const speed = 25 + Math.random() * 15; // 25-40 km/h
    const travelTime = (roadDistance / speed) * 60; // minutes
    const prepTime = store.avgPrepTime + (Math.random() * 10 - 5); // ±5 min variation
    const totalTime = prepTime + travelTime;
    
    // Stagger creation times over the past hour
    const createdAt = new Date(now - Math.random() * 3600000).toISOString();
    
    const order = {
      id: generateOrderId(),
      storeId: store.id,
      storeName: store.name,
      customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
      address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'King', 'Queen', 'York', 'James'][Math.floor(Math.random() * 5)]} St`,
      lat: deliveryLocation.lat,
      lng: deliveryLocation.lng,
      items: selectedItems,
      subtotal,
      tax,
      total,
      status: 'created',
      createdAt,
      updatedAt: createdAt,
      statusHistory: [{ status: 'created', timestamp: createdAt }],
      estimatedPrepTime: Math.round(prepTime),
      estimatedDeliveryTime: Math.round(totalTime),
      distance: Math.round(distance * 100) / 100,
      driverId: null,
      slaTarget: new Date(new Date(createdAt).getTime() + totalTime * 60000).toISOString()
    };
    
    orders.push(order);
  }
  
  // Sort by creation time
  orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  return orders;
}

/**
 * Update simulator state (called every second * speed)
 */
function updateSimulator() {
  if (!simulatorState.isRunning) return;
  
  const deltaMs = 1000 * simulatorState.speed; // 1 second * speed multiplier
  simulatorState.currentTime += deltaMs;
  
  // Process each order
  simulatorState.orders.forEach(order => {
    const orderAge = simulatorState.currentTime - new Date(order.createdAt).getTime();
    const ageMinutes = orderAge / 60000;
    
    // Advance order status based on time
    if (order.status === 'created' && ageMinutes > 1) {
      advanceOrderStatus(order, 'accepted');
    } else if (order.status === 'accepted' && ageMinutes > 2) {
      advanceOrderStatus(order, 'preparing');
    } else if (order.status === 'preparing' && ageMinutes > order.estimatedPrepTime) {
      advanceOrderStatus(order, 'ready');
    } else if (order.status === 'ready' && !order.driverId) {
      assignDriver(order);
    } else if (order.status === 'ready' && order.driverId && ageMinutes > order.estimatedPrepTime + 5) {
      advanceOrderStatus(order, 'picked_up');
    } else if (order.status === 'picked_up' || order.status === 'en_route') {
      updateDeliveryProgress(order);
    }
  });
  
  // Update driver positions
  updateDriverPositions();
}

/**
 * Advance order to next status
 */
function advanceOrderStatus(order, newStatus) {
  order.status = newStatus;
  order.updatedAt = new Date(simulatorState.currentTime).toISOString();
  order.statusHistory.push({
    status: newStatus,
    timestamp: order.updatedAt
  });
}

/**
 * Assign driver to order (simple nearest driver logic)
 */
function assignDriver(order) {
  const availableDrivers = simulatorState.drivers.filter(d => 
    d.status === 'idle' || (d.assignedOrders.length < d.capacity && d.status === 'assigned')
  );
  
  if (availableDrivers.length === 0) return;
  
  // Find nearest driver
  const store = simulatorState.stores.find(s => s.id === order.storeId);
  let nearestDriver = null;
  let minDistance = Infinity;
  
  availableDrivers.forEach(driver => {
    const dist = haversineDistance(driver.currentLat, driver.currentLng, store.lat, store.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestDriver = driver;
    }
  });
  
  if (nearestDriver) {
    order.driverId = nearestDriver.id;
    nearestDriver.assignedOrders.push(order.id);
    nearestDriver.status = 'assigned';
    
    // Build route: driver -> store -> delivery
    nearestDriver.currentRoute = [
      { type: 'pickup', lat: store.lat, lng: store.lng, orderId: order.id },
      { type: 'delivery', lat: order.lat, lng: order.lng, orderId: order.id }
    ];
  }
}

/**
 * Update delivery progress
 */
function updateDeliveryProgress(order) {
  const driver = simulatorState.drivers.find(d => d.id === order.driverId);
  if (!driver) return;
  
  // Calculate progress based on time
  const pickupTime = order.statusHistory.find(h => h.status === 'picked_up')?.timestamp;
  if (!pickupTime) return;
  
  const timeSincePickup = (simulatorState.currentTime - new Date(pickupTime).getTime()) / 60000; // minutes
  const estimatedTravelTime = order.estimatedDeliveryTime - order.estimatedPrepTime;
  const progress = Math.min(timeSincePickup / estimatedTravelTime, 1);
  
  // Update driver position (interpolate between store and delivery)
  const store = simulatorState.stores.find(s => s.id === order.storeId);
  driver.currentLat = store.lat + (order.lat - store.lat) * progress;
  driver.currentLng = store.lng + (order.lng - store.lng) * progress;
  
  // Mark en_route if not already
  if (order.status === 'picked_up' && progress > 0.1) {
    advanceOrderStatus(order, 'en_route');
  }
  
  // Deliver when reached
  if (progress >= 1 && order.status === 'en_route') {
    advanceOrderStatus(order, 'delivered');
    driver.status = 'idle';
    driver.assignedOrders = driver.assignedOrders.filter(id => id !== order.id);
    driver.deliveredCount++;
    driver.currentRoute = [];
  }
}

/**
 * Update driver positions
 */
function updateDriverPositions() {
  simulatorState.drivers.forEach(driver => {
    if (driver.status === 'idle') {
      // Idle drivers wander slightly
      driver.currentLat += (Math.random() - 0.5) * 0.001;
      driver.currentLng += (Math.random() - 0.5) * 0.001;
    }
  });
}

/**
 * Start simulator
 */
function startSimulator(speed = 1) {
  if (simulatorState.isRunning) return;
  
  simulatorState.isRunning = true;
  simulatorState.speed = speed;
  
  // Update every second
  simulatorState.intervalId = setInterval(updateSimulator, 1000);
}

/**
 * Pause simulator
 */
function pauseSimulator() {
  simulatorState.isRunning = false;
  if (simulatorState.intervalId) {
    clearInterval(simulatorState.intervalId);
    simulatorState.intervalId = null;
  }
}

/**
 * Reset simulator
 */
function resetSimulator() {
  pauseSimulator();
  initializeSimulator();
}

/**
 * Get simulator state
 */
function getSimulatorState() {
  // Calculate KPIs
  const activeOrders = simulatorState.orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const deliveredOrders = simulatorState.orders.filter(o => o.status === 'delivered').length;
  
  const deliveredOrdersList = simulatorState.orders.filter(o => o.status === 'delivered');
  const avgPrepTime = deliveredOrdersList.length > 0
    ? deliveredOrdersList.reduce((sum, o) => {
        const prepStart = new Date(o.createdAt);
        const prepEnd = new Date(o.statusHistory.find(h => h.status === 'ready')?.timestamp || o.createdAt);
        return sum + (prepEnd - prepStart) / 60000;
      }, 0) / deliveredOrdersList.length
    : 0;
    
  const avgDeliveryTime = deliveredOrdersList.length > 0
    ? deliveredOrdersList.reduce((sum, o) => {
        const start = new Date(o.createdAt);
        const end = new Date(o.statusHistory.find(h => h.status === 'delivered')?.timestamp || o.createdAt);
        return sum + (end - start) / 60000;
      }, 0) / deliveredOrdersList.length
    : 0;
  
  const onTimeOrders = deliveredOrdersList.filter(o => {
    const delivered = new Date(o.statusHistory.find(h => h.status === 'delivered')?.timestamp);
    const target = new Date(o.slaTarget);
    return delivered <= target;
  }).length;
  
  const onTimePercentage = deliveredOrdersList.length > 0
    ? (onTimeOrders / deliveredOrdersList.length) * 100
    : 0;
  
  const totalDrivers = simulatorState.drivers.length;
  const activeDrivers = simulatorState.drivers.filter(d => d.status !== 'idle').length;
  const driverUtilization = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;
  
  return {
    isRunning: simulatorState.isRunning,
    speed: simulatorState.speed,
    currentTime: simulatorState.currentTime,
    orders: simulatorState.orders,
    drivers: simulatorState.drivers,
    stores: simulatorState.stores,
    kpis: {
      activeOrders,
      deliveredOrders,
      totalOrders: simulatorState.orders.length,
      avgPrepTime: Math.round(avgPrepTime),
      avgDeliveryTime: Math.round(avgDeliveryTime),
      onTimePercentage: Math.round(onTimePercentage),
      driverUtilization: Math.round(driverUtilization)
    }
  };
}

module.exports = {
  initializeSimulator,
  generate100Orders,
  startSimulator,
  pauseSimulator,
  resetSimulator,
  getSimulatorState,
  get state() { return simulatorState; },
  set state(newState) { simulatorState = newState; }
};
