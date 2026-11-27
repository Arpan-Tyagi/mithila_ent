import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { secretMatches } from '@/lib/secure-compare';
import { plainText, uuid } from '@/lib/validation/common';

// Logistics provider webhook: updates an order's tracking status.
//
// Auth: the provider must send a shared secret in the `x-webhook-secret` header
// that matches LOGISTICS_WEBHOOK_SECRET. If the secret is unset or wrong, the
// request is rejected (fail closed).
//
// The service-role client is used because the request has no user session and
// `orders` is admin-write under RLS. The secret check is what authorizes it.
// The status ends up in customer e-mails, so it is bounded and stripped of
// markup, and database errors are never echoed back to the caller.

const MAX_BODY_BYTES = 16 * 1024;

const payloadSchema = z.object({
  order_id: uuid,
  tracking_status: plainText(200, { min: 1 }),
});

export async function POST(request: Request) {
  if (!secretMatches(process.env.LOGISTICS_WEBHOOK_SECRET, request.headers.get('x-webhook-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from('orders')
    .update({ tracking_status: parsed.data.tracking_status })
    .eq('id', parsed.data.order_id)
    .select('id');

  if (error) {
    console.error('logistics webhook update failed:', error.message);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
