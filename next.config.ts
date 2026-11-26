import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// SEC-09: security headers for every path (pages and /api), a pinned image
// host, and a Content Security Policy rolled out in two parts:
//
// 1. Enforced now: the directives that cannot break a page or a third-party
//    tag (framing limited, no <base> hijack, no plugins, forms post only to us).
// 2. Report-only: the full allowlist (scripts, connections, frames, images).
//    Violations are sent to /api/csp-report and show in the Vercel logs.
//    Once the logs are clean for checkout, GTM tags and Sentry, rename the
//    header to Content-Security-Policy to enforce it.
//
// Scripts keep 'unsafe-inline': a nonce would force every page to render
// dynamically (Next.js CSP guide), which breaks the static/ISR performance
// budget. Inline-script XSS is handled at the sinks instead (src/lib/json-ld.ts).

const isDev = process.env.NODE_ENV === "development";

const PROD_SUPABASE_HOST = "nhmarliyovmucuqryceg.supabase.co";
function supabaseOrigin(): URL {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    if (u.hostname === "placeholder.supabase.co") throw new Error("placeholder");
    return u;
  } catch {
    return new URL(`https://${PROD_SUPABASE_HOST}`);
  }
}
const supabase = supabaseOrigin();
const supabaseHttp = supabase.origin;
const supabaseWs = `${supabase.protocol === "https:" ? "wss" : "ws"}://${supabase.host}`;

// Public pages may be framed by the agency portfolio (commit b9fef3c);
// signed-in and payment pages may not be framed by anyone.
const PUBLIC_FRAME_ANCESTORS = "frame-ancestors 'self' https://panarchdigital.com https://*.panarchdigital.com";
const PRIVATE_FRAME_ANCESTORS = "frame-ancestors 'none'";

const enforcedCsp = (frameAncestors: string) =>
  [
    "base-uri 'self'",
    "object-src 'none'",
    frameAncestors,
    "form-action 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

const reportOnlyCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHttp} https://images.unsplash.com https://*.razorpay.com https://*.google-analytics.com https://*.googletagmanager.com https://*.google.com https://*.doubleclick.net`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHttp} ${supabaseWs} https://api.razorpay.com https://lumberjack.razorpay.com https://*.sentry.io https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.googletagmanager.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  PUBLIC_FRAME_ANCESTORS,
  "form-action 'self'",
  "report-uri /api/csp-report",
  "report-to csp",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Razorpay opens UPI / net-banking windows as popups.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy", value: enforcedCsp(PUBLIC_FRAME_ANCESTORS) },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
  { key: "Reporting-Endpoints", value: 'csp="/api/csp-report"' },
];

// Later rules override earlier ones for the same header key.
const noFrameHeaders = [
  { key: "Content-Security-Policy", value: enforcedCsp(PRIVATE_FRAME_ANCESTORS) },
  { key: "X-Frame-Options", value: "DENY" },
];
const PRIVATE_SOURCES = [
  "/admin/:path*",
  "/admin",
  "/account/:path*",
  "/account",
  "/checkout/:path*",
  "/checkout",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        // Only this project's public storage, not every *.supabase.co tenant.
        protocol: supabase.protocol === "http:" ? "http" : "https",
        hostname: supabase.hostname,
        ...(supabase.port ? { port: supabase.port } : {}),
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    staticGenerationMaxConcurrency: 1,
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...PRIVATE_SOURCES.map((source) => ({ source, headers: noFrameHeaders })),
    ];
  },
};

// withBotId adds the two same-origin rewrites the BotID client script uses.
export default withBotId(nextConfig);
