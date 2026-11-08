import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, CartStore } from "@/types";

/**
 * Zustand cart store persisted in localStorage.
 * Cart items are scoped per tenant via tenantId — switching storefronts
 * does NOT merge carts across different tenants.
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tenantId: null,

      setTenantId: (tenantId: string) => {
        const current = get().tenantId;
        if (current && current !== tenantId) {
          // Different storefront — clear previous tenant's cart
          set({ items: [], tenantId });
        } else {
          set({ tenantId });
        }
      },

      addItem: (newItem: Omit<CartItem, "quantity">, qty = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...newItem, quantity: qty }],
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.sellingPrice * item.quantity,
          0
        );
      },

      getGSTBreakdown: () => {
        const items = get().items;
        const slabMap = new Map<number, number>();

        for (const item of items) {
          const lineTotal = item.sellingPrice * item.quantity;
          // GST is typically included in the selling price for B2C
          // Extract GST amount from inclusive price: GST = (price × rate) / (100 + rate)
          const gstAmount = (lineTotal * item.gstSlab) / (100 + item.gstSlab);
          slabMap.set(
            item.gstSlab,
            (slabMap.get(item.gstSlab) ?? 0) + gstAmount
          );
        }

        const slabs = Array.from(slabMap.entries()).map(([rate, amount]) => ({
          rate,
          amount: Math.round(amount * 100) / 100,
        }));
        const total = slabs.reduce((s, { amount }) => s + amount, 0);

        return { slabs, total: Math.round(total * 100) / 100 };
      },

      getTotalWithGST: () => {
        // GST is inclusive in selling price, so total = subtotal
        return get().getSubtotal();
      },
    }),
    {
      name: "storeforge-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : sessionStorage
      ),
      partialize: (state) => ({
        items: state.items,
        tenantId: state.tenantId,
      }),
    }
  )
);
