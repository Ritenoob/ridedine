import React from "react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: string;
}

export function PlaceholderPage({
  title,
  description,
  icon = "🚧",
}: PlaceholderPageProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
        minHeight: 400,
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 24 }}>{icon}</div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--text, #1F2937)",
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 16,
          color: "var(--text-secondary, #6b7280)",
          maxWidth: 400,
        }}
      >
        {description ?? "This page is coming soon. Check back later!"}
      </p>
    </div>
  );
}
