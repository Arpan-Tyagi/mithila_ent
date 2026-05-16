"use client";

import { useCart, CartItem } from '@/store/useCart';
import { Button } from '@/components/ui/Button';

export default function AddToCartButton({ item }: { item: CartItem }) {
  const { addItem, openCart } = useCart();

  const handleAdd = () => {
    addItem(item);
    openCart();
  };

  return (
    <Button onClick={handleAdd} className="w-full text-lg mt-8">
      Add to Cart - ₹{item.price}
    </Button>
  );
}
