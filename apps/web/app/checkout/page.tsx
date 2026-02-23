"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/CartContext";
import { getSupabaseClient } from "../../lib/supabaseClient";

interface CartItemWithDetails {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CheckoutPage() {
  const { items, total, chefId, clearCart } = useCart();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items.length, router]);

  const proceedToPayment = async () => {
    const supabase = getSupabaseClient();
    if (!chefId || items.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      // Check authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Create order in Supabase with payment_status: 'pending'
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          chef_id: chefId,
          customer_id: session.user.id,
          customer_name: session.user.email || "Customer",
          customer_email: session.user.email || "",
          delivery_address: "", // TODO: Add address input in Task 6
          status: "draft",
          payment_status: "pending",
          total_cents: Math.round(total * 100),
        })
        .select()
        .single();

      if (orderErr) {
        throw new Error(orderErr.message);
      }

      // Insert order items
      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          dish_id: i.id,
          quantity: i.quantity,
          price_cents: Math.round(i.price * 100),
        }))
      );

      if (itemsErr) {
        throw new Error(itemsErr.message);
      }

      // Call Edge Function to create Stripe Checkout session
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_checkout_session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            success_url: `${window.location.origin}/orders/${order.id}/success`,
            cancel_url: `${window.location.origin}/orders/${order.id}/cancel`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { session_url } = await response.json();

      if (session_url) {
        // Clear cart before redirecting
        clearCart();

        // Redirect to Stripe Checkout
        window.location.href = session_url;
      } else {
        throw new Error("No session URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "An error occurred during checkout");
      setProcessing(false);
    }
  };

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">
          <img src="/logo.svg" alt="RideNDine" style={{ height: 32, width: "auto", verticalAlign: "middle" }} />
        </Link>
        <Link href="/cart" className="nav-link">
          ← Back to Cart
        </Link>
      </nav>

      <div className="page" style={{ maxWidth: 900 }}>
        <h1 className="page-title" style={{ marginBottom: 16 }}>
          Checkout
        </h1>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
          <div>
            <div className="card card-body" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Secure Checkout</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                You&apos;ll be redirected to Stripe&apos;s secure payment page to complete your purchase.
              </p>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: "100%" }}
                onClick={proceedToPayment}
                disabled={processing}
              >
                {processing ? "Processing..." : `Proceed to Payment — $${total.toFixed(2)}`}
              </button>
            </div>
          </div>

          <div>
            <div className="card card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
              {items.map((i: CartItemWithDetails) => (
                <div
                  key={i.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                    fontSize: 14,
                  }}
                >
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span style={{ fontWeight: 600 }}>${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  marginTop: 12,
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
