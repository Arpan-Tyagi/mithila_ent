"use client";

import { useState } from "react";
import Link from "next/link";
import SidePanel from "./SidePanel";
import { motion } from "framer-motion";

export default function Header() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState<"cart" | "account">("cart");

  const openPanel = (type: "cart" | "account") => {
    setPanelContent(type);
    setIsPanelOpen(true);
  };

  return (
    <header className="w-full border-b-4 border-ink-black py-4 px-6 bg-cotton relative z-50">
      <nav className="flex justify-between items-center max-w-7xl mx-auto font-yatra text-ink-black text-lg">
        <div className="flex gap-6 items-center">
          <Link href="/shop/cotton" className="hover:text-dye-red transition-colors">Cotton Shop</Link>
          <Link href="/shop/linen" className="hover:text-dye-indigo transition-colors">Linen Shop</Link>
          <Link href="/shop/stitched" className="hover:text-dye-green transition-colors">Stitched Wear</Link>
        </div>

        <div className="flex-1 text-center font-yatra text-3xl font-bold text-dye-red px-4 border-wobble inline-block mx-4">
          <Link href="/" className="px-6 py-2 block tracking-wider">
            MITHILA
          </Link>
        </div>

        <div className="flex gap-6 items-center">
          <Link href="/collections" className="hover:text-dye-indigo transition-colors">Collections</Link>
          <Link href="/artizone" className="hover:text-dye-yellow transition-colors">Artizone</Link>
          <button onClick={() => openPanel("cart")} className="hover:text-dye-red transition-colors cursor-none">Cart</button>
          <button onClick={() => openPanel("account")} className="hover:text-dye-green transition-colors cursor-none">Account</button>
        </div>
      </nav>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={panelContent === "cart" ? "Your Pouch" : "Artisan Portal"}
      >
        {panelContent === "cart" ? (
          <p className="italic">Your handwoven pouch is currently empty.</p>
        ) : (
          <p className="italic">Identify yourself to enter the artisan portal.</p>
        )}
      </SidePanel>
    </header>
  );
}
