"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
const STATUSES = ["pending","accepted","preparing","ready","picked_up","delivered","cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrder, setNewOrder] = useState<any>(null);
  const supabase = useMemo(() => supabaseBrowser(), []);

  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("orders").select("*, chefs(*, profiles(name))").order("created_at", { ascending: false }).limit(50);
    setOrders(data || []); setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    fetchOrders();
    // Real-time: new orders
    const channel = supabase.channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, payload => {
        setNewOrder(payload.new);
        setOrders(prev => [payload.new, ...prev]);
        setTimeout(() => setNewOrder(null), 5000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!supabase) return;
    await supabase.from("orders").update({ status }).eq("id", orderId);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}>🍜 RidenDine</Link>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600, padding: "0 14px", marginBottom: 8 }}>Menu</div>
        {[["📊","Dashboard","/dashboard"],["📦","Orders","/dashboard/orders"],["🧑‍🍳","Chefs","/dashboard/chefs"],["🍽","Meals","/dashboard/meals"]].map(([icon,label,href])=>(
          <Link key={href} href={href} className={`sidebar-link ${href==="/dashboard/orders"?"active":""}`}>{icon} {label}</Link>
        ))}
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        {newOrder && (
          <div className="alert alert-info" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="live-dot"></span>
            🔔 New order received from {newOrder.customer_name || "customer"}! Total: ${((newOrder.total_cents||0)/100).toFixed(2)}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 className="page-title">Orders</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span className="live-dot"></span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Live updates enabled</span>
            </div>
          </div>
          <button onClick={fetchOrders} className="btn btn-outline btn-sm">↻ Refresh</button>
        </div>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Token</th><th>Customer</th><th>Chef</th><th>Total</th><th>Status</th><th>Payment</th><th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>No orders yet. They will appear here in real time.</td></tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td><code style={{ fontSize: 12 }}>{order.tracking_token || "—"}</code></td>
                  <td>{order.customer_name || "—"}<br/><span style={{fontSize:12,color:"var(--text-secondary)"}}>{order.customer_email}</span></td>
                  <td>{order.chefs?.profiles?.name || "—"}</td>
                  <td style={{ fontWeight: 700 }}>${((order.total_cents || 0) / 100).toFixed(2)}</td>
                  <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                  <td><span className={`badge badge-${order.payment_status}`}>{order.payment_status}</span></td>
                  <td>
                    <select defaultValue={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid var(--border)", fontSize: 13, cursor: "pointer" }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
