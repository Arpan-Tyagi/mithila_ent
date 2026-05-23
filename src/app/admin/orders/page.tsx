import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(full_name, phone)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Order Management</h1>
        <Button variant="outline" className="text-sm">Export to CSV</Button>
      </div>
      
      <div className="bg-white border-2 border-[var(--charcoal-ink)] rounded-sm overflow-x-auto">
        <table className="w-full text-left font-sans whitespace-nowrap">
          <thead className="bg-[var(--charcoal-ink)] text-[var(--unbleached-cotton)]">
            <tr>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Order ID</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Date</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Customer</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Total</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Payment</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold">Status</th>
              <th className="p-4 uppercase tracking-widest text-xs font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[var(--charcoal-ink)]/20">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--unbleached-cotton)] transition-colors">
                  <td className="p-4 font-bold text-[var(--charcoal-ink)]">#{order.id.split('-')[0]}</td>
                  <td className="p-4 text-sm opacity-80">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-medium">{order.profiles?.full_name || 'Guest User'}</td>
                  <td className="p-4 font-bold text-[var(--madder-red)]">₹{order.total_amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm ${order.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {order.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="p-4">
                    <select 
                      defaultValue={order.status}
                      className="bg-transparent border-2 border-[var(--charcoal-ink)]/20 p-1 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[var(--turmeric)]"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" className="text-sm py-1 px-3 border-2 border-[var(--charcoal-ink)]">View</Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm opacity-70">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
