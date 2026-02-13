"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    const MASTER_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_MASTER_PASSWORD || "admin123";

    if (password === MASTER_PASSWORD) {
      document.cookie = "admin_auth=true; path=/";
      router.push("/");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>RIDENDINE Admin Login</h1>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <button onClick={handleLogin}>Login</button>
      </div>
    </main>
  );
}
