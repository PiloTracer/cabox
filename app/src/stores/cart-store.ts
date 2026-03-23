import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;           // productId
  variantId?: string;
  sku: string;
  nameEn: string;
  nameEs: string;
  slug: string;
  imageUrl?: string;
  price: number;        // CRC — snapshot at add-to-cart time
  quantity: number;
  weight?: number;      // kg
  attributes?: Record<string, string>; // { color: 'Red', size: 'M' }
}

interface CartStore {
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number;
  
  // UI State
  isCartOpen: boolean;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variantId?: string) => void;
  openCart: () => void;
  closeCart: () => void;
  updateQuantity: (id: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  updatePrices: (updates: { id: string; variantId?: string; price: number }[]) => void;

  // Selectors
  totalItems: () => number;
  subtotal: () => number;
  total: () => number;
}

const itemKey = (id: string, variantId?: string) =>
  variantId ? `${id}::${variantId}` : id;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: undefined,
      couponDiscount: 0,
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addItem: (newItem) => {
        set((state) => {
          const key = itemKey(newItem.id, newItem.variantId);
          const existing = state.items.find(
            (i) => itemKey(i.id, i.variantId) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.id, i.variantId) === key
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem], isCartOpen: true };
        });
      },

      removeItem: (id, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.id, i.variantId) !== itemKey(id, variantId)
          ),
        }));
      },

      updateQuantity: (id, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.id, i.variantId) === itemKey(id, variantId)
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: undefined, couponDiscount: 0 }),

      applyCoupon: (code, discount) =>
        set({ couponCode: code, couponDiscount: discount }),

      removeCoupon: () => set({ couponCode: undefined, couponDiscount: 0 }),

      updatePrices: (updates) => {
        set((state) => ({
          items: state.items.map((item) => {
            const update = updates.find(
              (u) => itemKey(u.id, u.variantId) === itemKey(item.id, item.variantId)
            );
            return update ? { ...item, price: update.price } : item;
          }),
        }));
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      total: () => Math.max(0, get().subtotal() - get().couponDiscount),
    }),
    {
      name: 'cabox-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        items: state.items, 
        couponCode: state.couponCode, 
        couponDiscount: state.couponDiscount 
      }), // Don't persist UI state (isCartOpen)
    }
  )
);
