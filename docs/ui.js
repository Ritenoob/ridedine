document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const orderCount = el("orderCount");
  const hours = el("hours");

  const placeOrderBtn = el("placeOrderBtn");
  const btnGenerate = el("btnGenerate");
  const btnRun = el("btnRun");
  const btnCompare = el("btnCompare");

  const compareStatus = el("compareStatus");
  const compareTable = el("compareTable");

  const totalsTable = el("totalsTable");
  const driverTable = el("driverTable");
  const deliveryTable = el("deliveryTable");
  const eventLog = el("eventLog");

  const log = (msg) => {
    const time = new Date().toLocaleTimeString();
    eventLog.innerHTML += `<div>${time} – ${msg}</div>`;
    eventLog.scrollTop = eventLog.scrollHeight;
  };

  const renderTable = (tableEl, headers, rows) => {
    tableEl.innerHTML = `
      <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}
    `;
  };

  // Map (Centennial Batch Center)
  const hub = RD.AREA.hub;

  const map = L.map("mapCanvas").setView([hub.lat, hub.lng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const markersLayer = L.layerGroup().addTo(map);
  const circlesLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);

  const clearMap = () => { markersLayer.clearLayers(); circlesLayer.clearLayers(); routeLayer.clearLayers(); };

  const drawHubAndRadius = () => {
    // Hub marker
    L.circleMarker([hub.lat, hub.lng], {
      radius: 9,
      weight: 2,
      color: "#00c2a8",
      fillColor: "#00c2a8",
      fillOpacity: 1
    })
      .bindPopup(`<b>${RD.CONFIG.hubLabel}</b><br>${RD.AREA.name}`)
      .addTo(markersLayer);

    // Operating/service radius (20km)
    L.circle([hub.lat, hub.lng], {
      radius: RD.CONFIG.serviceRadiusKm * 1000,
      color: "#00c2a8",
      weight: 1,
      fillOpacity: 0.05
    }).addTo(circlesLayer);

    // 2km "chef cluster" visualization
    L.circle([hub.lat, hub.lng], {
      radius: 2000,
      color: "#ff7a00",
      weight: 1,
      dashArray: "4 6",
      fillOpacity: 0.03
    }).addTo(circlesLayer);

    // Fit map view to service radius
    const b = RD.boundsFromRadiusKm(hub, RD.CONFIG.serviceRadiusKm);
    map.fitBounds([[b.south, b.west], [b.north, b.east]]);
  };

  const drawCooks = () => {
    RD.CONFIG.cooks.forEach(c => {
      L.circleMarker([c.lat, c.lng], {
        radius: 8,
        weight: 2,
        color: "#ff7a00",
        fillColor: "#ff7a00",
        fillOpacity: 1
      })
        .bindPopup(`${c.id} – ${c.name}`)
        .addTo(markersLayer);
    });
  };

  const drawOrders = (orders) => {
    orders.forEach(o => {
      L.circleMarker([o.custLat, o.custLng], {
        radius: 3,
        weight: 1,
        color: "#2b7fff",
        fillColor: "#2b7fff",
        fillOpacity: 0.9
      })
        .bindPopup(`${o.id}<br>${o.cookName}<br>$${o.value}`)
        .addTo(markersLayer);
    });
  };

  const drawBatchCircles = (batches) => {
    batches.forEach(b => {
      L.circle([b.cookLat, b.cookLng], {
        radius: RD.CONFIG.batchRadiusKm * 1000,
        color: "#ff7a00",
        weight: 1,
        fillOpacity: 0.05
      }).addTo(circlesLayer);
    });
  };

  const drawRouteForDelivery = (delivery) => {
    routeLayer.clearLayers();

    const pts = delivery.routePoints.map(p => [p.lat, p.lng]);
    const line = L.polyline(pts, { weight: 4, opacity: 0.85 }).addTo(routeLayer);

    // endpoints
    const first = delivery.routePoints[0];
    const cook = delivery.routePoints[1];

    L.circleMarker([first.lat, first.lng], { radius: 6, weight: 2 })
      .bindPopup(`Start: Hub<br>${RD.CONFIG.hubLabel}`)
      .addTo(routeLayer);

    L.circleMarker([cook.lat, cook.lng], { radius: 6, weight: 2 })
      .bindPopup(`Pickup: ${delivery.cookName}`)
      .addTo(routeLayer);

    // customers
    delivery.routePoints
      .filter(p => p.type === "customer")
      .forEach(p => {
        L.circleMarker([p.lat, p.lng], { radius: 5, weight: 2 })
          .bindPopup(`Drop: ${p.orderId}`)
          .addTo(routeLayer);
      });

    line.bindPopup(
      `<b>${delivery.batchId}</b> – ${delivery.driverId}<br>` +
      `Start: ${new Date(delivery.startAt).toLocaleTimeString()}<br>` +
      `End: ${new Date(delivery.endAt).toLocaleTimeString()}<br>` +
      `KM: ${delivery.km} (deadhead ${delivery.deadheadKm})<br>` +
      `Orders: ${delivery.orders}`
    );

    map.fitBounds(line.getBounds(), { padding: [20, 20] });
  };

  // State
  let currentOrders = [];
  let lastRun = null;

  // Init view
  clearMap();
  drawHubAndRadius();
  drawCooks();
  log(
    `Ready ✅ ${RD.CONFIG.city} | hubRadius=${RD.CONFIG.serviceRadiusKm}km | ` +
    `cooks=4 within 2km | batchRadius=${RD.CONFIG.batchRadiusKm}km`
  );

  // Place single order (adds one order into current session)
  placeOrderBtn.onclick = () => {
    const h = Math.max(1, Number(hours.value || 6));
    const next = RD.generateOrders({ count: 1, hours: h, seed: Date.now() })[0];
    currentOrders.push(next);
    clearMap(); drawHubAndRadius(); drawCooks(); drawOrders(currentOrders);
    log(`Order placed: ${next.id} ($${next.value})`);
  };

  // Generate batch data
  btnGenerate.onclick = () => {
    const n = Math.max(1, Number(orderCount.value || 50));
    const h = Math.max(1, Number(hours.value || 6));

    currentOrders = RD.generateOrders({ count: n, hours: h, seed: 42 });

    totalsTable.innerHTML = "";
    driverTable.innerHTML = "";
    deliveryTable.innerHTML = "";

    clearMap();
    drawHubAndRadius();
    drawCooks();
    drawOrders(currentOrders);

    log(`Generated ${n} orders over ${h} hours ✅`);
  };

  // Run simulation
  btnRun.onclick = () => {
    if (!currentOrders.length) {
      log("No orders yet — click Generate Batch Data first.");
      return;
    }

    lastRun = RD.runSimulation({ orders: currentOrders });

    clearMap();
    drawHubAndRadius();
    draw
