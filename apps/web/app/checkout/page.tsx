"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/CartContext";
import { getSupabaseClient } from "../../lib/supabaseClient";

export default function CheckoutPage() {
  const { items, total, chefId, clearCart } = useCart();
  const router = useRouter();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
    // Pre-fill user details if logged in
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setEmail(data.session.user.email ?? "");
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", data.session.user.id).single();
      if (profile?.name) setName(profile.name);
    });
  }, [items.length, router]);

  const placeOrder = async () => {
    const supabase = getSupabaseClient();
    if (!chefId || items.length === 0) return;
    if (!deliveryAddress.trim()) { alert("Please enter a delivery address."); return; }

    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id ?? null;
    const customerName = name.trim() || "Guest";
    const customerEmail = email.trim() || "guest@example.com";

    // Create order in Supabase
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        chef_id: chefId,
        customer_id: userId,
        customer_name: customerName,
        customer_email: customerEmail,
        delivery_address: deliveryAddress,
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
          <div>
            <div className="card card-body" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Delivery Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label className="form-label">Your Name</label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>
                <div>
                  <label className="form-label">Delivery Address</label>
                  <input className="form-input" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="123 Main St, City, State" required />
                </div>
              </div>
            </div>
            <div className="card card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Place Order</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: 14 }}>
                Payment is collected on delivery. Order will be confirmed once the chef accepts.
              </p>
              <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={placeOrder}>
                Place Order — ${total.toFixed(2)}
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
