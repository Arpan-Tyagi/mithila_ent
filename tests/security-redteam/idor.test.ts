import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import { ANON_KEY, catalogue, dbEnabled, persona, record, service, SHIPPING, SUPABASE_URL, type Persona } from './harness';

// Playbook Step 5: horizontal IDOR, vertical escalation and mass assignment
// through the public PostgREST API with each persona's own JWT. Owner and admin
// access is proven first so an empty table can never produce a false pass.

describe.skipIf(!dbEnabled)('red-team: access control through the public API (local stack)', () => {
  let a: Persona;
  let b: Persona;
  let admin: Persona;
  let orderId: string;
  let variantId: string;
  const anon = () => createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  beforeAll(async () => {
    a = await persona('idor-a');
    b = await persona('idor-b');
    admin = await persona('idor-admin', { admin: true });
    const cat = await catalogue('idor');
    variantId = await cat.variant(100, 250);
    const o = await service().rpc('create_order_atomic', {
      p_user_id: a.id, p_items: [{ variant_id: variantId, quantity: 2 }], p_shipping: SHIPPING,
      p_shipping_amount: 60, p_discount_code: null, p_idempotency_key: crypto.randomUUID(),
    });
    if (o.error) throw new Error(o.error.message);
    orderId = o.data as string;
    // Admin claims come from the access-token hook, so sign in again after the grant.
    admin = await persona('idor-admin2', { admin: true });
  }, 60_000);

  it('positive control: the owner and an admin can read the order', async () => {
    const own = await a.client.from('orders').select('id, total_amount').eq('id', orderId);
    const adm = await admin.client.from('orders').select('id').eq('id', orderId);
    record('idor_positive', { owner_rows: own.data?.length, admin_rows: adm.data?.length });
    expect(own.data).toHaveLength(1);
    expect(adm.data).toHaveLength(1);
  });

  it('customer B cannot read, edit or delete customer A order data', async () => {
    const read = await b.client.from('orders').select('*').eq('id', orderId);
    const items = await b.client.from('order_items').select('*').eq('order_id', orderId);
    const upd = await b.client.from('orders').update({ total_amount: 1, is_paid: true }).eq('id', orderId).select('id');
    const del = await b.client.from('orders').delete().eq('id', orderId).select('id');
    record('idor_customer_b', {
      read_rows: read.data?.length ?? read.error?.code, item_rows: items.data?.length ?? items.error?.code,
      update: upd.data?.length ?? upd.error?.code, delete: del.data?.length ?? del.error?.code,
    });
    expect(read.data ?? []).toHaveLength(0);
    expect(items.data ?? []).toHaveLength(0);
    expect(upd.data ?? []).toHaveLength(0);
    expect(del.data ?? []).toHaveLength(0);
    const still = await service().from('orders').select('total_amount, is_paid').eq('id', orderId).single();
    expect(Number(still.data?.total_amount)).toBeGreaterThan(1);
    expect(still.data?.is_paid).toBe(false);
  });

  it('even the owner cannot rewrite their own order total or mark it paid', async () => {
    const upd = await a.client.from('orders').update({ total_amount: 1, is_paid: true }).eq('id', orderId).select('id');
    record('owner_self_tamper', upd.data?.length ?? upd.error?.code);
    expect(upd.data ?? []).toHaveLength(0);
    const still = await service().from('orders').select('total_amount, is_paid').eq('id', orderId).single();
    expect(still.data?.is_paid).toBe(false);
  });

  it('a customer cannot call the server-only money RPCs', async () => {
    const calls = {
      create_order_atomic: await b.client.rpc('create_order_atomic', {
        p_user_id: b.id, p_items: [{ variant_id: variantId, quantity: 1 }], p_shipping: SHIPPING, p_shipping_amount: 0,
      }),
      record_payment: await b.client.rpc('record_payment', { p_order_id: orderId, p_provider: 'razorpay', p_provider_payment_id: 'pay_x', p_amount: 1 }),
      cancel_order_restock: await b.client.rpc('cancel_order_restock', { p_order_id: orderId }),
      partial_cancel_order_item: await b.client.rpc('partial_cancel_order_item', { p_order_id: orderId, p_order_item_id: orderId, p_restock: true }),
      adjust_stock: await b.client.rpc('adjust_stock', { p_variant_id: variantId, p_delta: 1000 }),
    };
    const codes = Object.fromEntries(Object.entries(calls).map(([k, v]) => [k, v.error?.code ?? 'ALLOWED']));
    record('rpc_denials', codes);
    for (const [, v] of Object.entries(calls)) expect(v.error?.code).toBe('42501');
  });

  it('a customer cannot make themselves admin (mass assignment)', async () => {
    const roleCol = await b.client.from('profiles').update({ role: 'admin' }).eq('id', b.id).select('id');
    const rolesRow = await b.client.from('user_roles').upsert({ user_id: b.id, role: 'admin' }).select('user_id');
    const nameOk = await b.client.from('profiles').update({ full_name: 'Customer B' }).eq('id', b.id).select('id');
    const isAdmin = await b.client.rpc('is_admin');
    record('mass_assignment', {
      profiles_role: roleCol.error?.code ?? roleCol.data?.length, user_roles: rolesRow.error?.code ?? rolesRow.data?.length,
      own_name_update_rows: nameOk.data?.length, is_admin: isAdmin.data,
    });
    expect(roleCol.error).not.toBeNull();
    expect(rolesRow.error).not.toBeNull();
    expect(nameOk.data).toHaveLength(1); // positive control: allowed columns still work
    expect(isAdmin.data).toBe(false);
  });

  it('a customer cannot insert an order directly', async () => {
    const ins = await b.client.from('orders').insert({ user_id: b.id, subtotal: 1, total_amount: 1, status: 'paid', is_paid: true }).select('id');
    record('direct_order_insert', ins.error?.code ?? 'ALLOWED');
    expect(ins.error?.code).toBe('42501');
  });

  it('anonymous callers see no private data', async () => {
    const c = anon();
    const out: Record<string, unknown> = {};
    for (const t of ['orders', 'order_items', 'profiles', 'payments', 'user_roles', 'webhook_events', 'contact_inquiries', 'pending_emails']) {
      const r = await c.from(t).select('*').limit(5);
      out[t] = r.error ? r.error.code : r.data?.length;
      expect(r.data ?? []).toHaveLength(0);
    }
    record('anon_sweep', out);
  });

  it('records whether anonymous callers can probe coupon codes', async () => {
    const r = await anon().rpc('validate_discount', { p_code: 'NOPE', p_subtotal: 1000 });
    const rb = await b.client.rpc('validate_discount', { p_code: 'NOPE', p_subtotal: 1000 });
    record('validate_discount_direct', { anon: r.error?.code ?? 'ALLOWED', customer: rb.error?.code ?? 'ALLOWED' });
    // Finding RT-01 in docs/SECURITY_REDTEAM_REPORT.md; fixed by migration 0049.
    expect(r.error?.code).toBe('42501');
    expect(rb.error?.code).toBe('42501');
  });
});
