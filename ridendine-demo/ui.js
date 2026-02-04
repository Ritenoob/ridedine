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

  // Leaflet map (Hamilton)
  const map = L.map("mapCanvas").setView([RD.HAMILTON.center.lat, RD.HAMILTON.center.lng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const markersLayer = L.layerGroup().addTo(map);
  const circlesLayer = L.layerGroup().addTo(map);

  const clearMap = () => { markersLayer.clearLayers(); circlesLayer.clearLayers(); };

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
    // 5km radius around each cook for visualization
    batches.forEach(b => {
      L.circle([b.cookLat, b.cookLng], {
        radius: RD.CONFIG.batchRadiusKm * 1000,
        color: "#ff7a00",
        weight: 1,
        fillOpacity: 0.05
      }).addTo(circlesLayer);
    });
  };

  // State
  let currentOrders = [];
  let lastRun = null;

  // Init view
  clearMap();
  drawCooks();
  log(`Ready ✅ ${RD.CONFIG.city} | batchRadius=${RD.CONFIG.batchRadiusKm}km | maxCookDistance=${RD.CONFIG.maxOrderKmFromCook}km`);

  // Place single order (adds one order into current session)
  placeOrderBtn.onclick = () => {
    const h = Math.max(1, Number(hours.value || 6));
    const next = RD.generateOrders({ count: 1, hours: h, seed: Date.now() })[0];
    currentOrders.push(next);
    clearMap(); drawCooks(); drawOrders(currentOrders);
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
    drawCooks();
    drawOrders(currentOrders);
    drawBatchCircles(lastRun.batches);

    const t = lastRun.totals;

    renderTable(
      totalsTable,
      ["Metric", "Value"],
      [
        ["Orders", t.orders],
        ["Batches", t.batches],
        ["Avg Delivery (min / batch)", t.avgDeliveryMin],
        ["Total KM", t.km],
        ["Order Value", `$${t.orderValue}`],
        ["Chef (30%)", `$${t.chefShare}`],
        ["Platform (40%)", `$${t.platformShare}`],
        ["Delivery (30%)", `$${t.deliveryShare}`],
        ["Driver Pay", `$${t.driverPay}`],
        ["Delivery Margin", `$${t.deliveryMargin}`]
      ]
    );

    renderTable(
      driverTable,
      ["Driver", "Trips", "Stops", "KM", "Minutes", "Earnings"],
      lastRun.drivers.map(d => [
        d.id,
        d.trips,
        d.stops,
        d.km.toFixed(2),
        d.minutes.toFixed(1),
        `$${d.earnings.toFixed(2)}`
      ])
    );

    renderTable(
      deliveryTable,
      ["Batch", "Cook", "Orders", "KM", "Min", "Value", "Driver Pay", "Margin"],
      lastRun.deliveries.map(x => [
        x.batchId,
        x.cookName,
        x.orders,
        x.km,
        x.minutes,
        `$${x.orderValue}`,
        `$${x.driverPay}`,
        `$${x.deliveryMargin}`
      ])
    );

    log(`Simulation complete ✅ batches=${t.batches} drivers=${lastRun.drivers.length}`);
  };

  // Scenario compare 50/100/200
  btnCompare.onclick = () => {
    const h = Math.max(1, Number(hours.value || 6));
    const scenarios = [50, 100, 200].map(n => {
      const orders = RD.generateOrders({ count: n, hours: h, seed: 42 });
      const run = RD.runSimulation({ orders });
      const t = run.totals;
      const net = (t.platformShare + t.deliveryMargin);
      return [
        n,
        t.batches,
        run.drivers.length,
        t.avgDeliveryMin,
        `$${t.platformShare.toFixed(2)}`,
        `$${t.driverPay.toFixed(2)}`,
        `$${net.toFixed(2)}`
      ];
    });

    renderTable(
      compareTable,
      ["Orders", "Batches", "Drivers", "Avg Delivery (min)", "Platform Rev", "Driver Cost", "Net Margin"],
      scenarios
    );

    compareStatus.textContent = "Completed ✅";
    log("Scenario comparison completed ✅");
  };
});
