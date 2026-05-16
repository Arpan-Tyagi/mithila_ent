import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <h2 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Profile Details</h2>
      
      <form className="max-w-xl space-y-6">
        <div>
          <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Full Name</label>
          <input type="text" defaultValue="Guest User" className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
        </div>
        <div>
          <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Email Address</label>
          <input type="email" defaultValue="guest@example.com" disabled className="w-full border-2 border-[var(--charcoal-ink)] bg-neutral-100 p-3 font-sans opacity-70 cursor-not-allowed" />
        </div>
        <div>
          <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Phone Number</label>
          <input type="tel" placeholder="+91" className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}
