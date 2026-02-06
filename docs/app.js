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
