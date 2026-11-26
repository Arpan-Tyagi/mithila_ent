// Open-redirect guard for ?next= / formData "next" (SEC-04).
// Accepts only same-origin relative paths such as "/account/orders?x=1".
// Rejects absolute URLs, protocol-relative ("//evil"), backslash tricks ("/\evil"),
// control characters, and anything that resolves to another origin.
// Safe to import from both server and client code (no server-only APIs).

const DEFAULT_NEXT = '/account'
const BASE = 'https://same-origin.invalid'

export function safeNextPath(value: unknown, fallback: string = DEFAULT_NEXT): string {
  if (typeof value !== 'string') return fallback
  const v = value.trim()
  if (v.length === 0 || v.length > 2048) return fallback
  if (!v.startsWith('/')) return fallback
  if (v.startsWith('//') || v.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\u007f\\]/.test(v)) return fallback

  try {
    const url = new URL(v, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
