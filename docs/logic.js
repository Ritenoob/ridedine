window.RD = window.RD || {};

/**
 * RideNDine Demo v0.7.0 (Centennial Batch Center)
 * - Hub: 75 Centennial Parkway N, Hamilton, ON (Eastgate Square area)
 * - 4 chef cooks within 2km of the hub
 * - Service radius: 20km from the hub
 * - Simulation tracks: cars (drivers), batches, orders, and per-batch routes/timelines
 */

RD.AREA = {
  name: "75 Centennial Parkway N (Hamilton, ON)",
  hub: { lat: 43.228648, lng: -79.765785 }, // Eastgate Square GPS
  serviceRadiusKm: 20
};

// Derived map bounds from a radius (approx; good enough for demo)
RD.boundsFromRadiusKm = function(center, radiusKm) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos(center.lat * Math.PI / 180));
  return {
    north: center.lat + dLat,
    south: center.lat - dLat,
    west: center.lng - dLng,
    east: center.lng + dLng
  };
};

RD.CONFIG = {
  city: "Hamilton, Ontario (Centennial Batch Center)",
  hubLabel: "Batch Center (75 Centennial Pkwy N)",
  batchRadiusKm: 5,             // customer-to-customer clustering per cook
  maxOrderKmFromCook: 20,       // max customer distance from cook
  serviceRadiusKm: 20,          // hard limit from hub (city operating radius)

  // Timing + economics
  avgSpeedKmh: 28,
  cookPrepMinutes: 12,
  pickupMinutes: 4,
  dropoffMinutes: 3,

  baseDriverPay: 4.0,
  payPerKm: 0.65,

  orderValueAvg: 30.0,
  split: { chef: 0.30, platform: 0.40, delivery: 0.30 },

  // Fleet (cars)
  drivers: 6,

  // 4 chefs/cooks within ~2km of 75 Centennial Pkwy N
  cooks: [
    { id: "C1", name: "Chef #1 (Centennial North)", lat: 43.2376570090, lng: -79.7608392496 },
    { id: "C2", name: "Chef #2 (Centennial East)",  lat: 43.2214407928, lng: -79.7583663744 },
    { id: "C3", name: "Chef #3 (Centennial West)",  lat: 43.2331525045, lng: -79.7806222511 },
    { id: "C4", name: "Chef #4 (Centennial South)", lat: 43.2232425946, lng: -79.7719671880 }
  ]
};

