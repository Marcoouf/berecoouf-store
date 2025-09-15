'use client';

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  workId: string;
  variantId: string;
  title: string;
  artistName?: string;
  image?: string;
  price: number; // en centimes
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  inc: (workId: string, variantId: string) => void;
  dec: (workId: string, variantId: string) => void;
  setQty: (workId: string, variantId: string, qty: number) => void;
  remove: (workId: string, variantId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.workId === item.workId && i.variantId === item.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.workId === item.workId && i.variantId === item.variantId
                  ? { ...i, qty: i.qty + item.qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      inc: (workId, variantId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.workId === workId && i.variantId === variantId
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        })),
      dec: (workId, variantId) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.workId === workId && i.variantId === variantId
                ? { ...i, qty: i.qty - 1 }
                : i
            )
            .filter((i) => i.qty > 0),
        })),
      setQty: (workId, variantId, qty) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.workId === workId && i.variantId === variantId ? { ...i, qty } : i
            )
            .filter((i) => i.qty > 0),
        })),
      remove: (workId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.workId === workId && i.variantId === variantId)
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cart-storage",
      version: 1,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
      partialize: (state: CartState) => ({ items: state.items }),
    }
  )
);

// --- Selectors --- //
export const useCartCount = () =>
  useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0));

export const useCartSubtotal = () =>
  useCart((s) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0));