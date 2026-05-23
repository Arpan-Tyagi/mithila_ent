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

// Generates an intricate repeating edge pattern
const generateIntricateBorder = () => {
  const size = 100; // viewBox 100x100
  let paths = [];

  // Outer frame
  paths.push(<rect key="o1" x="2" y="2" width="96" height="96" fill="none" stroke="var(--ink-black)" strokeWidth="1" />);
  paths.push(<rect key="o2" x="4" y="4" width="92" height="92" fill="none" stroke="var(--ink-black)" strokeWidth="2" />);

  // Kachni hatching around the edge (using a thick dashed border with offset)
  paths.push(<rect key="k1" x="8" y="8" width="84" height="84" fill="none" stroke="var(--ink-black)" strokeWidth="4" strokeDasharray="1 3" />);

  // Inner frame
  paths.push(<rect key="i1" x="12" y="12" width="76" height="76" fill="none" stroke="var(--ink-black)" strokeWidth="2" />);
  paths.push(<rect key="i2" x="15" y="15" width="70" height="70" fill="none" stroke="var(--dye-red)" strokeWidth="1" strokeDasharray="4 2" />);

  // Corner motifs (small lotuses)
  const corners = [
    { x: 15, y: 15 }, { x: 85, y: 15 }, { x: 15, y: 85 }, { x: 85, y: 85 }
  ];

  corners.forEach((c, i) => {
    paths.push(
      <g key={`corner-${i}`}>
        <circle cx={c.x} cy={c.y} r="5" fill="var(--dye-yellow)" stroke="var(--ink-black)" strokeWidth="1" />
        <circle cx={c.x} cy={c.y} r="2" fill="var(--ink-black)" />
        {/* Simple petals */}
        <path d={`M${c.x} ${c.y-5} Q${c.x-3} ${c.y-8} ${c.x} ${c.y-10} Q${c.x+3} ${c.y-8} ${c.x} ${c.y-5}`} fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="0.5"/>
        <path d={`M${c.x} ${c.y+5} Q${c.x-3} ${c.y+8} ${c.x} ${c.y+10} Q${c.x+3} ${c.y+8} ${c.x} ${c.y+5}`} fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="0.5"/>
        <path d={`M${c.x-5} ${c.y} Q${c.x-8} ${c.y-3} ${c.x-10} ${c.y} Q${c.x-8} ${c.y+3} ${c.x-5} ${c.y}`} fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="0.5"/>
        <path d={`M${c.x+5} ${c.y} Q${c.x+8} ${c.y-3} ${c.x+10} ${c.y} Q${c.x+8} ${c.y+3} ${c.x+5} ${c.y}`} fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="0.5"/>
      </g>
    );
  });

  return paths;
};

// Extracted SwatchCard to obey Rules of Hooks
const SwatchCard = ({ p }: { p: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative aspect-square flex flex-col items-center justify-center cursor-none mt-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-4 bg-cotton border-wobble shadow-none z-10 flex items-center justify-center overflow-hidden">
        <span className="font-lora text-ink-black/40 italic z-20">Fabric Swatch {p}</span>

        {/* Subtle background motif inside swatch */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
           <circle cx="50" cy="50" r="40" stroke="var(--ink-black)" strokeWidth="2" fill="none" strokeDasharray="5 5" />
           <path d="M 50 10 C 20 40, 80 40, 50 90 C 20 60, 80 60, 50 10" stroke="var(--dye-red)" strokeWidth="1" fill="none" />
        </svg>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ink-black flex items-center justify-center z-30">
          <div className="w-1 h-1 bg-cotton rounded-full"></div>
        </div>
      </div>

      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            {generateIntricateBorder()}
          </svg>
      </motion.div>

      <div className="absolute -bottom-8 w-full text-center h-8 z-20">
        {isHovered ? (
          <TypewriterText text={`Madhubani Print ${p}`} isHovered={true} />
        ) : (
          <span className="font-yatra text-xl text-ink-black opacity-0">Madhubani Print {p}</span> // Hidden until hovered as per req
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
        {/* Decorative end piece for the line */}
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="var(--dye-yellow)" stroke="var(--ink-black)" strokeWidth="2" />
          <circle cx="10" cy="10" r="3" fill="var(--ink-black)" />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p) => (
          <SwatchCard key={p} p={p} />
        ))}
      </div>
    </section>
  );
}
