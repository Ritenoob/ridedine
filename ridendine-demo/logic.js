window.RD = window.RD || {};

RD.HAMILTON = {
  center: { lat: 43.2557, lng: -79.8711 },
  bounds: {
    north: 43.35,
    south: 43.15,
    west: -80.05,
    east: -79.70
  }
};

RD.CONFIG = {
  city: "Hamilton, Ontario",
  batchRadiusKm: 5,
  maxOrderKmFromCook: 20,
  avgSpeedKmh: 28,
  pickupMinutes: 4,
  dropoffMinutes: 3,
  baseDriverPay: 4.0,
  payPerKm: 0.65,
  orderValueAvg: 30.0,
  split: { chef: 0.30, platform: 0.40, delivery: 0.30 },

  cooks: [
    { id: "C1", name: "Cook #1 (Westdale)", lat: 43.2605, lng: -79.9142 },
    { id: "C2", name: "Cook #2 (Delta)",    lat: 43.2387, lng: -79.8291 },
    { id: "C3", name: "Cook #3 (Stoney)",   lat: 43.2712, lng: -79.7610 }
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

RD.randomCustomerNearCook = function(rand, cook, maxKm) {
  const kmToLat = (km) => km / 111;
  const kmToLng = (km) => km / 82;

  for (let tries = 0; tries < 200; tries++) {
    const r = rand() * maxKm;
    const ang = rand() * Math.PI * 2;
    const dLat = Math.cos(ang) * kmToLat(r);
    const dLng = Math.sin(ang) * kmToLng(r);

    const lat = cook.lat + dLat;
    const lng = cook.lng + dLng;

    if (lat < RD.HAMILTON.bounds.south || lat > RD.HAMILTON.bounds.north) continue;
    if (lng < RD.HAMILTON.bounds.west || lng > RD.HAMILTON.bounds.east) continue;

    const km = RD.haversineKm(cook, { lat, lng });
    if (km <= maxKm) return { lat, lng, kmFromCook: km };
  }
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

RD.batchOrders = function(orders) {
  const rKm = RD.CONFIG.batchRadiusKm;
  const batches = [];
  const remaining = [...orders];

  while (remaining.length) {
    const seed = remaining.shift();

    const batch = {
      id: `B${String(batches.length + 1).padStart(3, "0")}`,
      cookId: seed.cookId,
      cookName: seed.cookName,
      cookLat: seed.cookLat,
      cookLng: seed.cookLng,
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
        remaining.splice(i, 1);
      }
    }

    batches.push(batch);
  }

  return batches;
};

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

    const cook = { lat: batch.cookLat, lng: batch.cookLng };
    let stops = batch.orders.map(o => ({ lat: o.custLat, lng: o.custLng, orderId: o.id }));
    let current = cook;

    let totalKm = 0;
    let totalMin = pickupMin;

    while (stops.length) {
      let bestIdx = 0;
      let bestD = Infinity;
      for (let i = 0; i < stops.length; i++) {
        const d = RD.haversineKm(current, stops[i]);
        if (d < bestD) { bestD = d; bestIdx = i; }
      }
      const next = stops.splice(bestIdx, 1)[0];
      totalKm += bestD;
      totalMin += (bestD / speed) * 60;
      totalMin += dropMin;
      current = next;
    }

    const driverPay = (RD.CONFIG.baseDriverPay * batch.orders.length) + (RD.CONFIG.payPerKm * totalKm);

    const totalValue = batch.orders.reduce((s, o) => s + o.value, 0);
    const chefShare = totalValue * RD.CONFIG.split.chef;
    const platformShare = totalValue * RD.CONFIG.split.platform;
    const deliveryShare = totalValue * RD.CONFIG.split.delivery;
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
      cookLat: batch.cookLat,
      cookLng: batch.cookLng,
      orders: batch.orders.length,
      km: Number(totalKm.toFixed(2)),
      minutes: Number(totalMin.toFixed(1)),
      orderValue: Number(totalValue.toFixed(2)),
      chefShare: Number(chefShare.toFixed(2)),
      platformShare: Number(platformShare.toFixed(2)),
      deliveryShare: Number(deliveryShare.toFixed(2)),
      driverPay: Number(driverPay.toFixed(2)),
      deliveryMargin: Number(deliveryMargin.toFixed(2)),
      orderIds: batch.orders.map(o => o.id)
    });
  }

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

  const avgDeliveryMin = totals.batches ? (totals.minutes / totals.batches) : 0;

  return {
    batches,
    drivers,
    deliveries,
    totals: {
      orders: totals.orders,
      batches: totals.batches,
      km: Number(totals.km.toFixed(2)),
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
