"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminHome() {
  const MASTER = useMemo(
    () => process.env.NEXT_PUBLIC_ADMIN_MASTER_PASSWORD || "admin123",
    []
  );

  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER) {
      setAuthed(true);
      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } else {
      alert("Invalid password");
    }
  };

  if (!authed) {
    return (
      <main style={{ 
        padding: 40, 
        maxWidth: 500, 
        margin: '100px auto',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: 32, marginBottom: 10 }}>🍽️ RidenDine Admin</h1>
        <p style={{ color: '#666', marginBottom: 30 }}>
          Premium Home Chef Marketplace Administration
        </p>

        <form onSubmit={onLogin} style={{ marginTop: 16 }}>
          <input
            type="password"
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              display: "block", 
              marginBottom: 10, 
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ddd',
              borderRadius: 4
            }}
          />
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Enter Admin Dashboard
          </button>
        </form>
        
        <p style={{ marginTop: 20, fontSize: 12, color: '#999' }}>
          Default: admin123
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Redirecting...</h1>
    </main>
  );
}
