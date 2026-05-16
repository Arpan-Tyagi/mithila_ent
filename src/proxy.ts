import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Basic security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Cloudflare GEO logic
  // For Vercel, x-vercel-ip-country is used, for Cloudflare it's cf-ipcountry
  const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'US';
  
  // Set a custom header or cookie for the frontend to adjust currency
  response.headers.set('x-user-country', country);

  // Here we would integrate Upstash Redis for rate limiting in production

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
