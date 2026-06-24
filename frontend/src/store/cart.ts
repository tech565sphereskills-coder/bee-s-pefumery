import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/data/products";

export type VariantInfo = {
  id: number;
  size_ml: number;
  price: number;
  label: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  variant?: VariantInfo;
};

type CartState = {
  items: CartItem[];
  add: (p: Product, qty?: number, variant?: VariantInfo) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

function cartKey(productId: number | string, variantId?: number): string {
  return variantId ? `${productId}_v${variantId}` : String(productId);
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (p, qty = 1, variant?) =>
        set((s) => {
          const pid = String(p.id);
          const key = cartKey(pid, variant?.id);
          const price = variant ? variant.price : (typeof p.price === "string" ? parseFloat(p.price) : p.price);
          const existing = s.items.find((i) => i.id === key);
          if (existing) {
            return {
              items: s.items.map((i) => (i.id === key ? { ...i, qty: i.qty + qty } : i)),
            };
          }
          return {
            items: [...s.items, {
              id: key,
              name: p.name,
              price,
              image: p.image,
              qty,
              variant,
            }],
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "bees-cart" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.qty * i.price, 0);

// Wishlist moved to @/store/wishlist
