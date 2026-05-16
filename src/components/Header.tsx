"use client";

import Link from 'next/link';
import { ShoppingCart, User, Menu, Search } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useEffect, useState } from 'react';

export default function Header() {
  const { openCart, items } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-[var(--charcoal-ink)] bg-[var(--unbleached-cotton)]">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        
        {/* Mobile Menu */}
        <button className="md:hidden p-2 text-[var(--charcoal-ink)]">
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-tight text-[var(--madder-red)]">
            MITHILA
          </span>
          <span className="hidden md:block font-sans text-sm tracking-widest text-[var(--charcoal-ink)]">
            ENTERPRISES
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-sans font-bold text-[var(--charcoal-ink)] tracking-wider">
          <Link href="/shop" className="hover:text-[var(--peacock-blue)] hover:-translate-y-1 transition-all duration-300">Shop All</Link>
          <Link href="/category/cotton" className="hover:text-[var(--lotus-pink)] hover:-translate-y-1 transition-all duration-300">Cotton</Link>
          <Link href="/category/linen" className="hover:text-[var(--parrot-green)] hover:-translate-y-1 transition-all duration-300">Linen</Link>
          <Link href="/about" className="hover:text-[var(--turmeric)] hover:-translate-y-1 transition-all duration-300">Heritage</Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4 text-[var(--charcoal-ink)]">
          <button className="p-2 hover:text-[var(--peacock-blue)] hover:rotate-12 transition-all duration-300 hidden md:block">
            <Search size={24} />
          </button>
          <Link href="/login" className="p-2 hover:text-[var(--lotus-pink)] hover:-rotate-12 transition-all duration-300">
            <User size={24} />
          </Link>
          <button onClick={openCart} className="p-2 hover:text-[var(--turmeric)] hover:scale-110 transition-all duration-300 relative group">
            <ShoppingCart size={24} className="group-hover:animate-bounce" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lotus-pink)] text-[10px] font-bold text-white shadow-lg animate-pulse">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
