"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function AdminGate() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.push("/dashboard");
      else setLoading(false);
    });
  }, [router, supabase]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setErr("Supabase not configured"); return; }
    setErr(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      setSubmitting(false);
      return;
    }
    router.push("/dashboard");
  };

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <p style={{ color: "#6b7280" }}>Loading...</p>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>RIDENDINE Admin</h1>
        <p style={{ marginBottom: 16, color: "#6b7280" }}>Sign in with your admin account to continue.</p>

        <form onSubmit={onLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 10 }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
          />
          {err ? <p style={{ color: "#b91c1c", marginTop: 10 }}>{err}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12, border: "none", cursor: "pointer" }}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
