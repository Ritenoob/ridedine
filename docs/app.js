const base = [43.2238, -79.7654]; // 75 Centennial Pkwy, Hamilton, ON
const dropPoints = [
  [43.2339, -79.7481],
  [43.2444, -79.7812],
  [43.2172, -79.8024],
  [43.2318, -79.7708],
];

const buildMap = (elementId, options = {}) => {
  const mapInstance = L.map(elementId, {
    zoomControl: false,
    scrollWheelZoom: false,
    ...options,
  }).setView(base, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapInstance);

  L.control.zoom({ position: "bottomright" }).addTo(mapInstance);

  const baseMarker = L.marker(base, {
    title: "RideNDine Base - 75 Centennial Pkwy",
  }).addTo(mapInstance);
  baseMarker.bindPopup("RideNDine Base<br>75 Centennial Pkwy, Hamilton, ON");

  L.circle(base, {
    radius: 20000,
    color: "#19b7b1",
    weight: 2,
    fillColor: "#19b7b1",
    fillOpacity: 0.08,
  }).addTo(mapInstance);

  const routeLine = L.polyline([base, ...dropPoints, base], {
    color: "#ff7a18",
    weight: 4,
    opacity: 0.9,
  }).addTo(mapInstance);

  return { mapInstance, routeLine };
};

const { mapInstance: map, routeLine } = buildMap("map");
const { mapInstance: adminMap } = buildMap("admin-map", {
  zoomControl: false,
});

const driverPaths = [
  [base, dropPoints[0], dropPoints[1], base],
  [base, dropPoints[2], dropPoints[3], base],
  [base, dropPoints[1], dropPoints[2], base],
];

const driverMarkers = driverPaths.map((path, index) => {
  const marker = L.circleMarker(path[0], {
    radius: 7,
    color: "#19b7b1",
    fillColor: "#19b7b1",
    fillOpacity: 1,
  }).addTo(map);
  marker.bindTooltip(`Driver ${index + 1}`, { direction: "top" });
  return { marker, path, progress: 0 };
});

function interpolatePoint(start, end, t) {
  return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
}

function animateDrivers() {
  driverMarkers.forEach((driver) => {
    const segment = Math.floor(driver.progress) % (driver.path.length - 1);
    const segmentProgress = driver.progress - Math.floor(driver.progress);
    const start = driver.path[segment];
    const end = driver.path[segment + 1];
    const nextPoint = interpolatePoint(start, end, segmentProgress);
    driver.marker.setLatLng(nextPoint);
    driver.progress += 0.003 + segment * 0.0004;
    if (driver.progress >= driver.path.length - 1) {
      driver.progress = 0;
    }
  });
  requestAnimationFrame(animateDrivers);
}

animateDrivers();

const routeStats = document.querySelectorAll("[data-route-stat]");
if (routeStats.length) {
  routeStats.forEach((node, index) => {
    node.textContent = index === 0 ? "20 km coverage" : "ETA 22-28 min";
  });
}

const bypassButtons = document.querySelectorAll("[data-bypass]");
const adminPanel = document.querySelector("[data-panel]");
const adminLogin = document.querySelector(".admin__login");

const openDashboard = () => {
  if (!adminPanel || !adminLogin) {
    return;
  }
  adminPanel.hidden = false;
  adminLogin.classList.add("is-hidden");
  adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
};

bypassButtons.forEach((button) => {
  button.addEventListener("click", openDashboard);
});

const paymentModal = document.querySelector("[data-payment-modal]");
const paymentButtons = document.querySelectorAll("[data-open-payment]");
const closePaymentButton = document.querySelector("[data-close-payment]");
const paymentForm = document.querySelector("[data-payment-form]");
const paymentTotal = document.querySelector("[data-payment-total]");
const orderLists = document.querySelectorAll("[data-order-list]");
const progressFills = document.querySelectorAll("[data-progress]");
const progressLabels = document.querySelectorAll("[data-progress-label]");
const simStatuses = document.querySelectorAll("[data-sim-status]");
const checkoutPanel = document.querySelector("[data-checkout]");
const orderIdOutput = document.querySelector("[data-order-id]");
const trackingForm = document.querySelector("[data-tracking-form]");
const trackingStatus = document.querySelector("[data-tracking-status]");

