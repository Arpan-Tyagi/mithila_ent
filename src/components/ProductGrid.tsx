"use client";

import { motion } from "framer-motion";
import { useState } from "react";

// Simple Typewriter component
const TypewriterText = ({ text, isHovered }: { text: string; isHovered: boolean }) => {
  return (
    <span className="font-yatra text-xl text-ink-black inline-block min-h-[1.5em]">
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.1, delay: index * 0.05 }}
        >
          {char}
        </motion.span>
      ))}
      {!isHovered && <span className="opacity-100">{text}</span>}
    </span>
  );
};

// Extracted SwatchCard to obey Rules of Hooks
const SwatchCard = ({ p }: { p: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative aspect-square flex flex-col items-center justify-center cursor-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-4 bg-cotton border-wobble shadow-none z-10 flex items-center justify-center overflow-hidden">
        <span className="font-lora text-ink-black/40 italic">Fabric Swatch {p}</span>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ink-black flex items-center justify-center">
          <div className="w-1 h-1 bg-cotton rounded-full"></div>
        </div>
      </div>

      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="none" stroke="var(--ink-black)" strokeWidth="8" strokeDasharray="4 4" />
            <rect width="100%" height="100%" fill="none" stroke="var(--dye-red)" strokeWidth="4" strokeDasharray="2 6" strokeDashoffset="4" />
          </svg>
      </motion.div>

      <div className="absolute -bottom-8 w-full text-center h-8 z-20">
        {isHovered ? (
          <TypewriterText text={`Madhubani Print ${p}`} isHovered={true} />
        ) : (
          <span className="font-yatra text-xl text-ink-black">Madhubani Print {p}</span>
        )}
      </div>
    </motion.div>
  );
};

export default function ProductGrid({ title }: { title: string }) {
  const products = [1, 2, 3, 4];

  return (
    <section className="w-full max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="font-yatra text-4xl text-dye-red">{title}</h2>
        <div className="flex-1 h-[2px] bg-ink-black"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p) => (
          <SwatchCard key={p} p={p} />
        ))}
      </div>
    </section>
  );
}
