import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { haveTestDb, serviceClient, makeUser, deleteUser, seedVariant, seedDiscount } from './helpers';

const U = 'rpc-user@test.mithila.local';
const U2 = 'rpc-user2@test.mithila.local';

// create_order_atomic is service_role-only and prices everything server-side
// (migration 0040). The app calls it from src/actions/orders.ts with p_user_id
// taken from the verified session.
function placeOrder(userId: string, items: unknown[], extra: Record<string, unknown> = {}) {
  return serviceClient().rpc('create_order_atomic', {
    p_user_id: userId,
    p_items: items,
    p_shipping: { city: 'Delhi' },
    p_shipping_amount: 50,
    ...extra,
  });
}

describe.skipIf(!haveTestDb)('create_order_atomic', () => {
  let user: any;
  let user2: any;
  beforeAll(async () => { user = await makeUser(U); user2 = await makeUser(U2); });
  afterAll(async () => { await deleteUser(U); await deleteUser(U2); });

  it('computes subtotal + 5% GST (products.gst_rate) + shipping', async () => {
    const v = await seedVariant(500, 10);
    const { data: orderId, error } = await placeOrder(user.userId, [{ variant_id: v.variantId, quantity: 2 }]);
    expect(error).toBeNull();
    const { data: o } = await serviceClient()
      .from('orders').select('subtotal, tax_amount, shipping_amount, total_amount').eq('id', orderId).single();
    expect(Number(o!.subtotal)).toBe(1000);
    expect(Number(o!.tax_amount)).toBe(50);
    expect(Number(o!.shipping_amount)).toBe(50);
    expect(Number(o!.total_amount)).toBe(1100);
  });

  it('decrements stock and rejects oversell', async () => {
    const v = await seedVariant(100, 1);
    const ok = await placeOrder(user.userId, [{ variant_id: v.variantId, quantity: 1 }]);
    expect(ok.error).toBeNull();
    const fail = await placeOrder(user.userId, [{ variant_id: v.variantId, quantity: 1 }]);
    expect(fail.error?.message || '').toMatch(/INSUFFICIENT_STOCK/);
    const after = await serviceClient().from('product_variants').select('stock_quantity').eq('id', v.variantId).single();
    expect(Number(after.data?.stock_quantity)).toBe(0);
  });

  it('applies a percentage discount and records it', async () => {
    const v = await seedVariant(1000, 5);
    await seedDiscount('RPC10', 'percentage', 10);
    const { data: orderId } = await placeOrder(user.userId, [{ variant_id: v.variantId, quantity: 1 }], { p_discount_code: 'RPC10' });
    const { data: o } = await serviceClient()
      .from('orders').select('discount_applied, total_amount, applied_discount_id').eq('id', orderId).single();
    expect(Number(o!.discount_applied)).toBe(100);          // 10% of 1000
    expect(Number(o!.total_amount)).toBe(1000);             // 1000 - 100 + 50 GST + 50 ship
    expect(o!.applied_discount_id).not.toBeNull();
  });

  it('rejects negative shipping', async () => {
    const v = await seedVariant(100, 5);
    const r = await placeOrder(user.userId, [{ variant_id: v.variantId, quantity: 1 }], { p_shipping_amount: -500 });
    expect(r.error?.message || '').toMatch(/INVALID_SHIPPING/);
  });

  it('a signed-in customer cannot call create_order_atomic directly', async () => {
    const v = await seedVariant(100, 5);
    const r = await user.client.rpc('create_order_atomic', {
      p_user_id: user.userId,
      p_items: [{ variant_id: v.variantId, quantity: 1 }],
      p_shipping: {},
      p_shipping_amount: 0,
    });
    expect(r.error).not.toBeNull();
    expect(r.data).toBeNull();
  });

  it('a signed-in customer cannot INSERT an order with their own total', async () => {
    const r = await user.client.from('orders').insert({
      user_id: user.userId, subtotal: 1, total_amount: 1, shipping_address: {},
    });
    expect(r.error).not.toBeNull();
  });

  it('respects max_uses on a coupon', async () => {
    const v = await seedVariant(200, 10);
    const code = 'ONCE' + Math.random().toString(36).slice(2, 7).toUpperCase();
    await serviceClient().from('discounts').insert({
      code, type: 'percentage', value: 10, is_active: true, max_uses: 1, max_uses_per_user: 5,
    });
    const first = await placeOrder(user.userId, [{ variant_id: v.variantId, quantity: 1 }], { p_discount_code: code });
    expect(first.error).toBeNull();
    const second = await placeOrder(user2.userId, [{ variant_id: v.variantId, quantity: 1 }], { p_discount_code: code });
    expect(second.error?.message || '').toMatch(/INVALID_DISCOUNT/);
  });
});
