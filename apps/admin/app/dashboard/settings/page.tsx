"use client";
import Link from "next/link";
import { PlaceholderPage } from "@home-chef/ui";

export default function SettingsPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="RideNDine" style={{ height: 32, width: "auto", verticalAlign: "middle" }} />
        </Link>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600, padding: "0 14px", marginBottom: 8 }}>Menu</div>
        {[["📊","Dashboard","/dashboard"],["📦","Orders","/dashboard/orders"],["🧑‍🍳","Chefs","/dashboard/chefs"],["🍽","Meals","/dashboard/meals"],["👥","Users","/dashboard/users"],["⚙️","Settings","/dashboard/settings"]].map(([icon,label,href])=>(
          <Link key={href} href={href} className={`sidebar-link ${href==="/dashboard/settings"?"active":""}`}>{icon} {label}</Link>
        ))}
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        <div className="page-header">
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Configure platform-wide settings and preferences</p>
        </div>
        <PlaceholderPage
          title="Settings"
          description="Manage platform configuration, commission rates, notification preferences, and more."
          icon="⚙️"
        />
      </div>
    </div>
  );
}
