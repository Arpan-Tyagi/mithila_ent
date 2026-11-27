import { beforeEach, describe, expect, it, vi } from 'vitest';

// Step 4 (logistics): shared-secret auth, bounded/markup-free status, no DB error echo.

const state = vi.hoisted(() => ({ update: vi.fn(), result: { data: [{ id: 'x' }], error: null as null | { message: string } } }));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (u: unknown) => {
        state.update(u);
        return { eq: () => ({ select: async () => state.result }) };
      },
    }),
  }),
}));

import { POST } from '@/app/api/webhooks/logistics/route';

const ORDER = '0b6f8d3e-1c2a-4f5b-9a7e-2d4c6b8a0f11';
function req(body: unknown, secret = 'logi_secret') {
  return new Request('http://localhost/api/webhooks/logistics', {
    method: 'POST',
    headers: { 'x-webhook-secret': secret, 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.LOGISTICS_WEBHOOK_SECRET = 'logi_secret';
  state.update.mockReset();
  state.result = { data: [{ id: ORDER }], error: null };
});

describe('logistics webhook', () => {
  it('rejects a wrong or missing secret before reading the body', async () => {
    expect((await POST(req({ order_id: ORDER, tracking_status: 'x' }, 'nope'))).status).toBe(401);
    delete process.env.LOGISTICS_WEBHOOK_SECRET;
    expect((await POST(req({ order_id: ORDER, tracking_status: 'x' }, ''))).status).toBe(401);
    expect(state.update).not.toHaveBeenCalled();
  });
  it('rejects a non-UUID order id and an oversized status', async () => {
    expect((await POST(req({ order_id: '1 OR 1=1', tracking_status: 'x' }))).status).toBe(400);
    expect((await POST(req({ order_id: ORDER, tracking_status: 'x'.repeat(201) }))).status).toBe(400);
    expect((await POST(req('{not json'))).status).toBe(400);
  });
  it('strips markup from the status before storing it', async () => {
    const res = await POST(req({ order_id: ORDER, tracking_status: 'AWB 123 <img src=x onerror=alert(1)>' }));
    expect(res.status).toBe(200);
    expect(state.update).toHaveBeenCalledWith({ tracking_status: 'AWB 123' });
  });
  it('does not echo database errors and reports unknown orders as 404', async () => {
    state.result = { data: [], error: { message: 'relation "orders" secret detail' } };
    const res = await POST(req({ order_id: ORDER, tracking_status: 'In transit' }));
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('secret detail');
    state.result = { data: [], error: null };
    expect((await POST(req({ order_id: ORDER, tracking_status: 'In transit' }))).status).toBe(404);
  });
});
