import { describe, expect, it } from 'vitest';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://proj.supabase.co';

import { jsonLd } from '@/lib/json-ld';
import { sniffImage, decodeImageDataUrl } from '@/lib/image-validation';
const { plainText, productImageUrl } = await import('@/lib/validation/common');
const { addressSchema, cartItemsSchema } = await import('@/lib/validation/customer');
const { stockAdjustmentSchema, productDraftSchema } = await import('@/lib/validation/admin');

const V = '0b6f8d3e-1c2a-4f5b-9a7e-2d4c6b8a0f11';

describe('jsonLd (SEC-10)', () => {
  it('cannot close the script element', () => {
    const out = jsonLd({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });
});

describe('plainText (SEC-10)', () => {
  it('strips tags and control characters and caps length', () => {
    expect(plainText(50).parse('  Indigo <img src=x onerror=alert(1)>linen\u0007 ')).toBe('Indigo linen');
    expect(plainText(5).safeParse('abcdef').success).toBe(false);
  });
});

describe('productImageUrl (SEC-11)', () => {
  it('accepts our bucket, /images paths and unsplash only', () => {
    expect(productImageUrl.safeParse('https://proj.supabase.co/storage/v1/object/public/product-images/a.jpg').success).toBe(true);
    expect(productImageUrl.safeParse('/images/fabrics/linen.png').success).toBe(true);
    expect(productImageUrl.safeParse('https://images.unsplash.com/photo-1').success).toBe(true);
    expect(productImageUrl.safeParse('https://other.supabase.co/storage/v1/object/public/product-images/a.jpg').success).toBe(false);
    expect(productImageUrl.safeParse('data:image/svg+xml;base64,PHN2Zz4=').success).toBe(false);
    expect(productImageUrl.safeParse('javascript:alert(1)').success).toBe(false);
    expect(productImageUrl.safeParse('/images/../../etc').success).toBe(false);
  });
});

describe('image sniffing (SEC-11)', () => {
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
  it('trusts the bytes, not the declared type', () => {
    expect(sniffImage(png)?.contentType).toBe('image/png');
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(sniffImage(svg)).toBeNull();
    expect(() => decodeImageDataUrl(`data:image/png;base64,${svg.toString('base64')}`)).toThrow(/Only JPEG/);
    expect(decodeImageDataUrl(`data:image/svg+xml;base64,${png.toString('base64')}`).image.contentType).toBe('image/png');
  });
});

describe('customer schemas (SEC-12)', () => {
  it('cart lines accept id or variant_id and are capped', () => {
    expect(cartItemsSchema.parse([{ id: V, quantity: 2.5, price: 1 }])).toEqual([{ variant_id: V, quantity: 2.5 }]);
    expect(cartItemsSchema.safeParse([]).success).toBe(false);
    expect(cartItemsSchema.safeParse([{ id: 'prod_1', quantity: 1 }]).success).toBe(false);
    expect(cartItemsSchema.safeParse(Array(51).fill({ id: V, quantity: 1 })).success).toBe(false);
  });
  it('address drops unknown keys and checks the PIN', () => {
    const a = addressSchema.parse({
      firstName: 'Asha', lastName: null, email: '', address1: '1 Road', address2: null,
      city: 'Patna', state: 'Bihar', pinCode: '800001', extra: 'x'.repeat(10000),
    });
    expect(a).not.toHaveProperty('extra');
    expect(addressSchema.safeParse({ ...a, pinCode: '012345' }).success).toBe(false);
  });
});

describe('admin schemas (SEC-08, SEC-12)', () => {
  it('stock adjustment must be a non-zero whole number in range', () => {
    expect(stockAdjustmentSchema.safeParse({ variantId: V, adjustment: 5 }).success).toBe(true);
    expect(stockAdjustmentSchema.safeParse({ variantId: V, adjustment: 0 }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ variantId: V, adjustment: 1.5 }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ variantId: V, adjustment: 1e9 }).success).toBe(false);
  });
  it('product draft text is stripped of markup', () => {
    const d = productDraftSchema.parse({
      title: 'Linen<script>x</script>', description: '<b>Soft</b>', weaveDensity: '', gsm: 150,
      width: '54in', stretch: '0%', origin: 'Bihar', bestSuitedFor: 'Shirts', pricePerMeter: 500,
      colors: ['Indigo'], categoryId: V,
    });
    expect(d.title).toBe('Linenx');
    expect(d.description).toBe('Soft');
  });
});
