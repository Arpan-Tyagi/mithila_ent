import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export default async function proxy(request: NextRequest) {
  // First, run the Supabase session update
  const response = await updateSession(request);

  // Then add the proxy logic (headers, GEO, etc.)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Cloudflare GEO logic
  const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'US';
  response.headers.set('x-user-country', country);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images/|patterns/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
