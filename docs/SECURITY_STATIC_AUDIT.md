# Static Security Audit: OWASP Top 10:2025, ASVS 5.0 and Supply Chain (Runbook Step 2)

> **Do not commit this file while the findings below are open.** `Arpan-Tyagi/mithila_ent` is a
> public repository, and this document describes exploitable weaknesses in the live site.

| | |
|---|---|
| Date | 2026-11-22 |
| Code reviewed | `main` at `8816e5b` (= `origin/master`) plus the live Supabase project `nhmarliyovmucuqryceg` (read-only queries, and two rollback-only proofs) |
| Scope | Next.js App Router app (`src/`), `next.config.ts`, `vercel.json`, Supabase migrations and live grants/policies, npm dependency tree, git history (all refs, 139 commits), CI workflow |
| Out of scope (later steps) | Full RLS/pgTAP matrix (Step 3), GST/DLT/payments end-to-end tests (Step 4), dashboard-only Vercel/Supabase settings |

## How to read this report

- **Severity** is the exploitability-based priority from the project's `owasp-security` skill:
  - **Critical**: unauthenticated RCE, auth bypass or mass data exposure.
  - **High**: exploitation that crosses a trust boundary.
  - **Medium**: needs unusual preconditions, or has limited impact.
  - **Low**: a defense-in-depth gap with no demonstrated exploit path.
- **CVSS 4.0.** Each finding below carries an exact CVSS 4.0 base vector. The numeric scores are **Unscored**. Running a CVSS calculator in this session was blocked, so no number was computed and none is estimated. Paste a vector into <https://www.first.org/cvss/calculator/4.0> to score it.
- **Verifier quorum.** Three lenses are applied to every candidate:
  - **R**: reachable from a real entry point.
  - **I**: impact confirmed.
  - **D**: no existing defense stops it.

  `3/3` means all three are backed by the cited evidence. One reviewer applied the lenses; this was not a multi-agent vote.
- **Evidence-first.** Every verdict cites one of these:
  - `file:line`,
  - a live SQL result,
  - command output.

  Where impact rests on vendor advisories or provider behavior that was not reproduced, the finding says so.

## Findings

