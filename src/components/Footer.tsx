import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-zinc-100 py-16 text-zinc-600 font-sans">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          
          {/* Identity Column */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-serif italic font-bold text-xl text-zinc-900">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white font-bold font-serif text-xs">
                M
              </div>
              Mithila
            </Link>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              Premium handloom fabrics and fine line artistry loomed with devotion and contemporary elegance.
            </p>
          </div>

          {/* Company links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-black transition-colors">Our Legacy</Link></li>
              <li><Link href="/shop" className="hover:text-black transition-colors">Shop Fabrics</Link></li>
              <li><Link href="/contact" className="hover:text-black transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms-of-service" className="hover:text-black transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy-policy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/shipping-returns" className="hover:text-black transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Connect</h4>
            <div className="space-y-1 text-sm text-zinc-500">
              <p>arpan@mithilaent.com</p>
              <p>+91-99999-88888</p>
            </div>
            <div className="flex gap-4 text-sm mt-3">
              <a href="#" className="hover:text-black">Instagram</a>
              <a href="#" className="hover:text-black">Pinterest</a>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-zinc-100 mb-8"></div>

        {/* Bottom copyright block */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>&copy; {new Date().getFullYear()} Mithila Enterprises. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/legal/privacy-policy" className="hover:underline">Privacy</Link>
            <Link href="/legal/terms-of-service" className="hover:underline">Terms</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
