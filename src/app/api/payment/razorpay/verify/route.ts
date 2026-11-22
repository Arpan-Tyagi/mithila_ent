import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchRazorpayPayment, razorpayConfigured, verifyPaymentSignature } from '@/lib/razorpay';

// Checkout callback. Marks one of OUR orders paid only when all of these hold:
//   1. The Razorpay signature over (razorpay_order_id|razorpay_payment_id) is valid.
//   2. The caller is signed in and owns `orderId`.
//   3. `razorpay_order_id` is the Razorpay order that create-order stored on
//      this order (orders.razorpay_order_id, migration 0041).
//   4. Razorpay's API says the payment belongs to that Razorpay order, is INR,
//      and is captured. The amount passed to record_payment is the captured
//      amount from Razorpay, so record_payment's "captured >= total" check is
//      a real check rather than total >= total.
// A payment that is authorized but not yet captured gets 202 { pending: true };
// the signed webhook records it when it is captured.
export async function POST(request: Request) {
  try {
    if (!razorpayConfigured()) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (
      typeof orderId !== 'string' || !orderId ||
      typeof razorpay_order_id !== 'string' || !razorpay_order_id ||
      typeof razorpay_payment_id !== 'string' || !razorpay_payment_id ||
      typeof razorpay_signature !== 'string' || !razorpay_signature
    ) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: order } = await admin
      .from('orders')
      .select('id, user_id, total_amount, is_paid, razorpay_order_id')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (!order.razorpay_order_id || order.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
    }
    if (order.is_paid) {
      return NextResponse.json({ success: true });
    }

    const payment = await fetchRazorpayPayment(razorpay_payment_id);
    if (payment.order_id !== razorpay_order_id || payment.currency !== 'INR') {
      return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
    }
    if (payment.status !== 'captured') {
      return NextResponse.json({ success: false, pending: true, status: payment.status }, { status: 202 });
    }

    const { error } = await admin.rpc('record_payment', {
      p_order_id: order.id,
      p_provider: 'razorpay',
      p_provider_payment_id: payment.id,
      p_amount: payment.amount / 100,
      p_status: 'captured',
      p_method: payment.method || 'razorpay',
      p_currency: payment.currency,
      p_raw: { razorpay_order_id, razorpay_payment_id: payment.id, source: 'checkout_verify' },
    });
    if (error) {
      console.error('razorpay verify record_payment:', error);
      return NextResponse.json({ error: 'Payment could not be recorded' }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('razorpay verify:', err);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
