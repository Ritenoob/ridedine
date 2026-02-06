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
