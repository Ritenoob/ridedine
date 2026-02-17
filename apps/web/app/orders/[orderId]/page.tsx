"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "../../../lib/supabaseClient";

const STATUS_COLOR: Record<string, string> = { delivered: "#4caf50", cancelled: "#f44336", refunded: "#f44336", placed: "#ff9800" };

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseClient();
    Promise.all([
      sb.from("orders").select("*, chefs(profiles(name))").eq("id", orderId).single(),
      sb.from("order_items").select("*, dishes(name)").eq("order_id", orderId),
    ]).then(([{ data: o }, { data: i }]) => { setOrder(o); setItems(i ?? []); setLoading(false); });
  }, [orderId]);

  if (loading) return <main style={{ padding: 32 }}><p>Loading...</p></main>;
  if (!order) return <main style={{ padding: 32 }}><p>Order not found.</p></main>;

  const placed = searchParams.get("placed") === "1";

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
      <Link href="/orders" style={{ color: "#1976d2", textDecoration: "none" }}>← My Orders</Link>

      {placed && (
        <div style={{ background: "#e8f5e9", border: "1px solid #4caf50", borderRadius: 8, padding: 16, margin: "16px 0", color: "#2e7d32", fontWeight: 600 }}>
          Order placed successfully! Your chef has been notified.
        </div>
      )}

      <div style={{ marginTop: 20, marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ background: STATUS_COLOR[order.status] ?? "#1976d2", color: "white", padding: "4px 14px", borderRadius: 4, fontSize: 13, fontWeight: 600, textTransform: "uppercase" }}>{order.status.replace("_", " ")}</span>
          <span style={{ color: "#666", fontSize: 14 }}>{new Date(order.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <Row label="Chef" value={order.chefs?.profiles?.name ?? "—"} />
        <Row label="Delivery Address" value={order.address ?? "—"} />
        {order.notes && <Row label="Instructions" value={order.notes} />}
        {order.tracking_token && (
          <div style={{ marginTop: 12 }}>
            <Link href={`/tracking?token=${order.tracking_token}`} style={{ color: "#1976d2", fontWeight: 600 }}>Track this order →</Link>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Items</h2>
      {items.map((item) => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
          <span>{item.dishes?.name ?? "Item"} × {item.quantity}</span>
          <span style={{ fontWeight: 600 }}>${((item.price_cents ?? 0) * item.quantity / 100).toFixed(2)}</span>
        </div>
      ))}

      <div style={{ marginTop: 20, background: "#f8f9fa", borderRadius: 8, padding: 16 }}>
        {[["Subtotal", order.subtotal_cents], ["Delivery Fee", order.delivery_fee_cents], ["Platform Fee", order.platform_fee_cents], order.tip_cents > 0 ? ["Tip", order.tip_cents] : null]
          .filter(Boolean).map(([l, c]: any) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#666" }}>
              <span>{l}</span><span style={{ fontWeight: 600 }}>${(c / 100).toFixed(2)}</span>
            </div>
          ))}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0e0e0", paddingTop: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Total</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1976d2" }}>${(order.total_cents / 100).toFixed(2)}</span>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
