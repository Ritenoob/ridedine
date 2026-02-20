"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/CartContext";
import { supabase } from "../../lib/supabaseClient";

export default function CheckoutPage() {
  const { items, total, chefId, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items.length, router]);

  const placeOrder = async () => {
    if (!chefId || items.length === 0) return;

    // Create order in Supabase (NO payment)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        chef_id: chefId,
        customer_name: "Guest",
        customer_email: "guest@example.com",
        delivery_address: "",
        status: "pending",
        payment_status: "unpaid",
        total_cents: Math.round(total * 100),
      })
      .select()
      .single();

    if (orderErr) {
      alert(orderErr.message);
      return;
    }

    // Insert order items
    await supabase.from("order_items").insert(
      items.map((i: any) => ({
        order_id: order.id,
        dish_id: i.id,
        quantity: i.quantity,
        price_cents: Math.round(i.price * 100),
      }))
    );

    clearCart();
    router.push(`/tracking?token=${order.tracking_token}`);
  };

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">🍜 RidenDine</Link>
        <Link href="/cart" className="nav-link">← Back to Cart</Link>
      </nav>

      <div className="page" style={{ maxWidth: 900 }}>
        <h1 className="page-title" style={{ marginBottom: 16 }}>Checkout</h1>

        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          Payments are temporarily disabled (Stripe not configured). You can still place a test order.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
          <div>
            <div className="card card-body" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Place Test Order</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                This creates an order in Supabase with payment_status = unpaid.
              </p>
              <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={placeOrder}>
                Place Order (No Payment) — ${total.toFixed(2)}
              </button>
            </div>
          </div>

          <div>
            <div className="card card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
              {items.map((i: any) => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                  <span>{i.name} × {i.quantity}</span>
                  <span style={{ fontWeight: 600 }}>${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}