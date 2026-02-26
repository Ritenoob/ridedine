"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<{
    id: string;
    total_cents: number;
    payment_method: string;
    customer_email: string;
    tracking_token: string;
    chef?: { name: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*, chef:chefs(name)")
        .eq("id", orderId)
        .single();

      if (!error && data) {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div
        className="page"
        style={{ maxWidth: 600, textAlign: "center", paddingTop: 80 }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="page"
        style={{ maxWidth: 600, textAlign: "center", paddingTop: 80 }}
      >
        <h1>Order Not Found</h1>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 20 }}>
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 600, paddingTop: 40 }}>
      <div className="card card-body" style={{ textAlign: "center" }}>
        {/* Success Icon */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#10b981",
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
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Payment Successful!
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 16,
            marginBottom: 32,
          }}
        >
          Your order has been confirmed and is being prepared
        </p>

        {/* Order Details */}
        <div
          style={{
            backgroundColor: "var(--background-secondary)",
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>Order Number</span>
            <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
              #{orderId?.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>Chef</span>
            <span style={{ fontWeight: 600 }}>
              {order.chef?.name || "Unknown"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>Total Paid</span>
            <span style={{ fontWeight: 600, color: "#10b981" }}>
              ${(order.total_cents / 100).toFixed(2)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Payment Method
            </span>
            <span style={{ fontWeight: 600 }}>
              {order.payment_method === "stripe"
                ? "Credit Card"
                : "Cryptocurrency"}
            </span>
          </div>
        </div>

        {/* Delivery Info */}
        <div
          style={{
            backgroundColor: "#dbeafe",
            border: "1px solid #93c5fd",
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
                color: "#2563eb",
                marginRight: 12,
                flexShrink: 0,
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p style={{ fontWeight: 600, color: "#1e40af", marginBottom: 4 }}>
                What&apos;s Next?
              </p>
              <p style={{ fontSize: 14, color: "#1e40af", lineHeight: 1.5 }}>
                The chef will review your order and start preparing your meal.
                You&apos;ll receive updates via email at{" "}
                <strong>{order.customer_email}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href={`/tracking?token=${order.tracking_token}`}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Track Order
          </Link>
          <Link href="/" className="btn btn-secondary" style={{ flex: 1 }}>
            Browse More
          </Link>
        </div>
      </div>
    </div>
  );
}
