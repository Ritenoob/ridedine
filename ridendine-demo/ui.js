document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  const orderCount = el("orderCount");
  const hours = el("hours");

  const btnPlace = el("placeOrderBtn");
  const btnGenerate = el("btnGenerate");
  const btnRun = el("btnRun");

  const btnCompare = el("btnCompare");
  const compareStatus = el("compareStatus");
  const compareTable = el("compareTable");

  const totalsTable = el("totalsTable");
  const driverTable = el("driverTable");
  const deliveryTable = el("deliveryTable");
  const mapCanvas = el("mapCanvas");
  const eventLog = el("eventLog");

  const log = (msg) => {
    const time = new Date().toLocaleTimeString();
    eventLog.innerHTML += `<div>${time} – ${msg}</div>`;
    eventLog.scrollTop = eventLog.scrollHeight;
  };

  // Render helpers
  const renderTable = (tableEl, headers, rows) => {
    tableEl.innerHTML = `
      <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}
    `;
  };

  // Simple “map” (no APIs): draw cooks + customers on an HTML canvas created inside mapCanvas div
  const drawMap = (orders = [], cooks = []) => {
    mapCanvas.innerHTML = `<canvas id="rdCanvas" width="900" height="280"></canvas>`;
    const canvas = document.getElementById("rdCanvas");
    const ctx = canvas.getContext("2d");

    // background
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const toPx = (x, y) => ({
      px: (x / 100) * (canvas.width - 20) + 10,
      py: (y / 100) * (canvas.height - 20) + 10
    });

    // Draw customers
    ctx.fillStyle = "#2b7fff";
    orders.forEach(o => {
      const p = toPx(o.custX, o.custY);
      ctx.beginPath();
      ctx.arc(p.px, p.py, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw cooks (bigger, orange)
    ctx.fillStyle = "#ff7a00";
    cooks.forEach(c => {
      const p = toPx(c.x, c.y);
      ctx.beginPath();
      ctx.arc(p.px, p.py, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(c.id, p.px + 10, p.py + 4);
    });
  };

  // App state
  let currentOrders = [];
  let lastRun = null;

  // Place Order = adds a single “manual” order (small feature)
  btnPlace.onclick = () => {
    const n = Number(orderCount.value || 50);
    log(`Order placed: ${n} (manual placeholder)`);
  };

  // Generate batch data = generate orders for the selected count/hours
  btnGenerate.onclick = () => {
    const n = Math.max(1, Number(orderCount.value || 50));
    const h = Math.max(1, Number(hours.value || 6));
    currentOrders = RD.generateOrders({ count: n, hours: h, seed: 42 });

    drawMap(currentOrders, RD.CONFIG.cooks);

    // Fill totals/driver/delivery with empty placeholders until run
    totalsTable.innerHTML = "";
    driverTable.innerHTML = "";
    deliveryTable.innerHTML = "";

    log(`Batch data generated: ${n} orders over ${h} hours`);
  };

  // Run simulation = compute routing + costs + fill tables
  btnRun.onclick = () => {
    if (!currentOrders.length) {
      log("No data yet — click Generate Batch Data first.");
      return;
    }

    lastRun = RD.runSimulation({ orders: currentOrders });

    // Totals table
    const t = lastRun.totals;
    renderTable(
      totalsTable,
      ["Metric", "Value"],
      [
        ["Orders", t.orders],
        ["Batches", t.batches],
        ["Avg Delivery (min / batch)", t.avgDeliveryMin],
        ["Total KM", t.km],
        ["Total Minutes", t.minutes],
        ["Order Value", `$${t.orderValue}`],
        ["Chef (30%)", `$${t.chefShare}`],
        ["Platform (40%)", `$${t.platformShare}`],
        ["Delivery (30%)", `$${t.deliveryShare}`],
        ["Driver Pay", `$${t.driverPay}`],
        ["Delivery Margin", `$${t.deliveryMargin}`]
      ]
    );

    // Driver table
    renderTable(
      driverTable,
      ["Driver", "Trips", "Stops", "KM", "Minutes", "Earnings"],
      lastRun.drivers.map(d => [
        d.id, d.trips, d.stops, d.km.toFixed(2), d.minutes.toFixed(1), `$${d.earnings.toFixed(2)}`
      ])
    );

    // Delivery table
    renderTable(
      deliveryTable,
      ["Batch", "Cook", "Orders", "KM", "Min", "Value", "Driver Pay", "Delivery Margin"],
      lastRun.deliveries.map(x => [
        x.batchId, x.cookName, x.orders, x.km, x.minutes, `$${x.orderValue}`, `$${x.driverPay}`, `$${x.deliveryMargin}`
      ])
    );

    log(`Simulation completed ✅ ${t.batches} batches | ${lastRun.drivers.length} drivers used`);
  };

  // Scenario compare still works (uses the new engine)
  btnCompare.onclick = () => {
    const h = Math.max(1, Number(hours.value || 6));

    const scenarios = [50, 100, 200].map(n => {
      const orders = RD.generateOrders({ count: n, hours: h, seed: 42 });
      const run = RD.runSimulation({ orders });
      return {
        orders: n,
        batches: run.totals.batches,
        drivers: run.drivers.length,
        avgDeliveryMin: run.totals.avgDeliveryMin,
        platformRev: run.totals.platformShare,
        driverCost: run.totals.driverPay,
        netMargin: (run.totals.platformShare + run.totals.deliveryMargin).toFixed(2)
      };
    });

    compareTable.innerHTML = `
      <tr>
        <th>Orders</th><th>Batches</th><th>Drivers</th>
        <th>Avg Delivery (min)</th><th>Platform Rev</th><th>Driver Cost</th><th>Net Margin</th>
      </tr>
      ${scenarios.map(s => `
        <tr>
          <td>${s.orders}</td>
          <td>${s.batches}</td>
          <td>${s.drivers}</td>
          <td>${s.avgDeliveryMin}</td>
          <td>$${Number(s.platformRev).toFixed(2)}</td>
          <td>$${Number(s.driverCost).toFixed(2)}</td>
          <td>$${s.netMargin}</td>
        </tr>
      `).join("")}
    `;

    compareStatus.textContent = "Completed ✅";
    log("Scenario comparison completed ✅");
  };

  // Initial paint
  drawMap([], RD.CONFIG.cooks);
  log(`Ready. Version: ${window.RIDENDINE_VERSION || "unknown"}`);
});
