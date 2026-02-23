import React from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface BottomNavProps {
  items: NavItem[];
  activeHref?: string;
}

export function BottomNav({ items, activeHref }: BottomNavProps) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--surface, #ffffff)",
        borderTop: "1px solid var(--border, #e0e0e0)",
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0",
        zIndex: 100,
        boxShadow: "0 -1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {items.map((item) => {
        const isActive = activeHref === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "4px 12px",
              textDecoration: "none",
              color: isActive
                ? "var(--primary, #FF7A00)"
                : "var(--text-secondary, #6b7280)",
              fontWeight: isActive ? 600 : 400,
              fontSize: 11,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
