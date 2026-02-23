"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div>
      <header style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>RidenDine Admin</h1>
        <button
          onClick={handleSignOut}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            cursor: "pointer",
            backgroundColor: "white",
          }}
        >
          Sign Out
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}
