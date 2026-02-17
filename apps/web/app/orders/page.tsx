"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

interface Order { id: string; status: string; total_cents: number; created_at: string; tracking_token: string; chefs: { profiles: { name: string } } }

const STATUS_COLOR: Record<string, string> = { delivered: "#4caf50", cancelled: "#f44336", refunded: "#f44336", placed: "#ff9800" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    const sb = getSupabaseClient();
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setUnauthenticated(true); setLoading(false); return; }
      const { data: rows } = await sb
        .from("orders").select("*, chefs(profiles(name))").eq("customer_id", data.session.user.id).order("created_at", { ascending: false });
      setOrders(rows ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <main style={{ padding: 32 }}><p>Loading...</p></main>;

  if (unauthenticated) return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: 32, textAlign: "center" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Sign in to see your orders</h1>
      <Link href="/checkout"><button style={{ background: "#1976d2", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Sign In</button></Link>
    </main>
  );

  if (orders.length === 0) return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>No orders yet</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Start ordering delicious meals from local chefs</p>
      <Link href="/chefs"><button style={{ background: "#1976d2", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Browse Chefs</button></Link>
    </main>
  );

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32 }}>
      <Link href="/dashboard" style={{ color: "#1976d2", textDecoration: "none" }}>← Back</Link>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "12px 0 24px" }}>My Orders</h1>
      {orders.map((order) => (
        <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 16, marginBottom: 12, border: "1px solid #e0e0e0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{order.chefs?.profiles?.name ?? "Chef"}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1976d2" }}>${(order.total_cents / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ background: STATUS_COLOR[order.status] ?? "#1976d2", color: "white", padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{order.status.replace("_", " ")}</span>
              <span style={{ color: "#1976d2", fontWeight: 600, fontSize: 14 }}>Details →</span>
            </div>
          </div>
        </Link>
      ))}
    </main>
  );
}