| Finding ID | Severity | OWASP 2025 / ASVS 5.0 ID | Verifier Quorum | File:Line | Attack Scenario | Exact Patch Summary |
|---|---|---|---|---|---|---|
| SEC-01 | High | A03:2025 Software Supply Chain Failures; A06; ASVS 15.2.1 | 3/3 (I from vendor advisory, not reproduced) | `package.json:35` (`"next": "16.2.6"`); `.next/server/server-reference-manifest.json` (≈40 action IDs) | Unauthenticated, crafted Server Action requests burn CPU and block the process (CVE-2026-64641, CVE-2026-94482). The app has App Router + Server Actions, which are the advisories' preconditions. npm audit lists 25 Next.js advisories against 16.2.6 in all (see "Framework CVE hygiene"). | `npm i next@16.4.6 eslint-config-next@16.4.6` (npm audit's non-major fix; any later 16.4.x patch also works), then `npm run build && npm test`. |
| SEC-02 | High | A07:2025 Authentication Failures; A01; ASVS 6.3.1, 8.3.1 | 3/3 (live rollback proof) | Live: `auth_attempt_record_failure(p_email,p_max,p_lock_minutes)`, `auth_attempt_clear`, `auth_attempt_is_locked` are EXECUTE for `anon` and `search_path=public`; `src/actions/auth.ts:23-26,34,47` | With only the public anon key, one RPC call locks any account out of password login for as long as the attacker wants, because the caller supplies `p_max` and `p_lock_minutes` (the proof locked an address for 365 days with `p_max = 1`). The owner's login e-mail is published in this public repo (`supabase/migrations/0023_owner_admin.sql:1`, `docs/deployment.md:62`). `auth_attempt_clear` is also anon-callable, so the lockout is trivially reset by a brute-forcer. The lockout can be skipped entirely by calling Supabase's `/auth/v1/token` endpoint directly. | Migration: `REVOKE ALL ON FUNCTION auth_attempt_* FROM PUBLIC, anon, authenticated; GRANT EXECUTE … TO service_role`. Drop the `p_max`/`p_lock_minutes` parameters (hard-code 5 / 15 min). Set `search_path=''`. Call the RPCs from `login` via `createAdminClient()`. Enable Supabase Auth CAPTCHA and rate limits as the real brute-force control. Remove the owner e-mail from tracked docs and migrations; history keeps it, so treat it as public. |
| SEC-03 | High | A06:2025 Insecure Design; A10; ASVS 2.4.1, 2.3.2 | 3/3 (live rollback proof) | `src/actions/orders.ts:116-124` (any signed-in user; no per-user cap); `vercel.json:2-4` (only `process-emails` is scheduled); live `cancel_expired_pending_orders()` body vs `order_events` columns | A free account places unpaid orders for the whole stock. `create_order_atomic` decrements stock when the order is placed (`supabase/migrations/0040_server_only_order_pricing.sql:166`). Nothing ever releases it: `/api/cron/timeouts` is not scheduled, `pg_cron` is not installed, and `cancel_expired_pending_orders()` (`supabase/migrations/0029_domain_model_updates.sql:47`, 1-hour hold at `:60`) would abort anyway. It inserts `order_events(status, description)`; the live columns are `event, note, from_status, to_status`, and the proof returned `42703 column "status" … does not exist`. The storefront goes out of stock for every real buyer until an admin cancels each order by hand. | Fix the INSERT to `(order_id, event, note, from_status, to_status)`, add `SET search_path=''`, and use `FOR UPDATE SKIP LOCKED`. Schedule it with `pg_cron` every 10 min, so it is independent of the Vercel plan. In `create_order_atomic`, cap open unpaid orders per user (e.g. ≤2) and total reserved quantity. Rate-limit `createOrder` per user. Shorten the hold to 15-30 min. |
| SEC-04 | Medium | A01:2025 Broken Access Control (open redirect); ASVS 3.7.2 | 3/3 (not executed) | `src/app/login/page.tsx:16,29`; `src/actions/auth.ts:15,60,69,128,152`; `src/actions/auth.ts:100,157` (unencoded `next`); `src/app/api/auth/callback/route.ts:7,13`; `src/components/AuthCallbackCatcher.tsx:13-16` | Victim opens `/login?next=https://evil.example`, then logs in for real. `redirect(nextPath)` sends them off-site, because Next's `redirect()` "accepts absolute URLs" (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md:54`). Next is the classic "session expired, re-enter password" phishing page. The callback builds `${origin}${next}`, so `next=.evil.example` or `next=@evil.example` becomes an attacker host after Google/OAuth sign-in. | Add `safeNextPath(v)`: accept only `/`-prefixed paths that are not `//` or `/\`, then `new URL(v, origin)` with `url.origin === origin`, else `/account`. Apply it in all five places. Use `encodeURIComponent(next)` when building callback URLs. |
| SEC-05 | Medium | A05:2025 Injection (query-parameter injection); A04/A06 pricing; ASVS 1.2.2, 2.2.1 | 2/3 (provider behavior not tested) | `src/lib/shipping.ts:37`; `src/actions/orders.ts:104-108,121`; `src/app/api/shipping/calculate/route.ts:5-13,57-63,78` | A signed-in buyer sets `pinCode` to `110001&weight=0.1&cod=0#`. The `#` drops the server's real `&weight=` from the request, so Shiprocket quotes 0.1 kg and the order is charged that rate. `/api/shipping/calculate` is unauthenticated and unthrottled, and each call spends a Shiprocket API call. Any quote failure silently falls back to a flat ₹50 (`shipping.ts:35,46,57`), so exhausting the Shiprocket quota under-charges every order. | Validate `/^[1-9][0-9]{5}$/` before quoting, in `createOrder`, the route, and `create_order_atomic` for `p_shipping->>'pinCode'`. Build the URL with `URLSearchParams`. Require a session plus `checkApiRateLimit` on `/api/shipping/calculate`. On quote failure, block checkout or use a weight-band table instead of ₹50. Return generic errors (`calculate/route.ts:78`). |
| SEC-06 | Medium | A05:2025 Injection (HTML in e-mail); A06 (no anti-automation); ASVS 1.2.1, 2.4.1, 6.3.1 | 3/3 | `src/app/api/contact/route.ts:11-17,40-56,63-66`; `src/app/api/wholesale/route.ts:11-17,39-57,63-66`; live policies `Anyone can insert …` `WITH CHECK (true)`; live grants | Anyone, unauthenticated and with no rate limit or CAPTCHA, posts forms whose raw values are interpolated into HTML e-mails to the owner. The result is phishing links and forms rendered from the store's own sender, plus e-mail and WhatsApp flooding. The same tables accept unlimited-length rows straight through PostgREST with the anon key, with no length limits, bypassing the route entirely. Live grants also give `anon`/`authenticated` `TRUNCATE`, `UPDATE`, `DELETE` and `SELECT` on both tables, breaking invariant 2. | Use Zod schemas with max lengths and an e-mail format check. Escape all values, or send plain-text e-mail. Add `checkApiRateLimit` + Turnstile/hCaptcha. Migration: `REVOKE ALL … FROM anon, authenticated`. Either drop the anon INSERT policy (insert server-side with the service role) or keep INSERT only and add `CHECK (char_length(message) <= 5000 …)`. |
| SEC-07 | Medium | A08:2025 Software or Data Integrity Failures; A10; ASVS 2.3.3, 16.5.2 | 2/3 (race not reproduced) | Live `payments` has only a non-unique `idx_payments_provider_payment_id`; `supabase/migrations/0032_strict_payment_verification.sql:15,21,31-51`; `src/app/api/webhooks/razorpay/route.ts:30-41,44`; `src/app/api/payment/razorpay/webhook/route.ts:46,53`; `src/app/api/webhooks/payment/route.ts:15-19,42-51` | Every successful payment hits `record_payment` twice, from `/verify` and from the webhook. The idempotency is SELECT-then-INSERT, with no `UNIQUE` and no row lock, so concurrent calls can insert duplicate captured rows. Revenue is double-counted, and invariant 3 is broken. `/api/webhooks/razorpay` ignores the RPC error and returns 200, so Razorpay never retries and a captured payment can be lost. `record_payment` sets `is_paid=true` on an already-cancelled order without flagging a refund. A third endpoint, `/api/webhooks/payment`, marks any order paid for any amount given a static header secret: no HMAC, no replay protection. | Migration: `CREATE UNIQUE INDEX … ON payments(provider, provider_payment_id, status) WHERE provider_payment_id IS NOT NULL`. Then use `INSERT … ON CONFLICT DO NOTHING`, `SELECT … FROM orders … FOR UPDATE`, and `search_path=''`. On a cancelled order, record `payment.captured_after_cancel` and queue a refund. In webhooks, check `error` and return 5xx, and check `entity.order_id === orders.razorpay_order_id`. Keep one Razorpay webhook route with an event-id dedupe table. Delete `/api/webhooks/payment` if it is unused. |
| SEC-08 | Medium | A06:2025 Insecure Design; A10; ASVS 2.3.3, 16.5.3 | 3/3 (admin-triggered) | `src/actions/admin.ts:107-120`; `src/actions/orders.ts:283-295,299-304,261-264` | Three admin paths are broken:<br>- `adjustInventory` is read-modify-write. An admin "+5" racing with a customer order overwrites the order's decrement, which oversells.<br>- `partialCancelOrderItem` restocks non-atomically, so a double-click restocks twice, and it never checks `item.order_id = orderId`. It selects `orders.total_discount` and reads `item.price`; the live columns are `discount_applied` and `unit_price`, so the select errors and the refund, totals and event step is **silently skipped**. The item is cancelled and restocked, but the customer's total and the Section 34 credit-note trail never change.<br>- `cancelOrder(restock=false)` writes `order_events(status, description)`, which always fails, unchecked. | Replace them with RPCs:<br>- `adjust_stock(variant, delta)` as one `UPDATE … SET stock_quantity = GREATEST(0, stock_quantity + delta) RETURNING`.<br>- `cancel_order_item(order, item, restock, idempotency_key)`. It locks the order and item `FOR UPDATE`, checks ownership and status, uses `unit_price`/`discount_applied`, writes `order_events(event, note, …)`, and is UNIQUE on the key.<br>Also check every Supabase `error`. |
| SEC-09 | Low | A02:2025 Security Misconfiguration; ASVS 3.4.3, 3.4.6, 3.3.4 | 2/3 (SameSite=Lax blocks cross-site authenticated framing) | `next.config.ts:29-40` and `vercel.json:5-14` (both blank `X-Frame-Options`); no CSP anywhere; `src/proxy.ts:14-17,27-29`; `node_modules/@supabase/ssr/dist/main/utils/constants.js:6-7`; `next.config.ts:16` | Four configuration gaps:<br>- Pages, including `/admin/customers` with one-click "Make Admin" forms, can be framed. Same-site framing is clickjackable.<br>- With no CSP, any XSS (see SEC-10) runs freely. Supabase session cookies are `httpOnly:false`, so XSS means session theft.<br>- `/api/*` gets no HSTS or `nosniff` from the proxy.<br>- `images.remotePatterns` allows **every** `*.supabase.co` tenant through the site's image optimizer. | Delete both blank XFO entries. Add CSP with `frame-ancestors 'none'` and nonce-based `script-src` (via `src/proxy.ts`). Emit security headers for all paths via `next.config.ts headers()`. Pin `hostname` to `nhmarliyovmucuqryceg.supabase.co`. |
| SEC-10 | Low | A05:2025 Injection (stored XSS); LLM10 Improper Output Handling; LLM01 Prompt Injection; ASVS 1.2.3 | 2/3 (requires an admin to save content) | `src/app/product/[slug]/page.tsx:59-63,85`; `src/app/api/extract-fabric/route.ts:65-83` | `JSON.stringify()` does not escape `<`. A product `title`/`description` containing `</script><script>…` breaks out of the JSON-LD block on the public product page. That text can arrive via Gemini: a supplier's swatch photo carries injected text, the model copies it into `description`, and the admin saves the draft. | `JSON.stringify(ld).replace(/</g,'\\u003c')` at `page.tsx:85`, and the same in `StructuredData.tsx:31-32`. Treat model output as untrusted: length-limit and strip markup before `createProduct`/`updateProduct`. |
| SEC-11 | Low | A05:2025 / ASVS 5.2.1, 5.2.2 (file handling) | 2/3 (admin-only) | `src/actions/admin.ts:437-447,73`; live bucket `product-images`: public, `allowed_mime_types` = any, `file_size_limit` = none | `uploadProductImage` trusts the client-declared MIME, accepts `image/svg+xml`, and checks no magic bytes. The SVG is served from the public storage origin. `createProduct` stores whatever `imagePreview` string it is given, including multi-MB `data:` URLs. Storage writes are admin-only (`product-images admin write` = `is_admin()`), which limits who can trigger it. | Allowlist jpeg, png, webp and avif, and drop SVG. Verify magic bytes. Set `allowed_mime_types` and `file_size_limit` (e.g. 5 MB) on the bucket via migration. Accept only project-storage URLs in `images`. |
| SEC-12 | Low (invariant non-compliance) | A01:2025; ASVS 8.3.1, 2.2.1, 15.1.x | n/a (architecture; RLS verified to enforce) | No `src/lib/dal/`; `server-only` and `zod` absent from `package.json`; `src/lib/supabase/admin.ts:1-5`; `src/app/admin/inventory/page.tsx:4-19`; client admin pages `categories`, `collections`, `products`, `products/new`, `promotions` write via the browser client | CLAUDE.md invariant 1 is unmet. Authorization is copy-pasted per action, with no `server-only` DAL and no schema validation. The `any` inputs include `createOrder(cartItems:any[], shippingAddress:any)`, `addSavedAddress(any)` and `syncCartVariants` (unbounded array). Six admin pages rely on the proxy plus RLS alone. Today this is not exploitable: the live policies use `is_admin()` or a profiles-role check, and every server action re-checks the role. But one missed check equals an authorization bug. | `npm i server-only zod`. Add `src/lib/dal/{session,admin}.ts` (`import 'server-only'`; `requireUser()`/`requireAdmin()` returning DTOs). Add Zod to every action and route. Put `import 'server-only'` in `supabase/admin.ts`. Put guarded admin routes in a route group whose server `layout.tsx` calls `requireAdmin()`, keeping `/admin/login` outside it. |
| SEC-13 | Low | A07:2025 / A01; ASVS 8.2.1 | 1/3 (needs the owner auth row to be absent) | Live trigger `on_auth_user_created` AFTER INSERT → `handle_new_user()` (`search_path=public`); `supabase/migrations/0023_owner_admin.sql:17-32` | Admin is granted at sign-up time by matching a hard-coded e-mail, before the address is confirmed. If the owner's auth user is ever deleted or re-created, whoever signs up first with that public e-mail becomes admin. That works only if "Confirm email" is off, which is not inspected. This also breaks invariant 2 (`user_roles` + `custom_access_token_hook`). | Remove the e-mail CASE from `handle_new_user`. Create `public.user_roles` + `custom_access_token_hook` (Step 3), seeding the owner by user id. Set `search_path=''`. |
| SEC-14 | Low | A03:2025 Software Supply Chain Failures; ASVS 15.2.1 | 1/3 (reachability not established) | `npm audit --omit=dev`: 34 advisories (2 critical, 10 high, 21 moderate, 1 low); `.github/workflows/main.yml:13,15` | Transitive packages have fixes available: `axios` (via `razorpay`), `follow-redirects`, `fast-uri`, `brace-expansion`, `nanoid`, `source-map-js`, `postcss`/`sharp` (via next), and OpenTelemetry (via Sentry). No app path feeding them attacker input was found. `@ducanh2912/next-pwa` pulls a build-time `serialize-javascript`/`workbox` chain. Actions are pinned to tags, not SHAs. | `npm audit fix` (non-breaking). `@sentry/nextjs@^10.75.2`. Plan a replacement for `next-pwa` (e.g. Serwist). Pin actions to commit SHAs. Add `npm audit --omit=dev --audit-level=high` to CI. |
| SEC-15 | Low | A07:2025 Authentication Failures (CWE-798 hard-coded credentials); ASVS 13.3.1 | 1/3 (account absent on the live project; admin promotion blocked since 0039) | `scripts/seed.mjs:97-99,108-110,116` | The seed script, public at HEAD, hard-codes a gmail.com e-mail and a weak 8-character password. It signs that account up through the public anon API, signs in, then sets its own `profiles.role` to `admin`. Anyone who reads the repo can sign in as that account on any project the script has been run against. Before migration 0039, the account would also have been an admin. Today the role update has no effect: since 0039, `authenticated` cannot write `profiles.role` (live-verified, see Phase 2.2; also covered by `tests/integration/rls.test.ts:88-92`). The account does not exist on `nhmarliyovmucuqryceg` (read-only lookup by e-mail hash: 0 of 3 users). | Delete the sign-up, sign-in and role-update block (`:96-117`). Seed catalog data only, with the service-role key from the environment, against a local or branch database. Make the script exit when `NEXT_PUBLIC_SUPABASE_URL` contains the production project ref. Treat the password as public and never reuse it. |

