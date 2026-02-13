"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <main style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>
        🍽️ RidenDine Admin Dashboard
      </h1>
      <p style={{ color: '#666', marginBottom: 40 }}>
        Manage your premium home chef marketplace
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 20 
      }}>
        <DashboardCard
          title="📦 Orders"
          description="View and manage all orders"
          href="/dashboard/orders"
        />
        <DashboardCard
          title="👨‍🍳 Chefs"
          description="Approve and manage chef profiles"
          href="/dashboard/chefs"
        />
        <DashboardCard
          title="🍱 Meals"
          description="Review and feature meals"
          href="/dashboard/meals"
        />
        <DashboardCard
          title="📊 Analytics"
          description="View platform metrics"
          href="/dashboard/analytics"
        />
        <DashboardCard
          title="🎫 Promo Codes"
          description="Manage promotional codes"
          href="/dashboard/promos"
        />
        <DashboardCard
          title="📍 Tracking"
          description="Public order tracking"
          href="/tracking"
        />
      </div>
    </main>
  );
}

function DashboardCard({ title, description, href }: { 
  title: string; 
  description: string; 
  href: string;
}) {
  return (
    <Link 
      href={href}
      style={{
        display: 'block',
        padding: 24,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        border: '1px solid #e0e0e0',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#e3f2fd';
        e.currentTarget.style.borderColor = '#1976d2';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f9fa';
        e.currentTarget.style.borderColor = '#e0e0e0';
      }}
    >
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: '#666', fontSize: 14 }}>{description}</p>
    </Link>
  );
}
