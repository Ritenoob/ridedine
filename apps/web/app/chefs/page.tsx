"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

interface Chef { id: string; bio: string; cuisine_types: string[]; profiles: { name: string } }

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupabaseClient()
      .from("chefs").select("*, profiles(name)").eq("status", "approved").order("created_at", { ascending: false })
      .then(({ data }) => { setChefs(data ?? []); setLoading(false); });
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <Link href="/dashboard" style={{ color: "#1976d2", textDecoration: "none" }}>← Back</Link>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "12px 0 4px" }}>Browse Chefs</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>Order home-cooked meals from local chefs</p>
      {loading && <p style={{ color: "#666" }}>Loading chefs...</p>}
      {!loading && chefs.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 60 }}>No chefs available right now.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 20 }}>
        {chefs.map((chef) => (
          <Link key={chef.id} href={`/chefs/${chef.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid #e0e0e0", borderRadius: 12, padding: 24, background: "#fff", cursor: "pointer" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1976d2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>👨‍🍳</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{chef.profiles?.name}</h2>
              <p style={{ color: "#666", fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>{chef.bio || "Home chef offering delicious meals"}</p>
              {chef.cuisine_types?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {chef.cuisine_types.map((c) => (
                    <span key={c} style={{ background: "#e3f2fd", color: "#1976d2", padding: "2px 8px", borderRadius: 10, fontSize: 12, fontWeight: 600 }}>{c}</span>
                  ))}
                </div>
              )}
              <span style={{ color: "#1976d2", fontWeight: 600, fontSize: 14 }}>View Menu →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
