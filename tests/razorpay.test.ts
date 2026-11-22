import crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyPaymentSignature, verifyWebhookSignature } from '@/lib/razorpay';
import { secretMatches } from '@/lib/secure-compare';

const hmac = (key: string, msg: string) => crypto.createHmac('sha256', key).update(msg).digest('hex');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Razorpay signatures fail closed', () => {
  it('rejects a checkout signature forged with an empty key when RAZORPAY_KEY_SECRET is unset', () => {
    vi.stubEnv('RAZORPAY_KEY_SECRET', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const forged = hmac('', 'order_X|pay_Y');
    expect(verifyPaymentSignature('order_X', 'pay_Y', forged)).toBe(false);
  });

  it('rejects a webhook forged with an empty key when RAZORPAY_WEBHOOK_SECRET is unset', () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const body = '{"event":"payment.captured"}';
    expect(verifyWebhookSignature(body, hmac('', body))).toBe(false);
  });

  it('accepts a correct checkout signature and rejects a tampered one', () => {
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test_secret');
    const sig = hmac('test_secret', 'order_X|pay_Y');
    expect(verifyPaymentSignature('order_X', 'pay_Y', sig)).toBe(true);
    expect(verifyPaymentSignature('order_X', 'pay_Z', sig)).toBe(false);
    expect(verifyPaymentSignature('order_X', 'pay_Y', '')).toBe(false);
  });

  it('accepts a correct webhook signature over the raw body only', () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'wh_secret');
    const body = '{"a":1}';
    expect(verifyWebhookSignature(body, hmac('wh_secret', body))).toBe(true);
    expect(verifyWebhookSignature('{"a": 1}', hmac('wh_secret', body))).toBe(false);
  });
});

describe('secretMatches', () => {
  it('fails closed on missing expected or provided secret', () => {
    expect(secretMatches(undefined, 'x')).toBe(false);
    expect(secretMatches('', '')).toBe(false);
    expect(secretMatches('abc', null)).toBe(false);
  });
  it('matches only the exact secret', () => {
    expect(secretMatches('abc', 'abc')).toBe(true);
    expect(secretMatches('abc', 'abcd')).toBe(false);
  });
});
