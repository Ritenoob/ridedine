import React from "react";

interface PageTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function PageTemplate({ title, subtitle, children, action }: PageTemplateProps) {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text, #1F2937)",
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                color: "var(--text-secondary, #6b7280)",
                marginTop: 4,
                fontSize: 15,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
