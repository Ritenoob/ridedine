"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCart } from "../../../lib/CartContext";

interface Dish { id: string; name: string; description: string; price: number; cuisine_type: string }
interface Chef { id: string; bio: string; cuisine_types: string[]; profiles: { name: string } }

export default function ChefDetailPage() {
  const { chefId } = useParams<{ chefId: string }>();
  const [chef, setChef] = useState<Chef | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const { addItem, getTotalItems, getTotalPrice, getChefId } = useCart();

  useEffect(() => {
    const sb = getSupabaseClient();
    Promise.all([
      sb.from("chefs").select("*, profiles(name)").eq("id", chefId).single(),
      sb.from("dishes").select("*").eq("chef_id", chefId).eq("available", true),
    ]).then(([{ data: c }, { data: d }]) => { setChef(c); setDishes(d ?? []); setLoading(false); });
  }, [chefId]);

  const handleAdd = (dish: Dish) => {
    const cartChef = getChefId();
    if (cartChef && cartChef !== chefId) {
      setNotice("You can only order from one chef at a time. Clear your cart first.");
      setTimeout(() => setNotice(""), 3000);
      return;
    }
    addItem({ dishId: dish.id, name: dish.name, price: dish.price, chefId: chefId, chefName: chef?.profiles?.name ?? "" });
    setNotice(`Added ${dish.name} to cart`);
    setTimeout(() => setNotice(""), 2000);
  };

  if (loading) return <main style={{ padding: 32 }}><p>Loading...</p></main>;
  if (!chef) return <main style={{ padding: 32 }}><p>Chef not found.</p></main>;

  const cartCount = getTotalItems();
  const cartTotal = getTotalPrice();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <Link href="/chefs" style={{ color: "#1976d2", textDecoration: "none" }}>← All Chefs</Link>
      <div style={{ margin: "20px 0 24px", padding: 24, background: "#e3f2fd", borderRadius: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{chef.profiles?.name}</h1>
        <p style={{ color: "#555", marginBottom: 12 }}>{chef.bio}</p>
        {chef.cuisine_types?.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {chef.cuisine_types.map((c) => <span key={c} style={{ background: "#1976d2", color: "white", padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600 }}>{c}</span>)}
          </div>
        )}
      </div>
      {notice && <div style={{ padding: 12, marginBottom: 16, background: notice.includes("only") ? "#fff3e0" : "#e8f5e9", border: `1px solid ${notice.includes("only") ? "#ffb300" : "#4caf50"}`, borderRadius: 8 }}>{notice}</div>}
      {cartCount > 0 && (
        <Link href="/cart" style={{ textDecoration: "none" }}>
          <div style={{ background: "#1976d2", color: "white", padding: "12px 20px", borderRadius: 8, marginBottom: 24, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600 }}>{cartCount} item{cartCount !== 1 ? "s" : ""} in cart</span>
            <span style={{ fontWeight: 700 }}>${cartTotal.toFixed(2)} · View Cart →</span>
          </div>
        </Link>
      )}
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Menu</h2>
      {dishes.length === 0 && <p style={{ color: "#666" }}>No dishes available right now.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(255px,1fr))", gap: 16 }}>
        {dishes.map((dish) => (
          <div key={dish.id} style={{ border: "1px solid #e0e0e0", borderRadius: 10, padding: 20, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{dish.name}</h3>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#1976d2", marginLeft: 12 }}>${Number(dish.price).toFixed(2)}</span>
            </div>
            {dish.description && <p style={{ color: "#666", fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>{dish.description}</p>}
            {dish.cuisine_type && <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>{dish.cuisine_type}</p>}
            <button onClick={() => handleAdd(dish)} style={{ width: "100%", padding: 10, background: "#1976d2", color: "white", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
