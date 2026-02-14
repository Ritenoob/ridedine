export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/dashboard/orders");
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

