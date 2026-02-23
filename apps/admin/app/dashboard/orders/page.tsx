"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { OrderStatus, canTransitionStatus, nextStatuses } from "@home-chef/shared";

type TabKey = "new" | "in_progress" | "completed" | "cancelled";
const TABS: { key: TabKey; label: string; statuses: OrderStatus[] }[] = [
  { key: "new", label: "New", statuses: [OrderStatus.DRAFT, OrderStatus.SUBMITTED, OrderStatus.PLACED] },
  { key: "in_progress", label: "In Progress", statuses: [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY] },
  { key: "completed", label: "Completed", statuses: [OrderStatus.DELIVERED] },
  { key: "cancelled", label: "Cancelled", statuses: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrder, setNewOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("new");
  const supabase = useMemo(() => createClient(), []);

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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload: any) => {
        setNewOrder(payload.new);
        setOrders(prev => [payload.new, ...prev]);
        setTimeout(() => setNewOrder(null), 5000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload: any) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchOrders]);

  const updateStatus = useCallback(async (orderId: string, status: string) => {
    if (!supabase) return;
    await supabase.from("orders").update({ status }).eq("id", orderId);
  }, [supabase]);

  const handleStatusChange = useCallback(async (orderId: string, currentStatus: OrderStatus, nextStatus: string) => {
    if (nextStatus && canTransitionStatus(currentStatus, nextStatus as OrderStatus)) {
      await updateStatus(orderId, nextStatus);
    }
  }, [updateStatus]);

  const tabOrders = useMemo(() => {
    const tab = TABS.find(t => t.key === activeTab);
    if (!tab) return orders;
    return orders.filter(o => tab.statuses.includes(o.status as OrderStatus));
  }, [orders, activeTab]);

  const tabCounts = useMemo(() =>
    Object.fromEntries(TABS.map(t => [t.key, orders.filter(o => t.statuses.includes(o.status as OrderStatus)).length])),
    [orders]
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}><img src="/logo.svg" alt="RideNDine" style={{height:32,width:"auto",verticalAlign:"middle"}} /></Link>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 className="page-title">Orders</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span className="live-dot"></span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Live updates enabled</span>
            </div>
          </div>
          <button onClick={fetchOrders} className="btn btn-outline btn-sm">↻ Refresh</button>
        </div>

        {/* Status Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontWeight: activeTab === tab.key ? 700 : 400,
                borderBottom: activeTab === tab.key ? "2px solid var(--primary, #FF7A00)" : "2px solid transparent",
                color: activeTab === tab.key ? "var(--primary, #FF7A00)" : "var(--text-secondary)", fontSize: 14 }}>
              {tab.label} {tabCounts[tab.key] > 0 && <span style={{ background: "#FF7A00", color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{tabCounts[tab.key]}</span>}
            </button>
          ))}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Token</th><th>Customer</th><th>Chef</th><th>Total</th><th>Status</th><th>Payment</th><th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>Loading orders...</td></tr>
              ) : tabOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>No orders in this category.</td></tr>
              ) : tabOrders.map(order => {
                const currentStatus = order.status as OrderStatus;
                const allowed = nextStatuses(currentStatus);
                return (
                  <tr key={order.id}>
                    <td><code style={{ fontSize: 12 }}>{order.tracking_token || "—"}</code></td>
                    <td>{order.customer_name || "—"}<br/><span style={{fontSize:12,color:"var(--text-secondary)"}}>{order.customer_email}</span></td>
                    <td>{order.chefs?.profiles?.name || "—"}</td>
                    <td style={{ fontWeight: 700 }}>${((order.total_cents || 0) / 100).toFixed(2)}</td>
                    <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                    <td><span className={`badge badge-${order.payment_status}`}>{order.payment_status}</span></td>
                    <td>
                      {allowed.length > 0 ? (
                        <select defaultValue="" onChange={e => handleStatusChange(order.id, currentStatus, e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid var(--border)", fontSize: 13, cursor: "pointer" }}>
                          <option value="" disabled>Move to…</option>
                          {allowed.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
