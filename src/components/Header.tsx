"use client";

import Link from 'next/link';
import { ShoppingCart, User, Menu, Search } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useEffect, useState } from 'react';

export default function Header() {
  const { openCart, items } = useCart();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-white/80 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled ? 'py-3 border-zinc-200/80 shadow-sm' : 'py-5 border-zinc-100'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6 max-w-7xl">
        
        {/* Logo & Identity */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold font-serif text-sm transition-transform group-hover:scale-105">
            M
          </div>
          <span className="font-serif italic font-bold text-lg tracking-tight text-zinc-900 group-hover:text-purple-600 transition-colors">
            Mithila
          </span>
          <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-400 font-bold border-l border-zinc-200 pl-2">
            Enterprises
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-sans font-medium text-sm text-zinc-600">
          {[
            ['Shop Fabrics', '/shop'],
            ['Our Story', '/about'],
            ['Features', '/#features'],
            ['Contact', '/contact']
          ].map(([label, href]) => (
            <Link 
              key={label} 
              href={href} 
              className="hover:text-black transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Action Triggers */}
        <div className="flex items-center gap-4 text-zinc-700">
          <Link href="/shop" className="p-2 hover:text-black transition-colors">
            <Search size={18} strokeWidth={2} />
          </Link>
          
          <Link href="/login" className="p-2 hover:text-black transition-colors">
            <User size={18} strokeWidth={2} />
          </Link>
          
          <button 
            onClick={openCart} 
            className="p-2 hover:text-black transition-colors relative"
          >
            <ShoppingCart size={18} strokeWidth={2} />
            {mounted && itemCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[8px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
          
          <button className="md:hidden p-2 hover:text-black">
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

      </div>
    </header>
  );
}
