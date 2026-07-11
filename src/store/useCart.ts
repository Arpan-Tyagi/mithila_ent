import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // Variant ID
  product_id: string;
  title: string;
  color: string;
  price: number;
  quantity: number;
  min_order_quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  syncItems: (updates: { id: string; price: number; min_order_quantity: number }[]) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find((item) => item.id === newItem.id);
        const moq = newItem.min_order_quantity || 1;
        if (existingItem) {
          const newQty = Math.max(moq, existingItem.quantity + newItem.quantity);
          return {
            items: state.items.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: newQty }
                : item
            ),
          };
        }
        return { items: [...state.items, { ...newItem, quantity: Math.max(moq, newItem.quantity) }] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) => {
          if (item.id === id) {
            const moq = item.min_order_quantity || 1;
            return { ...item, quantity: Math.max(moq, quantity) };
          }
          return item;
        }),
      })),
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      syncItems: (updates) => set((state) => {
        let hasChanges = false;
        const newItems = state.items.map((item) => {
          const update = updates.find(u => u.id === item.id);
          if (update) {
            const moq = update.min_order_quantity || 1;
            const newQty = Math.max(moq, item.quantity);
            if (item.price !== update.price || item.min_order_quantity !== update.min_order_quantity || item.quantity !== newQty) {
              hasChanges = true;
              return { ...item, price: update.price, min_order_quantity: update.min_order_quantity, quantity: newQty };
            }
          }
          return item;
        });
        return hasChanges ? { items: newItems } : state;
      }),
    }),
    {
      name: 'mithila-cart-storage',
    }
  )
);
