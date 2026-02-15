"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

type Status = "idle" | "ok" | "error";

export default function DashboardPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("error");
      setDetail("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (or running server-side).");
      return;
    }

    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setDetail(error.message);
        } else {
          setStatus("ok");
          setDetail("Supabase configured (session endpoint reachable).");
        }
      })
      .catch((e) => {
        setStatus("error");
        setDetail(e?.message ?? "Unknown error");
      });
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: 1040, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>RIDENDINE</h1>
          <p style={{ margin: "0.25rem 0 0", opacity: 0.8 }}>Customer dashboard</p>
        </div>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link href="/dashboard">Home</Link>
          <Link href="/tracking">Tracking</Link>
          <Link href="/orders">Orders</Link>
        </nav>
      </header>

      <section style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Backend status</h2>
        <p>
          Status:{" "}
          <strong>
            {status === "idle" ? "Checking…" : status === "ok" ? "Connected" : "Error"}
          </strong>
        </p>
        <p style={{ marginBottom: 0, opacity: 0.85 }}>{detail}</p>
      </section>
    </main>
  );
}

