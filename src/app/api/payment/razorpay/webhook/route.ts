import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const rawBody = await request.text();
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payload = event.payload.payment.entity;
      const receipt = payload.notes?.order_id;
      
      if (!receipt) {
         return NextResponse.json({ error: 'No order_id in notes' }, { status: 400 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { error } = await supabase.rpc('record_payment', {
        p_order_id: receipt,
        p_provider: 'razorpay',
        p_provider_payment_id: payload.id,
        p_amount: Number(payload.amount) / 100, // payload is in paise
        p_status: 'captured',
        p_method: payload.method,
        p_currency: payload.currency,
        p_raw: payload,
      });

      if (error) {
        console.error('Webhook record_payment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('razorpay webhook:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
