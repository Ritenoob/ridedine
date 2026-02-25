"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  cuisine_type: string;
  available: boolean;
  featured: boolean;
  created_at: string;
  chefs: {
    id: string;
    profiles: {
      name: string;
    };
  };
}

export default function MealsPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const supabase = useMemo(() => supabaseBrowser(), []);

  const loadDishes = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      let query = supabase
        .from("dishes")
        .select("*, chefs(id, profiles(name))")
        .order("created_at", { ascending: false });

      if (filter === "featured") {
        query = query.eq("featured", true);
      } else if (filter === "available") {
        query = query.eq("available", true);
      } else if (filter === "unavailable") {
        query = query.eq("available", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error("Error loading dishes:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  const toggleFeatured = async (dishId: string, currentFeatured: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("dishes")
        .update({ featured: !currentFeatured })
        .eq("id", dishId);

      if (error) throw error;
      loadDishes();
    } catch (error) {
      console.error("Error updating dish:", error);
      alert("Failed to update meal");
    }
  };

  const toggleAvailability = async (dishId: string, currentAvailable: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("dishes")
        .update({ available: !currentAvailable })
        .eq("id", dishId);

      if (error) throw error;
      loadDishes();
    } catch (error) {
      console.error("Error updating dish:", error);
      alert("Failed to update meal");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}>🍜 RidenDine</Link>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600, padding: "0 14px", marginBottom: 8 }}>Menu</div>
        {[["📊","Dashboard","/dashboard"],["📦","Orders","/dashboard/orders"],["🧑‍🍳","Chefs","/dashboard/chefs"],["🍽","Meals","/dashboard/meals"],["👥","Users","/dashboard/users"],["⚙️","Settings","/dashboard/settings"]].map(([icon,label,href])=>(
          <Link key={href} href={href} className={`sidebar-link ${href==="/dashboard/meals"?"active":""}`}>{icon} {label}</Link>
        ))}
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ marginBottom: 30 }}>
          <h1 className="page-title">🍱 Meal Management</h1>
          <p className="page-subtitle">Manage and feature meals on the platform</p>
        </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: 30, display: "flex", gap: 10 }}>
        {["all", "featured", "available", "unavailable"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "10px 20px",
              backgroundColor: filter === status ? "#1976d2" : "#f0f0f0",
              color: filter === status ? "white" : "#333",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p>Loading meals...</p>
        </div>
      )}

      {/* Meals List */}
      {!loading && dishes.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: 60, 
          backgroundColor: "#f8f9fa",
          borderRadius: 8
        }}>
          <p style={{ fontSize: 18, color: "#666" }}>
            No {filter !== "all" ? filter : ""} meals found
          </p>
        </div>
      )}

      {!loading && dishes.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
          {dishes.map((dish) => (
            <div
              key={dish.id}
              style={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: 20,
                position: "relative",
              }}
            >
              {/* Featured Badge */}
              {dish.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    backgroundColor: "#ffd700",
                    color: "#000",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ⭐ FEATURED
                </div>
              )}

              <div style={{ marginBottom: 15 }}>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{dish.name}</h3>
                <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
                  {dish.description}
                </p>
                <p style={{ fontSize: 20, fontWeight: "bold", color: "#1976d2", marginBottom: 8 }}>
                  ${dish.price}
                </p>
                <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
                  Chef: {dish.chefs?.profiles?.name || "Unknown"}
                </p>
                <p style={{ fontSize: 12, color: "#999" }}>
                  Cuisine: {dish.cuisine_type}
                </p>
              </div>

              {/* Status Indicators */}
              <div style={{ marginBottom: 15, display: "flex", gap: 8 }}>
                <span
                  style={{
                    padding: "4px 8px",
                    backgroundColor: dish.available ? "#4caf50" : "#f44336",
                    color: "white",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {dish.available ? "AVAILABLE" : "UNAVAILABLE"}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => toggleFeatured(dish.id, dish.featured)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: dish.featured ? "#ffd700" : "#e0e0e0",
                    color: dish.featured ? "#000" : "#333",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {dish.featured ? "⭐ Unfeature" : "☆ Feature on Homepage"}
                </button>
                <button
                  onClick={() => toggleAvailability(dish.id, dish.available)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: dish.available ? "#f44336" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {dish.available ? "❌ Make Unavailable" : "✓ Make Available"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

