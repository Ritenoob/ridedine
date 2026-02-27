"use client";
import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

type ProfileRow = {
  name?: string | null;
  role?: string | null;
};

type UserRow = {
  id: string;
  email?: string | null;
};

export default function AccountPage() {
  const [user, setUser] = useState<UserRow | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const sb = getSupabaseClient();
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setLoading(false); return; }
      setUser(data.session.user as UserRow);
      const { data: p } = await sb.from("profiles").select("*").eq("id", data.session.user.id).single();
      setProfile(p as ProfileRow | null);
      setLoading(false);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setAuthLoading(true);
    const sb = getSupabaseClient();
    const fn = isSignUp ? sb.auth.signUp({ email, password }) : sb.auth.signInWithPassword({ email, password });
    const { data, error: authErr } = await fn;
    if (authErr) { setError(authErr.message); setAuthLoading(false); return; }
    setUser(data.user as UserRow | null);
    if (data.user) {
      const { data: p } = await sb.from("profiles").select("*").eq("id", data.user.id).single();
      setProfile(p as ProfileRow | null);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await getSupabaseClient().auth.signOut();
    setUser(null); setProfile(null);
  };

  if (loading) return <main style={{ padding: 32 }}><p>Loading...</p></main>;

  if (!user) return (
    <main style={{ maxWidth: 440, margin: "60px auto", padding: 32 }}>
      <Link href="/dashboard" style={{ color: "#1976d2", textDecoration: "none" }}>← Back</Link>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "16px 0 4px" }}>{isSignUp ? "Create Account" : "Sign In"}</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Access your orders and account details</p>
      {error && <div style={{ padding: 12, background: "#ffebee", color: "#c62828", borderRadius: 6, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleAuth}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, boxSizing: "border-box" }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
          style={{ width: "100%", padding: 12, marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, boxSizing: "border-box" }} />
        <button type="submit" disabled={authLoading}
          style={{ width: "100%", padding: 13, background: "#1976d2", color: "white", border: "none", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {authLoading ? "..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: 12, background: "none", border: "none", color: "#1976d2", cursor: "pointer", fontSize: 14 }}>
        {isSignUp ? "Already have an account? Sign In" : "No account? Create one"}
      </button>
    </main>
  );

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <Link href="/dashboard" style={{ color: "#1976d2", textDecoration: "none" }}>← Back</Link>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "16px 0 24px" }}>My Account</h1>

      <div style={{ background: "#f5f5f5", borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#1976d2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 26, color: "white" }}>
          {(profile?.name ?? user.email ?? "?")[0].toUpperCase()}
        </div>
        <InfoRow label="Name" value={profile?.name ?? "—"} />
        <InfoRow label="Email" value={user.email ?? "—"} />
        <InfoRow label="Role" value={profile?.role ?? "customer"} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Link href="/orders"><button style={navBtn}>My Orders</button></Link>
        <Link href="/chefs"><button style={navBtn}>Browse Chefs</button></Link>
        <button onClick={handleSignOut} style={{ ...navBtn, background: "#fff", color: "#f44336", border: "1px solid #f44336" }}>Sign Out</button>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{value}</div>
    </div>
  );
}

const navBtn: React.CSSProperties = { width: "100%", padding: "13px 20px", background: "#1976d2", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left" };
