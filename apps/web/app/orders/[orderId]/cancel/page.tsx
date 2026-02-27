"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../../lib/supabaseClient";

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_cents: number;
}

export default function PaymentCancelPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !data) {
        console.error("Failed to load order:", error);
        setLoading(false);
        return;
      }

      setOrder(data as Order);
      setLoading(false);
    };

    loadOrder();
  }, [orderId]);

  const retryPayment = async () => {
    if (!order) return;

    setRetrying(true);
    const supabase = getSupabaseClient();

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Please sign in to continue");
        router.push("/login");
        return;
      }

      // Call Edge Function to create Stripe session
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_checkout_session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            success_url: `${window.location.origin}/orders/${orderId}/success`,
            cancel_url: `${window.location.origin}/orders/${orderId}/cancel`,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { session_url } = await response.json();

      if (session_url) {
        // Redirect to Stripe Checkout
        window.location.href = session_url;
      }
    } catch (error: unknown) {
      console.error("Retry payment error:", error);
      const message = error instanceof Error ? error.message : "Failed to retry payment";
      alert(message);
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", padding: 60 }}>
        <h1 className="page-title">Loading...</h1>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page" style={{ textAlign: "center", padding: 60 }}>
        <h1 className="page-title">Order Not Found</h1>
        <Link href="/orders" className="btn btn-primary" style={{ marginTop: 20 }}>
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">
          <img src="/logo.svg" alt="RideNDine" style={{ height: 32, width: "auto", verticalAlign: "middle" }} />
        </Link>
      </nav>

      <div className="page" style={{ maxWidth: 600, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>

        <h1 className="page-title" style={{ marginBottom: 12 }}>
          Payment Cancelled
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 32 }}>
          Your payment was cancelled. Your order is still pending and waiting for payment.
        </p>

        <div className="card card-body" style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
              Order Total
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              ${(order.total_cents / 100).toFixed(2)}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
              Status
            </div>
            <span className={`badge badge-${order.status}`}>
              {order.status}
            </span>
          </div>

          <div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
              Payment Status
            </div>
            <span className={`badge badge-${order.payment_status}`}>
              {order.payment_status}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={retryPayment}
            disabled={retrying}
            className="btn btn-primary"
          >
            {retrying ? "Processing..." : "Retry Payment"}
          </button>
          <Link href="/orders" className="btn btn-outline">
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
