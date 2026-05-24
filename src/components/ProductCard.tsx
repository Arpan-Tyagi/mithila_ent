"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductCard({ product }: { product: any }) {
  const price = product.product_variants?.[0]?.price || 0;
  const image = product.product_variants?.[0]?.images?.[0] || '';

  return (
    <Link href={`/product/${product.slug}`} className="block relative group">
      <motion.div 
        whileHover={{ scale: 1.02, rotate: -2, y: -5 }}
        whileTap={{ scale: 0.95, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 12 }}
        className="hand-drawn-border bg-white overflow-hidden relative z-10"
      >
        <div className="aspect-[3/4] w-full bg-[var(--unbleached-cotton)] relative border-b-2 border-[var(--charcoal-ink)]">
          {image ? (
            <img src={image} alt={product.title} className="object-cover w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 kachni-border"></div>
          )}
          {/* Playful hover overlay */}
          <motion.div 
            className="absolute inset-0 bg-[var(--turmeric)]/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>
        <div className="p-4 flex flex-col justify-between bg-white relative">
          <div>
            <h3 className="font-serif font-bold text-[var(--charcoal-ink)] text-lg truncate">{product.title}</h3>
            <p className="font-sans text-xs uppercase tracking-widest opacity-70 mt-1 text-[var(--peacock-blue)] font-bold">{product.weave}</p>
          </div>
          <p className="font-sans font-black text-[var(--lotus-pink)] mt-4 text-xl">₹{price}</p>
        </div>
      </motion.div>
    </Link>
  );
}