## Fix status (2026-11-22)

The table above describes the code as audited (`8816e5b`). The three Highs were then fixed in the working tree. The database parts are applied live; the app parts are **not deployed yet** (nothing committed at the time of writing).

| ID | Status | What changed | Evidence |
|---|---|---|---|
| SEC-01 | Fixed in code, not deployed | `package.json:35` `"next": "16.4.6"`, `:50` `"eslint-config-next": "16.4.6"` | `npm audit --omit=dev` lists **0** Next.js advisories (was 25). `npx tsc --noEmit` exit 0; `npm run lint` clean; `npm run build` exit 0 on 16.4.6. `vitest`: 3 files pass, 2 skipped (integration, no test DB), 1 fails: `tests/password.test.ts` expects a 12-character minimum while `src/lib/password.ts` enforces 8. Neither file was touched (last change `5632b1a`), so the failure predates this fix and is unrelated. |
| SEC-02 | Fixed live (DB); app change not deployed | `supabase/migrations/0042_server_only_login_lockout.sql`: `REVOKE ALL` on `auth_attempts` (`:21`); locks longer than 15 min shortened (`:24-26`); 3-arg function dropped (`:28`); new 1-arg `auth_attempt_record_failure` with fixed 5 failures / 15 min / 15 min lock, `FOR UPDATE`, no extension of an active lock (`:30-85`); all three functions `search_path=''` and EXECUTE for `service_role` only (`:112-117`). `src/actions/auth.ts:26,27,38,51` call them with `createAdminClient()`. | Rollback-only live proof: `anon_record=denied old_3arg=gone anon_islocked=denied anon_clear=denied anon_table=denied auth_record=denied auth_table=denied`; 4th failure `locked:false`, 5th `locked:true, justLocked:true`, 6th `justLocked:false` (not extended), `lock_minutes=15`, after expiry count resets to 1, after clear `locked=false`; `long_locks_left=0`. |
| SEC-03 | Fixed live (DB); app change not deployed | `supabase/migrations/0043_release_unpaid_order_stock.sql`: `cancel_expired_pending_orders()` rewritten (`:27`) for unpaid `pending` orders older than 1 h (`:42`), `FOR UPDATE SKIP LOCKED` (`:45`), restocks pending lines, cancels lines and order, returns coupon uses, logs `order.payment_timeout` with the real `order_events` columns (`:78`), `service_role` only (`:89`); `pg_cron` job every 10 min (`:95`). `create_order_atomic` (`:103`) takes a per-user advisory lock (`:161`) and refuses a 4th open unpaid order (`TOO_MANY_PENDING_ORDERS`, `:179`) and new orders after 5 payment timeouts in 24 h (`TOO_MANY_UNPAID_ORDERS`, `:186-189`). `src/actions/orders.ts:79` adds a per-user `checkApiRateLimit`; `:159-163` map the new errors to buyer-facing messages. | Rollback-only live proof (throwaway product + variant, stock 10): `stock_after_3_orders=4 4th_order=TOO_MANY_PENDING_ORDERS retry_k1_same=true`; `cleanup1=3 stock_after_cleanup=10 items_cancelled=3 timeout_events=3 status_change_events=3`; a paid order is left alone (`paid_order_status=pending stock=8`); `after_5_lapsed=TOO_MANY_UNPAID_ORDERS`; `anon_cleanup=denied anon_create=denied`; `cron_jobs_active=1`; all five functions `search_path=""`. |


