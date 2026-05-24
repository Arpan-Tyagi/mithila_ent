"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    let trailId = 0;
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Add a trail dot every few movements
      if (Math.random() > 0.5) {
        setTrails((prev) => [
          ...prev.slice(-10), // Keep max 10 trails to prevent performance issues
          { id: trailId++, x: e.clientX, y: e.clientY },
        ]);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return (
    <>
      {/* The main quill cursor */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[10000]"
        animate={{ x: mousePosition.x, y: mousePosition.y }}
        transition={{ type: "spring", stiffness: 1000, damping: 50, mass: 0.1 }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ink-black)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full transform -rotate-45 -translate-x-1/4 -translate-y-1/4"
        >
          {/* Simple quill/brush SVG representation */}
          <path d="M12 2L15 8C15 8 18 10 18 14C18 18 15 20 12 20C9 20 6 18 6 14C6 10 9 8 9 8L12 2Z" fill="var(--ink-black)"/>
          <path d="M12 20V24" />
        </svg>
      </motion.div>

      {/* Ink trails */}
      <AnimatePresence>
        {trails.map((trail) => (
          <motion.div
            key={trail.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-0 left-0 w-2 h-2 bg-ink-black rounded-none pointer-events-none z-[9999]"
            style={{
              left: trail.x,
              top: trail.y,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </AnimatePresence>
    </>
  );
}
