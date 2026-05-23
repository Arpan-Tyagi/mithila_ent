"use client";

import { motion } from "framer-motion";

interface DividerProps {
  type: "elephant" | "peacock";
}

export default function ScrollingDividers({ type }: DividerProps) {
  // Highly detailed Madhubani Elephant
  const Elephant = () => (
    <svg viewBox="0 0 150 100" className="h-20 w-auto mx-8 inline-block overflow-visible" stroke="var(--ink-black)" strokeWidth="1.5" fill="none">
      {/* Body Outline with scalloped back blanket */}
      <path d="M 20 80 L 20 50 C 20 10, 80 10, 110 20 C 130 25, 140 40, 140 60 Q 140 80, 130 90 Q 120 70, 115 50" fill="var(--dye-red)" opacity="0.1" />
      <path d="M 20 80 L 20 50 C 20 10, 80 10, 110 20 C 130 25, 140 40, 140 60" />

      {/* Elephant Trunk Details */}
      <path d="M 140 60 Q 150 70, 145 90 Q 140 100, 130 95 Q 120 70, 115 50" />
      {/* Trunk rings */}
      <path d="M 138 65 L 125 60 M 140 75 L 128 70 M 142 85 L 132 80" strokeWidth="1" />

      {/* Eye and Head details */}
      <circle cx="110" cy="35" r="4" fill="var(--cotton)" />
      <circle cx="110" cy="35" r="2" fill="var(--ink-black)" />
      {/* Bindu/Tika on forehead */}
      <circle cx="125" cy="25" r="3" fill="var(--dye-yellow)" stroke="none" />
      <path d="M 100 20 Q 120 10, 130 20" strokeWidth="1" strokeDasharray="2 2" />

      {/* Ear with scalloped edges and inner floral pattern */}
      <path d="M 95 30 C 110 30, 110 60, 95 65 C 80 60, 80 30, 95 30 Z" fill="var(--dye-yellow)" opacity="0.2" />
      <path d="M 95 30 C 110 30, 110 60, 95 65 C 80 60, 80 30, 95 30 Z" />
      <path d="M 95 35 L 95 60 M 85 45 L 105 45 M 88 38 L 102 52 M 88 52 L 102 38" strokeWidth="0.5" stroke="var(--dye-red)" />

      {/* Decorative Blanket (Jhool) */}
      <path d="M 40 20 C 60 15, 80 15, 90 25 L 90 60 L 40 60 Z" fill="var(--dye-indigo)" opacity="0.1" />
      <path d="M 40 20 C 60 15, 80 15, 90 25 L 90 60 L 40 60 Z" />
      {/* Blanket internal Kachni grid */}
      <path d="M 50 20 L 50 60 M 60 18 L 60 60 M 70 18 L 70 60 M 80 20 L 80 60" strokeWidth="0.5" />
      <path d="M 40 30 L 90 30 M 40 40 L 90 40 M 40 50 L 90 50" strokeWidth="0.5" />
      {/* Blanket tassels */}
      <path d="M 45 60 L 45 65 M 55 60 L 55 65 M 65 60 L 65 65 M 75 60 L 75 65 M 85 60 L 85 65" strokeWidth="2" stroke="var(--dye-red)" />

      {/* Legs with toes */}
      <path d="M 30 60 L 30 90 L 45 90 L 45 60 M 70 60 L 70 90 L 85 90 L 85 60" />
      {/* Toes */}
      <path d="M 30 90 C 35 85, 40 85, 45 90 M 70 90 C 75 85, 80 85, 85 90" fill="var(--dye-yellow)" />

      {/* Tail */}
      <path d="M 20 40 Q 5 50, 10 70" />
      {/* Tail brush */}
      <path d="M 10 70 L 5 80 M 10 70 L 10 82 M 10 70 L 15 80" strokeWidth="1" />
    </svg>
  );

  // Highly detailed Madhubani Peacock
  const Peacock = () => (
    <motion.svg
      viewBox="0 0 150 120"
      className="h-24 w-auto mx-8 inline-block overflow-visible"
      stroke="var(--ink-black)"
      strokeWidth="1.5"
      fill="none"
    >
      {/* Body */}
      <path d="M 40 90 L 40 50 C 40 20, 70 20, 80 40 C 95 55, 110 50, 120 40" fill="var(--dye-indigo)" opacity="0.1" />
      <path d="M 40 90 L 40 50 C 40 20, 70 20, 80 40 C 95 55, 110 50, 120 40" />

      {/* Eye and Beak */}
      <circle cx="110" cy="35" r="3" fill="var(--cotton)" />
      <circle cx="110" cy="35" r="1.5" fill="var(--ink-black)" />
      <path d="M 120 40 L 135 35 L 122 30 Z" fill="var(--dye-yellow)" />
      <path d="M 120 40 L 135 35 L 122 30 Z" />

      {/* Head Crest (Kalgi) */}
      <path d="M 105 25 L 100 10 M 110 23 L 110 5 M 115 25 L 120 10" strokeWidth="1" />
      <circle cx="100" cy="10" r="2" fill="var(--dye-red)" />
      <circle cx="110" cy="5" r="2" fill="var(--dye-red)" />
      <circle cx="120" cy="10" r="2" fill="var(--dye-red)" />

      {/* Wing with intricate scales */}
      <path d="M 50 50 C 70 40, 90 60, 80 80 C 60 90, 40 70, 50 50 Z" fill="var(--dye-green)" opacity="0.2" />
      <path d="M 50 50 C 70 40, 90 60, 80 80 C 60 90, 40 70, 50 50 Z" />
      <path d="M 55 55 Q 65 50, 70 60 Q 60 65, 55 55 Z" strokeWidth="1" />
      <path d="M 60 65 Q 75 60, 75 75 Q 65 80, 60 65 Z" strokeWidth="1" />

      {/* Legs */}
      <path d="M 50 90 L 50 110 L 45 115 M 50 110 L 55 115 M 50 110 L 50 115" strokeWidth="2" stroke="var(--dye-yellow)" />
      <path d="M 70 85 L 70 105 L 65 110 M 70 105 L 75 110 M 70 105 L 70 110" strokeWidth="2" stroke="var(--dye-yellow)" />

      {/* Animating Plume/Tail Feathers */}
      <motion.g
        animate={{ y: [0, -4, 0], rotate: [0, 3, 0], transformOrigin: "40px 90px" }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Main Feathers */}
        <path d="M 40 50 Q -10 10, -20 40 Q 10 90, 40 90" fill="var(--dye-indigo)" opacity="0.05" />
        <path d="M 40 50 Q -10 10, -20 40 Q 10 90, 40 90" />

        <path d="M 40 50 Q 10 -20, -10 -5 Q -10 40, 40 90" fill="var(--dye-green)" opacity="0.05" />
        <path d="M 40 50 Q 10 -20, -10 -5 Q -10 40, 40 90" />

        <path d="M 40 50 Q 40 -30, 20 -20 Q 0 30, 40 90" fill="var(--dye-red)" opacity="0.05" />
        <path d="M 40 50 Q 40 -30, 20 -20 Q 0 30, 40 90" />

        {/* Peacock Eyes (Ocelli) on feathers */}
        <g strokeWidth="1">
          <circle cx="-5" cy="40" r="5" fill="var(--dye-yellow)" />
          <circle cx="-5" cy="40" r="2" fill="var(--ink-black)" />

          <circle cx="0" cy="15" r="5" fill="var(--dye-red)" />
          <circle cx="0" cy="15" r="2" fill="var(--ink-black)" />

          <circle cx="20" cy="-5" r="5" fill="var(--dye-green)" />
          <circle cx="20" cy="-5" r="2" fill="var(--ink-black)" />
        </g>
      </motion.g>
    </motion.svg>
  );

  // We repeat items to make a smooth marquee
  const items = Array.from({ length: 10 });

  return (
    <div className="w-full overflow-hidden border-y-4 border-ink-black py-4 bg-cotton flex items-center relative h-32">
      {/* Background wobbly track line (Double line) */}
      <div className="absolute top-1/2 left-0 w-full h-[6px] border-y border-ink-black -translate-y-1/2 opacity-20"></div>

      <motion.div
        className="flex whitespace-nowrap items-end"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: type === "elephant" ? 30 : 25,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {items.map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, i % 2 === 0 ? -2 : 2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {type === "elephant" ? <Elephant /> : <Peacock />}
          </motion.div>
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((_, i) => (
          <motion.div
            key={`dup-${i}`}
            animate={{ y: [0, i % 2 === 0 ? -2 : 2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          >
            {type === "elephant" ? <Elephant /> : <Peacock />}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
