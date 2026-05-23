import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, product_variants(*, products(title)))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const orderList = orders || [];

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Order History</h2>
      
      {orderList.length === 0 ? (
        <div className="py-12 border-2 border-[var(--charcoal-ink)]/20 text-center">
          <p className="font-sans opacity-70 mb-4">You haven't placed any orders yet.</p>
          <Link href="/shop">
            <Button>Start Exploring</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orderList.map((order: any) => (
             <div key={order.id} className="border-2 border-[var(--charcoal-ink)] bg-white p-6">
                <div className="flex flex-wrap justify-between items-start mb-6 pb-6 border-b-2 border-[var(--charcoal-ink)]/20">
                  <div>
                    <p className="font-sans text-sm opacity-70 uppercase tracking-widest mb-1">Order #{order.id.split('-')[0]}</p>
                    <p className="font-sans font-bold text-[var(--charcoal-ink)]">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-sm opacity-70 uppercase tracking-widest mb-1">Total</p>
                    <p className="font-sans font-bold text-[var(--madder-red)]">₹{order.total_amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-sm opacity-70 uppercase tracking-widest mb-1">Status</p>
                    <span className="bg-[var(--turmeric)] text-[var(--charcoal-ink)] px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm">
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                   {(order.order_items || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center font-sans">
                         <div>
                            <p className="font-bold">{item.product_variants?.products?.title ?? 'Unknown Product'}</p>
                            <p className="text-sm opacity-70">Qty: {item.quantity}</p>
                         </div>
                         <p>₹{item.unit_price}</p>
                      </div>
                   ))}
                </div>
                <div className="mt-8 pt-6 border-t-2 border-[var(--charcoal-ink)]/20 flex gap-4">
                  <Button variant="outline" className="text-sm">Track Package</Button>
                  <Button variant="outline" className="text-sm">Download Invoice (PDF)</Button>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
