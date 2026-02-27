"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentFailedClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Unknown error";

  return (
    <div className="page" style={{ maxWidth: 600, paddingTop: 40 }}>
      <div className="card card-body" style={{ textAlign: "center" }}>
        {/* Error Icon */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <svg
              style={{ width: 48, height: 48, color: "white" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Payment Failed
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 16,
            marginBottom: 32,
          }}
        >
          We couldn&apos;t process your payment
        </p>

        {/* Error Details */}
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "start" }}>
            <svg
              style={{
                width: 20,
                height: 20,
                color: "#dc2626",
                marginRight: 12,
                flexShrink: 0,
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p style={{ fontWeight: 600, color: "#991b1b", marginBottom: 4 }}>
                Error Details
              </p>
              <p style={{ fontSize: 14, color: "#991b1b", lineHeight: 1.5 }}>
                {reason}
              </p>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div
          style={{
            backgroundColor: "var(--background-secondary)",
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Common Issues</h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            <li>Card declined by your bank</li>
            <li>Insufficient funds</li>
            <li>Incorrect card details</li>
            <li>Card expired or not activated</li>
            <li>Transaction limit exceeded</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/checkout" className="btn btn-primary">
            Try Again
          </Link>
          <Link href="/" className="btn btn-secondary">
            Return Home
          </Link>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          Need help? Contact us at support@ridendine.com
        </p>
      </div>
    </div>
  );
}
