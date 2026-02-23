"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { SESSION_KEY } from "@home-chef/data";
import { useSubscribeOrders } from "@home-chef/data";

interface Order { id: string; status: string; total_cents: number; created_at: string; tracking_token: string; chefs?: { profiles?: { name?: string } } }

const STATUS_COLOR: Record<string, string> = { delivered: "#4caf50", cancelled: "#f44336", refunded: "#f44336", placed: "#ff9800", submitted: "#2196f3", accepted: "#ff9800", preparing: "#ff9800", out_for_delivery: "#2196f3" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => {
    try { return getSupabaseClient(); } catch { return null; }
  }, []);

  const sessionId = typeof window !== "undefined" ? (localStorage.getItem(SESSION_KEY) ?? undefined) : undefined;

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    async function load() {
      if (!supabase) return;
      // Try authenticated first, fall back to session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      let query = supabase.from("orders").select("*, chefs(profiles(name))").order("created_at", { ascending: false });
      if (userId) {
        query = query.eq("customer_id", userId);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        setOrders([]);
        setLoading(false);
        return;
      }
      const { data: rows } = await query;
      setOrders(rows ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, sessionId]);

  useSubscribeOrders(
    supabase,
    { sessionId },
    ({ eventType, new: updated }) => {
      const order = updated as unknown as Order;
      if (eventType === "INSERT") {
        setOrders((prev) => [order, ...prev]);
      } else {
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, ...order } : o));
      }
    }
  );

  if (loading) return (
    <main style={{ padding: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ background: "#f0f0f0", borderRadius: 8, height: 80, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    </main>
  );

  if (orders.length === 0) return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>No orders yet</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Start ordering delicious meals from local chefs</p>
      <Link href="/chefs"><button style={{ background: "#FF7A00", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Browse Chefs</button></Link>
    </main>
  );

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32 }}>
      <Link href="/dashboard" style={{ color: "#FF7A00", textDecoration: "none" }}>← Back</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>My Orders</h1>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#2196f3" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2196f3", display: "inline-block" }} />
          Live
        </span>
      </div>
      {orders.map((order) => (
        <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 16, marginBottom: 12, border: "1px solid #e0e0e0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{order.chefs?.profiles?.name ?? "Chef"}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#FF7A00" }}>${(order.total_cents / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ background: STATUS_COLOR[order.status] ?? "#FF7A00", color: "white", padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{order.status.replace(/_/g, " ")}</span>
              <span style={{ color: "#FF7A00", fontWeight: 600, fontSize: 14 }}>Details →</span>
            </div>
          </div>
        </Link>
      ))}
    </main>
  );
}
