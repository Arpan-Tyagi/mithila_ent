// Input handling for the public lead forms (contact, wholesale). SEC-06.
// Every value is length-capped, control characters are removed, and anything
// placed in an HTML e-mail goes through escapeHtml().

// Same limits as the CHECK constraints in migration 0046.
export const LIMITS = {
  name: 100,
  email: 254,
  location: 200,
  message: 5000,
  businessName: 200,
  taxId: 20,
  phone: 20,
  category: 100,
} as const;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

/** Trimmed string with control characters removed (newlines kept only when allowed). */
export function cleanText(value: unknown, max: number, multiline = false): string | null {
  if (typeof value !== 'string') return null;
  const stripped = multiline
    ? value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    : value.replace(/[\u0000-\u001F\u007F]/g, ' ');
  const v = stripped.trim();
  if (v.length === 0 || v.length > max) return null;
  return v;
}

export function cleanEmail(value: unknown): string | null {
  const v = cleanText(value, LIMITS.email);
  return v && EMAIL_RE.test(v) ? v.toLowerCase() : null;
}

/** Optional field: empty → undefined, present but invalid → null. */
export function optionalText(value: unknown, max: number): string | undefined | null {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  return cleanText(value, max);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
