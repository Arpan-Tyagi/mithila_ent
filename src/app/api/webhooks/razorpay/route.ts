import { NextResponse, after } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PROVIDER,
  processWebhookEvent,
  razorpayEventId,
  reduceRazorpayEvent,
} from '@/lib/payments/razorpay-webhook';

// The only Razorpay webhook (SEC-07). Configure Razorpay to call
// https://<domain>/api/webhooks/razorpay. /api/payment/razorpay/webhook is an
// alias of this handler for dashboards set up with the older path.
//
// 1. HMAC-SHA256 over the raw, unparsed body, compared in constant time.
// 2. One INSERT into webhook_events (dedupe on the event id).
// 3. 200 straight away; the payment is recorded after the response.
// If step 2 fails we answer 500 so Razorpay retries the delivery.

const MAX_BODY_BYTES = 256 * 1024;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }
  const signature = request.headers.get('x-razorpay-signature') || '';
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const reduced = reduceRazorpayEvent(event);
  const eventId = razorpayEventId(request.headers.get('x-razorpay-event-id'), reduced);
  if (!eventId) {
    // Signed but carries nothing we can act on (no event id, no payment id).
    return NextResponse.json({ received: true });
  }

  try {
    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from('webhook_events')
      .upsert(
        { provider: PROVIDER, event_id: eventId, event_type: reduced.event, payload: reduced },
        { onConflict: 'provider,event_id', ignoreDuplicates: true },
      )
      .select('event_id');
    if (error) {
      console.error('razorpay webhook: could not store event', error.message);
      return NextResponse.json({ error: 'Temporary failure' }, { status: 500 });
    }

    // A duplicate delivery returns no row; an earlier delivery owns processing
    // (and the retry cron picks it up if that run failed).
    if (inserted && inserted.length > 0) {
      after(() => processWebhookEvent(eventId));
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('razorpay webhook:', (err as Error).message);
    return NextResponse.json({ error: 'Temporary failure' }, { status: 500 });
  }
}