### Fix status (2026-11-26)

Migrations 0046 and 0047 were applied to `nhmarliyovmucuqryceg` on 2026-11-26 (versions `20261126133358`, `20261126133422`). The app changes below are committed with them; they are live only once deployed.

| ID | Status | What changed | Evidence |
|---|---|---|---|
| SEC-04 | Fixed in code | New `src/lib/safe-next.ts:10` `safeNextPath()` accepts only same-origin relative paths (rejects `//host`, `/\host`, absolute URLs, control characters; falls back to `/account`). Used at `src/actions/auth.ts:17,74,157`, `src/app/login/page.tsx:17`, `src/app/signup/page.tsx:18`, `src/app/api/auth/callback/route.ts:10` (redirect built with `new URL(next, origin)`) and `src/components/AuthCallbackCatcher.tsx:14` (query built with `URLSearchParams`). Callback URLs use `encodeURIComponent(nextPath)`. | Node check: `/account/orders?x=1#a` kept; `//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:alert(1)`, `/<TAB>evil`, `null`, `""` all return `/account`; `/a/../../x` normalises to `/x`. `tsc`, `eslint`, `next build` exit 0. |
| SEC-05 | Fixed (code + live DB) | `src/lib/shipping.ts:33-36` `isValidPinCode` (`^[1-9][0-9]{5}$`); `:65` courier query built with `URLSearchParams`; `:46` weight-band fallback replaces the flat ₹50 (₹80 first 0.5 kg + ₹40 per further 0.5 kg; **placeholder rates, owner to set**). `src/actions/orders.ts:99` rejects a bad PIN before quoting. `src/app/api/shipping/calculate/route.ts:14,18,30,94`: session required, per-user rate limit, PIN validated, generic 500. DB: `0046:389-393` `orders_shipping_pincode_format` CHECK (NOT VALID, new rows). | pgTAP `09_definer_functions_test.sql`: `orders reject a malformed pinCode` (`110001&weight=0.1#` → 23514). Live: constraint present. |
| SEC-06 | Fixed (code + live DB); CAPTCHA not added | `src/lib/form-input.ts` (length caps, control-character strip, e-mail check, `escapeHtml`). `src/app/api/contact/route.ts:17,22-26,52-53` and `src/app/api/wholesale/route.ts`: per-IP `checkApiRateLimit`, validated fields, every value escaped in the HTML e-mail. DB: `0046:399-416` length-cap CHECKs on `contact_inquiries` and `wholesale_applications` (NOT VALID). Grants were already narrowed in 0044. | pgTAP: `contact_inquiries reject a message over 5000 chars`. Live rollback probe: `long_contact=rejected`. Turnstile/hCaptcha still open (needs keys). |
| SEC-07 | Partly fixed (live DB) | `0046:188-190` `UNIQUE (provider_payment_id, status) WHERE provider_payment_id IS NOT NULL`; `record_payment` (`0046:192`) locks the order `FOR UPDATE`, inserts with `ON CONFLICT DO NOTHING`, returns the existing id with no second side effect, and logs `payment.captured_after_cancel` on a cancelled order. | pgTAP: repeat capture returns the same id, 1 row, 1 `order.paid` event; a raw duplicate INSERT fails 23505. Live: index present, 0 duplicate keys before creation. **Open:** webhook routes still ignore RPC errors / third route `/api/webhooks/payment` still present. |
| SEC-08 | Partly fixed | Partial cancel: migration 0045 (`e842de6`). Full cancel: `cancel_order_restock(uuid, boolean, uuid)` (`0046:281`) replaces the 1-arg version that always returned FORBIDDEN for the service-role caller; it locks the order and active lines, restocks only lines not already cancelled/refunded, is idempotent, handles the no-restock path, returns the coupon use. `src/actions/orders.ts:279` calls it for both paths. | pgTAP 09: service-role cancel `ok`; line already cancelled by 0045 not restocked twice (24 stays 24); second call `already_cancelled`, no extra stock or event; shrinkage leaves stock unchanged; customer call 42501. **Open:** `adjustInventory` read-modify-write. |
| SEC-13 | Fixed (live DB) | `handle_new_user` (`0046:48`) has no e-mail, always inserts `retail`, `ON CONFLICT DO NOTHING`. `0047`: `public.user_roles` (`:20`), mirror trigger `sync_profile_role` (`:65,100`), `prevent_profile_role_change` now blocks every direct `profiles.role` change (`:42`), `is_admin()` reads `user_roles` (`:118`), five policies switched to `(SELECT public.is_admin())` (`:137-146`), `custom_access_token_hook` (`:151`). `src/actions/admin.ts:301-305` and `src/app/api/dev/login/route.ts:70` write `user_roles`; an admin cannot demote themselves. | pgTAP `10_user_roles_test.sql` (17 tests) and `01` tests 7-8 pass. Live: `user_roles_admins=1`, `roles_in_sync=1`, `handle_new_user_no_email=true`, `policies_reading_profiles=NULL`; rollback probe `hook_admin=admin hook_other=retail direct_role_update=denied is_admin(admin)=true is_admin(customer)=false auth_insert_roles=denied`. **Owner action:** enable the hook (Dashboard → Authentication → Hooks → Customize Access Token). |
| SEC-14 | Partly fixed | `@sentry/nextjs` ^10.78.0; `npm audit fix` (non-breaking). | `npm audit --omit=dev`: 30 → 10 (9 moderate, 1 high `serialize-javascript` via `@ducanh2912/next-pwa`, build-time, fix is semver-major). Actions still pinned to tags. |
| SEC-15 | Fixed in code | `scripts/seed.mjs`: account sign-up, sign-in and role update removed; uses `SUPABASE_SERVICE_ROLE_KEY` (`:94`); exits when the URL contains the production ref (`:90,99`). `scripts/seed-sample.mjs` and `tests/integration/helpers.ts` grant admin through `user_roles`. | The credential remains in git history: treat it as public and never reuse it. |
| Analytics | Fixed in code | GTM moved out of `src/app/layout.tsx` into `src/components/AnalyticsConsent.tsx` (rendered at `layout.tsx:119`): nothing from Google loads until "Allow" (`:92,137`); never on `/admin`, `/account`, `/checkout` or sign-in pages (`:18`); Consent Mode defaults to denied and is set back to denied if the visitor moves to one of those pages; footer "Cookie preferences" withdraws the choice. | `tsc`, `eslint`, `next build` exit 0. Not yet checked in a browser. |

