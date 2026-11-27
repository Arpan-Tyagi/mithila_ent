import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import crypto from 'crypto';
import { APP_URL, appEnabled, catalogue, persona, record, service, SHIPPING, SUPABASE_URL, type Persona } from '../security-redteam/harness';

// Playbook Step 6: customer A, customer B and the owner admin walk the real
// app (production build, local stack) on desktop 1440x900 and mobile 375x812.
// Every page visited is scanned with axe for WCAG 2.0/2.1/2.2 A and AA, and
// watched for console errors, hydration errors, uncaught exceptions and 5xx.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

type Issues = { console: string[]; pageErrors: string[]; http5xx: string[]; http404: string[] };

function watch(page: Page): Issues {
  const issues: Issues = { console: [], pageErrors: [], http5xx: [], http404: [] };
  page.on('console', (m) => { if (m.type() === 'error') issues.console.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => issues.pageErrors.push(e.message.slice(0, 300)));
  page.on('response', (r) => {
    if (r.status() >= 500) issues.http5xx.push(`${r.status()} ${r.url()}`);
    if (r.status() === 404) issues.http404.push(r.url());
  });
  return issues;
}

const HYDRATION = /hydrat|did not match|server rendered HTML|Minified React error #(418|423|425)/i;

/** The cookie @supabase/ssr reads: sb-<host label>-auth-token = "base64-" + base64url(session), chunked. */
async function signIn(context: BrowserContext, p: Persona) {
  const name = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
  const value = 'base64-' + Buffer.from(JSON.stringify(p.session)).toString('base64url');
  const domain = new URL(APP_URL).hostname;
  const chunks = value.length <= 3000 ? [[name, value]] : Array.from({ length: Math.ceil(value.length / 3000) }, (_, i) => [`${name}.${i}`, value.slice(i * 3000, (i + 1) * 3000)]);
  await context.addCookies(chunks.map(([n, v]) => ({ name: n, value: v, domain, path: '/', sameSite: 'Lax' as const })));
}

async function audit(page: Page, label: string, issues: Issues) {
  // Let entrance animations finish so axe measures the settled colours.
  // Looping animations never finish, so only wait on finite ones, capped at 3 s.
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined))),
    new Promise((r) => setTimeout(r, 3000)),
  ]));
  await page.waitForTimeout(1000);
  const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const violations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') }));
  const hydration = [...issues.console, ...issues.pageErrors].filter((m) => HYDRATION.test(m));
  record(`e2e ${test.info().project.name} ${label}`, {
    axe_violations: violations, console_errors: issues.console, page_errors: issues.pageErrors, http5xx: issues.http5xx, http404: issues.http404, hydration,
  });
  return { violations, hydration };
}

async function visit(page: Page, path: string, issues: Issues) {
  const res = await page.goto(path, { waitUntil: 'load' });
  expect(res?.status(), `${path} status`).toBeLessThan(500);
  await page.waitForLoadState('domcontentloaded');
}

function expectClean(label: string, r: { violations: { impact?: string | null }[]; hydration: string[] }, issues: Issues) {
  expect(issues.http5xx, `${label}: 5xx responses`).toEqual([]);
  expect(issues.pageErrors, `${label}: uncaught exceptions`).toEqual([]);
  expect(r.hydration, `${label}: hydration errors`).toEqual([]);
  const blocking = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(blocking, `${label}: serious or critical WCAG violations`).toEqual([]);
}

