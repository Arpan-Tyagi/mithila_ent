import { z } from 'zod';

// Shared Zod building blocks for Server Actions and Route Handlers (SEC-12).

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const TAGS = /<[^>]*>/g;

/**
 * Plain text: trims, removes control characters and anything that looks like
 * an HTML tag, then enforces a length cap. Used for every catalogue field an
 * admin can save, including text drafted by the Gemini extractor (SEC-10:
 * model output is untrusted).
 */
export function plainText(max: number, { min = 0 }: { min?: number } = {}) {
  return z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, '').replace(TAGS, '').replace(/[<>]/g, '').trim())
    .pipe(z.string().min(min).max(max));
}

// z.guid(): any 8-4-4-4-12 hex id (Postgres uuids, including test fixtures).
export const uuid = z.guid();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const STORAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;

/**
 * Product image URL. Only our own storage bucket, site-relative /images/
 * paths, or images.unsplash.com (the same allowlist next/image uses). No data:
 * URLs, no other hosts (SEC-11).
 */
export const productImageUrl = z
  .string()
  .max(2048)
  .refine((u) => {
    if (/^\/images\/[A-Za-z0-9._\-/]+$/.test(u) && !u.includes('..')) return true;
    if (SUPABASE_URL && u.startsWith(STORAGE_PREFIX) && !u.includes('..')) return true;
    try {
      const url = new URL(u);
      return url.protocol === 'https:' && url.hostname === 'images.unsplash.com';
    } catch {
      return false;
    }
  }, 'Image must be uploaded to the product image store');

/** Throws a short error naming the first bad field (never the value). */
export function parseOrThrow<T extends z.ZodType>(schema: T, value: unknown, message = 'Invalid input'): z.output<T> {
  const r = schema.safeParse(value);
  if (!r.success) {
    const first = r.error.issues[0];
    const field = first?.path.length ? first.path.join('.') : '';
    console.error('validation failed:', r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    throw new Error(field ? `${message}: ${field}` : message);
  }
  return r.data;
}
