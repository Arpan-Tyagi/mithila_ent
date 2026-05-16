import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-[var(--charcoal-ink)] bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)] pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[var(--turmeric)]">MITHILA</h3>
            <p className="font-sans text-sm opacity-80 leading-relaxed">
              Premium B2C wholesaler of heritage cotton and linen fabrics. Inspired by the geometric perfection of Madhubani art.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-sans font-bold tracking-widest text-[var(--madder-red)]">SHOP</h4>
            <ul className="space-y-2 font-sans text-sm opacity-80">
              <li><Link href="/shop" className="hover:text-[var(--turmeric)] transition-colors">All Fabrics</Link></li>
              <li><Link href="/category/cotton" className="hover:text-[var(--turmeric)] transition-colors">Pure Cotton</Link></li>
              <li><Link href="/category/linen" className="hover:text-[var(--turmeric)] transition-colors">Fine Linen</Link></li>
              <li><Link href="/search" className="hover:text-[var(--turmeric)] transition-colors">Search</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-sans font-bold tracking-widest text-[var(--madder-red)]">SUPPORT</h4>
            <ul className="space-y-2 font-sans text-sm opacity-80">
              <li><Link href="/account/orders" className="hover:text-[var(--turmeric)] transition-colors">Track Order</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--turmeric)] transition-colors">Contact Us</Link></li>
              <li><Link href="/legal/returns" className="hover:text-[var(--turmeric)] transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-[var(--turmeric)] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-sans font-bold tracking-widest text-[var(--madder-red)]">NEWSLETTER</h4>
            <p className="font-sans text-sm opacity-80">Subscribe to receive exclusive drops and heritage stories.</p>
            <form className="flex mt-4 border-b border-[var(--turmeric)]">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-transparent border-none outline-none text-sm py-2 flex-grow placeholder:text-[var(--unbleached-cotton)] placeholder:opacity-50"
              />
              <button type="submit" className="text-[var(--turmeric)] font-bold text-sm tracking-widest hover:text-[var(--madder-red)] transition-colors">JOIN</button>
            </form>
          </div>
        </div>
        
        {/* Kachni Border Pattern Separator */}
        <div className="w-full h-4 kachni-border bg-[var(--turmeric)] mb-8 opacity-20"></div>

        <div className="flex flex-col md:flex-row items-center justify-between font-sans text-xs opacity-60">
          <p>&copy; {new Date().getFullYear()} Mithila Enterprises. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
