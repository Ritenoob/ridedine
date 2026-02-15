"use client";
export const dynamic = 'force-dynamic';
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase-browser";

interface Order {
  id: string;
  status: string;
  total_amount?: number | null;
  created_at?: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total_amount,created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setOrders((data ?? []) as Order[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <Link href="/dashboard" style={{ marginLeft: "auto" }}>
          Back to Dashboard
        </Link>
      </div>

      <p style={{ marginTop: 8, color: "#444" }}>
        Latest 50 orders (demo view).
      </p>

      <button onClick={() => void loadOrders()} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>

      {error && (
        <p style={{ color: "crimson", marginTop: 12 }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <p>Loading orders…</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {orders.map((o) => (
              <li key={o.id}>
                <strong>{o.id}</strong> — {o.status}
                {typeof o.total_amount === "number" ? ` — $${(o.total_amount / 100).toFixed(2)}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}



