import crypto from 'crypto';

const RP_BASE = 'https://api.razorpay.com/v1';

export function razorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createRazorpayOrder(amountPaise: number, receipt: string, notes?: Record<string, string>, customer_id?: string) {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  
  const payload: any = { amount: amountPaise, currency: 'INR', receipt, payment_capture: 1, notes: notes || {} };
  if (customer_id) {
    payload.customer_id = customer_id;
  }

  const res = await fetch(`${RP_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order create failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; amount: number; currency: string }>;
}

export async function getOrCreateRazorpayCustomer(name: string, email: string, contact?: string): Promise<string> {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  
  const res = await fetch(`${RP_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      name,
      email,
      contact,
      fail_existing: 0 // if it already exists, razorpay returns the existing one!
    }),
  });

  if (!res.ok) {
    throw new Error(`Razorpay customer create failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.id;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Verifies the checkout callback signature: HMAC_SHA256(order_id|payment_id, key_secret).
// Fails closed: with no secret configured, nothing verifies (an empty-key HMAC
// is computable by anyone).
export function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error('verifyPaymentSignature: RAZORPAY_KEY_SECRET is not set; rejecting');
    return false;
  }
  if (typeof signature !== 'string' || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

// Verifies a Razorpay webhook: HMAC_SHA256(rawBody, webhook_secret). Fails closed.
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('verifyWebhookSignature: RAZORPAY_WEBHOOK_SECRET is not set; rejecting');
    return false;
  }
  if (typeof signature !== 'string' || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number; // paise
  currency: string;
  status: string; // created | authorized | captured | refunded | failed
  method: string | null;
}

// Fetches a payment from Razorpay so amount/status/order come from the gateway,
// not from the browser or our own DB.
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new Error('Invalid payment id');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay not configured');
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch(`${RP_BASE}/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Razorpay payment fetch failed: ${res.status}`);
  const p = await res.json();
  return {
    id: String(p.id),
    order_id: p.order_id ?? null,
    amount: Number(p.amount),
    currency: String(p.currency),
    status: String(p.status),
    method: p.method ?? null,
  };
}
