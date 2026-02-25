"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, LogRocket, etc.)
    console.error('Global error:', error, error.digest);
  }, [error]);

  // Never expose internal error messages to users in production
  const userMessage = process.env.NODE_ENV === 'development'
    ? error.message
    : 'An unexpected error occurred. Please try again.';

  return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        {userMessage}
      </p>
      <p style={{ color: "#999", fontSize: 12, marginBottom: 24 }}>
        If this problem persists, please contact support.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{ background: "#FF7A00", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
        >
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          style={{ background: "#f5f5f5", color: "#333", border: "1px solid #ddd", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
        >
          Go home
        </button>
      </div>
    </main>
  );
}
