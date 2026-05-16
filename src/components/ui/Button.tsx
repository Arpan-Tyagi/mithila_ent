"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "outline" | "ghost";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05, rotate: variant === "primary" ? -2 : 2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className={cn(
          "px-6 py-3 font-sans font-bold text-sm tracking-wider uppercase hand-drawn-border transition-colors duration-300 relative overflow-hidden group",
          {
            "bg-[var(--lotus-pink)] text-[var(--unbleached-cotton)] hover:bg-[var(--peacock-blue)] hover:text-white":
              variant === "primary",
            "bg-[var(--unbleached-cotton)] text-[var(--charcoal-ink)] hover:bg-[var(--turmeric)]":
              variant === "outline",
            "bg-transparent border-transparent text-[var(--peacock-blue)] hover:text-[var(--lotus-pink)] !shadow-none !border-none !rounded-none":
              variant === "ghost",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
