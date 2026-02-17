"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CartItem {
  id: string;
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  chefId: string;
  chefName: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getChefId: () => string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("hc_cart");
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hc_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.dishId === item.dishId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing].quantity += item.quantity ?? 1;
        return next;
      }
      return [...prev, { ...item, id: `${item.dishId}-${Date.now()}`, quantity: item.quantity ?? 1 }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeItem(id); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);
  const getTotalItems = () => items.reduce((t, i) => t + i.quantity, 0);
  const getTotalPrice = () => items.reduce((t, i) => t + i.price * i.quantity, 0);
  const getChefId = () => (items.length > 0 ? items[0].chefId : null);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice, getChefId }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