Residual risk and follow-ups:

- **Until the new `src/actions/auth.ts` is deployed, the login lockout is off.** The deployed code still calls the lockout functions with the anon key, which now gets `permission denied`; the code ignores that error, so sign-in keeps working but failures are not counted. Deploy promptly.
- The lockout is still a 15-minute denial of password login for any known e-mail, triggerable by 5 wrong passwords on the real login form, and it does not cover direct calls to Supabase's `/auth/v1/token`. Supabase Auth CAPTCHA and rate limits (dashboard) remain the real brute-force control; removing the owner e-mail from tracked files is still open.
- `checkApiRateLimit` fails open when Upstash is not configured; the database caps in `create_order_atomic` apply either way.
- The stock hold is still 1 hour (the audit suggested 15-30 min); the per-user caps bound how much one account can hold.
- `/api/cron/timeouts` is unchanged and still works as a manual trigger; `pg_cron` is now the scheduler.

## Per-finding CVSS 4.0 vectors (all Unscored, see above)

| ID | Vector | Metric notes |
|---|---|---|
| SEC-01 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:H/SC:N/SI:N/SA:N` | Unauthenticated request; process-wide CPU exhaustion (advisory). |
| SEC-02 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:L/VA:H/SC:N/SI:N/SA:N` | VI:L because the attacker writes lockout state. VA:H because password login can be denied persistently for any known account, including the only admin. |
| SEC-03 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:N/VI:L/VA:H/SC:N/SI:N/SA:N` | Any self-registered account. Sales are denied store-wide until manual cleanup. |
| SEC-04 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:A/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N` | Victim must log in via the crafted link. The impact lands on the user's browser and next site. |
| SEC-05 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N` | Integrity of the shipping charge only. |
| SEC-06 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:L/VA:L/SC:N/SI:L/SA:N` | SI:L because it injects content into the owner's mailbox. VA:L for DB and notification flooding. |
| SEC-07 | `CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N` | Needs a concurrency window or a transient DB failure. |
| SEC-08 | `CVSS:4.0/AV:N/AC:H/AT:P/PR:H/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N` | Admin action plus concurrency; financial-record integrity. |
| SEC-09 | `CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:A/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N` | Same-site framing only, because cookies are SameSite=Lax. |
| SEC-10 | `CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:A/VC:L/VI:L/VA:N/SC:L/SI:L/SA:N` | Admin must accept model output. Session theft is possible because cookies are not httpOnly. |
| SEC-11 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:H/UI:N/VC:N/VI:L/VA:N/SC:L/SI:L/SA:N` | Admin-only upload; script executes on the storage origin. |
| SEC-12 | n/a | Architecture/invariant gap, not a standalone vulnerability. |
| SEC-13 | `CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N` | AT:P: the owner row must be absent and e-mail confirmation off. |
| SEC-14 | n/a (Unscored) | Reachability of the vulnerable transitive code is not established. |
| SEC-15 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N` | AT:P: the script must have been run against the target project. The seeded account holds no real data, and admin promotion has been blocked since 0039. |

