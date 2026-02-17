"use client";
import Link from "next/link";
import { useCart } from "../../lib/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const DELIVERY = 4.99;
  const subtotal = getTotalPrice();
  const platform = subtotal * 0.15;
  const total = subtotal + DELIVERY + platform;

  if (items.length === 0) return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Add some delicious meals to get started</p>
      <Link href="/chefs"><button style={{ background: "#1976d2", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Browse Chefs</button></Link>
    </main>
  );

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Your Cart</h1>
        <button onClick={clearCart} style={{ background: "none", border: "none", color: "#f44336", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Clear All</button>
      </div>
      <p style={{ color: "#666", marginBottom: 24 }}>From: {items[0]?.chefName}</p>

      {items.map((item) => (
        <div key={item.id} style={{ background: "#f5f5f5", borderRadius: 8, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{item.name}</span>
            <span style={{ fontWeight: 700, color: "#1976d2" }}>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #ccc", background: "white", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>−</button>
            <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #ccc", background: "white", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>+</button>
            <button onClick={() => removeItem(item.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f44336", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Remove</button>
          </div>
        </div>
      ))}

      <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 20, marginTop: 24 }}>
        {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Delivery Fee", `$${DELIVERY.toFixed(2)}`], ["Platform Fee (15%)", `$${platform.toFixed(2)}`]].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "#666" }}>
            <span>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e0e0e0", paddingTop: 12, marginTop: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1976d2" }}>${total.toFixed(2)}</span>
        </div>
      </div>

      <Link href="/checkout">
        <button style={{ width: "100%", marginTop: 20, padding: 16, background: "#1976d2", color: "white", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          Proceed to Checkout (${total.toFixed(2)})
        </button>
      </Link>
    </main>
  );
}
