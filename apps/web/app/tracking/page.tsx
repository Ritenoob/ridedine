"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

const STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "accepted", label: "Accepted by Chef" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready for Pickup" },
  { key: "picked_up", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function TrackingPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!token) { setErr("No tracking token provided."); setLoading(false); return; }
    const { data, error } = await getSupabaseClient()
      .from("orders").select("*, chefs!inner(profiles!inner(name))").eq("tracking_token", token).single();
    if (error) { setErr("Order not found."); }
    else { setOrder(data); setErr(""); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [token]);

  if (loading) return <main style={{ padding: 32 }}><p>Loading order...</p></main>;
  if (err) return <main style={{ padding: 32, textAlign: "center" }}><p style={{ color: "#d32f2f", fontSize: 18 }}>{err}</p><Link href="/orders" style={{ color: "#1976d2" }}>← My Orders</Link></main>;
  if (!order) return null;

  const currentIdx = STEPS.findIndex((s) => s.key === order.status);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 0 }}>
      <div style={{ background: "#1976d2", color: "white", padding: "24px 32px" }}>
        <Link href="/orders" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 14 }}>← My Orders</Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>Order Tracking</h1>
        <p style={{ fontSize: 13, opacity: 0.85 }}>Token: {token}</p>
      </div>

      <div style={{ padding: 32 }}>
        <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 20, marginBottom: 28 }}>
          {[["Chef", order.chefs?.profiles?.name], ["Total", `$${(order.total_cents / 100).toFixed(2)}`], ["Delivery", order.delivery_method]].map(([l, v]) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#666" }}>{l}</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{v}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Order Status</h2>
        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const current = idx === currentIdx;
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "flex-start", marginBottom: 24, position: "relative" }}>
              <div style={{ position: "relative", marginRight: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "#1976d2" : "#ddd", flexShrink: 0 }} />
                {idx < STEPS.length - 1 && (
                  <div style={{ width: 2, height: 28, background: idx < currentIdx ? "#1976d2" : "#ddd", marginTop: 2 }} />
                )}
              </div>
              <div style={{ paddingTop: 1 }}>
                <div style={{ fontWeight: done ? 600 : 400, color: done ? "#000" : "#666", fontSize: 15 }}>{step.label}</div>
                {current && <div style={{ fontSize: 12, color: "#1976d2", fontWeight: 600, marginTop: 2 }}>Current</div>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
