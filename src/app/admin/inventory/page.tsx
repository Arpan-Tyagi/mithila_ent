"use client";

import { useEffect, useState } from 'react';
import { product_variants, products } from '@/lib/mockData';
import { Package, AlertCircle } from 'lucide-react';

export default function InventoryPage() {
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch mock
    const mapped = product_variants.map(v => ({
      ...v,
      products: { title: products.find(p => p.id === v.product_id)?.title }
    })).sort((a, b) => a.stock_quantity - b.stock_quantity);
    setVariants(mapped);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Live Inventory</h1>
      
      <div className="bg-white border-2 border-[var(--charcoal-ink)] rounded-sm overflow-hidden">
        <table className="w-full text-left font-sans">
          <thead className="bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)]">
            <tr>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Product</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">SKU</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Stock</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[var(--charcoal-ink)]/20">
            {variants.map((v) => (
              <tr key={v.id} className="hover:bg-[var(--unbleached-cotton)] transition-colors">
                <td className="p-4 font-bold text-[var(--charcoal-ink)]">
                  {v.products?.title} <span className="opacity-70 block text-sm font-normal">{v.color}</span>
                </td>
                <td className="p-4 text-sm opacity-80">{v.sku}</td>
                <td className="p-4">
                  <span className={`font-bold ${v.stock_quantity < 5 ? 'text-red-600' : 'text-[var(--charcoal-ink)]'}`}>
                    {v.stock_quantity} units
                  </span>
                </td>
                <td className="p-4">
                  {v.stock_quantity < 5 ? (
                    <span className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-widest">
                      <AlertCircle size={14} /> Low Stock
                    </span>
                  ) : (
                    <span className="text-green-600 text-xs font-bold uppercase tracking-widest">
                      Healthy
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
