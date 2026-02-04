// RideNDine v1.1 simulation logic (no external libs)
// Pilot constraints:
// - batch radius: 5km (orders grouped near each other / cook)
// - max order distance from cook: 20km

window.RD = window.RD || {};

RD.CONFIG = {
  city: "Hamilton",
  batchRadiusKm: 5,
  maxOrderKmFromCook: 20,
  avgSpeedKmh: 28,      // urban average
  pickupMinutes: 4,     // time at cook
  dropoffMinutes: 3,    // time at customer
  baseDriverPay: 4.0,   // per stop base payout (demo)
  payPerKm: 0.65,       // demo driver rate
  orderValueAvg: 30.0,
  commissionSplit: { chef: 0.30, platform: 0.40, delivery: 0.30 },
  cooks: [
    { id: "C1", name: "Cook #1", x: 20, y: 55 },
    { id: "C2", name: "Cook #2", x: 55, y: 30 },
    { id: "C3", name: "Cook #3", x: 75, y: 70 }
  ]
};

// Simple deterministic RNG (seeded) so demo is repeatable
RD.rng = function(seed = 12345) {
  let s = seed >>> 0;
  return function() {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

// Demo coordinate system: 0..100 (grid). Convert grid distance to km.
RD.gridDistToKm = function(d) {
  // 100 grid units ~ 30km across city (demo scale)
  return (d / 100) * 30;
};

RD.dist = function(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
};

// Generate orders around cooks with constraint max 20km from cook
RD.generateOrders = function({ count = 50, hours = 6, seed = 42 }) {
  const rand = RD.rng(seed);
  const cooks = RD.CONFIG.cooks;

  const orders = [];
  const startTs = Date.now();

  for (let i = 0; i < count; i++) {
    const cook = cooks[Math.floor(rand() * cooks.length)];

    // Generate a customer point near cook, but enforce <= 20km
    let customer, kmFromCook;
    for (let tries = 0; tries < 200; tries++) {
      const angle = rand() * Math.PI * 2;
      const r = rand() * 40; // in grid units
      const x = Math.max(0, Math.min(100, cook.x + Math.cos(angle) * r));
      const y = Math.max(0, Math.min(100, cook.y + Math.sin(angle) * r));
      customer = { x, y };
      kmFromCook = RD.gridDistToKm(RD.dist(cook, customer));
      if (kmFromCook <= RD.CONFIG.maxOrderKmFromCook) break;
    }

    const minutesIntoWindow = Math.floor(rand() * (hours * 60));
    const createdAt = new Date(startTs + minutesIntoWindow * 60_000);

    // Order value ~ $30 avg
    const value = (RD.CONFIG.orderValueAvg * (0.75 + rand() * 0.7)).toFixed(2);

    orders.push({
      id: `O${String(i + 1).padStart(4, "0")}`,
      cookId: cook.id,
      cookName: cook.name,
      cookX: cook.x, cookY: cook.y,
      custX: customer.x, custY: customer.y,
      createdAt,
      value: Number(value),
      kmFromCook
    });
  }

  // Sort by time
  orders.sort((a, b) => a.createdAt - b.createdAt);
  return orders;
};

// Batch orders by cook + within 5km customer proximity
RD.batchOrders = function(orders) {
  const radiusKm = RD.CONFIG.batchRadiusKm;
  const radiusGrid = (radiusKm / 30) * 100; // inverse of gridDistToKm

  const batches = [];
  const remaining = [...orders];

  while (remaining.length) {
    const seed = remaining.shift();

    const batch = {
      id: `B${String(batches.length + 1).padStart(3, "0")}`,
      cookId: seed.cookId,
      cookName: seed.cookName,
      cookX: seed.cookX,
      cookY: seed.cookY,
      orders: [seed]
    };

    // Add other orders for same cook within radius of the seed customer
    for (let i = remaining.length - 1; i >= 0; i--) {
      const o = remaining[i];
      if (o.cookId !== seed.cookId) continue;

      const dGrid = RD.dist({ x: seed.custX, y: seed.custY }, { x: o.custX, y: o.custY });
      if (dGrid <= radiusGrid) {
        batch.orders.push(o);
        remaining.splice(i, 1);
      }
    }

    batches.push(batch);
  }

  return batches;
};

// Assign drivers and simulate routes (simple heuristic):
// - One driver per batch
// - Driver goes: start -> cook -> dropoffs (nearest-neighbor)
RD.runSimulation = function({ orders }) {
  const batches = RD.batchOrders(orders);

  const drivers = [];
  const deliveries = [];

  const speed = RD.CONFIG.avgSpeedKmh;
  const pickupMin = RD.CONFIG.pickupMinutes;
  const dropMin = RD.CONFIG.dropoffMinutes;

  const mkDriver = (idx) => ({
    id: `D${String(idx).padStart(3, "0")}`,
    trips: 0,
    stops: 0,
    km: 0,
    minutes: 0,
    earnings: 0
  });

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const driver = mkDriver(drivers.length + 1);

    // Route planning: nearest-neighbor among dropoffs
    const cook = { x: batch.cookX, y: batch.cookY };

    let remainingStops = batch.orders.map(o => ({ x: o.custX, y: o.custY, orderId: o.id }));
    let current = cook;

    // Start at cook (assume driver "appears" at cook for demo)
    let totalKm = 0;
    let totalMin = pickupMin;

    const stopSequence = [];

    while (remainingStops.length) {
      // Find nearest next stop
      let bestIdx = 0;
      let bestD = Infinity;
      for (let i = 0; i < remainingStops.length; i++) {
        const d = RD.gridDistToKm(RD.dist(current, remainingStops[i]));
        if (d < bestD) { bestD = d; bestIdx = i; }
      }

      const next = remainingStops.splice(bestIdx, 1)[0];
      totalKm += bestD;
      totalMin += (bestD / speed) * 60; // travel time
      totalMin += dropMin;

      stopSequence.push({ orderId: next.orderId, kmFromPrev: bestD });
      current = next;
    }

    // Driver pay (demo): base per stop + per km
    const driverPay = (RD.CONFIG.baseDriverPay * batch.orders.length) + (RD.CONFIG.payPerKm * totalKm);

    // Revenue split per order (Chef 30, Platform 40, Delivery 30)
    const totalOrderValue = batch.orders.reduce((s, o) => s + o.value, 0);
    const chefShare = totalOrderValue * RD.CONFIG.commissionSplit.chef;
    const platformShare = totalOrderValue * RD.CONFIG.commissionSplit.platform;
    const deliveryShare = totalOrderValue * RD.CONFIG.commissionSplit.delivery;

    // Delivery margin is delivery share - driver pay (for demo)
    const deliveryMargin = deliveryShare - driverPay;

    driver.trips += 1;
    driver.stops += batch.orders.length;
    driver.km += totalKm;
    driver.minutes += totalMin;
    driver.earnings += driverPay;

    drivers.push(driver);

    deliveries.push({
      batchId: batch.id,
      cookName: batch.cookName,
      orders: batch.orders.length,
      km: Number(totalKm.toFixed(2)),
      minutes: Number(totalMin.toFixed(1)),
      orderValue: Number(totalOrderValue.toFixed(2)),
      chefShare: Number(chefShare.toFixed(2)),
      platformShare: Number(platformShare.toFixed(2)),
      deliveryShare: Number(deliveryShare.toFixed(2)),
      driverPay: Number(driverPay.toFixed(2)),
      deliveryMargin: Number(deliveryMargin.toFixed(2))
    });
  }

  // Totals
  const totals = deliveries.reduce((t, d) => {
    t.orders += d.orders;
    t.batches += 1;
    t.km += d.km;
    t.minutes += d.minutes;
    t.orderValue += d.orderValue;
    t.chefShare += d.chefShare;
    t.platformShare += d.platformShare;
    t.deliveryShare += d.deliveryShare;
    t.driverPay += d.driverPay;
    t.deliveryMargin += d.deliveryMargin;
    return t;
  }, {
    orders: 0, batches: 0, km: 0, minutes: 0,
    orderValue: 0, chefShare: 0, platformShare: 0, deliveryShare: 0,
    driverPay: 0, deliveryMargin: 0
  });

  // Averages
  const avgDeliveryMin = totals.batches ? (totals.minutes / totals.batches) : 0;

  return {
    batches,
    drivers,
    deliveries,
    totals: {
      ...Object.fromEntries(Object.entries(totals).map(([k,v]) => [k, Number(v.toFixed(2))])),
      avgDeliveryMin: Number(avgDeliveryMin.toFixed(1))
    }
  };
};