## Evidence for the two live proofs

Both ran on 2026-11-22 against `nhmarliyovmucuqryceg` inside one `DO` block that ends in `RAISE EXCEPTION`, so the transaction rolled back. A fake address `audit-probe@example.invalid` was used. A follow-up query returned `probe_rows_left = 0` and `probe_events_left = 0`.

```
SET LOCAL ROLE anon;
auth_attempt_record_failure('audit-probe@example.invalid', 1, 525600)  -> {"locked": true, "attempts": 1, "justLocked": true}
auth_attempt_record_failure('audit-probe@example.invalid', 1, 525600)  -> {"locked": true, "attempts": 2, "justLocked": false}
auth_attempt_is_locked(...) -> t        locked_until - now() = 365 days
auth_attempt_clear('nobody@example.invalid') -> allowed for anon
INSERT INTO public.order_events (order_id, status, description) ...
  -> 42703 column "status" of relation "order_events" does not exist   (the statement cancel_expired_pending_orders() runs)
```

## Phase 2.1: Framework CVE hygiene (the runbook's named CVEs)

**Versions.** Locked: `next` 16.2.6 and `react`/`react-dom` 19.2.4 (`package-lock.json`). Next 16.2.6 bundles its own React server runtime, `19.3.0-canary-3f0b9e61-20260317` (`node_modules/next/dist/compiled/react/cjs/react.production.js`). Advisory ranges were checked against the GitHub Advisory Database with `gh api advisories`.

| CVE | Advisory | Fixed in | Verdict for this app | Evidence |
|---|---|---|---|---|
| CVE-2025-29927 (middleware bypass via `x-middleware-subrequest`) | GHSA-f82v-jwr5-mffw | 15.2.3 (affected ranges end below 15.2.3) | **Not affected** | `package.json:35` = 16.2.6 is outside every affected range |
| CVE-2025-55182 (React Server Components RCE) | GHSA-fv66-9v8q-g76r | react-server-dom-* 19.0.1 / 19.1.2 / 19.2.1 | **Not affected** | The bundled RSC runtime is a 2026-03-17 canary build, later than the fix |
| CVE-2025-66478 (Next.js side of the same RCE) | GHSA-9qr9-h5gf-34mp (GitHub shows no CVE id on it) | next 16.0.7 | **Not affected** | 16.2.6 ≥ 16.0.7 |
| CVE-2025-55184 (RSC DoS) | GHSA-2m3v-v2m8-q956 | react-server-dom-* 19.2.2 | **Not affected** | Bundled runtime postdates the fix |
| CVE-2025-67779 (incomplete fix of 55184) | GHSA-7gmr-mq3h-m5h9 | react-server-dom-* 19.2.3 | **Not affected** | Bundled runtime postdates the fix |
| CVE-2026-64642 (proxy bypass, Turbopack + single i18n locale) | GHSA-6gpp-xcg3-4w24 | next 16.2.11 | **Not affected**: needs `config.i18n.locales` with one entry | `next.config.ts:10-42` has no `i18n` key; still fixed by SEC-01's upgrade |

These advisories were also found against 16.2.6 (npm audit) and assessed for applicability:

| Advisory | Fixed in | Verdict |
|---|---|---|
| CVE-2026-64641 and CVE-2026-94482 (Server Actions DoS) | 16.2.11 / 16.4.1 | **Affected → SEC-01** (App Router + Server Actions present) |
| CVE-2026-64643 (Server Action ID disclosure) | 16.2.11 | Affected, recon only. Every action re-checks the session or role inside itself (`src/actions/admin.ts:32-35,101-105,129-134`; `src/actions/orders.ts:13-16,121-124,147-150`), and the inline page actions delegate to those (`src/app/admin/customers/page.tsx:59-61`). |
| GHSA-vcvr-r3jv-pc5j (RCE in Node `next/og` ImageResponse) | 16.3.6 | **Not affected**: `src/app/api/og/route.tsx:4` uses the Edge runtime, and query values are rendered as HTML text, not SVG. |
| GHSA-673q-mjm6-r5xr (`use cache` RCE) | 16.4.1 | **Not affected**: no `'use cache'` anywhere in `src/`. |
| CVE-2026-75604 (RCE on Windows-hosted servers) | 16.3.3 | **Not affected**: Vercel hosting runs on Linux. |
| GHSA-2464-fhr4-w9xw / GHSA-2xp9-vwfh-vxw4 (image-optimizer RCE via sharp/libvips) and CVE-2026-94483 (image-optimizer SSRF) | 16.3.3 to 16.4.1 | **Needs verification**: applies where Next's own optimizer runs (`next start`/self-host). See assumption U1. |
| CVE-2026-119346 (HttpOnly cookie exposure on Edge routes) | 16.4.5 | **Needs verification**: the app has one Edge route (`/api/og`). Fixed by the SEC-01 upgrade either way. |
| @sentry/nextjs CVE-2026-114139 (critical, tunnel-route middleware bypass) | 10.75.2 | **Not affected**: no tunnel route. `next.config.ts:44` exports `withPWA(nextConfig)` with no `withSentryConfig`, and `src/instrumentation-client.ts` only sets `dsn`. Upgrade anyway (SEC-14). |

