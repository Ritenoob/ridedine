"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Chef {
  id: string;
  status: string;
  bio: string;
  cuisine_types: string[];
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const supabase = useMemo(() => supabaseBrowser(), []);

  const loadChefs = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      let query = supabase
        .from("chefs")
        .select("*, profiles(name, email)")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setChefs(data || []);
    } catch (error) {
      console.error("Error loading chefs:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => {
    loadChefs();
  }, [loadChefs]);

  const updateChefStatus = async (chefId: string, newStatus: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("chefs")
        .update({ status: newStatus })
        .eq("id", chefId);

      if (error) throw error;
      
      // Reload chefs
      loadChefs();
      alert(`Chef ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating chef:", error);
      alert("Failed to update chef status");
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 32, marginBottom: 10 }}>ðŸ‘¨â€ðŸ³ Chef Management</h1>
        <p style={{ color: "#666" }}>Approve and manage chef applications</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: 30, display: "flex", gap: 10 }}>
        {["all", "pending", "approved", "rejected", "suspended"].map((status) => (
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
          <p>Loading chefs...</p>
        </div>
      )}

      {/* Chef List */}
      {!loading && chefs.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: 60, 
          backgroundColor: "#f8f9fa",
          borderRadius: 8
        }}>
          <p style={{ fontSize: 18, color: "#666" }}>
            No {filter !== "all" ? filter : ""} chefs found
          </p>
        </div>
      )}

      {!loading && chefs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {chefs.map((chef) => (
            <div
              key={chef.id}
              style={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: 20,
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                marginBottom: 15
              }}>
                <div>
                  <h3 style={{ fontSize: 20, marginBottom: 5 }}>
                    {chef.profiles?.name || "Unknown"}
                  </h3>
                  <p style={{ color: "#666", fontSize: 14, marginBottom: 5 }}>
                    {chef.profiles?.email}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      backgroundColor: getStatusColor(chef.status),
                      color: "white",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {chef.status}
                  </span>
                </div>
                
                {/* Action Buttons */}
                {chef.status === "pending" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => updateChefStatus(chef.id, "approved")}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      âœ“ Approve
                    </button>
                    <button
                      onClick={() => updateChefStatus(chef.id, "rejected")}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      âœ— Reject
                    </button>
                  </div>
                )}
                
                {chef.status === "approved" && (
                  <button
                    onClick={() => updateChefStatus(chef.id, "suspended")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ff9800",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Suspend
                  </button>
                )}
              </div>

              {/* Chef Details */}
              <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid #f0f0f0" }}>
                <p style={{ marginBottom: 8 }}>
                  <strong>Bio:</strong> {chef.bio || "No bio provided"}
                </p>
                <p style={{ marginBottom: 8 }}>
                  <strong>Cuisine Types:</strong>{" "}
                  {chef.cuisine_types?.join(", ") || "Not specified"}
                </p>
                <p style={{ fontSize: 12, color: "#999" }}>
                  Applied: {new Date(chef.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "approved":
      return "#4caf50";
    case "pending":
      return "#ff9800";
    case "rejected":
      return "#f44336";
    case "suspended":
      return "#9e9e9e";
    default:
      return "#666";
  }
}

