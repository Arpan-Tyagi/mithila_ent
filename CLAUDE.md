@AGENTS.md

# CLAUDE.md — Luxury Fabric E-Commerce & Dual-Dashboard CRM Engineering Standard

## Architecture & Domain Identity

- **Stack:** Next.js (App Router, latest patched release of the active major line, e.g. 16.4+ or patched 15.x/14.x), TypeScript (strict), Tailwind CSS, Supabase (PostgreSQL + Auth + Storage via `@supabase/ssr`), Razorpay, Shiprocket/Delhivery, WhatsApp Cloud API + TRAI DLT SMS, Resend/Postmark.
- **Domain:** Premium D2C & B2B fabric e-commerce featuring fractional meterage (`0.5m` increments), single-bolt continuous yardage, roll/dye-lot/shade continuity, remnant lifecycle tracking, and a swatch-recovery credit ledger.
- **Dual Command Surfaces:**
  1. **Customer Dashboard** — profile with unique human-readable User ID, orders, live tracking, cut-boundary cancellations, GST PDF invoices, swatch credit, DPDP privacy controls.
  2. **Owner CRM Dashboard** — roll inventory, catalog CMS with soft-archiving, orders/refunds, GST & net revenue analytics, coupons, unified Contact Us + Meta Lead Ads + Google Ads Lead CRM.
- **Performance Budget:** Preserve sub-second mobile performance (`<0.8s` mobile LCP, `0ms` TBT, `0.00` CLS, WCAG 2.1/2.2 AA compliance). Never fix a security bug by introducing bloated client bundles or N+1 queries.

## Non-Negotiable Security Invariants

1. **Zero Middleware-Only Auth:** Proxy/Middleware is routing only. Every Server Component, Server Action, and Route Handler MUST authenticate and authorize via an `import 'server-only'` Data Access Layer (`src/lib/dal/`) returning minimal DTOs.
2. **PostgreSQL RLS & Minimal Grants:** Every table in `public` MUST enable RLS, explicitly `REVOKE ALL` (including `TRUNCATE`) from `anon` and `authenticated`, wrap `auth.uid()` in `(select auth.uid())`, use `WITH (security_invoker = on)` on views, pin `SET search_path = ''` on `SECURITY DEFINER` functions, and derive admin roles strictly via `custom_access_token_hook` + `public.user_roles` (NEVER `user_metadata`).
3. **Atomic Money & Inventory Paths:** All coupon redemptions, bolt meterage deductions, swatch credits, and refund requests MUST execute atomically inside PostgreSQL (`SELECT ... FOR UPDATE` or conditional `UPDATE ... WHERE`) with DB-level `UNIQUE` idempotency keys.
4. **Raw-Body Webhook Verification:** Razorpay (`X-Razorpay-Signature`) and Meta (`X-Hub-Signature-256`) webhooks MUST verify HMAC-SHA256 over the raw unparsed request body in constant time, respond `200` within 5 seconds, and process asynchronously.
5. **Indian Statutory Compliance:** Enforce GST 2.0 (flat 5% fabrics Ch. 50–60; 5%/18% cliff at ₹2,500 for stitched garments Ch. 61–62), CGST Rule 46 mandatory tax invoice fields, Section 34 credit notes, TRAI DLT typed variable tags (`{#numeric#}`, `{#alphanumeric#}`, `#url#`), and DPDP Rules 2025 unbundled consent & erasure readiness.

## Audit & Verification Rule

- **Evidence-First:** Never mark any requirement `PASS` without citing exact `file:line`, SQL policy, or passing test execution output. Do not modify `.env*` or run destructive tests against production URLs.
