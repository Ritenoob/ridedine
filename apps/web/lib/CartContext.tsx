"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface CartItem { id:string; name:string; price:number; quantity:number; chefId:string; chefName:string; }
interface CartContextType {
  items: CartItem[];
  addItem: (item:Omit<CartItem,"quantity">) => void;
  removeItem: (id:string) => void;
  updateQty: (id:string, qty:number) => void;
  clearCart: () => void;
  total: number;
  chefId: string|null;
  getTotalItems: () => number;
  totalItems: number;
}

const CartContext = createContext<CartContextType|null>(null);

export function CartProvider({children}:{children:ReactNode}) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item:Omit<CartItem,"quantity">) => {
    setItems(prev => {
      const existing = prev.find(i=>i.id===item.id);
      if(existing) return prev.map(i=>i.id===item.id?{...i,quantity:i.quantity+1}:i);
      if(prev.length>0 && prev[0].chefId!==item.chefId) {
        if(!confirm(`Your cart has items from ${prev[0].chefName}. Start a new cart with ${item.chefName}?`)) return prev;
        return [{...item,quantity:1}];
      }
      return [...prev,{...item,quantity:1}];
    });
  };

  const removeItem = (id:string) => setItems(prev=>prev.filter(i=>i.id!==id));
  const updateQty = (id:string,qty:number) => {
    if(qty<1) return removeItem(id);
    setItems(prev=>prev.map(i=>i.id===id?{...i,quantity:qty}:i));
  };
  const clearCart = () => setItems([]);
  const total = items.reduce((s,i)=>s+i.price*i.quantity,0);
  const totalItems = items.reduce((s,i)=>s+i.quantity,0);
  const getTotalItems = () => totalItems;
  const chefId = items.length>0?items[0].chefId:null;

  return (
    <CartContext.Provider value={{items,addItem,removeItem,updateQty,clearCart,total,chefId,getTotalItems,totalItems}}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if(!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};