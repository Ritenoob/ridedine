"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function AdminGate() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    async function checkSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // User is logged in, check if they're an admin
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile?.role === "admin") {
            router.push("/dashboard");
            return;
          } else {
            setError("Access denied: Admin role required");
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router, supabase]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSigningIn(true);

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!data.user) {
        setError("Login failed");
        return;
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        setError("Failed to verify admin access");
        await supabase.auth.signOut();
        return;
      }

      if (profile.role !== "admin") {
        setError("Access denied: Admin role required");
        await supabase.auth.signOut();
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>RIDENDINE Admin</h1>
        <p style={{ marginBottom: 16, color: "#6b7280" }}>Sign in with your admin account.</p>

        <form onSubmit={onLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 12 }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
          />
          {error ? <p style={{ color: "#b91c1c", marginTop: 10 }}>{error}</p> : null}
          <button
            type="submit"
            disabled={isSigningIn}
            style={{
              width: "100%",
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: "none",
              cursor: isSigningIn ? "not-allowed" : "pointer",
              opacity: isSigningIn ? 0.6 : 1,
            }}
          >
            {isSigningIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
