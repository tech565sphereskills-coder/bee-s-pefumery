import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { getSessionToken } from "@/lib/api";

export type WishlistItemData = {
  id: number;
  product: number;
  product_name: string;
  product_image: string | null;
  product_price: string;
  product_brand: string;
  product_slug: string;
  variant: number | null;
  variant_name: string;
  notify_on_stock: boolean;
  in_stock: boolean;
  created_at: string;
};

type WishlistState = {
  ids: string[];
  items: WishlistItemData[];
  loaded: boolean;
  init: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  has: (id: string) => boolean;
  setNotify: (itemId: number, notify: boolean) => Promise<void>;
  removeItem: (itemId: number) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      items: [],
      loaded: false,

      init: async () => {
        try {
          const token = getSessionToken();
          const res = await api.get("wishlist/", { params: { session_token: token } });
          const items: WishlistItemData[] = res.data.results || res.data;
          set({
            items,
            ids: items.map((i) => String(i.product)),
            loaded: true,
          });
        } catch {
          set({ loaded: true });
        }
      },

      toggle: async (productId) => {
        const { ids, items } = get();
        const token = getSessionToken();
        const existing = items.find((i) => String(i.product) === productId);

        if (ids.includes(productId) && existing) {
          set({
            ids: ids.filter((x) => x !== productId),
            items: items.filter((i) => i.id !== existing.id),
          });
          try {
            await api.delete(`wishlist/${existing.id}/`);
          } catch { /* ignore */ }
        } else {
          const newIds = [...ids, productId];
          set({ ids: newIds });
          try {
            const res = await api.post("wishlist/toggle/", {
              product: Number(productId),
              session_token: token,
            });
            if (res.data?.id) {
              set({ items: [...get().items, res.data] });
            }
          } catch {
            set({ ids: ids.filter((x) => x !== productId) });
          }
        }
      },

      has: (id) => get().ids.includes(id),

      setNotify: async (itemId, notify) => {
        try {
          const res = await api.patch(`wishlist/${itemId}/notify/`, { notify_on_stock: notify });
          set({
            items: get().items.map((i) => (i.id === itemId ? res.data : i)),
          });
        } catch { /* ignore */ }
      },

      removeItem: (itemId) => {
        set({
          ids: get().ids.filter((_, i) => get().items[i]?.id !== itemId),
          items: get().items.filter((i) => i.id !== itemId),
        });
        api.delete(`wishlist/${itemId}/`).catch(() => {});
      },
    }),
    {
      name: "bees-wishlist",
      partialize: (state) => ({ ids: state.ids }),
    },
  ),
);
