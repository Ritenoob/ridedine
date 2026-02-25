"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGate() {
  const router = useRouter();

  // NOTE: This is a DEMO gate, not real security. Do proper auth (Supabase roles) for production.
  const MASTER = useMemo(
    () => process.env.NEXT_PUBLIC_ADMIN_MASTER_PASSWORD || "admin123",
    []
  );

  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER) {
      setErr(null);
      router.push("/dashboard");
      return;
    }
    setErr("Incorrect password");
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>RIDENDINE Admin</h1>
        <p style={{ marginBottom: 16, color: "#6b7280" }}>Enter the admin password to continue.</p>

        <form onSubmit={onLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
          />
          {err ? <p style={{ color: "#b91c1c", marginTop: 10 }}>{err}</p> : null}
          <button
            type="submit"
            style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12, border: "none", cursor: "pointer" }}
          >
            Continue
          </button>
        </form>

        <p style={{ marginTop: 12, fontSize: 12, color: "#9ca3af" }}>
          Tip: set NEXT_PUBLIC_ADMIN_MASTER_PASSWORD to override the default.
        </p>
      </div>
    </main>
  );
}