RD.rng = function(seed = 12345) {
  let s = seed >>> 0;
  return function() {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

RD.haversineKm = function(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const h = sin1*sin1 + Math.cos(lat1)*Math.cos(lat2)*sin2*sin2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Random point within a circle (uniform by area)
RD.randomPointInRadiusKm = function(rand, center, radiusKm) {
  const u = rand();
  const v = rand();
  const r = radiusKm * Math.sqrt(u);
  const ang = 2 * Math.PI * v;

  const kmNorth = r * Math.cos(ang);
  const kmEast  = r * Math.sin(ang);

  const lat = center.lat + (kmNorth / 111);
  const lng = center.lng + (kmEast / (111 * Math.cos(center.lat * Math.PI / 180)));
  return { lat, lng };
};

RD.randomCustomerNearCook = function(rand, cook, maxKmFromCook) {
  const hub = RD.AREA.hub;
  const serviceKm = RD.CONFIG.serviceRadiusKm;

  for (let tries = 0; tries < 400; tries++) {
    // generate around cook first (so distribution remains "restaurant-centric")
    const pt = RD.randomPointInRadiusKm(rand, { lat: cook.lat, lng: cook.lng }, maxKmFromCook);

    // enforce hub service radius
    const kmFromHub = RD.haversineKm(hub, pt);
    if (kmFromHub > serviceKm) continue;

    const kmFromCook = RD.haversineKm(cook, pt);
    if (kmFromCook > maxKmFromCook) continue;

    return { lat: pt.lat, lng: pt.lng, kmFromCook };
  }

  // Fallback
  return { lat: cook.lat, lng: cook.lng, kmFromCook: 0 };
};

RD.generateOrders = function({ count = 50, hours = 6, seed = 42 }) {
  const rand = RD.rng(seed);
  const cooks = RD.CONFIG.cooks;
  const orders = [];
  const startTs = Date.now();

  for (let i = 0; i < count; i++) {
    const cook = cooks[Math.floor(rand() * cooks.length)];
    const customer = RD.randomCustomerNearCook(rand, cook, RD.CONFIG.maxOrderKmFromCook);

    const minutesIntoWindow = Math.floor(rand() * (hours * 60));
    const createdAt = new Date(startTs + minutesIntoWindow * 60000);

    const value = RD.CONFIG.orderValueAvg * (0.75 + rand() * 0.7);

    orders.push({
      id: `O${String(i + 1).padStart(4, "0")}`,
      cookId: cook.id,
      cookName: cook.name,
      cookLat: cook.lat,
      cookLng: cook.lng,
      custLat: customer.lat,
      custLng: customer.lng,
      createdAt,
      value: Number(value.toFixed(2)),
      kmFromCook: Number(customer.kmFromCook.toFixed(2))
    });
  }

  orders.sort((a, b) => a.createdAt - b.createdAt);
  return orders;
};

// Batch orders by proximity (per cook)
RD.batchOrders = function(orders) {
  const rKm = RD.CONFIG.batchRadiusKm;
  const batches = [];
  const remaining = [...orders].sort((a, b) => a.createdAt - b.createdAt);

  while (remaining.length) {
    const seed = remaining.shift();

    const batch = {
      id: `B${String(batches.length + 1).padStart(3, "0")}`,
      cookId: seed.cookId,
      cookName: seed.cookName,
      cookLat: seed.cookLat,
      cookLng: seed.cookLng,
      createdAt: seed.createdAt,
      orderIds: [seed.id],
      orders: [seed]
    };

    for (let i = remaining.length - 1; i >= 0; i--) {
      const o = remaining[i];
      if (o.cookId !== seed.cookId) continue;

      const dKm = RD.haversineKm(
        { lat: seed.custLat, lng: seed.custLng },
        { lat: o.custLat, lng: o.custLng }
      );

      if (dKm <= rKm) {
        batch.orders.push(o);
        batch.orderIds.push(o.id);
        remaining.splice(i, 1);
      }
    }

    // Keep batches ordered by earliest order time for scheduling
    batch.createdAt = new Date(Math.min(...batch.orders.map(o => o.createdAt.getTime())));
    batches.push(batch);
  }

  batches.sort((a, b) => a.createdAt - b.createdAt);
  return batches;
};

RD.minutesToMs = (m) => m * 60000;

RD.routeNearestNeighbor = function(start, stops) {
  const remaining = [...stops];
  const ordered = [];
  let current = start;

  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = RD.haversineKm(current, remaining[i]);
      if (d < bestD) { bestD = d; bestIdx = i; }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }
  return ordered;
};

RD.runSimulation = function({ orders }) {
  const batches = RD.batchOrders(orders);

  const speed = RD.CONFIG.avgSpeedKmh;
  const cookPrepMin = RD.CONFIG.cookPrepMinutes;
  const pickupMin = RD.CONFIG.pickupMinutes;
  const dropMin = RD.CONFIG.dropoffMinutes;

  // Determine simulation start: earliest order
  const simStart = batches.length ? batches[0].createdAt.getTime() : Date.now();

  const mkDriver = (idx) => ({
    id: `CAR${String(idx).padStart(2, "0")}`,
    trips: 0,
    stops: 0,
    deadheadKm: 0,
    deliveryKm: 0,
    km: 0,
    minutes: 0,
    earnings: 0,
    availableAt: simStart,
    loc: { ...RD.AREA.hub }
  });

  const drivers = Array.from({ length: RD.CONFIG.drivers }, (_, i) => mkDriver(i + 1));
  const deliveries = [];

  const assignDriver = (readyAtMs) => {
    // choose driver who can start the soonest
    let best = drivers[0];
    let bestStart = Infinity;

    for (const d of drivers) {
      const start = Math.max(d.availableAt, readyAtMs);
      if (start < bestStart) { bestStart = start; best = d; }
    }
    return best;
  };

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];

    const cook = { lat: batch.cookLat, lng: batch.cookLng };
    const batchReadyAt = batch.createdAt.getTime() + RD.minutesToMs(cookPrepMin);

    const driver = assignDriver(batchReadyAt);

    const departMs = Math.max(driver.availableAt, batchReadyAt);

    // Drive to cook (deadhead)
    const toCookKm = RD.haversineKm(driver.loc, cook);
    const toCookMin = (toCookKm / speed) * 60;

    const arriveCookMs = departMs + RD.minutesToMs(toCookMin);
    const pickupDoneMs = arriveCookMs + RD.minutesToMs(pickupMin);

    // Route to customers (nearest-neighbor)
    const stopPts = batch.orders.map(o => ({ lat: o.custLat, lng: o.custLng, orderId: o.id }));
    const orderedStops = RD.routeNearestNeighbor(cook, stopPts);

    const route = [];
    const routePoints = [{ type: "hub", ...driver.loc }, { type: "cook", ...cook }];

    // Leg 0: hub -> cook
    route.push({
      fromType: "hub",
      toType: "cook",
      from: { ...driver.loc },
      to: { ...cook },
      km: Number(toCookKm.toFixed(2)),
      minutes: Number(toCookMin.toFixed(1)),
      departAt: new Date(departMs),
      arriveAt: new Date(arriveCookMs)
    });

    let current = cook;
    let tMs = pickupDoneMs;

    let deliveryKm = 0;
    let deliveryMin = pickupMin;

    for (const stop of orderedStops) {
      const legKm = RD.haversineKm(current, stop);
      const legMin = (legKm / speed) * 60;

      const departAt = new Date(tMs);
      const arriveAtMs = tMs + RD.minutesToMs(legMin);
      const arriveAt = new Date(arriveAtMs);

      tMs = arriveAtMs + RD.minutesToMs(dropMin);

      route.push({
        fromType: current.orderId ? "customer" : "cook",
        toType: "customer",
        from: { lat: current.lat, lng: current.lng, orderId: current.orderId || null },
        to: { lat: stop.lat, lng: stop.lng, orderId: stop.orderId },
        km: Number(legKm.toFixed(2)),
        minutes: Number(legMin.toFixed(1)),
        departAt,
        arriveAt
      });

      routePoints.push({ type: "customer", lat: stop.lat, lng: stop.lng, orderId: stop.orderId });

      deliveryKm += legKm;
      deliveryMin += legMin + dropMin;
      current = stop;
    }

    const endMs = tMs;
    const totalKm = toCookKm + deliveryKm;
    const totalMin = toCookMin + deliveryMin;

    // Economics
    const driverPay = (RD.CONFIG.baseDriverPay * batch.orders.length) + (RD.CONFIG.payPerKm * totalKm);

    const totalValue = batch.orders.reduce((s, o) => s + o.value, 0);
    const chefShare = totalValue * RD.CONFIG.split.chef;
    const platformShare = totalValue * RD.CONFIG.split.platform;
    const deliveryShare = totalValue * RD.CONFIG.split.delivery;
    const deliveryMargin = deliveryShare - driverPay;

    // Update driver state
    driver.trips += 1;
    driver.stops += batch.orders.length;
    driver.deadheadKm += toCookKm;
    driver.deliveryKm += deliveryKm;
    driver.km += totalKm;
    driver.minutes += totalMin;
    driver.earnings += driverPay;
    driver.availableAt = endMs;
    driver.loc = { lat: current.lat, lng: current.lng };

    deliveries.push({
      batchId: batch.id,
      driverId: driver.id,
      cookName: batch.cookName,
      cookLat: batch.cookLat,
      cookLng: batch.cookLng,
      orders: batch.orders.length,
      km: Number(totalKm.toFixed(2)),
      deadheadKm: Number(toCookKm.toFixed(2)),
      deliveryKm: Number(deliveryKm.toFixed(2)),
      minutes: Number(totalMin.toFixed(1)),
      startAt: new Date(departMs),
      endAt: new Date(endMs),
      orderValue: Number(totalValue.toFixed(2)),
      chefShare: Number(chefShare.toFixed(2)),
      platformShare: Number(platformShare.toFixed(2)),
      deliveryShare: Number(deliveryShare.toFixed(2)),
      driverPay: Number(driverPay.toFixed(2)),
      deliveryMargin: Number(deliveryMargin.toFixed(2)),
      orderIds: batch.orders.map(o => o.id),
      route,
      routePoints
    });
  }

  const totals = deliveries.reduce((t, d) => {
    t.orders += d.orders;
    t.batches += 1;
    t.km += d.km;
    t.deadheadKm += d.deadheadKm;
    t.deliveryKm += d.deliveryKm;
    t.minutes += d.minutes;
    t.orderValue += d.orderValue;
    t.chefShare += d.chefShare;
    t.platformShare += d.platformShare;
    t.deliveryShare += d.deliveryShare;
    t.driverPay += d.driverPay;
    t.deliveryMargin += d.deliveryMargin;
    return t;
  }, {
    orders: 0, batches: 0, km: 0, deadheadKm: 0, deliveryKm: 0, minutes: 0,
    orderValue: 0, chefShare: 0, platformShare: 0, deliveryShare: 0,
    driverPay: 0, deliveryMargin: 0
  });

  const avgDeliveryMin = totals.batches ? (totals.minutes / totals.batches) : 0;

  return {
    batches,
    drivers,
    deliveries,
    totals: {
      orders: totals.orders,
      batches: totals.batches,
      km: Number(totals.km.toFixed(2)),
      deadheadKm: Number(totals.deadheadKm.toFixed(2)),
      deliveryKm: Number(totals.deliveryKm.toFixed(2)),
      minutes: Number(totals.minutes.toFixed(1)),
      avgDeliveryMin: Number(avgDeliveryMin.toFixed(1)),
      orderValue: Number(totals.orderValue.toFixed(2)),
      chefShare: Number(totals.chefShare.toFixed(2)),
      platformShare: Number(totals.platformShare.toFixed(2)),
      deliveryShare: Number(totals.deliveryShare.toFixed(2)),
      driverPay: Number(totals.driverPay.toFixed(2)),
      deliveryMargin: Number(totals.deliveryMargin.toFixed(2))
    }
  };
};
