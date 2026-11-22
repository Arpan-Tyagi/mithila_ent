import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- mocks -------------------------------------------------------------------
const state = vi.hoisted(() => ({
  user: null as null | { id: string },
  order: null as null | Record<string, unknown>,
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: state.order }),
      };
      return q;
    },
    rpc: state.rpc,
  }),
}));

import { POST } from '@/app/api/payment/razorpay/verify/route';

// --- helpers -----------------------------------------------------------------
const SECRET = 'rzp_test_secret';
const sign = (o: string, p: string) => crypto.createHmac('sha256', SECRET).update(`${o}|${p}`).digest('hex');
const OWNER = 'user-a';
const ORDER = 'order-uuid-1';

function req(body: Record<string, unknown>) {
  return new Request('http://localhost/api/payment/razorpay/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function body(rpOrder: string, payId: string, orderId = ORDER) {
  return { orderId, razorpay_order_id: rpOrder, razorpay_payment_id: payId, razorpay_signature: sign(rpOrder, payId) };
}
function mockRazorpayPayment(p: Record<string, unknown>) {
  const f = vi.fn(async () => new Response(JSON.stringify(p), { status: 200 }));
  vi.stubGlobal('fetch', f);
  return f;
}

beforeEach(() => {
  vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_key');
  vi.stubEnv('RAZORPAY_KEY_SECRET', SECRET);
  state.user = { id: OWNER };
  state.order = { id: ORDER, user_id: OWNER, total_amount: 1100, is_paid: false, razorpay_order_id: 'order_RP1' };
  state.rpc.mockReset();
  state.rpc.mockResolvedValue({ data: 'payment-row', error: null });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// --- tests -------------------------------------------------------------------
describe('POST /api/payment/razorpay/verify', () => {
  it('rejects a valid signature for a different (cheap) Razorpay order', async () => {
    mockRazorpayPayment({ id: 'pay_1', order_id: 'order_CHEAP', amount: 100, currency: 'INR', status: 'captured' });
    const res = await POST(req(body('order_CHEAP', 'pay_1')));
    expect(res.status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("returns 404 for another customer's order", async () => {
    state.user = { id: 'user-b' };
    const res = await POST(req(body('order_RP1', 'pay_1')));
    expect(res.status).toBe(404);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('requires a signed-in user', async () => {
    state.user = null;
    const res = await POST(req(body('order_RP1', 'pay_1')));
    expect(res.status).toBe(401);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('rejects a bad signature before touching the DB', async () => {
    const res = await POST(req({ ...body('order_RP1', 'pay_1'), razorpay_signature: 'deadbeef' }));
    expect(res.status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('records the amount Razorpay captured, not the DB total', async () => {
    mockRazorpayPayment({ id: 'pay_1', order_id: 'order_RP1', amount: 110000, currency: 'INR', status: 'captured', method: 'upi' });
    const res = await POST(req(body('order_RP1', 'pay_1')));
    expect(res.status).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith('record_payment', expect.objectContaining({
      p_order_id: ORDER, p_amount: 1100, p_provider_payment_id: 'pay_1', p_method: 'upi', p_status: 'captured',
    }));
  });

  it("rejects a payment Razorpay says belongs to another order", async () => {
    mockRazorpayPayment({ id: 'pay_1', order_id: 'order_OTHER', amount: 110000, currency: 'INR', status: 'captured' });
    const res = await POST(req(body('order_RP1', 'pay_1')));
    expect(res.status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('returns 202 pending for an authorized-but-not-captured payment', async () => {
    mockRazorpayPayment({ id: 'pay_1', order_id: 'order_RP1', amount: 110000, currency: 'INR', status: 'authorized' });
    const res = await POST(req(body('order_RP1', 'pay_1')));
    expect(res.status).toBe(202);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('returns 503 when Razorpay keys are not configured', async () => {
    vi.stubEnv('RAZORPAY_KEY_SECRET', '');
    const res = await POST(req(body('order_RP1', 'pay_1')));
    expect(res.status).toBe(503);
  });
});
