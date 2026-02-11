// Order & Driver Simulator
// Deterministic simulation with 100 orders and intelligent driver assignment
(function () {
  'use strict';

  const NUM_ORDERS = 100;
  const NUM_DRIVERS = 10;

  let orders = [];
  let drivers = [];
  let speedMultiplier = 1;
  let tickIntervalMs = 1000; // base 1s per tick
  let timerId = null;
  let isPaused = false;
  let tickCount = 0;
  let simulationTime = 0; // in seconds

  // DOM elements
  const $ordersCreated = document.getElementById('sim-orders-created');
  const $ordersDelivered = document.getElementById('sim-orders-delivered');
  const $driversAvailable = document.getElementById('sim-drivers-available');
  const $simTime = document.getElementById('sim-time');
  const $ordersList = document.getElementById('sim-orders-list');
  const $driversList = document.getElementById('sim-drivers-list');
  const $speedSelect = document.getElementById('sim-speed');
  const $startBtn = document.getElementById('sim-start');
  const $pauseBtn = document.getElementById('sim-pause');
  const $resetBtn = document.getElementById('sim-reset');

  // Status counters
  const $statusCreated = document.getElementById('sim-status-created');
  const $statusAssigned = document.getElementById('sim-status-assigned');
  const $statusPickup = document.getElementById('sim-status-pickup');
  const $statusDelivered = document.getElementById('sim-status-delivered');

  // Deterministic pseudo-random number generator (Linear Congruential Generator)
  function createPRNG(seed) {
    const m = 2 ** 31 - 1;
    const a = 48271;
    let state = seed % m;
    return () => {
      state = (a * state) % m;
      return state / m;
    };
  }

  const prng = createPRNG(12345);

  // Calculate distance between two points
  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Create drivers with random starting positions
  function createDrivers() {
    drivers = [];
    for (let i = 0; i < NUM_DRIVERS; i++) {
      drivers.push({
        id: `D${i + 1}`,
        x: Math.floor(prng() * 100),
        y: Math.floor(prng() * 100),
        busy: false,
        orderId: null,
        remainingTicks: 0,
        deliveries: 0,
      });
    }
  }

  // Create orders with random delivery locations
  function createOrders() {
    orders = [];
    for (let i = 0; i < NUM_ORDERS; i++) {
      orders.push({
        id: `O${String(i + 1).padStart(3, '0')}`,
        x: Math.floor(prng() * 100),
        y: Math.floor(prng() * 100),
        status: 'created', // created -> assigned -> pickup -> delivered
        driverId: null,
        createdAt: tickCount,
      });
    }
  }

  // Assign nearest available driver to pending orders
  function assignDrivers() {
    const availableDrivers = drivers.filter((d) => !d.busy);
    if (!availableDrivers.length) return;

    const pendingOrders = orders.filter((o) => o.status === 'created');
    
    for (const order of pendingOrders) {
      if (!availableDrivers.length) break;

      // Find nearest available driver
      let bestDriver = null;
      let bestDist = Infinity;
      
      for (const driver of availableDrivers) {
        const dist = distance(order, driver);
        if (dist < bestDist) {
          bestDist = dist;
          bestDriver = driver;
        }
      }

      if (!bestDriver) break;

      // Assign driver to order
      bestDriver.busy = true;
      bestDriver.orderId = order.id;
      
      // Calculate trip duration based on distance
      // Base ticks: 2-20 depending on distance, scaled by speed
      const baseTicks = 2 + Math.round(bestDist / 5);
      bestDriver.remainingTicks = Math.max(2, Math.round(baseTicks / Math.sqrt(speedMultiplier)));

      order.status = 'assigned';
      order.driverId = bestDriver.id;
      order.assignedAt = tickCount;

      // Remove from available list
      const idx = availableDrivers.indexOf(bestDriver);
      if (idx !== -1) availableDrivers.splice(idx, 1);
    }
  }

  // Progress trips and update order statuses
  function progressTrips() {
    for (const driver of drivers) {
      if (!driver.busy) continue;

      driver.remainingTicks -= 1;
      const order = orders.find((o) => o.id === driver.orderId);
      if (!order) continue;

      // Transition through states
      if (order.status === 'assigned') {
        order.status = 'pickup';
        order.pickedUpAt = tickCount;
      } else if (order.status === 'pickup' && driver.remainingTicks <= 0) {
        order.status = 'delivered';
        order.deliveredAt = tickCount;
        driver.busy = false;
        driver.orderId = null;
        driver.remainingTicks = 0;
        driver.deliveries += 1;
      }
    }
  }

  // Update UI statistics
  function updateStats() {
    if ($ordersCreated) {
      $ordersCreated.textContent = orders.length;
    }

    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    if ($ordersDelivered) {
      $ordersDelivered.textContent = deliveredCount;
    }

    const availableCount = drivers.filter((d) => !d.busy).length;
    if ($driversAvailable) {
      $driversAvailable.textContent = availableCount;
    }

    // Update time display
    if ($simTime) {
      const minutes = Math.floor(simulationTime / 60);
      const seconds = simulationTime % 60;
      $simTime.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    // Update status breakdown
    if ($statusCreated) {
      $statusCreated.textContent = orders.filter(o => o.status === 'created').length;
    }
    if ($statusAssigned) {
      $statusAssigned.textContent = orders.filter(o => o.status === 'assigned').length;
    }
    if ($statusPickup) {
      $statusPickup.textContent = orders.filter(o => o.status === 'pickup').length;
    }
    if ($statusDelivered) {
      $statusDelivered.textContent = orders.filter(o => o.status === 'delivered').length;
    }
  }

  // Render orders table (top 50 only)
  function renderOrders() {
    if (!$ordersList) return;

    const html = orders.slice(0, 50).map((order) => {
      const statusBadge = {
        created: 'badge--pending',
        assigned: 'badge--info',
        pickup: 'badge--warning',
        delivered: 'badge--success',
      }[order.status] || 'badge--default';

      const driver = order.driverId ? order.driverId : '-';
      const driverInfo = orders.find(o => o.id === order.id && o.driverId);
      const driverObj = driverInfo ? drivers.find(d => d.id === driverInfo.driverId) : null;
      const eta = driverObj && driverObj.busy && driverObj.orderId === order.id 
        ? `${driverObj.remainingTicks}s` 
        : '-';

      return `
        <tr>
          <td><code>${order.id}</code></td>
          <td>(${order.x}, ${order.y})</td>
          <td><span class="badge ${statusBadge}">${order.status}</span></td>
          <td>${driver}</td>
          <td>${eta}</td>
        </tr>
      `;
    }).join('');

    $ordersList.innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">No orders</td></tr>';
  }

  // Render drivers table
  function renderDrivers() {
    if (!$driversList) return;

    const html = drivers.map((driver) => {
      const status = driver.busy ? 'Busy' : 'Available';
      const statusClass = driver.busy ? 'badge--warning' : 'badge--success';
      const currentOrder = driver.busy ? driver.orderId : '-';
      const timeRemaining = driver.busy ? `${driver.remainingTicks}s` : '-';

      return `
        <tr>
          <td><strong>${driver.id}</strong></td>
          <td>(${driver.x}, ${driver.y})</td>
          <td><span class="badge ${statusClass}">${status}</span></td>
          <td><code>${currentOrder}</code></td>
          <td>${timeRemaining}</td>
        </tr>
      `;
    }).join('');

    $driversList.innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">No drivers</td></tr>';
  }

  // Main simulation tick
  function tick() {
    if (isPaused) return;

    tickCount++;
    simulationTime += 1;

    assignDrivers();
    progressTrips();
    updateStats();
    renderOrders();
    renderDrivers();

    // Check if all orders are delivered
    const allDelivered = orders.every((o) => o.status === 'delivered');
    if (allDelivered) {
      stop();
      if (window.showToast) {
        window.showToast('✅ Simulation complete! All orders delivered.', 'success');
      }
    }
  }

  // Start simulation
  function start() {
    if (timerId) return;
    
    isPaused = false;
    tickCount = 0;
    simulationTime = 0;
    
    const intervalMs = tickIntervalMs / speedMultiplier;
    timerId = setInterval(tick, intervalMs);

    if ($startBtn) $startBtn.disabled = true;
    if ($pauseBtn) $pauseBtn.disabled = false;
    
    console.log(`[Simulator] Started at ${speedMultiplier}x speed`);
  }

  // Pause simulation
  function pause() {
    isPaused = !isPaused;
    
    if ($pauseBtn) {
      $pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
    }
    
    console.log(`[Simulator] ${isPaused ? 'Paused' : 'Resumed'}`);
  }

  // Stop simulation
  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    
    isPaused = false;
    
    if ($startBtn) $startBtn.disabled = false;
    if ($pauseBtn) {
      $pauseBtn.disabled = true;
      $pauseBtn.textContent = '⏸️ Pause';
    }
    
    console.log('[Simulator] Stopped');
  }

  // Reset simulation
  function reset() {
    stop();
    tickCount = 0;
    simulationTime = 0;
    
    createDrivers();
    createOrders();
    
    updateStats();
    renderOrders();
    renderDrivers();
    
    console.log('[Simulator] Reset');
  }

  // Event listeners
  if ($speedSelect) {
    $speedSelect.addEventListener('change', (e) => {
      const val = Number(e.target.value) || 1;
      speedMultiplier = val;
      
      // Restart timer with new speed if running
      if (timerId && !isPaused) {
        stop();
        start();
      }
      
      console.log(`[Simulator] Speed changed to ${speedMultiplier}x`);
    });
  }

  if ($startBtn) {
    $startBtn.addEventListener('click', start);
  }

  if ($pauseBtn) {
    $pauseBtn.addEventListener('click', pause);
  }

  if ($resetBtn) {
    $resetBtn.addEventListener('click', reset);
  }

  // Initialize simulation on page load
  reset();
  
  console.log('[Simulator] Initialized with 100 orders and 10 drivers');
})();
