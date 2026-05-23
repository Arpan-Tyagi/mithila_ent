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

// Hyper-detailed repeating edge pattern
const generateIntricateBorder = () => {
  let paths = [];

  // Dense multiple outer frames
  paths.push(<rect key="o1" x="1" y="1" width="98" height="98" fill="none" stroke="var(--ink-black)" strokeWidth="1" />);
  paths.push(<rect key="o2" x="3" y="3" width="94" height="94" fill="none" stroke="var(--ink-black)" strokeWidth="2" />);

  // Winding Vine motif replacing simple dashed line
  // Top vine
  paths.push(<path key="v1" d="M 10 7 Q 15 4, 20 7 T 30 7 T 40 7 T 50 7 T 60 7 T 70 7 T 80 7 T 90 7" fill="none" stroke="var(--dye-green)" strokeWidth="1.5" />);
  paths.push(<path key="vl1" d="M 15 5 L 15 3 M 25 9 L 25 11 M 35 5 L 35 3" stroke="var(--dye-red)" strokeWidth="1" />);
  // Bottom vine
  paths.push(<path key="v2" d="M 10 93 Q 15 90, 20 93 T 30 93 T 40 93 T 50 93 T 60 93 T 70 93 T 80 93 T 90 93" fill="none" stroke="var(--dye-green)" strokeWidth="1.5" />);
  paths.push(<path key="vl2" d="M 15 91 L 15 89 M 25 95 L 25 97 M 35 91 L 35 89" stroke="var(--dye-red)" strokeWidth="1" />);
  // Left vine
  paths.push(<path key="v3" d="M 7 10 Q 4 15, 7 20 T 7 30 T 7 40 T 7 50 T 7 60 T 7 70 T 7 80 T 7 90" fill="none" stroke="var(--dye-green)" strokeWidth="1.5" />);
  paths.push(<path key="vl3" d="M 5 15 L 3 15 M 9 25 L 11 25 M 5 35 L 3 35" stroke="var(--dye-red)" strokeWidth="1" />);
  // Right vine
  paths.push(<path key="v4" d="M 93 10 Q 90 15, 93 20 T 93 30 T 93 40 T 93 50 T 93 60 T 93 70 T 93 80 T 93 90" fill="none" stroke="var(--dye-green)" strokeWidth="1.5" />);
  paths.push(<path key="vl4" d="M 91 15 L 89 15 M 95 25 L 97 25 M 91 35 L 89 35" stroke="var(--dye-red)" strokeWidth="1" />);

  // Inner complex frame
  paths.push(<rect key="i1" x="12" y="12" width="76" height="76" fill="none" stroke="var(--ink-black)" strokeWidth="1" />);
  paths.push(<rect key="i2" x="14" y="14" width="72" height="72" fill="none" stroke="var(--ink-black)" strokeWidth="1" />);
  paths.push(<rect key="i3" x="16" y="16" width="68" height="68" fill="none" stroke="var(--dye-indigo)" strokeWidth="0.5" strokeDasharray="2 1" />);

  // Highly detailed Corner cornerstones (Large lotuses)
  const corners = [
    { x: 14, y: 14, rot: 0 }, { x: 86, y: 14, rot: 90 }, { x: 86, y: 86, rot: 180 }, { x: 14, y: 86, rot: 270 }
  ];

  corners.forEach((c, i) => {
    paths.push(
      <g key={`corner-${i}`} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
        {/* Outer burst */}
        <circle cx="0" cy="0" r="10" fill="var(--cotton)" stroke="var(--ink-black)" strokeWidth="0.5" />
        {/* Intricate petals */}
        <path d="M 0 -10 Q -5 -15, 0 -20 Q 5 -15, 0 -10" fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="0.5"/>
        <path d="M 10 0 Q 15 -5, 20 0 Q 15 5, 10 0" fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="0.5"/>
        {/* Diagonal leaves */}
        <path d="M 7 -7 Q 10 -15, 15 -15 Q 15 -10, 7 -7" fill="var(--dye-yellow)" stroke="var(--ink-black)" strokeWidth="0.5"/>
        {/* Core */}
        <circle cx="0" cy="0" r="5" fill="var(--dye-yellow)" stroke="var(--ink-black)" strokeWidth="1" />
        <circle cx="0" cy="0" r="2" fill="var(--ink-black)" />
        <circle cx="-2" cy="-2" r="0.5" fill="var(--cotton)" stroke="none" />
      </g>
    );
  });

  return paths;
};

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

        {/* Complex background motif inside swatch */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-15 pointer-events-none">
           <circle cx="50" cy="50" r="45" stroke="var(--ink-black)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
           <circle cx="50" cy="50" r="40" stroke="var(--dye-red)" strokeWidth="2" fill="none" strokeDasharray="10 5" />
           <path d="M 50 10 C 10 40, 90 40, 50 90 C 10 60, 90 60, 50 10" stroke="var(--ink-black)" strokeWidth="1" fill="none" />
           <path d="M 50 20 C 30 40, 70 40, 50 80 C 30 60, 70 60, 50 20" stroke="var(--dye-yellow)" strokeWidth="0.5" fill="none" />
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
          <span className="font-yatra text-xl text-ink-black opacity-0">Madhubani Print {p}</span>
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
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="12" fill="none" stroke="var(--dye-yellow)" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="15" cy="15" r="8" fill="var(--dye-red)" stroke="var(--ink-black)" strokeWidth="1" />
          <circle cx="15" cy="15" r="3" fill="var(--ink-black)" />
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
