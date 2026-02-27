"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../../lib/supabaseClient";

interface Order {
  id: string;
  tracking_token: string;
  status: string;
  payment_status: string;
  total_cents: number;
  customer_name: string;
  delivery_address: string;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
          <Image src="/logo.svg" alt="RideNDine" width={130} height={32} style={{ height: 32, width: "auto", verticalAlign: "middle" }} />
        </Link>
      </nav>

      <div className="page" style={{ maxWidth: 600, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>

        <h1 className="page-title" style={{ marginBottom: 12 }}>
          Payment Successful!
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 32 }}>
          Your order has been placed and payment confirmed.
        </p>

        <div className="card card-body" style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
              Tracking Token
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>
              {order.tracking_token || "—"}
            </div>
          </div>

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
          <Link href={`/tracking/${order.tracking_token}`} className="btn btn-primary">
            Track Order
          </Link>
          <Link href="/orders" className="btn btn-outline">
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
