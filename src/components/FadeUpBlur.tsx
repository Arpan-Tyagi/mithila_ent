"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface FadeUpBlurProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  inView?: boolean; // Whether to trigger when scrolled into view
}

export default function FadeUpBlur({ children, delay = 0, className = "", inView = false }: FadeUpBlurProps) {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: 40,
      filter: "blur(15px)",
      scale: 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
        delay
      }
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView={inView ? "visible" : undefined}
      animate={inView ? undefined : "visible"}
      viewport={{ once: true, margin: "-100px" }} // Trigger slightly before entering viewport
      className={className}
    >
      {children}
    </motion.div>
  );
}
