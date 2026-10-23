import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartItem, Product } from "./types";

// Cart state shared across pages via React context, saved to localStorage
// so it survives a page refresh.
type Cart = {
  items: CartItem[];
  add: (p: Product) => void;
  setQuantity: (id: number, qty: number) => void;
  clear: () => void;
  totalPence: number;
  count: number;
};

const CartContext = createContext<Cart | null>(null);

function load(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem("cart") ?? "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch {
      /* storage unavailable: cart still works for this visit */
    }
  }, [items]);

  const add = (product: Product) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

  const setQuantity = (id: number, qty: number) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i))
    );

  const value: Cart = {
    items,
    add,
    setQuantity,
    clear: () => setItems([]),
    totalPence: items.reduce((sum, i) => sum + i.product.price_pence * i.quantity, 0),
    count: items.reduce((sum, i) => sum + i.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
