import { products } from '@/lib/mockData';
import { Package, ShoppingBag, IndianRupee, Users } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  // Mock aggregations
  const orderCount = 124;
  const productCount = products.length;
  
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Executive Overview</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-[var(--charcoal-ink)] p-6 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Total Revenue</p>
            <p className="font-bold text-2xl text-[var(--madder-red)]">₹2,45,000</p>
          </div>
          <IndianRupee className="text-[var(--charcoal-ink)] opacity-20" size={40} />
        </div>
        <div className="bg-white border-2 border-[var(--charcoal-ink)] p-6 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Total Orders</p>
            <p className="font-bold text-2xl text-[var(--charcoal-ink)]">{orderCount || 124}</p>
          </div>
          <ShoppingBag className="text-[var(--charcoal-ink)] opacity-20" size={40} />
        </div>
        <div className="bg-white border-2 border-[var(--charcoal-ink)] p-6 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Products</p>
            <p className="font-bold text-2xl text-[var(--charcoal-ink)]">{productCount || 45}</p>
          </div>
          <Package className="text-[var(--charcoal-ink)] opacity-20" size={40} />
        </div>
        <div className="bg-white border-2 border-[var(--charcoal-ink)] p-6 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Customers</p>
            <p className="font-bold text-2xl text-[var(--charcoal-ink)]">89</p>
          </div>
          <Users className="text-[var(--charcoal-ink)] opacity-20" size={40} />
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="font-serif text-2xl font-bold text-[var(--charcoal-ink)] pt-8">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/products/new" className="group bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] border-2 border-[var(--charcoal-ink)] p-6 rounded-sm hover:bg-[var(--madder-red)] hover:border-[var(--madder-red)] transition-colors">
           <h3 className="font-bold text-xl mb-2 group-hover:text-[var(--turmeric)]">AI Ingestion Form</h3>
           <p className="text-sm opacity-80">Upload an image and let Gemini generate SEO descriptions and variants.</p>
        </Link>
        <Link href="/admin/inventory" className="group bg-white border-2 border-[var(--charcoal-ink)] p-6 rounded-sm hover:bg-[var(--turmeric)] transition-colors">
           <h3 className="font-bold text-xl mb-2 text-[var(--charcoal-ink)]">Live Inventory</h3>
           <p className="text-sm opacity-80 text-[var(--charcoal-ink)]">Monitor stock levels across all variants in real-time via WebSockets.</p>
        </Link>
        <Link href="/admin/orders" className="group bg-white border-2 border-[var(--charcoal-ink)] p-6 rounded-sm hover:bg-[var(--charcoal-ink)] hover:text-[var(--unbleached-cotton)] transition-colors">
           <h3 className="font-bold text-xl mb-2">Fulfill Orders</h3>
           <p className="text-sm opacity-80">Process pending orders, print invoices, and update logistics tracking.</p>
        </Link>
      </div>
    </div>
  );
}
