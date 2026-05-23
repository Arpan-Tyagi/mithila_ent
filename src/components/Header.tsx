"use client";

import Link from 'next/link';
import { ShoppingCart, User, Menu, Search, X } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const { openCart, items } = useCart();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
        if (profile) {
          setUserName(profile.full_name?.split(' ')[0] || 'User');
          setIsAdmin(profile.role === 'admin');
        } else {
          setUserName(user.user_metadata?.full_name?.split(' ')[0] || 'User');
        }
      } else {
        setUserName(null);
        setIsAdmin(false);
      }
    };
    
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
       if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
         fetchUser();
       }
    });

    return () => {
       authListener.subscription.unsubscribe();
    };
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

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
          <button 
            onClick={() => setSearchOpen(!searchOpen)} 
            className="p-2 hover:text-[var(--peacock-blue)] hover:rotate-12 transition-all duration-300 hidden md:block"
          >
            {searchOpen ? <X size={24} /> : <Search size={24} />}
          </button>
          
          {userName ? (
            <Link href={isAdmin ? "/admin/dashboard" : "/account/profile"} className="flex items-center gap-1 font-sans text-sm font-bold hover:text-[var(--lotus-pink)] transition-colors">
              <span className="hidden md:inline">Hi, {userName}</span>
              <User size={24} />
            </Link>
          ) : (
            <Link href="/login" className="p-2 hover:text-[var(--lotus-pink)] hover:-rotate-12 transition-all duration-300">
              <User size={24} />
            </Link>
          )}
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

      {/* Search Drawer */}
      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-[var(--unbleached-cotton)] border-b-2 border-[var(--charcoal-ink)] py-4 px-4 md:px-8 shadow-lg z-40">
          <form onSubmit={handleSearch} className="container mx-auto flex items-center gap-4">
            <Search size={20} className="text-[var(--charcoal-ink)] opacity-50 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for sarees, dupattas, wall art..."
              autoFocus
              className="flex-grow bg-transparent border-b-2 border-[var(--charcoal-ink)] py-2 font-sans text-lg focus:outline-none focus:border-[var(--madder-red)] transition-colors placeholder:opacity-50"
            />
            <button type="submit" className="font-sans font-bold text-sm tracking-widest text-[var(--madder-red)] hover:text-[var(--turmeric)] transition-colors">
              SEARCH
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
