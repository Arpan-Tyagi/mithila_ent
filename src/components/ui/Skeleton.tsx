"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className={cn("bg-[var(--turmeric)]/20 rounded-sm", className)}
    />
  );
}