npm audit lists 14 more Next.js advisories against 16.2.6. They were not assessed one by one and are not counted as findings:
- cache confusion: GHSA-68g3-v927-f742, GHSA-4633-3j49-mh5q
- SSRF via rewrites or custom servers: GHSA-p9j2-gv94-2wf4, GHSA-89xv-2m56-2m9x
- Edge Server Action payload size: GHSA-4c39-4ccg-62r3
- image-optimizer SVG handling: GHSA-q8wf-6r8g-63ch, GHSA-7qx7-33qx-rqx2
- metadata image routes: GHSA-f87g-xv8r-7p7x
- SSG/ISR cache poisoning: GHSA-4jqv-mc3x-m676, GHSA-mcj8-r9mp-w47p
- self-hosted response injection: GHSA-pc58-hwjq-p385
- `use cache` leaks: GHSA-vc7v-qv4w-wrv8, GHSA-rhh4-g77r-r9qj
- the dev server's MCP endpoint: GHSA-39w2-rjm5-chcv

The newest affected range ends at 16.4.4, so the SEC-01 upgrade to 16.4.6 clears all 25.

## Phase 2.2: Zero middleware-only authorization (ASVS 8.2 / 8.3)

- **Proxy is routing only, so handlers must self-authorize.** `src/proxy.ts:27-29` excludes `/api` from the matcher. The `/account` and `/admin` checks in `src/lib/supabase/middleware.ts:66-95` are redirects only.
- **Server Actions: authorization is present, but the structure fails the invariant.**
  - Present:
    - Every admin action checks the role itself (citations in the CVE-2026-64643 row above).
    - Customer actions call `auth.getUser()` and rely on RLS (`src/actions/profile.ts:7-9,33-35`; `src/actions/orders.ts:100-102`).
    - `createOrder` passes only the session user id to the service-role RPC (`src/actions/orders.ts:117-118`).
  - Missing: a `server-only` DAL and Zod validation (SEC-12).
- **Route handlers: every non-public handler authenticates.** The checks are:
  - Session + admin: `extract-fabric/route.ts:33-37` and `logistics/route.ts:10-23`.
  - Session + ownership: `payment/razorpay/verify/route.ts`.
  - RLS-scoped read: `invoice/[id]/route.tsx:95-109`.
  - Cron routes: bearer secret checked, fail closed (`cron/timeouts/route.ts:10-17`, `cron/process-emails/route.ts:8-16`).
  - Webhooks: HMAC (`webhooks/razorpay/route.ts:9-13`, `payment/razorpay/webhook/route.ts:7-15`) or a shared secret (`webhooks/logistics/route.ts:16-21`, `webhooks/payment/route.ts:15-19`).
  - Dev-only routes return 404 in production: `dev/login/route.ts:11-22` and `stress-test/route.ts:8-10`.

  Public by design: `contact`, `wholesale`, `shipping/calculate`, `og`, `auth/callback` (see SEC-04, SEC-05, SEC-06).
- **Admin pages: six have no server-side guard.** They rely on the proxy plus RLS, and RLS was verified to enforce (SEC-12).
- **Role source.** Role checks read `profiles.role`. Since migration 0039, that column is not writable by `authenticated` (live-verified in the previous step). The invariant requires `user_roles` + `custom_access_token_hook`, which is not yet built (SEC-13, Step 3).

## Phase 2.3: Data leakage and serialization (ASVS V3 / V14)

