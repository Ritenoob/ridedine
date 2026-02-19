"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type TrackingRow = {
  status?: string | null;
  total_cents?: number | null;
  chef_name?: string | null;
  updated_at?: string | null;
  delivery_status?: string | null;
  driver_name?: string | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  return createClient(url, anon, { auth: { persistSession: false } });
}

function TrackingInner() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingRow | null>(null);

  const load = useCallback(async () => {
    setError(null);

    if (!token) {
      setData(null);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const res = await supabase.rpc("get_order_tracking", { token });
      if (res.error) {
        setError(res.error.message);
        setData(null);
      } else {
        const row = Array.isArray(res.data) ? res.data[0] : res.data;
        setData((row ?? null) as TrackingRow | null);
      }
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Order Tracking</h1>

      {!token && (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No tracking token</div>
          <div>Add <code>?token=...</code> to the URL.</div>
        </div>
      )}

      {token && (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Token:</span> <code>{token}</code>
          </div>

          {loading && <div>Loading…</div>}

          {error && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700 }}>Error</div>
              <div>{error}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                If you have not added the RPC yet, create Supabase function <code>get_order_tracking(token)</code>.
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              <div><b>Status:</b> {data.status ?? "-"}</div>
              <div><b>Chef:</b> {data.chef_name ?? "-"}</div>
              <div><b>Total:</b> {typeof data.total_cents === "number" ? `$${(data.total_cents / 100).toFixed(2)}` : "-"}</div>
              <div><b>Delivery:</b> {data.delivery_status ?? "-"}</div>
              <div><b>Driver:</b> {data.driver_name ?? "-"}</div>
              <div><b>Updated:</b> {data.updated_at ?? "-"}</div>
            </div>
          )}

          {!loading && !error && !data && (
            <div style={{ marginTop: 8 }}>No tracking data yet.</div>
          )}
        </div>
      )}
    </main>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading tracking…</div>}>
      <TrackingInner />
    </Suspense>
  );
}
