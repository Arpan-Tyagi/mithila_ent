import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Profile Details</h2>
      
      <form className="max-w-xl space-y-6">
        <div>
          <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Full Name</label>
          <input
            type="text"
            defaultValue={profile?.full_name ?? ''}
            className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors"
          />
        </div>
        <div>
          <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Email Address</label>
          <input
            type="email"
            defaultValue={user.email ?? ''}
            disabled
            className="w-full border-2 border-[var(--charcoal-ink)] bg-neutral-100 p-3 font-sans opacity-70 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Phone Number</label>
          <input
            type="tel"
            defaultValue={profile?.phone ?? ''}
            placeholder="+91"
            className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors"
          />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}
