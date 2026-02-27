import React from "react";

interface HeaderBarProps {
  title: string;
  subtitle?: string;
}

export function HeaderBar({ title, subtitle }: HeaderBarProps) {
  return (
    <header
      style={{
        background: "var(--surface, #ffffff)",
        borderBottom: "1px solid var(--border, #e0e0e0)",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "var(--shadow, 0 1px 3px rgba(0,0,0,0.1))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/logo.svg" alt="RideNDine" style={{ height: 36, width: "auto" }} />
        {subtitle && (
          <span
            style={{
              fontSize: 13,
              color: "var(--text-secondary, #6b7280)",
              fontWeight: 500,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text, #1F2937)",
        }}
      >
        {title}
      </span>
    </header>
  );
}
