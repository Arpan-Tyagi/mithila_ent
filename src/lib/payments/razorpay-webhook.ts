import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

// SEC-07: one Razorpay webhook implementation.
//
// The route verifies the HMAC over the raw body, stores a reduced copy of the
// event in public.webhook_events (primary key = provider + event id, so a
// repeated delivery is stored once), answers 200, and processes the event
// after the response. /api/cron/webhook-retry re-runs anything left
// unprocessed after a transient failure.

export const PROVIDER = 'razorpay';
const MAX_ATTEMPTS = 10;

type PaymentStatus = 'captured' | 'failed';

/** Only the fields we need. No customer e-mail, phone, card or VPA. */
export interface StoredRazorpayEvent {
  event: string;
  payment_id: string | null;
  razorpay_order_id: string | null;
  order_id: string | null; // our orders.id, from payment.notes.order_id
  amount_paise: number | null;
  currency: string | null;
  method: string | null;
  payment_status: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(v: unknown, max = 100): string | null {
  return typeof v === 'string' && v.length > 0 && v.length <= max ? v : null;
}

/** Reduces a verified Razorpay event to the stored shape. */
export function reduceRazorpayEvent(event: unknown): StoredRazorpayEvent {
  const e = (event ?? {}) as Record<string, any>;
  const p = (e.payload?.payment?.entity ?? {}) as Record<string, any>;
  const ourOrderId = str(p.notes?.order_id, 36);
  return {
    event: str(e.event) ?? 'unknown',
    payment_id: str(p.id),
    razorpay_order_id: str(p.order_id),
    order_id: ourOrderId && UUID_RE.test(ourOrderId) ? ourOrderId : null,
    amount_paise: Number.isSafeInteger(p.amount) && p.amount >= 0 ? p.amount : null,
    currency: str(p.currency, 8),
    method: str(p.method, 40),
    payment_status: str(p.status, 40),
  };
}

/** Razorpay sends x-razorpay-event-id; fall back to event + payment id. */
export function razorpayEventId(header: string | null, reduced: StoredRazorpayEvent): string | null {
  const h = str(header, 200);
  if (h) return h;
  if (reduced.payment_id) return `${reduced.event}:${reduced.payment_id}`;
  return null;
}

function statusFor(eventType: string): PaymentStatus | null {
  if (eventType === 'payment.captured' || eventType === 'order.paid') return 'captured';
  if (eventType === 'payment.failed') return 'failed';
  return null;
}

type Outcome =
  | { done: true; outcome: string }      // final: success, ignored, or a permanent rejection
  | { done: false; error: string };      // transient: retry later

async function handle(ev: StoredRazorpayEvent): Promise<Outcome> {
  const status = statusFor(ev.event);
  if (!status) return { done: true, outcome: 'ignored_event_type' };
  if (!ev.order_id || !ev.payment_id || !ev.razorpay_order_id) {
    return { done: true, outcome: 'ignored_missing_ids' };
  }

  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, razorpay_order_id')
    .eq('id', ev.order_id)
    .maybeSingle();
  if (orderErr) return { done: false, error: `order lookup: ${orderErr.message}` };
  if (!order) return { done: true, outcome: 'rejected_order_not_found' };

  // The payment must belong to the Razorpay order that create-order bound to
  // this order (migration 0041). notes.order_id alone is not enough.
  if (!order.razorpay_order_id || order.razorpay_order_id !== ev.razorpay_order_id) {
    console.error('razorpay webhook: payment does not belong to order', ev.order_id);
    return { done: true, outcome: 'rejected_order_mismatch' };
  }
  if (status === 'captured' && (ev.currency !== 'INR' || ev.amount_paise == null)) {
    return { done: true, outcome: 'rejected_currency_or_amount' };
  }

  const { error } = await admin.rpc('record_payment', {
    p_order_id: order.id,
    p_provider: PROVIDER,
    p_provider_payment_id: ev.payment_id,
    p_amount: (ev.amount_paise ?? 0) / 100,
    p_status: status,
    p_method: ev.method ?? PROVIDER,
    p_currency: ev.currency ?? 'INR',
    p_raw: { ...ev, source: 'webhook' },
  });
  if (error) {
    // Permanent: record_payment rejected the data itself.
    if (/PARTIAL_PAYMENT_REJECTED|ORDER_NOT_FOUND|invalid input value/i.test(error.message)) {
      console.error('razorpay webhook: record_payment rejected', ev.order_id, error.message);
      return { done: true, outcome: 'rejected_by_record_payment' };
    }
    return { done: false, error: `record_payment: ${error.message}` };
  }
  return { done: true, outcome: status === 'captured' ? 'recorded_capture' : 'recorded_failure' };
}

/** Processes one stored event and writes the result back to its row. */
export async function processWebhookEvent(eventId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('webhook_events')
    .select('event_id, payload, processed_at, attempts')
    .eq('provider', PROVIDER)
    .eq('event_id', eventId)
    .maybeSingle();
  if (error || !row) {
    console.error('razorpay webhook: event row not readable', eventId, error?.message);
    return;
  }
  if (row.processed_at || row.attempts >= MAX_ATTEMPTS) return;

  let result: Outcome;
  try {
    result = await handle(row.payload as StoredRazorpayEvent);
  } catch (err) {
    result = { done: false, error: (err as Error).message };
  }

  const update = result.done
    ? { processed_at: new Date().toISOString(), outcome: result.outcome, last_error: null, attempts: row.attempts + 1 }
    : { last_error: result.error.slice(0, 1000), attempts: row.attempts + 1 };
  if (!result.done) console.error('razorpay webhook: will retry', eventId, result.error);

  const { error: upErr } = await admin
    .from('webhook_events')
    .update(update)
    .eq('provider', PROVIDER)
    .eq('event_id', eventId);
  if (upErr) console.error('razorpay webhook: could not save outcome', eventId, upErr.message);
}

/** Retries events left unprocessed (called by the retry cron). */
export async function retryPendingWebhookEvents(limit = 50): Promise<{ retried: number }> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('webhook_events')
    .select('event_id')
    .eq('provider', PROVIDER)
    .is('processed_at', null)
    .lt('attempts', MAX_ATTEMPTS)
    .lt('received_at', cutoff)
    .order('received_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  for (const r of data ?? []) {
    await processWebhookEvent(r.event_id);
  }
  return { retried: data?.length ?? 0 };
}
