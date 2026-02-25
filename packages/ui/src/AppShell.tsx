import React from "react";
import { HeaderBar } from "./HeaderBar";
import { BottomNav } from "./BottomNav";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  nav?: NavItem[];
  activeHref?: string;
  showHeader?: boolean;
}

export function AppShell({
  children,
  title = "RideNDine",
  subtitle,
  nav,
  activeHref,
  showHeader = true,
}: AppShellProps) {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Faint watermark background */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url(/logo.svg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "55%",
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Header */}
      {showHeader && <HeaderBar title={title} subtitle={subtitle} />}
      {/* Main content */}
      <main style={{ position: "relative", zIndex: 1 }}>
        {children}
      </main>
      {/* Optional bottom nav */}
      {nav && nav.length > 0 && (
        <BottomNav items={nav} activeHref={activeHref} />
      )}
    </div>
  );
}
