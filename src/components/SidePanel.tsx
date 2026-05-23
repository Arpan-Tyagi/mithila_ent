"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SidePanel({ isOpen, onClose, title, children }: SidePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-black/20 z-[9000] cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            initial={{ rotateY: 90, x: "100%" }}
            animate={{ rotateY: 0, x: 0 }}
            exit={{ rotateY: 90, x: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            style={{ transformOrigin: "right center" }}
            className="fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-cotton border-l-8 border-double border-ink-black z-[9001] p-6 shadow-none"
          >
            <div className="flex justify-between items-center mb-8 border-b-2 border-ink-black pb-4">
              <h2 className="font-yatra text-2xl text-ink-black">{title}</h2>
              <button
                onClick={onClose}
                className="font-yatra text-xl text-dye-red hover:text-ink-black transition-colors"
              >
                X
              </button>
            </div>
            <div className="font-lora text-ink-black">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
