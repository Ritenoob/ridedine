"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  activeChefs: number;
  totalCustomers: number;
  ordersToday: number;
  revenueToday: number;
  pendingChefs: number;
  activeDishes: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalOrders: 0,
    totalRevenue: 0,
    activeChefs: 0,
    totalCustomers: 0,
    ordersToday: 0,
    revenueToday: 0,
    pendingChefs: 0,
    activeDishes: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => supabaseBrowser(), []);

  const loadAnalytics = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersData, chefsData, customersData, dishesData] = await Promise.all([
        supabase.from("orders").select("status, total_cents, created_at"),
        supabase.from("chefs").select("status"),
        supabase.from("profiles").select("role").eq("role", "customer"),
        supabase.from("dishes").select("available"),
      ]);

      const orders = ordersData.data || [];
      const chefs = chefsData.data || [];
      const customers = customersData.data || [];
      const dishes = dishesData.data || [];

      const ordersToday = orders.filter(
        (o) => new Date(o.created_at) >= today
      ).length;

      const revenueToday = orders
        .filter((o) => new Date(o.created_at) >= today && o.status === "delivered")
        .reduce((sum, o) => sum + o.total_cents, 0) / 100;

      const totalRevenue = orders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + o.total_cents, 0) / 100;

      setAnalytics({
        totalOrders: orders.length,
        totalRevenue,
        activeChefs: chefs.filter((c) => c.status === "approved").length,
        totalCustomers: customers.length,
        ordersToday,
        revenueToday,
        pendingChefs: chefs.filter((c) => c.status === "pending").length,
        activeDishes: dishes.filter((d) => d.available).length,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}>🍜 RidenDine</Link>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600, padding: "0 14px", marginBottom: 8 }}>Menu</div>
        {[["📊","Dashboard","/dashboard"],["📦","Orders","/dashboard/orders"],["🧑‍🍳","Chefs","/dashboard/chefs"],["🍽","Meals","/dashboard/meals"],["👥","Users","/dashboard/users"],["⚙️","Settings","/dashboard/settings"]].map(([icon,label,href])=>(
          <Link key={href} href={href} className={`sidebar-link ${href==="/dashboard"?"active":""}`}>{icon} {label}</Link>
        ))}
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ marginBottom: 30 }}>
          <h1 className="page-title">📊 Platform Analytics</h1>
          <p className="page-subtitle">Overview of your marketplace performance</p>
        </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p>Loading analytics...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Today's Stats */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 20 }}>
              Today&apos;s Performance
            </h2>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: 20 
            }}>
              <StatCard
                title="Orders Today"
                value={analytics.ordersToday}
                icon="📦"
                color="#e3f2fd"
              />
              <StatCard
                title="Revenue Today"
                value={`$${analytics.revenueToday.toFixed(2)}`}
                icon="💰"
                color="#e8f5e9"
              />
            </div>
          </div>

          {/* Overall Stats */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 20 }}>Overall Performance</h2>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: 20 
            }}>
              <StatCard
                title="Total Orders"
                value={analytics.totalOrders}
                icon="📊"
                color="#f3e5f5"
              />
              <StatCard
                title="Total Revenue"
                value={`$${analytics.totalRevenue.toFixed(2)}`}
                icon="💵"
                color="#e8f5e9"
              />
              <StatCard
                title="Active Chefs"
                value={analytics.activeChefs}
                icon="👨‍🍳"
                color="#fff3e0"
              />
              <StatCard
                title="Total Customers"
                value={analytics.totalCustomers}
                icon="👥"
                color="#e3f2fd"
              />
              <StatCard
                title="Active Dishes"
                value={analytics.activeDishes}
                icon="🍱"
                color="#fce4ec"
              />
              <StatCard
                title="Pending Chefs"
                value={analytics.pendingChefs}
                icon="⏳"
                color="#fff9c4"
              />
            </div>
          </div>

          {/* Platform Health */}
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 20 }}>Platform Health</h2>
            <div style={{ 
              backgroundColor: "#f8f9fa", 
              padding: 24, 
              borderRadius: 8 
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: 8 
                }}>
                  <span style={{ fontWeight: 600 }}>Chef Approval Rate</span>
                  <span style={{ color: "#666" }}>
                    {analytics.activeChefs + analytics.pendingChefs > 0
                      ? Math.round(
                          (analytics.activeChefs /
                            (analytics.activeChefs + analytics.pendingChefs)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div style={{ 
                  height: 8, 
                  backgroundColor: "#e0e0e0", 
                  borderRadius: 4 
                }}>
                  <div
                    style={{
                      height: "100%",
                      backgroundColor: "#4caf50",
                      borderRadius: 4,
                      width: `${
                        analytics.activeChefs + analytics.pendingChefs > 0
                          ? (analytics.activeChefs /
                              (analytics.activeChefs + analytics.pendingChefs)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: 8 
                }}>
                  <span style={{ fontWeight: 600 }}>Average Order Value</span>
                  <span style={{ color: "#666" }}>
                    $
                    {analytics.totalOrders > 0
                      ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: color,
        padding: 24,
        borderRadius: 8,
        border: "1px solid #e0e0e0",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: "#666" }}>{title}</div>
    </div>
  );
}

