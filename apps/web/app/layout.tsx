import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { CartProvider } from "../lib/CartContext";

export const metadata: Metadata = {
  title: "Home Chef Delivery",
  description: "Order home-cooked meals from local chefs"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ position: "relative" }}>
        {/* Faint logo watermark behind all content */}
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <CartProvider>{children}</CartProvider>
        </div>
      </body>
    </html>
  );
}
