"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';

interface MobileFilterSheetProps {
  currentCategory?: string;
  currentStyle?: string;
  currentColor?: string;
  currentGsm?: string;
  currentConstruction?: string;
  currentCount?: string;
  currentPrice?: string;
  categoriesList: { name: string; slug: string }[];
  allColors?: string[];
  allConstructions?: string[];
  allCounts?: string[];
}

export default function MobileFilterSheet({ 
  currentCategory, currentStyle, currentColor, currentGsm, currentConstruction, currentCount, currentPrice,
  categoriesList, allColors = [], allConstructions = [], allCounts = []
}: MobileFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const getFilterUrl = (key: string, value: string | null) => {
    const q = new URLSearchParams();
    if (currentCategory) q.set('category', currentCategory);
    if (currentStyle) q.set('style', currentStyle);
    if (currentColor) q.set('color', currentColor);
    if (currentGsm) q.set('gsm', currentGsm);
    if (currentConstruction) q.set('construction', currentConstruction);
    if (currentCount) q.set('count', currentCount);
    if (currentPrice) q.set('price', currentPrice);

    if (value === null || value === '') {
      q.delete(key);
    } else {
      q.set(key, value);
    }
    return `/shop?${q.toString()}`;
  };

  return (
    <>
      {/* Sticky Bottom Action Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[var(--charcoal-ink)] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-sans font-bold uppercase tracking-wider text-xs border border-white/10"
        >
          <Filter size={18} />
          Filter & Sort
        </button>
      </div>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[var(--charcoal-ink)]/60 backdrop-blur-sm z-50 lg:hidden"
            />
            
            {/* Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[var(--unbleached-cotton)] rounded-t-3xl shadow-2xl z-50 overflow-y-auto pb-safe-bottom lg:hidden border-t border-[var(--charcoal-ink)]/10"
            >
              <div className="sticky top-0 bg-[var(--unbleached-cotton)]/90 backdrop-blur-md px-6 py-4 border-b border-[var(--charcoal-ink)]/10 flex justify-between items-center">
                <span className="font-serif italic font-bold text-xl text-[var(--charcoal-ink)]">Filters</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 flex items-center justify-end text-[var(--charcoal-ink)] hover:text-[var(--madder-red)]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Styles */}
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--charcoal-ink)] mb-4">Fabric Print</h3>
                  <div className="flex flex-col gap-2 font-sans">
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('style', null)} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${!currentStyle ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>All Styles</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('style', 'plain')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentStyle === 'plain' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>Plain Weave</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('style', 'printed')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentStyle === 'printed' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>Printed & Patterned</Link>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--charcoal-ink)] mb-4">Weave Category</h3>
                  <div className="flex flex-col gap-2">
                    {categoriesList.map(cat => {
                      const isActive = (currentCategory === cat.slug) || (!currentCategory && cat.slug === '');
                      return (
                        <Link 
                          key={cat.slug}
                          onClick={() => setIsOpen(false)}
                          href={getFilterUrl('category', cat.slug)} 
                          className={`px-4 py-4 rounded-lg font-bold text-sm transition-colors border ${
                            isActive 
                            ? 'bg-[var(--indigo-dye)] text-white border-[var(--indigo-dye)] shadow-md' 
                            : 'border-[var(--charcoal-ink)]/10 text-[var(--charcoal-ink)] bg-white/50'
                          }`}
                        >
                          {cat.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* GSM */}
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--charcoal-ink)] mb-4">Weight (GSM)</h3>
                  <div className="flex flex-col gap-2 font-sans">
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('gsm', null)} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${!currentGsm ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>All Weights</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('gsm', 'light')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentGsm === 'light' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>Lightweight (&lt;150)</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('gsm', 'medium')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentGsm === 'medium' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>Medium (150-250)</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('gsm', 'heavy')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentGsm === 'heavy' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>Heavyweight (&gt;250)</Link>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--charcoal-ink)] mb-4">Price Range</h3>
                  <div className="flex flex-col gap-2 font-sans">
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('price', null)} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${!currentPrice ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>All Prices</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('price', 'budget')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentPrice === 'budget' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>Under ₹1000</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('price', 'standard')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentPrice === 'standard' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>₹1000 - ₹2000</Link>
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('price', 'premium')} className={`px-4 py-3 rounded-lg text-sm font-bold transition-colors w-full text-center ${currentPrice === 'premium' ? 'bg-[var(--charcoal-ink)] text-white' : 'border border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>Over ₹2000</Link>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--charcoal-ink)] mb-4">Color</h3>
                  <div className="flex flex-wrap gap-2 font-sans">
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('color', null)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${!currentColor ? 'bg-[var(--charcoal-ink)] text-white border-[var(--charcoal-ink)]' : 'border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>All</Link>
                    {allColors.map(c => (
                      <Link key={c} onClick={() => setIsOpen(false)} href={getFilterUrl('color', c)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${currentColor === c ? 'bg-[var(--charcoal-ink)] text-white border-[var(--charcoal-ink)]' : 'border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>{c}</Link>
                    ))}
                  </div>
                </div>

                {/* Construction */}
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--charcoal-ink)] mb-4">Construction</h3>
                  <div className="flex flex-wrap gap-2 font-sans">
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('construction', null)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${!currentConstruction ? 'bg-[var(--charcoal-ink)] text-white border-[var(--charcoal-ink)]' : 'border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>All</Link>
                    {allConstructions.map(c => (
                      <Link key={c} onClick={() => setIsOpen(false)} href={getFilterUrl('construction', c)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${currentConstruction === c ? 'bg-[var(--charcoal-ink)] text-white border-[var(--charcoal-ink)]' : 'border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>{c}</Link>
                    ))}
                  </div>
                </div>

                {/* Count */}
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--charcoal-ink)] mb-4">Thread Count</h3>
                  <div className="flex flex-wrap gap-2 font-sans">
                    <Link onClick={() => setIsOpen(false)} href={getFilterUrl('count', null)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${!currentCount ? 'bg-[var(--charcoal-ink)] text-white border-[var(--charcoal-ink)]' : 'border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>All</Link>
                    {allCounts.map(c => (
                      <Link key={c} onClick={() => setIsOpen(false)} href={getFilterUrl('count', c)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${currentCount === c ? 'bg-[var(--charcoal-ink)] text-white border-[var(--charcoal-ink)]' : 'border-[var(--charcoal-ink)]/20 text-[var(--charcoal-ink)]'}`}>{c}</Link>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
