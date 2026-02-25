"use client";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "calc(100vh - 180px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f0f0",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #ccc",
            borderTop: "3px solid #333",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ color: "#666" }}>Loading map...</p>
      </div>
    </div>
  ),
});

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

export default function LiveTrackingPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);
  const supabase = useMemo(() => supabaseBrowser(), []);

  const fetchDrivers = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("drivers")
        .select(
          `
          id,
          profile_id,
          vehicle_type,
          vehicle_plate,
          phone,
          status,
          current_lat,
          current_lng,
          last_location_update,
          profiles!inner (
            name,
            email
          )
        `,
        )
        .order("status", { ascending: false });

      if (error) throw error;

      const driversWithDeliveries = await Promise.all(
        (data || []).map(async (driver: any) => {
          const { data: delivery } = await supabase
            .from("deliveries")
            .select(
              `
              id,
              status,
              pickup_address,
              dropoff_address,
              pickup_lat,
              pickup_lng,
              dropoff_lat,
              dropoff_lng,
              orders!inner (
                id,
                customer_name,
                total_cents
              )
            `,
            )
            .eq("driver_id", driver.id)
            .in("status", [
              "assigned",
              "en_route_to_pickup",
              "arrived_at_pickup",
              "picked_up",
              "en_route_to_dropoff",
              "arrived_at_dropoff",
            ])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...driver,
            profiles: Array.isArray(driver.profiles)
              ? driver.profiles[0]
              : driver.profiles,
            active_delivery: delivery
              ? {
                  ...delivery,
                  order: Array.isArray(delivery.orders)
                    ? delivery.orders[0]
                    : delivery.orders,
                }
              : null,
          };
        }),
      );

      setDrivers(driversWithDeliveries);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    fetchDrivers();

    const activeDeliveries = drivers
      .filter((d) => d.active_delivery)
      .map((d) => d.active_delivery!.id);

    channels.forEach((ch) => supabase.removeChannel(ch));

    const newChannels = activeDeliveries.map((deliveryId) => {
      const channel = supabase.channel(`delivery:${deliveryId}`);

      channel.on(
        "broadcast",
        { event: "driver_location" },
        (payload: { payload: { lat: number; lng: number } }) => {
          setDrivers((prev) =>
            prev.map((driver) => {
              if (driver.active_delivery?.id === deliveryId) {
                return {
                  ...driver,
                  current_lat: payload.payload.lat,
                  current_lng: payload.payload.lng,
                  last_location_update: new Date().toISOString(),
                };
              }
              return driver;
            }),
          );
          setLastUpdate(new Date());
        },
      );

      channel.subscribe();
      return channel;
    });

    setChannels(newChannels);

    const interval = setInterval(fetchDrivers, 30000);

    return () => {
      newChannels.forEach((ch) => supabase.removeChannel(ch));
      clearInterval(interval);
    };
  }, [supabase, drivers.length]);

  const stats = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.status === "available").length;
    const busy = drivers.filter((d) => d.active_delivery).length;
    const offline = drivers.filter((d) => d.status === "offline").length;

    return { total, available, busy, offline };
  }, [drivers]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}>
          <img
            src="/logo.svg"
            alt="RideNDine"
            style={{ height: 32, width: "auto", verticalAlign: "middle" }}
          />
        </Link>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            fontWeight: 600,
            padding: "0 14px",
            marginBottom: 8,
          }}
        >
          Menu
        </div>
        {[
          ["📊", "Dashboard", "/dashboard"],
          ["📦", "Orders", "/dashboard/orders"],
          ["🚗", "Live Tracking", "/dashboard/live-tracking"],
          ["🧑‍🍳", "Chefs", "/dashboard/chefs"],
          ["🍽", "Meals", "/dashboard/meals"],
          ["💰", "Commissions", "/dashboard/commissions"],
        ].map(([icon, label, href]) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${
              href === "/dashboard/live-tracking" ? "active" : ""
            }`}
          >
            {icon} {label}
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 className="page-title">Live Driver Tracking</h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <span className="live-dot"></span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <button onClick={fetchDrivers} className="btn btn-outline btn-sm">
            ↻ Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              Total Drivers
            </div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              🟢 Available
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#10b981" }}>
              {stats.available}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              🟠 On Delivery
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#f59e0b" }}>
              {stats.busy}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              ⚫ Offline
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#6b7280" }}>
              {stats.offline}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div
              style={{
                height: "calc(100vh - 320px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Loading drivers...
            </div>
          ) : (
            <LiveTrackingMap drivers={drivers} />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
