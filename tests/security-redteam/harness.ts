// Shared red-team harness (Playbook Step 5). LOCAL STACK ONLY.
//
// Run with `npm run test:redteam`, which reads `supabase status` and sets the
// REDTEAM_* variables. Without them every suite is skipped, so plain
// `vitest run` and CI without a database stay green.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const SUPABASE_URL = process.env.REDTEAM_SUPABASE_URL ?? '';
export const SERVICE_KEY = process.env.REDTEAM_SERVICE_KEY ?? '';
export const ANON_KEY = process.env.REDTEAM_ANON_KEY ?? '';
export const APP_URL = process.env.REDTEAM_APP_URL ?? '';

function isLocal(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '[::1]';
  } catch {
    return false;
  }
}

/** SAFETY GATE: refuse to run against anything but a local host. */
export function assertLocal(url: string) {
  if (!isLocal(url)) throw new Error(`Red-team target ${url} is not localhost. Aborting.`);
}

export const dbEnabled = Boolean(SUPABASE_URL && SERVICE_KEY && ANON_KEY);
export const appEnabled = dbEnabled && Boolean(APP_URL);
if (dbEnabled) assertLocal(SUPABASE_URL);
if (APP_URL) assertLocal(APP_URL);

export function service(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Persona = { id: string; email: string; client: SupabaseClient; session: { access_token: string; refresh_token: string; [k: string]: unknown } };

/** Create a confirmed user, optionally admin, and return a signed-in client. */
export async function persona(tag: string, opts: { admin?: boolean } = {}): Promise<Persona> {
  const svc = service();
  const email = `redteam-${tag}-${crypto.randomUUID().slice(0, 8)}@example.test`;
  const password = `Rt-${crypto.randomUUID()}`;
  const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`createUser ${tag}: ${error?.message}`);
  if (opts.admin) {
    const r = await svc.from('user_roles').upsert({ user_id: data.user.id, role: 'admin' }, { onConflict: 'user_id' });
    if (r.error) throw new Error(`grant admin: ${r.error.message}`);
  }
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const s = await client.auth.signInWithPassword({ email, password });
  if (s.error || !s.data.session) throw new Error(`signIn ${tag}: ${s.error?.message}`);
  return { id: data.user.id, email, client, session: s.data.session as unknown as Persona['session'] };
}

export type Fixture = {
  categoryId: string;
  productId: string;
  /** Fabric sold by the metre: stock becomes an opening-balance roll (migration 0050). */
  variant: (stock: number, price?: number) => Promise<string>;
  /** Item sold by the piece (sarees, stitched goods): plain stock counter. */
  pcsVariant: (stock: number, price?: number) => Promise<string>;
};

export async function catalogue(tag: string): Promise<Fixture> {
  const svc = service();
  const suffix = crypto.randomUUID().slice(0, 8);
  const cat = await svc.from('categories').insert({ name: `RT ${tag}`, slug: `rt-${tag}-${suffix}` }).select('id').single();
  if (cat.error) throw new Error(`category: ${cat.error.message}`);
  const prod = await svc
    .from('products')
    .insert({ category_id: cat.data.id, slug: `rt-prod-${tag}-${suffix}`, title: `RT ${tag}`, status: 'active' })
    .select('id')
    .single();
  if (prod.error) throw new Error(`product: ${prod.error.message}`);
  let n = 0;
  let pcsProduct: string | null = null;
  const addVariant = async (productId: string, stock: number, price: number) => {
    const v = await svc
      .from('product_variants')
      .insert({ product_id: productId, sku: `RT-${tag}-${suffix}-${n++}`, color: 'Indigo', price, stock_quantity: stock })
      .select('id')
      .single();
    if (v.error) throw new Error(`variant: ${v.error.message}`);
    return v.data.id as string;
  };
  return {
    categoryId: cat.data.id,
    productId: prod.data.id,
    variant: (stock: number, price = 100) => addVariant(prod.data.id, stock, price),
    pcsVariant: async (stock: number, price = 100) => {
      if (!pcsProduct) {
        const p = await svc
          .from('products')
          .insert({ category_id: cat.data.id, slug: `rt-pcs-${tag}-${suffix}`, title: `RT ${tag} pieces`, status: 'active', sell_unit: 'PCS' })
          .select('id')
          .single();
        if (p.error) throw new Error(`pcs product: ${p.error.message}`);
        pcsProduct = p.data.id as string;
      }
      return addVariant(pcsProduct, stock, price);
    },
  };
}

export async function stockOf(variantId: string): Promise<number> {
  const { data, error } = await service().from('product_variants').select('stock_quantity').eq('id', variantId).single();
  if (error) throw new Error(error.message);
  return Number(data.stock_quantity);
}

export const SHIPPING = {
  firstName: 'Red', lastName: 'Team', email: 'redteam@example.test', address1: '1 Test Road',
  city: 'New Delhi', state: 'Delhi', pinCode: '110001',
};

/** Fire n calls at once (all promises created before any is awaited) and tally the outcomes. */
export async function race<T>(n: number, fn: (i: number) => PromiseLike<{ data: T; error: { message: string } | null }>) {
  const settled = await Promise.all(Array.from({ length: n }, (_, i) => Promise.resolve(fn(i)).then(
    (r) => r,
    (e: unknown) => ({ data: null as T, error: { message: e instanceof Error ? e.message : String(e) } }),
  )));
  const ok = settled.filter((r) => !r.error);
  const histogram: Record<string, number> = {};
  for (const r of settled) {
    const k = r.error ? r.error.message.replace(/[0-9a-f-]{36}/g, '<id>').slice(0, 60) : 'ok';
    histogram[k] = (histogram[k] ?? 0) + 1;
  }
  return { ok, settled, histogram };
}

export function record(name: string, value: unknown) {
  // Collected by run.mjs into docs/SECURITY_REDTEAM_REPORT.md evidence.
  console.log(`REDTEAM ${name} ${JSON.stringify(value)}`);
}
