import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// SEC-07: the single Razorpay webhook route.

const ORDER = '0b6f8d3e-1c2a-4f5b-9a7e-2d4c6b8a0f11';
const RZP_ORDER = 'order_ABC123';

const state = vi.hoisted(() => ({
  events: new Map<string, Record<string, unknown>>(),
  order: null as null | { id: string; razorpay_order_id: string | null },
  rpc: vi.fn(),
  afterFns: [] as (() => unknown)[],
  failInsert: false,
}));

vi.mock('next/server', async (orig) => {
  const mod = await orig<typeof import('next/server')>();
  return { ...mod, after: (fn: () => unknown) => { state.afterFns.push(fn); } };
});

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: state.rpc,
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      let pendingUpdate: Record<string, unknown> | null = null;
      const q: Record<string, unknown> = {};
      Object.assign(q, {
        select: () => q,
        eq: (k: string, v: unknown) => {
          filters[k] = v;
          if (pendingUpdate && table === 'webhook_events' && filters.event_id) {
            const row = state.events.get(String(filters.event_id));
            if (row) Object.assign(row, pendingUpdate);
            pendingUpdate = null;
          }
          return q;
        },
        maybeSingle: async () => {
          if (table === 'orders') return { data: state.order, error: null };
          return { data: state.events.get(String(filters.event_id)) ?? null, error: null };
        },
        update: (u: Record<string, unknown>) => {
          pendingUpdate = u;
          return q;
        },
        upsert: (row: Record<string, unknown>) => ({
          select: async () => {
            if (state.failInsert) return { data: null, error: { message: 'db down' } };
            const id = String(row.event_id);
            if (state.events.has(id)) return { data: [], error: null };
            state.events.set(id, { ...row, processed_at: null, attempts: 0 });
            return { data: [{ event_id: id }], error: null };
          },
        }),
      });
      return q;
    },
  }),
}));

import { POST } from '@/app/api/webhooks/razorpay/route';
import { POST as AliasPOST } from '@/app/api/payment/razorpay/webhook/route';

const SECRET = 'whsec_test';
function event(type = 'payment.captured', over: Record<string, unknown> = {}) {
  return {
    event: type,
    payload: {
      payment: {
        entity: {
          id: 'pay_XYZ', order_id: RZP_ORDER, amount: 150000, currency: 'INR', status: 'captured',
          method: 'upi', email: 'buyer@example.test', contact: '+919999999999',
          notes: { order_id: ORDER }, ...over,
        },
      },
    },
  };
}
function req(body: unknown, { sign = true, eventId = 'evt_1' } = {}) {
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  return new Request('http://localhost/api/webhooks/razorpay', {
    method: 'POST',
    headers: { 'x-razorpay-signature': sign ? sig : 'bad', 'x-razorpay-event-id': eventId },
    body: raw,
  });
}
async function runAfter() {
  const fns = state.afterFns.splice(0);
  for (const f of fns) await f();
}

beforeEach(() => {
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'x';
  state.events.clear();
  state.order = { id: ORDER, razorpay_order_id: RZP_ORDER };
  state.rpc.mockReset().mockResolvedValue({ data: 'payment-id', error: null });
  state.afterFns = [];
  state.failInsert = false;
});
afterEach(() => vi.clearAllMocks());

describe('Razorpay webhook (SEC-07)', () => {
  it('rejects a bad signature without storing anything', async () => {
    const res = await POST(req(event(), { sign: false }));
    expect(res.status).toBe(401);
    expect(state.events.size).toBe(0);
  });

  it('stores the event, answers 200, then records the payment after the response', async () => {
    const res = await POST(req(event()));
    expect(res.status).toBe(200);
    expect(state.rpc).not.toHaveBeenCalled(); // not processed inline
    await runAfter();
    expect(state.rpc).toHaveBeenCalledTimes(1);
    expect(state.rpc.mock.calls[0][1]).toMatchObject({
      p_order_id: ORDER, p_provider_payment_id: 'pay_XYZ', p_amount: 1500, p_status: 'captured',
    });
    expect(state.events.get('evt_1')).toMatchObject({ outcome: 'recorded_capture', attempts: 1 });
  });

  it('stores no customer e-mail or phone number', async () => {
    await POST(req(event()));
    const stored = JSON.stringify(state.events.get('evt_1'));
    expect(stored).not.toContain('buyer@example.test');
    expect(stored).not.toContain('9999999999');
  });

  it('processes a repeated delivery of the same event id once', async () => {
    await POST(req(event()));
    const second = await POST(req(event()));
    expect(second.status).toBe(200);
    await runAfter();
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });

  it('answers 500 when the event cannot be stored, so Razorpay retries', async () => {
    state.failInsert = true;
    const res = await POST(req(event()));
    expect(res.status).toBe(500);
  });

  it('refuses a payment whose Razorpay order is not the one bound to our order', async () => {
    await POST(req(event('payment.captured', { order_id: 'order_OTHER' })));
    await runAfter();
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.events.get('evt_1')).toMatchObject({ outcome: 'rejected_order_mismatch' });
  });

  it('keeps the event pending when record_payment fails for a transient reason', async () => {
    state.rpc.mockResolvedValue({ data: null, error: { message: 'connection reset' } });
    await POST(req(event()));
    await runAfter();
    const row = state.events.get('evt_1')!;
    expect(row.processed_at).toBeNull();
    expect(row.attempts).toBe(1);
    expect(String(row.last_error)).toContain('connection reset');
  });

  it('ignores event types it does not handle', async () => {
    await POST(req(event('refund.created')));
    await runAfter();
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.events.get('evt_1')).toMatchObject({ outcome: 'ignored_event_type' });
  });

  it('the old URL runs the same handler', async () => {
    expect(AliasPOST).toBe(POST);
  });
});
