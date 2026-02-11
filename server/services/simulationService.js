const db = require('../db');
const dataService = require('./dataService');

// Haversine distance calculation (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

// Generate random Toronto coordinates
function generateTorontoCoords() {
  const baseLat = 43.6532;
  const baseLng = -79.3832;
  const offset = 0.05; // ~5km radius
  return {
    lat: baseLat + (Math.random() - 0.5) * offset,
    lng: baseLng + (Math.random() - 0.5) * offset
  };
}

// Generate simulation data
async function generateSimulation(count = 100, windowMinutes = 360) {
  console.log(`🎬 Starting simulation: ${count} orders over ${windowMinutes} minutes`);

  const results = {
    ordersCreated: 0,
    routesCreated: 0,
    driversAssigned: 0,
    totalRevenue: 0,
    timestamp: new Date(),
    simulation_id: `SIM-${Date.now()}`
  };

  try {
    const isDb = dataService.isDbAvailable();

    // Get or create chefs
    let chefs = await dataService.getAllChefs();
    if (chefs.length === 0) {
      // Create default demo chefs if none exist
      const demoChefs = [
        { email: 'chef1@demo.com', name: 'Chef One', slug: 'chef-one' },
        { email: 'chef2@demo.com', name: 'Chef Two', slug: 'chef-two' },
        { email: 'chef3@demo.com', name: 'Chef Three', slug: 'chef-three' }
      ];

      if (isDb) {
        for (const chef of demoChefs) {
          const user = await dataService.createUser(chef.email, chef.name, '+1-555-0000', 'chef');
          await db.query(`
            INSERT INTO chefs (user_id, display_name, slug, pickup_geo, prep_capacity_per_hour)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (slug) DO NOTHING
          `, [user.id, chef.name, chef.slug, JSON.stringify(generateTorontoCoords()), 10]);
        }
        chefs = await dataService.getAllChefs();
      } else {
        // Create in-memory chefs for demo mode
        chefs = demoChefs.map((chef, idx) => ({
          id: idx + 1,
          display_name: chef.name,
          slug: chef.slug,
          pickup_geo: generateTorontoCoords()
        }));
      }
    }

    // Get or create drivers
    let drivers = await dataService.getAllDrivers();
    if (drivers.length === 0) {
      const demoDrivers = [
        { email: 'driver1@demo.com', name: 'Driver One' },
        { email: 'driver2@demo.com', name: 'Driver Two' },
        { email: 'driver3@demo.com', name: 'Driver Three' }
      ];

      if (isDb) {
        for (const driver of demoDrivers) {
          const user = await dataService.createUser(driver.email, driver.name, '+1-555-0000', 'driver');
          await db.query(`
            INSERT INTO drivers (user_id, vehicle_type, status, current_geo)
            VALUES ($1, $2, $3, $4)
          `, [user.id, 'car', 'available', JSON.stringify(generateTorontoCoords())]);
        }
        drivers = await dataService.getAllDrivers();
      } else {
        // Create in-memory drivers for demo mode
        drivers = demoDrivers.map((driver, idx) => ({
          id: idx + 1,
          name: driver.name,
          status: 'available',
          current_geo: generateTorontoCoords()
        }));
      }
    }

    // Create or get simulation customer
    let customer;
    if (isDb) {
      customer = await dataService.findUserByEmail('simulation@demo.com');
      if (!customer) {
        const user = await dataService.createUser('simulation@demo.com', 'Simulation Customer', '+1-555-0000', 'customer');
        await db.query(`
          INSERT INTO customers (user_id, saved_addresses)
          VALUES ($1, $2)
        `, [user.id, JSON.stringify([])]);
        customer = user;
      }
    } else {
      customer = { id: 9999, email: 'simulation@demo.com', name: 'Simulation Customer', role: 'customer' };
    }

    // Generate orders
    const orders = [];
    const now = new Date();
    const intervalMs = (windowMinutes * 60 * 1000) / count;

    for (let i = 0; i < count; i++) {
      const chef = chefs[Math.floor(Math.random() * chefs.length)];
      const orderTime = new Date(now.getTime() + i * intervalMs);
      const deliveryCoords = generateTorontoCoords();

      const subtotal = 15 + Math.random() * 35; // $15-50
      const fees = 3.99;
      const tax = subtotal * 0.13; // 13% HST
      const total = subtotal + fees + tax;

      if (isDb) {
        // Get customer record
        const customerRecord = await db.query('SELECT id FROM customers WHERE user_id = $1', [customer.id]);
        const customerId = customerRecord.rows[0]?.id || 1;

        const order = await dataService.createOrder(
          customerId,
          chef.id,
          [], // items can be empty for simulation
          deliveryCoords,
          { subtotal, fees, tax, total }
        );

        // Create delivery record
        await db.query(`
          INSERT INTO deliveries (order_id, status, eta, distance_km)
          VALUES ($1, $2, $3, $4)
        `, [
          order.id,
          'pending',
          new Date(orderTime.getTime() + 45 * 60 * 1000), // ETA +45 mins
          haversineDistance(chef.pickup_geo?.lat || 43.6532, chef.pickup_geo?.lng || -79.3832, deliveryCoords.lat, deliveryCoords.lng)
        ]);

        orders.push({ ...order, delivery_address: deliveryCoords });
      } else {
        orders.push({
          id: 10000 + i,
          customer_id: customer.id,
          chef_id: chef.id,
          status: 'pending',
          delivery_address: deliveryCoords,
          subtotal,
          fees,
          tax,
          total,
          created_at: orderTime
        });
      }

      results.ordersCreated++;
      results.totalRevenue += total;
    }

    // Create routes using simple batching
    if (isDb && drivers.length > 0) {
      const batchSize = 5; // Orders per route
      const batches = [];

      for (let i = 0; i < orders.length; i += batchSize) {
        const batchOrders = orders.slice(i, i + batchSize);
        const driver = drivers[batches.length % drivers.length];

        // Simple routing: calculate total distance
        let totalDistance = 0;
        const stops = batchOrders.map((order, idx) => {
          if (idx > 0) {
            const prevAddr = batchOrders[idx - 1].delivery_address;
            const currAddr = order.delivery_address;
            totalDistance += haversineDistance(prevAddr.lat, prevAddr.lng, currAddr.lat, currAddr.lng);
          }
          return {
            order_id: order.id,
            address: order.delivery_address,
            sequence: idx + 1
          };
        });

        const avgSpeed = 30; // km/h in city
        const duration = Math.ceil((totalDistance / avgSpeed) * 60); // minutes

        const route = await db.query(`
          INSERT INTO routes (batch_id, driver_id, stops_json, optimized_distance_km, optimized_duration_min, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          results.simulation_id,
          driver.id,
          JSON.stringify(stops),
          totalDistance.toFixed(2),
          duration,
          'pending'
        ]);

        // Update deliveries with route assignment
        for (const order of batchOrders) {
          await db.query(`
            UPDATE deliveries
            SET route_id = $1, driver_id = $2, status = 'assigned'
            WHERE order_id = $3
          `, [route.rows[0].id, driver.id, order.id]);
        }

        batches.push(route.rows[0]);
        results.routesCreated++;
      }

      results.driversAssigned = drivers.length;
    }

    console.log('✅ Simulation complete:', results);
    return results;
  } catch (error) {
    console.error('❌ Simulation error:', error);
    throw error;
  }
}

// Get dashboard metrics
async function getDashboardMetrics() {
  const isDb = dataService.isDbAvailable();

  if (!isDb) {
    // Return mock metrics in demo mode
    return {
      orders: {
        total: 247,
        pending: 15,
        preparing: 32,
        ready: 8,
        on_route: 12,
        delivered: 180
      },
      timeMetrics: {
        avgPrepTimeMin: 28,
        avgDispatchTimeMin: 12,
        avgDeliveryTimeMin: 35,
        onTimePercent: 87
      },
      batchMetrics: {
        ordersPerRoute: 4.8,
        avgRouteDurationMin: 42,
        avgDistanceKm: 8.5,
        utilizationPercent: 76
      },
      financial: {
        grossSales: 8547.32,
        fees: 985.03,
        tax: 1111.15,
        totalRevenue: 10643.50
      },
      drivers: {
        active: 8,
        idlePercent: 24,
        deliveriesPerHour: 2.3
      },
      timestamp: new Date()
    };
  }

  try {
    // Get order counts by status
    const orderStats = await db.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    const orders = {
      total: 0,
      pending: 0,
      preparing: 0,
      ready: 0,
      on_route: 0,
      delivered: 0,
      cancelled: 0
    };

    orderStats.rows.forEach(row => {
      orders[row.status] = parseInt(row.count);
      orders.total += parseInt(row.count);
    });

    // Get time metrics
    const timeMetricsResult = await db.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (delivered_at - created_at)) / 60) as avg_total_time,
        COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as delivered_count
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      WHERE d.delivered_at IS NOT NULL
    `);

    const timeMetrics = {
      avgPrepTimeMin: 28, // Placeholder, would need status transitions
      avgDispatchTimeMin: 12,
      avgDeliveryTimeMin: Math.round(timeMetricsResult.rows[0]?.avg_total_time || 35),
      onTimePercent: 87
    };

    // Get route metrics
    const routeMetrics = await db.query(`
      SELECT 
        AVG(optimized_duration_min) as avg_duration,
        AVG(optimized_distance_km) as avg_distance,
        AVG(jsonb_array_length(stops_json)) as avg_stops
      FROM routes
      WHERE status != 'pending'
    `);

    const batchMetrics = {
      ordersPerRoute: parseFloat(routeMetrics.rows[0]?.avg_stops || 4.8).toFixed(1),
      avgRouteDurationMin: Math.round(routeMetrics.rows[0]?.avg_duration || 42),
      avgDistanceKm: parseFloat(routeMetrics.rows[0]?.avg_distance || 8.5).toFixed(1),
      utilizationPercent: 76
    };

    // Get financial metrics
    const financialResult = await db.query(`
      SELECT 
        SUM(subtotal) as gross_sales,
        SUM(fees) as total_fees,
        SUM(tax) as total_tax,
        SUM(total) as total_revenue
      FROM orders
      WHERE status != 'cancelled'
    `);

    const financial = {
      grossSales: parseFloat(financialResult.rows[0]?.gross_sales || 0),
      fees: parseFloat(financialResult.rows[0]?.total_fees || 0),
      tax: parseFloat(financialResult.rows[0]?.total_tax || 0),
      totalRevenue: parseFloat(financialResult.rows[0]?.total_revenue || 0)
    };

    // Get driver metrics
    const driverStats = await db.query(`
      SELECT 
        COUNT(*) as total_drivers,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as idle_drivers,
        COUNT(CASE WHEN status = 'on_route' THEN 1 END) as active_drivers
      FROM drivers
    `);

    const drivers = {
      active: parseInt(driverStats.rows[0]?.active_drivers || 0),
      idle: parseInt(driverStats.rows[0]?.idle_drivers || 0),
      idlePercent: Math.round((parseInt(driverStats.rows[0]?.idle_drivers || 0) / Math.max(parseInt(driverStats.rows[0]?.total_drivers || 1), 1)) * 100),
      deliveriesPerHour: 2.3
    };

    return {
      orders,
      timeMetrics,
      batchMetrics,
      financial,
      drivers,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw error;
  }
}

module.exports = {
  generateSimulation,
  getDashboardMetrics
};
