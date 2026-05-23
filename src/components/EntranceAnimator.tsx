"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function EntranceAnimator({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 3 }} // Wait for "Twig Draw" before color bleed
      className="w-full h-full"
    >
      {/*
        The global "Twig Draw" is simulated here for structural elements.
        Instead of actual SVGs for the whole page layout (which breaks semantics),
        we use CSS masking or just a global color bleed.
        For individual elements (like mandalas), they will have their own SVG animations.
      */}
      {children}
    </motion.div>
  );
}

export function SvgTwigDraw({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  // A wrapper to draw SVG paths
  return (
    <motion.svg
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 3, ease: "easeInOut", delay }}
      className="w-full h-full overflow-visible"
    >
      {children}
    </motion.svg>
  );
}

export function BloomingMandala({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 10, delay: 3 + delay }} // Blooms after drawing
    >
      {children}
    </motion.div>
  );
}
