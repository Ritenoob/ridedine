"use client";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Driver {
  id: string;
  profile_id: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  phone: string | null;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  profiles: {
    name: string;
    email: string;
  };
  active_delivery?: {
    id: string;
    status: string;
    pickup_address: string;
    dropoff_address: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    order: {
      id: string;
      customer_name: string;
      total_cents: number;
    };
  } | null;
}

interface LiveTrackingMapProps {
  drivers: Driver[];
}

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createDriverIcon = (status: string, hasDelivery: boolean) => {
  let color = "#6b7280";
  if (status === "available") color = "#10b981";
  if (hasDelivery) color = "#f59e0b";

  const svgIcon = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🚗</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "driver-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createLocationIcon = (type: "pickup" | "dropoff") => {
  const emoji = type === "pickup" ? "🏪" : "🏠";
  const color = type === "pickup" ? "#3b82f6" : "#ef4444";

  const svgIcon = `
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="14" y="19" text-anchor="middle" fill="white" font-size="14">${emoji}</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "location-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export default function LiveTrackingMap({ drivers }: LiveTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const defaultCenter: [number, number] = [40.7128, -74.006];

  useEffect(() => {
    if (!mapRef.current || drivers.length === 0) return;

    const bounds: [number, number][] = [];
    drivers.forEach((driver) => {
      if (driver.current_lat && driver.current_lng) {
        bounds.push([driver.current_lat, driver.current_lng]);
      }
      if (driver.active_delivery) {
        bounds.push([
          driver.active_delivery.pickup_lat,
          driver.active_delivery.pickup_lng,
        ]);
        bounds.push([
          driver.active_delivery.dropoff_lat,
          driver.active_delivery.dropoff_lng,
        ]);
      }
    });

    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [drivers]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      assigned: "Assigned",
      en_route_to_pickup: "En Route to Pickup",
      arrived_at_pickup: "At Pickup",
      picked_up: "Picked Up",
      en_route_to_dropoff: "Delivering",
      arrived_at_dropoff: "At Dropoff",
    };
    return labels[status] || status;
  };

  const getTimeSince = (timestamp: string | null) => {
    if (!timestamp) return "Unknown";
    const seconds = Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 1000,
    );
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div style={{ position: "relative", height: "calc(100vh - 320px)" }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        ref={(map) => {
          if (map) mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {drivers.map((driver) => {
          const hasLocation = driver.current_lat && driver.current_lng;
          const hasDelivery = !!driver.active_delivery;

          if (!hasLocation) return null;

          return (
            <div key={driver.id}>
              {/* Driver Marker */}
              <Marker
                position={[driver.current_lat!, driver.current_lng!]}
                icon={createDriverIcon(driver.status, hasDelivery)}
              >
                <Popup>
                  <div style={{ minWidth: 220 }}>
                    <strong
                      style={{
                        fontSize: 16,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {driver.profiles.name}
                    </strong>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Status:{" "}
                        <span
                          style={{
                            fontWeight: 600,
                            color: hasDelivery
                              ? "#f59e0b"
                              : driver.status === "available"
                                ? "#10b981"
                                : "#6b7280",
                          }}
                        >
                          {hasDelivery ? "On Delivery" : driver.status}
                        </span>
                      </div>
                      {driver.vehicle_type && (
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Vehicle: {driver.vehicle_type}{" "}
                          {driver.vehicle_plate && `(${driver.vehicle_plate})`}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Last update: {getTimeSince(driver.last_location_update)}
                      </div>
                    </div>

                    {hasDelivery && driver.active_delivery && (
                      <div
                        style={{
                          borderTop: "1px solid #e5e7eb",
                          paddingTop: 8,
                          marginTop: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          Active Delivery
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Order: #{driver.active_delivery.order.id.slice(0, 8)}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Customer: {driver.active_delivery.order.customer_name}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Status:{" "}
                          {getStatusLabel(driver.active_delivery.status)}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Total: $
                          {(
                            driver.active_delivery.order.total_cents / 100
                          ).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Delivery Route */}
              {hasDelivery && driver.active_delivery && (
                <>
                  {/* Pickup Marker */}
                  <Marker
                    position={[
                      driver.active_delivery.pickup_lat,
                      driver.active_delivery.pickup_lng,
                    ]}
                    icon={createLocationIcon("pickup")}
                  >
                    <Popup>
                      <div>
                        <strong>Pickup Location</strong>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          {driver.active_delivery.pickup_address}
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Dropoff Marker */}
                  <Marker
                    position={[
                      driver.active_delivery.dropoff_lat,
                      driver.active_delivery.dropoff_lng,
                    ]}
                    icon={createLocationIcon("dropoff")}
                  >
                    <Popup>
                      <div>
                        <strong>Dropoff Location</strong>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          {driver.active_delivery.dropoff_address}
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Route Lines */}
                  <Polyline
                    positions={[
                      [driver.current_lat!, driver.current_lng!],
                      [
                        driver.active_delivery.pickup_lat,
                        driver.active_delivery.pickup_lng,
                      ],
                      [
                        driver.active_delivery.dropoff_lat,
                        driver.active_delivery.dropoff_lng,
                      ],
                    ]}
                    pathOptions={{
                      color: "#3b82f6",
                      weight: 3,
                      opacity: 0.6,
                      dashArray: "10, 10",
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          background: "white",
          padding: 16,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
          Legend
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            <span style={{ fontSize: 12 }}>Available</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
            <span style={{ fontSize: 12 }}>On Delivery</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#6b7280",
              }}
            />
            <span style={{ fontSize: 12 }}>Offline</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#3b82f6",
              }}
            />
            <span style={{ fontSize: 12 }}>🏪 Pickup</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <span style={{ fontSize: 12 }}>🏠 Dropoff</span>
          </div>
        </div>
      </div>
    </div>
  );
}