let paymentSum = 0;
let deliveredCount = 0;

const toggleModal = (isOpen) => {
  if (!paymentModal) return;
  paymentModal.classList.toggle("is-visible", isOpen);
  paymentModal.setAttribute("aria-hidden", String(!isOpen));
  if (paymentForm) {
    paymentForm.hidden = !isOpen;
  }
};

paymentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (checkoutPanel) {
      checkoutPanel.hidden = true;
    }
    if (paymentForm) {
      paymentForm.hidden = false;
    }
    toggleModal(true);
  });
});

if (closePaymentButton) {
  closePaymentButton.addEventListener("click", () => toggleModal(false));
}

if (paymentModal) {
  paymentModal.addEventListener("click", (event) => {
    if (event.target === paymentModal) {
      toggleModal(false);
    }
  });
}

const updateProgress = () => {
  const percent = Math.min((deliveredCount / 100) * 100, 100);
  progressFills.forEach((progressFill) => {
    progressFill.style.width = `${percent}%`;
  });
  progressLabels.forEach((progressLabel) => {
    progressLabel.textContent = `${deliveredCount} / 100 delivered`;
  });
};

const addOrder = (name, chef, amount) => {
  if (!orderLists.length) return;
  const orderId = `RD-${String(Math.floor(1000 + Math.random() * 9000))}`;
  orderLists.forEach((orderList) => {
    const item = document.createElement("li");
    item.innerHTML = `<span>${orderId} • ${name} • ${chef}</span><span>$${amount.toFixed(2)}</span>`;
    orderList.prepend(item);
    if (orderList.children.length > 5) {
      orderList.removeChild(orderList.lastChild);
    }
  });
  return orderId;
};

if (paymentForm) {
  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(paymentForm);
    const name = String(data.get("name") || "Guest");
    const amount = Number(data.get("amount") || 0);
    const chef = String(data.get("chef") || "Chef");
    if (!amount) return;
    paymentSum += amount;
    deliveredCount = Math.min(deliveredCount + 1, 100);
    if (paymentTotal) {
      paymentTotal.textContent = `$${paymentSum.toFixed(2)}`;
    }
    const orderId = addOrder(name, chef, amount);
    if (orderIdOutput && orderId) {
      orderIdOutput.textContent = orderId;
    }
    updateProgress();
    if (checkoutPanel) {
      checkoutPanel.hidden = false;
    }
    paymentForm.reset();
  });
}

const simulateDashboard = () => {
  if (!orderLists.length) return;
  const chefs = ["Hoang Gia Pho", "Chef Amina", "Chef Luca", "Chef Priya"];
  const names = ["Jade", "Marco", "Leila", "Andre", "Sienna", "Tariq"];
  const amount = 18 + Math.random() * 22;
  const name = names[Math.floor(Math.random() * names.length)];
  const chef = chefs[Math.floor(Math.random() * chefs.length)];
  addOrder(name, chef, amount);
  simStatuses.forEach((simStatus) => {
    simStatus.textContent = "Simulation: dispatching live orders.";
  });
};

setInterval(simulateDashboard, 6000);
updateProgress();

const tabButtons = document.querySelectorAll("[data-tab-target]");
const tabPanels = document.querySelectorAll("[data-tab-panel]");

const setActiveTab = (target) => {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tabTarget === target);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === target);
  });
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tabTarget);
  });
});

if (trackingForm && trackingStatus) {
  trackingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(trackingForm);
    const orderId = String(data.get("orderId") || "RD-0000").toUpperCase();
    trackingStatus.textContent = `${orderId} is out for delivery. Driver ETA 22-28 min.`;
  });
}

const closeButtons = document.querySelectorAll("[data-close-payment]");
closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (checkoutPanel) {
      checkoutPanel.hidden = true;
    }
    toggleModal(false);
  });
});

const invalidateMap = () => {
  map.invalidateSize();
  adminMap.invalidateSize();
};
window.addEventListener("resize", () => {
  window.clearTimeout(window.__mapResizeTimer);
  window.__mapResizeTimer = window.setTimeout(invalidateMap, 150);
});
setTimeout(invalidateMap, 400);
