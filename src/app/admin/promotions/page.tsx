import { Button } from '@/components/ui/Button';

export default async function AdminPromotions() {
  // Mock discounts
  const discounts = [
    { id: '1', code: 'FESTIVAL20', type: 'percentage', value: '20%', current_uses: 45, max_uses: 100, is_active: true },
    { id: '2', code: 'WELCOME10', type: 'percentage', value: '10%', current_uses: 890, max_uses: null, is_active: true }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Promotions Engine</h1>
        <Button className="text-sm">Create Discount</Button>
      </div>
      <div className="bg-white border-2 border-[var(--charcoal-ink)] p-8">
        <p className="font-sans text-sm opacity-70 mb-4">Manage active coupons and site-wide sales.</p>
        {/* Placeholder table */}
        <table className="w-full text-left font-sans">
          <thead>
            <tr className="border-b-2 border-[var(--charcoal-ink)]">
              <th className="py-2">Code</th>
              <th className="py-2">Type</th>
              <th className="py-2">Value</th>
              <th className="py-2">Uses</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {discounts?.map(d => (
              <tr key={d.id} className="border-b border-[var(--charcoal-ink)]/10">
                <td className="py-2 font-bold">{d.code || 'Site-wide'}</td>
                <td className="py-2 uppercase text-xs tracking-widest">{d.type}</td>
                <td className="py-2">{d.value}</td>
                <td className="py-2">{d.current_uses}/{d.max_uses || '∞'}</td>
                <td className="py-2">{d.is_active ? 'Active' : 'Expired'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
