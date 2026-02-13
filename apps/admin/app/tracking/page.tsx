export const dynamic = 'force-dynamic';
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

interface OrderTracking {
  id: string;
  status: string;
  updated_at?: string | null;
}

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("orders")
        .select("id,status,updated_at")
        .eq("id", trimmed)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setResult(null);
        setError("Order not found");
      } else {
        setResult(data as OrderTracking);
      }
    } catch (e: any) {
      setResult(null);
      setError(e?.message ?? "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const fromHash = hash?.startsWith("#") ? hash.slice(1) : "";
    if (fromHash) {
      setOrderId(fromHash);
      void loadOrder(fromHash);
    }
  }, [loadOrder]);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Order Tracking</h1>
        <Link href="/dashboard" style={{ marginLeft: "auto" }}>
          Back to Dashboard
        </Link>
      </div>

      <p style={{ marginTop: 8, color: "#444" }}>
        Enter an order ID to look up its current status.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order ID"
          style={{ minWidth: 260 }}
        />
        <button onClick={() => void loadOrder(orderId)} disabled={loading}>
          {loading ? "Checking..." : "Check Status"}
        </button>
      </div>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <p>
            <strong>ID:</strong> {result.id}
          </p>
          <p>
            <strong>Status:</strong> {result.status}
          </p>
          {result.updated_at && (
            <p>
              <strong>Updated:</strong> {new Date(result.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

