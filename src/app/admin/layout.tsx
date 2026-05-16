import Link from 'next/link';
import { Package, LayoutDashboard, ShoppingBag, PlusCircle, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[var(--unbleached-cotton)] overflow-hidden font-sans">
      {/* Mobile-first Sidebar */}
      <aside className="w-64 bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] hidden md:flex flex-col border-r-2 border-[var(--turmeric)]">
        <div className="p-6 border-b-2 border-[var(--charcoal-ink)]/20">
           <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--turmeric)]">MITHILA</h1>
           <p className="text-xs tracking-widest opacity-70 uppercase">Owner Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--madder-red)] rounded-sm transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--madder-red)] rounded-sm transition-colors">
            <ShoppingBag size={20} /> Orders
          </Link>
          <Link href="/admin/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--madder-red)] rounded-sm transition-colors">
            <Package size={20} /> Live Inventory
          </Link>
          <Link href="/admin/products/new" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--madder-red)] rounded-sm transition-colors">
            <PlusCircle size={20} /> AI Ingestion
          </Link>
        </nav>
        <div className="p-4 border-t-2 border-[var(--charcoal-ink)]/20">
          <button className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[var(--madder-red)] rounded-sm transition-colors text-left text-red-300">
            <LogOut size={20} /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] p-4 flex justify-between items-center border-b-2 border-[var(--turmeric)]">
          <span className="font-serif font-bold text-[var(--turmeric)]">MITHILA</span>
          <button><LayoutDashboard /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
