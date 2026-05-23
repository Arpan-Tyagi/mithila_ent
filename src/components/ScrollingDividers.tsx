"use client";

import { motion } from "framer-motion";

interface DividerProps {
  type: "elephant" | "peacock";
}

export default function ScrollingDividers({ type }: DividerProps) {
  // Simple structural SVGs for the animals
  const Elephant = () => (
    <svg viewBox="0 0 100 60" className="h-12 w-auto mx-4 inline-block overflow-visible" stroke="var(--ink-black)" strokeWidth="2" fill="none">
      <path d="M10,50 L10,30 C10,10 40,10 60,10 C80,10 90,30 90,50" /> {/* Body */}
      <path d="M90,30 Q100,20 110,40" /> {/* Trunk */}
      <circle cx="70" cy="25" r="2" fill="var(--ink-black)" /> {/* Eye */}
      <path d="M40,50 L40,60 M70,50 L70,60" /> {/* Legs */}
      <path d="M10,25 Q0,30 5,45" /> {/* Tail */}
    </svg>
  );

  const Peacock = () => (
    <motion.svg
      viewBox="0 0 100 80"
      className="h-16 w-auto mx-4 inline-block overflow-visible"
      stroke="var(--dye-indigo)"
      strokeWidth="2"
      fill="none"
    >
      <path d="M30,70 L30,40 C30,20 50,20 60,30 C70,40 80,40 90,30" /> {/* Body/Neck */}
      <circle cx="80" cy="25" r="2" fill="var(--ink-black)" /> {/* Eye */}
      <path d="M90,30 L95,25 L90,20 Z" fill="var(--dye-yellow)" /> {/* Beak */}
      <path d="M40,70 L40,80 M50,70 L50,80" stroke="var(--ink-black)" /> {/* Legs */}
      {/* Animating Tail Feathers */}
      <motion.g
        animate={{ y: [0, -5, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M30,40 Q10,10 0,30 Q20,60 30,50" />
        <path d="M30,40 Q0,0 -10,10 Q10,50 30,50" />
        <path d="M30,40 Q-10,-10 -20,-5 Q0,40 30,50" />
      </motion.g>
    </motion.svg>
  );

  // We repeat items to make a smooth marquee
  const items = Array.from({ length: 15 });

  return (
    <div className="w-full overflow-hidden border-y-4 border-ink-black py-2 bg-cotton flex items-center relative h-24">
      {/* Background wobbly track line */}
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-dye-red/30 -translate-y-1/2 opacity-50 kachni-border"></div>

      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: type === "elephant" ? 25 : 20, // Different speeds
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {items.map((_, i) => (
          // Add a slight vertical wobble to the container to simulate painted loop imperfection
          <motion.div
            key={i}
            animate={{ y: [0, i % 2 === 0 ? -3 : 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          >
            {type === "elephant" ? <Elephant /> : <Peacock />}
          </motion.div>
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((_, i) => (
          <motion.div
            key={`dup-${i}`}
            animate={{ y: [0, i % 2 === 0 ? -3 : 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          >
            {type === "elephant" ? <Elephant /> : <Peacock />}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
