import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { addSavedAddress, removeSavedAddress } from '@/actions/profile';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('saved_addresses, role')
    .eq('id', userData.user.id)
    .single();

  const savedAddresses = profile?.saved_addresses || [];

  return (
    <div className="space-y-12 max-w-2xl">
      <div>
        <h2 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Profile Details</h2>
        
        <div className="mt-8 space-y-6">
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Email Address</label>
            <input type="email" defaultValue={userData.user.email} disabled className="w-full border-2 border-[var(--charcoal-ink)] bg-neutral-100 p-3 font-sans opacity-70 cursor-not-allowed" />
          </div>
          <div>
            <label className="block font-sans text-xs font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-2">Role</label>
            <input type="text" defaultValue={profile?.role || 'Customer'} disabled className="w-full border-2 border-[var(--charcoal-ink)] bg-neutral-100 p-3 font-sans opacity-70 cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="border-t-2 border-[var(--charcoal-ink)]/20 pt-8">
        <h2 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)] mb-6">Saved Addresses</h2>
        
        <div className="space-y-4 mb-8">
          {savedAddresses.map((addr: any) => (
            <div key={addr.id} className="border-2 border-[var(--charcoal-ink)] p-4 flex justify-between items-start">
              <div>
                <div className="font-bold">{addr.firstName} {addr.lastName}</div>
                <div className="text-sm">{addr.address1}</div>
                {addr.address2 && <div className="text-sm">{addr.address2}</div>}
                <div className="text-sm">{addr.city}, {addr.state} {addr.pinCode}</div>
              </div>
              <form action={async () => { 'use server'; await removeSavedAddress(addr.id); }}>
                <button type="submit" className="text-xs uppercase tracking-widest text-[var(--madder-red)] hover:underline">
                  Remove
                </button>
              </form>
            </div>
          ))}
          {savedAddresses.length === 0 && (
            <p className="text-sm opacity-60 italic">No saved addresses yet.</p>
          )}
        </div>

        <h3 className="font-sans font-bold uppercase tracking-widest text-[var(--charcoal-ink)] mb-4 text-sm">Add New Address</h3>
        <form action={async (formData) => {
          'use server';
          await addSavedAddress({
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            address1: formData.get('address1'),
            address2: formData.get('address2'),
            city: formData.get('city'),
            state: formData.get('state'),
            pinCode: formData.get('pinCode'),
          });
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="firstName" placeholder="First Name" required className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
            <input type="text" name="lastName" placeholder="Last Name" required className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
          </div>
          <input type="text" name="address1" placeholder="Address Line 1" required className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
          <input type="text" name="address2" placeholder="Address Line 2 (Optional)" className="w-full border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
          <div className="grid grid-cols-3 gap-4">
            <input type="text" name="city" placeholder="City" required className="col-span-1 border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
            <input type="text" name="state" placeholder="State" required className="col-span-1 border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
            <input type="text" name="pinCode" placeholder="PIN Code" required className="col-span-1 border-2 border-[var(--charcoal-ink)] bg-transparent p-3 font-sans focus:outline-none focus:border-[var(--madder-red)] transition-colors" />
          </div>
          <Button type="submit">Save Address</Button>
        </form>
      </div>
    </div>
  );
}
