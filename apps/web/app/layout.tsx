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
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
