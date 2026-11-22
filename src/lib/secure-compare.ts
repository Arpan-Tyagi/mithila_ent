import crypto from 'crypto';

// Constant-time check of a presented shared secret against the configured one.
// Fails closed when the expected secret is unset/empty. Both sides are hashed
// first so the comparison length (and timing) does not depend on the input.
export function secretMatches(expected: string | undefined, provided: string | null | undefined): boolean {
  if (!expected || !provided) return false;
  const a = crypto.createHash('sha256').update(expected).digest();
  const b = crypto.createHash('sha256').update(provided).digest();
  return crypto.timingSafeEqual(a, b);
}
