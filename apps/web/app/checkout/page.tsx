"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCart } from "../../lib/CartContext";

const TIPS = [{ label: "No Tip", value: 0 }, { label: "$2", value: 2 }, { label: "$5", value: 5 }, { label: "$10", value: 10 }];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, getChefId } = useCart();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tip, setTip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const subtotal = getTotalPrice();
  const delivery = 4.99;
  const platform = subtotal * 0.15;
  const total = subtotal + delivery + platform + tip;

  useEffect(() => {
    getSupabaseClient().auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);
    const sb = getSupabaseClient();
    const fn = isSignUp ? sb.auth.signUp({ email, password }) : sb.auth.signInWithPassword({ email, password });
    const { data, error: authErr } = await fn;
    if (authErr) { setError(authErr.message); setAuthLoading(false); return; }
    setUser(data.user);
    setAuthLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) { setError("Please enter a delivery address."); return; }
    setLoading(true); setError("");
    try {
      const sb = getSupabaseClient();
      const { data: { user: u } } = await sb.auth.getUser();
      if (!u) { setError("Please sign in to place an order."); setLoading(false); return; }
      const chefId = getChefId();
      if (!chefId) { setError("Cart is empty."); setLoading(false); return; }

      const { data: order, error: oErr } = await sb.from("orders").insert({
        customer_id: u.id, chef_id: chefId, status: "placed",
        subtotal_cents: Math.round(subtotal * 100), delivery_fee_cents: Math.round(delivery * 100),
        platform_fee_cents: Math.round(platform * 100), tip_cents: Math.round(tip * 100),
        total_cents: Math.round(total * 100), delivery_method: "delivery", address, notes: notes || null,
      }).select().single();
      if (oErr) throw oErr;

      const { error: iErr } = await sb.from("order_items").insert(
        items.map((i) => ({ order_id: order.id, dish_id: i.dishId, quantity: i.quantity, price_cents: Math.round(i.price * 100) }))
      );
      if (iErr) throw iErr;

      clearCart();
      router.push(`/orders/${order.id}?placed=1`);
    } catch (err: any) {
      setError(err.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: 32, textAlign: "center" }}>
      <h1 style={{ marginBottom: 16 }}>Nothing to checkout</h1>
      <Link href="/chefs"><button style={{ background: "#1976d2", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Browse Chefs</button></Link>
    </main>
  );

  if (authLoading) return <main style={{ padding: 32 }}><p>Loading...</p></main>;

  if (!user) return (
    <main style={{ maxWidth: 440, margin: "60px auto", padding: 32 }}>
      <Link href="/cart" style={{ color: "#1976d2", textDecoration: "none" }}>← Back to Cart</Link>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "16px 0 4px" }}>{isSignUp ? "Create Account" : "Sign In to Order"}</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>You need an account to place an order</p>
      {error && <div style={{ padding: 12, background: "#ffebee", color: "#c62828", borderRadius: 6, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleAuth}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, boxSizing: "border-box" }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, boxSizing: "border-box" }} />
        <button type="submit" style={{ width: "100%", padding: 13, background: "#1976d2", color: "white", border: "none", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: 12, background: "none", border: "none", color: "#1976d2", cursor: "pointer", fontSize: 14 }}>
        {isSignUp ? "Already have an account? Sign In" : "No account? Create one"}
      </button>
    </main>
  );

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
      <Link href="/cart" style={{ color: "#1976d2", textDecoration: "none" }}>← Back to Cart</Link>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "16px 0 24px" }}>Checkout</h1>
      {error && <div style={{ padding: 12, background: "#ffebee", color: "#c62828", borderRadius: 6, marginBottom: 16 }}>{error}</div>}

      <Section title="Delivery Address">
        <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your delivery address" rows={3}
          style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, resize: "vertical", boxSizing: "border-box" }} />
      </Section>

      <Section title="Delivery Instructions (Optional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g., Ring doorbell, leave at door" rows={2}
          style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, resize: "vertical", boxSizing: "border-box" }} />
      </Section>

      <Section title="Add a Tip for the Chef">
        <div style={{ display: "flex", gap: 10 }}>
          {TIPS.map((t) => (
            <button key={t.value} onClick={() => setTip(t.value)}
              style={{ flex: 1, padding: 12, border: `2px solid ${tip === t.value ? "#1976d2" : "#e0e0e0"}`, borderRadius: 8, background: tip === t.value ? "#e3f2fd" : "white", color: tip === t.value ? "#1976d2" : "#666", fontWeight: 600, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Order Summary">
        <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 16 }}>
          {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Delivery Fee", `$${delivery.toFixed(2)}`], ["Platform Fee (15%)", `$${platform.toFixed(2)}`], ...(tip > 0 ? [["Tip", `$${tip.toFixed(2)}`]] : [])].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "#666" }}><span>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0e0e0", paddingTop: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1976d2" }}>${total.toFixed(2)}</span>
          </div>
        </div>
      </Section>

      <button onClick={handlePlaceOrder} disabled={loading}
        style={{ width: "100%", padding: 16, background: loading ? "#999" : "#1976d2", color: "white", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 8 }}>
        {loading ? "Placing Order..." : `Place Order ($${total.toFixed(2)})`}
      </button>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 24 }}><h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{title}</h2>{children}</div>;
}
