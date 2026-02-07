<<<<<<< dev
const base = [43.2238, -79.7654]; // 75 Centennial Pkwy, Hamilton, ON
const dropPoints = [
  [43.2339, -79.7481],
  [43.2444, -79.7812],
  [43.2172, -79.8024],
  [43.2318, -79.7708],
];

const map = L.map("map", {
  zoomControl: false,
  scrollWheelZoom: false,
}).setView(base, 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

L.control.zoom({ position: "bottomright" }).addTo(map);

const baseMarker = L.marker(base, {
  title: "RideNDine Base - 75 Centennial Pkwy",
}).addTo(map);
baseMarker.bindPopup("RideNDine Base<br>75 Centennial Pkwy, Hamilton, ON");

const routeLine = L.polyline([base, ...dropPoints, base], {
  color: "#ff7a18",
  weight: 4,
  opacity: 0.9,
}).addTo(map);

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
    node.textContent = index === 0 ? "6.4 mi loop" : "ETA 22-28 min";
  });
}

const bypassButton = document.querySelector("[data-bypass]");
const adminPanel = document.querySelector("[data-panel]");
const adminLogin = document.querySelector(".admin__login");

if (bypassButton && adminPanel && adminLogin) {
  bypassButton.addEventListener("click", () => {
    adminPanel.hidden = false;
    adminLogin.classList.add("is-hidden");
    adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

const invalidateMap = () => map.invalidateSize();
window.addEventListener("resize", () => {
  window.clearTimeout(window.__mapResizeTimer);
  window.__mapResizeTimer = window.setTimeout(invalidateMap, 150);
});
setTimeout(invalidateMap, 400);
=======
const baseLocation = [43.2254, -79.7659];

const map = L.map("map", { scrollWheelZoom: false }).setView(baseLocation, 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

const baseMarker = L.circleMarker(baseLocation, {
  radius: 10,
  color: "#0f766e",
  fillColor: "#0f766e",
  fillOpacity: 0.9,
}).addTo(map);
baseMarker.bindPopup("RideNDine Base • 75 Centennial Parkway");

const chefStops = [
  { name: "Chef Amelia", coords: [43.2331, -79.78] },
  { name: "Chef Mateo", coords: [43.2152, -79.744] },
];

const customerStops = [
  { name: "Customer Mia", coords: [43.247, -79.756] },
  { name: "Customer Theo", coords: [43.207, -79.782] },
];

chefStops.forEach((stop) => {
  L.circleMarker(stop.coords, {
    radius: 8,
    color: "#f97316",
    fillColor: "#f97316",
    fillOpacity: 0.85,
  })
    .addTo(map)
    .bindPopup(`${stop.name} pickup`);
});

customerStops.forEach((stop) => {
  L.circleMarker(stop.coords, {
    radius: 8,
    color: "#9333ea",
    fillColor: "#9333ea",
    fillOpacity: 0.85,
  })
    .addTo(map)
    .bindPopup(`${stop.name} drop-off`);
});

const routePath = [
  baseLocation,
  chefStops[0].coords,
  customerStops[0].coords,
  chefStops[1].coords,
  customerStops[1].coords,
];

L.polyline(routePath, {
  color: "#14b8a6",
  weight: 4,
  dashArray: "8 10",
}).addTo(map);

const driverMarkers = Array.from({ length: 4 }, (_, index) => {
  const marker = L.circleMarker(baseLocation, {
    radius: 6,
    color: "#0ea5e9",
    fillColor: "#0ea5e9",
    fillOpacity: 0.9,
  }).addTo(map);
  marker.bindTooltip(`Driver ${index + 1}`, { direction: "top" });
  return marker;
});

let animationStep = 0;

function animateDrivers() {
  animationStep += 0.02;
  driverMarkers.forEach((marker, index) => {
    const angle = animationStep + index * 1.5;
    const latOffset = Math.cos(angle) * 0.01;
    const lngOffset = Math.sin(angle) * 0.015;
    marker.setLatLng([baseLocation[0] + latOffset, baseLocation[1] + lngOffset]);
  });
}

setInterval(animateDrivers, 60);
>>>>>>> main