test.describe('fabric platform: multi-role E2E + WCAG 2.2 AA (local stack)', () => {
  test.skip(!appEnabled, 'Needs REDTEAM_* env from tests/e2e/run.mjs');

  let a: Persona;
  let b: Persona;
  let admin: Persona;
  let productSlug: string;
  let orderId: string;

  test.beforeAll(async () => {
    a = await persona('e2e-a');
    b = await persona('e2e-b');
    admin = await persona('e2e-admin', { admin: true });
    const cat = await catalogue('e2e');
    const v = await cat.variant(40, 850);
    const p = await service().from('products').select('slug').eq('id', cat.productId).single();
    productSlug = p.data!.slug as string;
    const o = await service().rpc('create_order_atomic', {
      p_user_id: a.id, p_items: [{ variant_id: v, quantity: 2 }], p_shipping: SHIPPING,
      p_shipping_amount: 60, p_discount_code: null, p_idempotency_key: crypto.randomUUID(),
    });
    if (o.error) throw new Error(o.error.message);
    orderId = o.data as string;
    const tot = await service().from('orders').select('total_amount').eq('id', orderId).single();
    const pay = await service().rpc('record_payment', {
      p_order_id: orderId, p_provider: 'razorpay', p_provider_payment_id: `pay_e2e_${crypto.randomUUID().slice(0, 12)}`,
      p_amount: Number(tot.data!.total_amount), p_status: 'captured', p_method: 'upi',
    });
    if (pay.error) throw new Error(pay.error.message);
  });

  const shortId = () => orderId.split('-')[0].toUpperCase();

  for (const path of ['/', '/shop', '/product/{slug}', '/cart', '/login', '/signup', '/contact', '/wholesale', '/blog']) {
    test(`anonymous storefront ${path}`, async ({ page }) => {
      const issues = watch(page);
      const url = path.replace('{slug}', productSlug);
      await visit(page, url, issues);
      const r = await audit(page, `anon ${path}`, issues);
      expectClean(path, r, issues);
    });
  }

  test('customer A: sees own paid order and downloads the GST invoice', async ({ page, context }) => {
    await signIn(context, a);
    const issues = watch(page);
    await visit(page, '/account/orders', issues);
    await expect(page.getByRole('heading', { name: 'Your Orders' })).toBeVisible();
    await expect(page.getByText(`ORDER #${shortId()}`)).toBeVisible();
    const link = page.getByRole('link', { name: /download gst invoice/i });
    await expect(link).toHaveAttribute('href', `/api/invoice/${orderId}`);
    const pdf = await page.request.get(`/api/invoice/${orderId}`);
    expect(pdf.status()).toBe(200);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
    const r = await audit(page, 'customerA /account/orders', issues);
    expectClean('/account/orders (A)', r, issues);

    await visit(page, '/account/profile', issues);
    const r2 = await audit(page, 'customerA /account/profile', issues);
    expectClean('/account/profile (A)', r2, issues);
  });

  test('customer B: never sees customer A order or invoice, and is refused the CRM', async ({ page, context }) => {
    await signIn(context, b);
    const issues = watch(page);
    await visit(page, '/account/orders', issues);
    await expect(page.getByRole('heading', { name: 'Your Orders' })).toBeVisible();
    await expect(page.getByText(`ORDER #${shortId()}`)).toHaveCount(0);
    const inv = await page.request.get(`/api/invoice/${orderId}`);
    expect(inv.status()).toBe(404);
    await page.goto('/admin/dashboard');
    expect(new URL(page.url()).pathname.startsWith('/admin/dashboard')).toBe(false);
    await page.goto(`/admin/orders/${orderId}`);
    expect(new URL(page.url()).pathname.startsWith('/admin/orders')).toBe(false);
    record(`e2e ${test.info().project.name} customerB isolation`, { invoice: inv.status(), landed_on: new URL(page.url()).pathname });
  });

  test('owner admin: CRM dashboard and order detail show customer A order', async ({ page, context }) => {
    await signIn(context, admin);
    const issues = watch(page);
    await visit(page, '/admin/dashboard', issues);
    await expect(page.getByRole('heading', { name: 'Executive Ledger' })).toBeVisible();
    const r = await audit(page, 'admin /admin/dashboard', issues);
    expectClean('/admin/dashboard', r, issues);

    await visit(page, '/admin/orders', issues);
    await expect(page.getByRole('heading', { name: /orders/i }).first()).toBeVisible();
    const r2 = await audit(page, 'admin /admin/orders', issues);
    expectClean('/admin/orders', r2, issues);

    await visit(page, `/admin/orders/${orderId}`, issues);
    await expect(page.getByText(new RegExp(shortId(), 'i')).first()).toBeVisible();
    const r3 = await audit(page, 'admin /admin/orders/[id]', issues);
    expectClean('/admin/orders/[id]', r3, issues);
  });

  test('home page layout stability and LCP (local, unthrottled)', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      w.__cls = 0; w.__lcp = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { const es = l.getEntries(); w.__lcp = es[es.length - 1].startTime; })
        .observe({ type: 'largest-contentful-paint', buffered: true });
    });
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(2500); // let late shifts and the final LCP candidate land
    const m = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      return { cls: Number(w.__cls.toFixed(4)), lcp_ms: Math.round(w.__lcp) };
    });
    record(`e2e ${test.info().project.name} web_vitals_home`, m);
    expect(m.cls).toBeLessThan(0.1);
  });
});
