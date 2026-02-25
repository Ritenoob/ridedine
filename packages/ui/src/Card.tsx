import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ children, style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--surface, #ffffff)",
        borderRadius: "var(--radius, 12px)",
        boxShadow: "var(--shadow, 0 1px 3px rgba(0,0,0,0.1))",
        border: "1px solid var(--border, #e0e0e0)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
