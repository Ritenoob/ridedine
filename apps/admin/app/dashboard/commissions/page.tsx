"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface CommissionRecord {
  id: string;
  order_id: string;
  chef_id: string;
  order_total_cents: number;
  commission_rate: number;
  commission_cents: number;
  chef_payout_cents: number;
  status: string;
  created_at: string;
  settled_at: string | null;
  paid_out_at: string | null;
}

export default function CommissionsPage() {
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [commissionRate, setCommissionRate] = useState("15");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => supabaseBrowser(), []);

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const [commRes, settingRes] = await Promise.all([
        supabase.from("commission_records").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("platform_settings").select("value").eq("key", "commission_rate").single(),
      ]);
      setRecords(commRes.data || []);
      if (settingRes.data) {
        setCommissionRate((parseFloat(settingRes.data.value) * 100).toFixed(0));
      }
    } catch (err) {
      console.error("Error loading commissions:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveRate = async () => {
    if (!supabase) return;
    setSaving(true);
    const rate = parseFloat(commissionRate) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) { alert("Rate must be 0–100%"); setSaving(false); return; }
    await supabase.from("platform_settings").upsert({ key: "commission_rate", value: rate.toFixed(4) }, { onConflict: "key" });
    setSaving(false);
  };

  const totalCommission = records.reduce((s, r) => s + r.commission_cents, 0);
  const totalPayouts = records.reduce((s, r) => s + r.chef_payout_cents, 0);
  const settled = records.filter(r => r.status === "settled" || r.status === "paid_out").length;

  const exportCSV = () => {
    const header = "ID,Order ID,Chef ID,Order Total,Commission Rate,Commission,Chef Payout,Status,Created\n";
    const rows = records.map(r =>
      `${r.id},${r.order_id},${r.chef_id},${(r.order_total_cents / 100).toFixed(2)},${(r.commission_rate * 100).toFixed(1)}%,${(r.commission_cents / 100).toFixed(2)},${(r.chef_payout_cents / 100).toFixed(2)},${r.status},${new Date(r.created_at).toISOString()}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}>🍜 RideNDine</Link>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600, padding: "0 14px", marginBottom: 8 }}>Menu</div>
        {[["📊","Analytics","/dashboard/analytics"],["📦","Orders","/dashboard/orders"],["🧑‍🍳","Chefs","/dashboard/chefs"],["🍽","Meals","/dashboard/meals"],["💰","Commissions","/dashboard/commissions"]].map(([icon,label,href])=>(
          <Link key={href} href={href} className={`sidebar-link ${href==="/dashboard/commissions"?"active":""}`}>{icon} {label}</Link>
        ))}
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 className="page-title">💰 Commission Tracking</h1>
            <p className="page-subtitle">Platform commission records and payout management</p>
          </div>
          <button onClick={exportCSV} className="btn btn-outline btn-sm" disabled={records.length === 0}>📥 Export CSV</button>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div className="card card-body stat-card">
            <div className="stat-value">${(totalCommission / 100).toFixed(2)}</div>
            <div className="stat-label">Total Commission Earned</div>
          </div>
          <div className="card card-body stat-card">
            <div className="stat-value">${(totalPayouts / 100).toFixed(2)}</div>
            <div className="stat-label">Total Chef Payouts</div>
          </div>
          <div className="card card-body stat-card">
            <div className="stat-value">{records.length}</div>
            <div className="stat-label">Commission Records</div>
          </div>
          <div className="card card-body stat-card">
            <div className="stat-value">{settled}</div>
            <div className="stat-label">Settled / Paid Out</div>
          </div>
        </div>

        {/* Commission Rate Config */}
        <div className="card card-body" style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>⚙️ Commission Rate</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              className="form-input"
              style={{ width: 100 }}
              type="number"
              min="0"
              max="100"
              value={commissionRate}
              onChange={e => setCommissionRate(e.target.value)}
            />
            <span>%</span>
            <button className="btn btn-primary btn-sm" onClick={saveRate} disabled={saving}>
              {saving ? "Saving..." : "Save Rate"}
            </button>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Applied to new orders</span>
          </div>
        </div>

        {/* Records Table */}
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order Total</th>
                <th>Rate</th>
                <th>Commission</th>
                <th>Chef Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>Loading commission records...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>No commission records yet. They are created when orders are delivered.</td></tr>
              ) : records.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>${(r.order_total_cents / 100).toFixed(2)}</td>
                  <td>{(r.commission_rate * 100).toFixed(1)}%</td>
                  <td style={{ color: "var(--primary)", fontWeight: 700 }}>${(r.commission_cents / 100).toFixed(2)}</td>
                  <td>${(r.chef_payout_cents / 100).toFixed(2)}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
