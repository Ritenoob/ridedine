"use client";
import Image from "next/image";
import Link from "next/link";
import { PlaceholderPage } from "@home-chef/ui";

export default function UsersPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <Link href="/" className="nav-brand" style={{ marginBottom: 24 }}>
          <Image src="/logo.svg" alt="RideNDine" width={130} height={32} style={{ verticalAlign: "middle" }} />
        </Link>
        <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600, padding: "0 14px", marginBottom: 8 }}>Menu</div>
        {[["📊","Dashboard","/dashboard"],["📦","Orders","/dashboard/orders"],["🧑‍🍳","Chefs","/dashboard/chefs"],["🍽","Meals","/dashboard/meals"],["👥","Users","/dashboard/users"],["⚙️","Settings","/dashboard/settings"]].map(([icon,label,href])=>(
          <Link key={href} href={href} className={`sidebar-link ${href==="/dashboard/users"?"active":""}`}>{icon} {label}</Link>
        ))}
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        <div className="page-header">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">View and manage platform users</p>
        </div>
        <PlaceholderPage
          title="User Management"
          description="Browse, search, and manage customer and chef accounts on the platform."
          icon="👥"
        />
      </div>
    </div>
  );
}
