import { NextResponse } from 'next/server';
import { checkApiRateLimit, clientIp } from '@/lib/ratelimit';

// Receives Content-Security-Policy-Report-Only violations (next.config.ts).
// Logs only the directive and the blocked origin: no full URLs, query strings
// or page paths with ids, so nothing personal ends up in the logs.

const MAX_BODY = 16 * 1024;

function origin(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  if (['inline', 'eval', 'data', 'blob', 'self'].includes(value)) return value;
  try {
    return new URL(value).origin;
  } catch {
    return value.slice(0, 40);
  }
}

function summarise(r: Record<string, unknown>) {
  return {
    directive: String(r['effective-directive'] ?? r['effectiveDirective'] ?? r['violated-directive'] ?? '').slice(0, 60),
    blocked: origin(r['blocked-uri'] ?? r['blockedURL']),
    page: (() => {
      try {
        return new URL(String(r['document-uri'] ?? r['documentURL'] ?? '')).pathname.split('/').slice(0, 2).join('/') || '/';
      } catch {
        return '';
      }
    })(),
  };
}

export async function POST(req: Request) {
  if (!(await checkApiRateLimit(`csp-report:${clientIp(req)}`))) {
    return new NextResponse(null, { status: 204 });
  }
  const text = await req.text();
  if (text.length > MAX_BODY) return new NextResponse(null, { status: 204 });
  try {
    const body = JSON.parse(text);
    // report-uri sends { "csp-report": {...} }; report-to sends [{ type, body }].
    const reports: Record<string, unknown>[] = Array.isArray(body)
      ? body.filter((x) => x?.type === 'csp-violation').map((x) => x.body ?? {})
      : body?.['csp-report']
        ? [body['csp-report']]
        : [];
    for (const r of reports.slice(0, 10)) {
      console.warn('csp-report', JSON.stringify(summarise(r)));
    }
  } catch {
    // ignore malformed reports
  }
  return new NextResponse(null, { status: 204 });
}