| Check | Result | Evidence |
|---|---|---|
| `productionBrowserSourceMaps: false` | PASS (default false; not set) | `next.config.ts:10-42` |
| `images.remotePatterns` strict | **FAIL** (`*.supabase.co` = every tenant) → SEC-09 | `next.config.ts:13-24` |
| `images.dangerouslyAllowLocalIP` disabled | PASS (not set; Next 16 default blocks local IPs) | `next.config.ts`; `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md:821` |
| `serverActions.allowedOrigins` restricted | PASS (not set → framework same-origin check) | `next.config.ts:10-42` |
| Strict CSP | **FAIL** (none) → SEC-09 | grep for `Content-Security-Policy`/`frame-ancestors`: 0 hits |
| HSTS / `X-Content-Type-Options` | Partial: pages only, `/api/*` excluded | `src/proxy.ts:16-17,27-29` |
| `Cache-Control: no-store` on private responses | Not set explicitly on any `/api` response (invoice PDF, payment JSON). Runtime behavior is not verified (assumption U5). | grep `Cache-Control\|no-store` in `src/app/api`: 0 hits |
| `NEXT_PUBLIC_*` carries no secrets | PASS: only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RAZORPAY_KEY_ID`, `SENTRY_DSN`, `SITE_URL` | `grep -rhoE NEXT_PUBLIC_…`; no `'use client'` file references a service key or `_SECRET` |
| Service-role key stays server-side | PASS (with hardening note): the key is only read in server modules. `admin.ts` lacks `import 'server-only'` (SEC-12). | `src/lib/supabase/admin.ts:5-14` |
| Minimal DTOs across Server→Client | No sensitive field found crossing to the browser in the reviewed boundaries. Admin pages select explicit columns (`src/app/admin/customers/page.tsx:13-18`). `select('*')` appears only on public catalog tables (`src/app/category/[slug]/page.tsx:16`, `src/app/shop/page.tsx:125`) and in admin-only returns (`src/actions/admin.ts:272`). | grep results above |
| Error detail to clients | Minor: raw `error.message` from `shipping/calculate/route.ts:78`, `extract-fabric/route.ts:86` (admin), the three webhook routes, and `auth.ts:43` (Supabase auth message). No secrets in those messages. | as cited |

## Phase 2.4: Injection, XSS and file handling (ASVS V1 / V5)

- **`dangerouslySetInnerHTML`: 3 sites.** Two are static constants (`src/components/StructuredData.tsx:31-32`). One is DB-driven (`src/app/product/[slug]/page.tsx:85`) → SEC-10.
- **Raw SQL string interpolation: none.** All data access goes through the PostgREST builder or named RPCs (grep for template-literal `query`/`sql`/`execute`: 0 hits).
- **Unvalidated redirects:** SEC-04.
- **SSRF sinks.** Every outbound `fetch` targets a fixed host:
  - Shiprocket, where the query is injectable → SEC-05.
  - Razorpay: `fetchRazorpayPayment` validates `^pay_[A-Za-z0-9]+$`.
  - WhatsApp/Twilio, Resend and Gemini SDKs.

  No user-supplied URL is fetched. The image optimizer wildcard is covered by SEC-09.
- **E-mail HTML injection:** `contact`/`wholesale` → SEC-06. Order e-mails interpolate the customer's own name (`src/lib/email.ts:190-193`) and are sent to that customer; low impact.
- **Upload validation:** SEC-11.

## Phase 2.5: TypeScript and fail-open defaults (A10)

- **Type check.** `typescript-lsp` was not available, so `npx tsc --noEmit -p tsconfig.json` ran with `"strict": true` (`tsconfig.json:11`). Exit 0, no diagnostics.
- **Unchecked `any` in auth, payment and order code: 24 occurrences.** The material ones are the untyped Server Action inputs (`src/actions/orders.ts:68`, `src/actions/profile.ts:5`, `src/actions/auth.ts:11,64`) → SEC-12.
- **Fail-open handling:**
  - Webhook RPC error swallowed → SEC-07.
  - Partial-cancel and no-restock cancel write errors swallowed → SEC-08.
  - Rate limiters silently allow everything when Upstash env vars are absent (`src/lib/ratelimit.ts:17-19`, `src/lib/supabase/middleware.ts:7-13,21`); see assumption U4.
  - All other route `catch` blocks return a 4xx/5xx and stop, i.e. they fail closed.

## Phase 1: Secrets and supply chain

| Check | Result |
|---|---|
| `.env*` ever committed (all refs, 139 commits) | **None.** `git log --all --name-only` shows no `.env`, key or credential files; `.gitignore:36` ignores `.env*`. |
| Provider-key patterns in full history | **No hits** for Supabase personal tokens (`sbp_`), `sb_secret_`, HS256 JWTs (service-role key shape), `rzp_live_`, Google `AIza…`, GitHub, Slack, Twilio, SendGrid or PEM private keys. The 4 raw matches were base64 blobs in a committed Playwright report and minified code (false positives). |
| Same patterns in currently tracked files | **No hits.** `.mcp.json` (untracked) holds no credentials. |
| Generic `password=`/`token=` literal assignments in history | **Done.** Scope: all 139 commits on all refs, merges included. PNG/JPG/WebP/PSD/PDF files and `package-lock.json` were left out of the diff scan. The 11 SVG and extension-less text blobs, including the 26 MB `docs/assets/Untitled` SVG, were grepped directly, with no hits. The diff scan found 5 hits:<br>- 3 are `env()` references in `supabase/config.toml:101,294,326`.<br>- 1 is a test-only default password for throwaway integration-test users (`tests/integration/helpers.ts:19`).<br>- 1 is a real hard-coded credential → SEC-15.<br>No JWT-shaped string appears anywhere in history, so no Supabase anon or service-role key was ever committed. No `user:password@` URL appears in the lockfile's history. |
| Personal data in the public repo | The owner's personal e-mail (also the admin login) is hard-coded in 7 tracked files: `docs/deploy_checklist.md:33`, `docs/deployment.md:62`, `docs/pre_deploy_checklist.md:11,20`, `supabase/migrations/0023_owner_admin.sql:1,17,21,32`, `supabase/setup/01_FULL_SETUP_fresh_db.sql:1478-1509`, `supabase/setup/02_NEW_MIGRATIONS_only.sql:269-300`, `supabase/setup/README.md:21`. It feeds SEC-02 and SEC-13. |
| Lockfile and CI install | PASS. `package-lock.json` is committed and CI uses `npm ci` (`.github/workflows/main.yml:19`). Actions are tag-pinned (`:13,15`) → SEC-14. |
| `npm audit --omit=dev` | 34 advisories (critical 2, high 10, moderate 21, low 1). Mapped to SEC-01 (next), SEC-14 (transitive, build chain), and N/A (@sentry tunnel route). |

## Unverified assumptions (not counted as findings)

| # | Assumption | Why it matters | How to verify |
|---|---|---|---|
| U1 | On Vercel, `/_next/image` is served by Vercel's image service, not Next's sharp-based optimizer. | Decides whether the image-optimizer RCE/SSRF advisories apply before the upgrade. | Vercel project → Settings/Usage → Image Optimization; or just ship SEC-01. |
| U2 | Supabase Auth "Confirm email" is enabled (inferred: 1 of 3 users is unconfirmed). | SEC-13 precondition. | Supabase dashboard → Authentication → Providers → Email. |
| U3 | The Supabase Auth redirect allow-list only permits the production origin. | `register`/`signInWithGoogle` build `origin` from the `Host`/`X-Forwarded-Proto` headers (`src/actions/auth.ts:81-91,141-151`). | Supabase dashboard → Authentication → URL Configuration. |
| U4 | `UPSTASH_REDIS_REST_URL`/`TOKEN` are set in production. | Otherwise every app-level rate limit is a no-op. | `vercel env ls production` (Vercel CLI not installed here). |
| U5 | Private API responses (invoice PDF, payment JSON) are not cached by browser or CDN without explicit headers. | Shared-cache leakage. | `curl -I` an authenticated invoice URL and check `Cache-Control`. |
| U6 | Shiprocket honors the injected parameters as described in SEC-05. | SEC-05 impact. | One quote call against the Shiprocket sandbox with a crafted pincode. |
| U7 | Vercel Deployment Protection, firewall/WAF and env-var scoping were not inspected. | Dashboard-only settings. | Not inspected: needs a logged-in dashboard session. |

## Tool coverage vs the runbook

| Runbook tool | Used? | Substitute |
|---|---|---|
| `/security-audit` (web, secrets, supply-chain) | Yes (`security-audit:security-audit`) | |
| `owasp-security` | Yes | |
| `/claude-security`, Trail of Bits skills | Not installed | Same Inventory → Threat → Sweep → 3-lens verification done inline |
| `typescript-lsp` | Not available | `tsc --noEmit` (strict) |
| CVSS calculator | Execution blocked in this session | Vectors given; scores Unscored |

## Suggested fix order

1. **SEC-02 and SEC-03** (DB migrations; no app deploy needed for the grant/function parts).
2. **SEC-01** (Next.js upgrade; also closes the remaining framework advisories).
3. **SEC-07, then SEC-08** (money and stock integrity).
4. **SEC-04, SEC-05, SEC-06** (input handling).
5. **SEC-09 to SEC-15** (hardening and invariants; SEC-12 and SEC-13 overlap with Step 3; SEC-15 is a few-line deletion).
