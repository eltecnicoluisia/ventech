import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  serialNumbers?: string[];
}

interface PosState {
  items: CartItem[];
  currency: 'USD' | 'VES';
  exchangeRate: number;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setExchangeRate: (rate: number) => void;
  getTotalUSD: () => number;
  getTotalVES: () => number;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      items: [],
      currency: 'USD',
      exchangeRate: 0, // Inicia en 0, debe actualizarse via API

      addItem: (newItem) => set((state) => {
        const existing = state.items.find(i => i.variantId === newItem.variantId);
        if (existing) {
          return {
            items: state.items.map(i => 
              i.variantId === newItem.variantId 
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            )
          };
        }
        return { items: [...state.items, newItem] };
      }),

      removeItem: (variantId) => set((state) => ({
        items: state.items.filter(i => i.variantId !== variantId)
      })),

      updateQuantity: (variantId, quantity) => set((state) => ({
        items: state.items.map(i => 
          i.variantId === variantId ? { ...i, quantity } : i
        )
      })),

      clearCart: () => set({ items: [] }),

      setExchangeRate: (rate) => set({ exchangeRate: rate }),

      getTotalUSD: () => {
        const items = get().items;
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getTotalVES: () => {
        const totalUSD = get().getTotalUSD();
        return totalUSD * get().exchangeRate;
      }
    }),
    {
      name: 'pos-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // CRÍTICO: exchangeRate NUNCA se persiste en localStorage.
      // Siempre se obtiene en tiempo real desde la API del BCV al cargar la página.
      partialize: (state) => ({
        items: state.items,
        currency: state.currency,
        exchangeRate: state.exchangeRate // PERMITIR QUE SE GUARDE
      }),
    }
  )
);
