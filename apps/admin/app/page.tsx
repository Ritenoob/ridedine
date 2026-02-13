"use client";

import { useMemo, useState } from "react";

export default function AdminHome() {
  const MASTER = useMemo(
    () => process.env.NEXT_PUBLIC_ADMIN_MASTER_PASSWORD || "admin123",
    []
  );

  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER) {
      setAuthed(true);
    } else {
      alert("Invalid password");
    }
  };

  if (!authed) {
    return (
      <main style={{ padding: 40 }}>
        <h1>RIDENDINE Admin</h1>
        <p>Enter master password to continue.</p>

        <form onSubmit={onLogin} style={{ marginTop: 16 }}>
          <input
            type="password"
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginBottom: 10, minWidth: 320 }}
          />
          <button type="submit">Enter</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>RIDENDINE Admin Dashboard</h1>
      <p>Authenticated (dev gate). Build your dashboard here.</p>
    </main>
  );
}
