# Production Readiness Checklist — Mithila Fabric Storefront, Customer Dashboard & Owner CRM

> **Audit type:** Static code trace (UI → Server Action / Route Handler → DAL → Supabase migration/RLS).
> **Date:** 2026-11-22 · **Commit:** `5a466ce` · **Stack observed:** Next.js `16.2.6`, React `19.2.4`, `@supabase/ssr ^0.10.3`, 38 SQL migrations.
>
> **Evidence rule (CLAUDE.md):** every `PASS` cites `file:line`. Nothing here was executed — no tests, no live DB.
> **Not covered in this pass:** the live Supabase schema (the staging MCP rejected its token: `JWT could not be decoded`), so findings reflect `supabase/migrations/` only. The live DB may have drifted, for example via `supabase/scripts/fix-rls*.sql` or `supabase/setup/*.sql`. Step 3 (pgTAP) must confirm each DB finding against the real database.
>
> Status key: **PASS** verified in code · **PARTIAL** exists but incomplete/unsafe · **MISSING** not implemented · **BUG** implemented incorrectly (security or correctness defect).

---

## 1. Executive Readiness Summary

| # | Domain | Items | PASS | PARTIAL | MISSING | BUG | Complete* |
|---|---|---|---|---|---|---|---|
| D1 | Identity, Auth & OTP | 12 | 1 | 5 | 3 | 3 | **29%** |
| D2 | Fabric Catalog & Precision Mechanics | 11 | 2 | 1 | 8 | 0 | **23%** |
| D3 | Order Immutability & Snapshot | 10 | 1 | 4 | 3 | 2 | **30%** |
| D4 | Customer Dashboard | 8 | 1 | 5 | 2 | 0 | **44%** |
| D5 | Owner Inventory & Catalog CMS | 8 | 1 | 3 | 2 | 2 | **31%** |
| D6 | Owner Orders, Payments, Refunds & Analytics | 13 | 0 | 4 | 5 | 4 | **15%** |
| D7 | Discount Coupons & Offers Engine | 10 | 3 | 3 | 0 | 4 | **45%** |
| D8 | Multi-Channel Lead CRM | 8 | 0 | 2 | 6 | 0 | **13%** |
| D9 | Communications & Tracking | 7 | 2 | 2 | 3 | 0 | **43%** |
| D10 | Privacy, Platform Security & Performance | 11 | 0 | 6 | 2 | 3 | **27%** |
| | **Total** | **98** | **11** | **35** | **34** | **18** | **~29%** |

\* Complete = (PASS + 0.5 × PARTIAL) ÷ Items.

### Blocker count

- **Critical: 4.** Each lets any signed-in customer take store-owner powers or obtain goods without paying full price.
  1. Self-promotion to admin by editing your own `profiles.role` (D1-10).
  2. Order totals controlled by the client through `create_order_atomic` parameters and direct `INSERT` policies (D3-9).
  3. Razorpay `/verify` marks *any* order paid using a signature from a different, cheaper order (D6-11).
  4. Webhook and checkout signatures fail open when `RAZORPAY_*_SECRET` is unset (D6-12).
- **High: 9.** Coupon limits unenforced (D7-2/3/4), free-shipping coupons misapplied (D7-1), legacy `SECURITY DEFINER` RPCs callable by `PUBLIC` (D10-11), payment-timeout cron broken and fails open (D6-7), open redirects (D1-7), owner email hard-coded into the role trigger (D1-11), partial-cancel/refund math references non-existent columns (D6-6), clickjacking protection disabled (D10-4), SVG upload accepted (D5-5).
- **Product build-out gap.** None of the fabric-domain mechanics exist: fractional meterage, rolls/bolts, dye-lots, remnants, swatches, swatch credit. Neither does OTP/MFA, Lead Ads/Google Ads ingestion, refunds/credit notes, or DPDP flows. Quantities are `INTEGER` throughout. These are feature work, not fixes, and are listed separately in §4.

**Verdict: NOT production-ready.** The four Critical items are exploitable today by any registered customer using only the public anon key and browser devtools.

---

### Remediation status — 2026-11-22 (criticals)

All four Critical items are fixed, plus one further Critical found while fixing them. **The database fixes are live** on project `nhmarliyovmucuqryceg` (applied 2026-11-22). **The app code is not deployed and nothing is committed.** Until the new code ships, checkout on the deployed site fails safely: the old code calls the removed `create_order_atomic` signature.

| # | Item | Fix | Evidence |
|---|---|---|---|
| 1 | D1-10 self-promotion to admin | `supabase/migrations/0039_lock_profile_role.sql`: column-level `GRANT UPDATE (full_name, phone, saved_addresses)`, policy `WITH CHECK`, `BEFORE UPDATE` trigger rejecting role/id changes by non-privileged roles, `is_admin()` with `search_path=''`. `setUserRole` now uses the service-role client (`src/actions/admin.ts:286`). | PGlite (Postgres 18.7) harness: before = role becomes `admin`; after = `permission denied for table profiles`; name/address edits still work; signup trigger still works. |
| 2 | D3-9 client-controlled totals | `0040_server_only_order_pricing.sql`: INSERT policies dropped and INSERT/DELETE revoked; all old `create_order_atomic` overloads dropped; new 6-arg version is `service_role`-only, prices lines from `product_variants`, GST from `products.gst_rate`, coupons locked `FOR UPDATE` with `max_uses`/per-user limits, shipping bounds-checked, rows locked in `variant_id` order (no deadlock). `createOrder` calls it with the admin client (`src/actions/orders.ts`). | Harness before: ₹1,000 of goods → `total_amount = -500.00`. After: customer RPC/INSERT denied; 800 + 5% + 60 = 900 exact; oversell, MOQ, draft products, negative shipping, idempotency, coupon exhaustion all verified. |
| 3 | D6-11 cross-order verify | `0041_razorpay_order_binding.sql` adds `orders.razorpay_order_id` (unique). `create-order` binds it; `verify` requires a session + ownership + matching Razorpay order, fetches `GET /v1/payments/:id`, records the **captured** amount. | `tests/verify-route.test.ts` 8/8 pass (cheap-order replay → 400, other user → 404, no session → 401, amount from Razorpay). |
| 3b | **NEW — `record_payment` callable by anon** | On Supabase, `REVOKE ... FROM PUBLIC` (`0015:166`) leaves the default `anon`/`authenticated` EXECUTE grants, so `/rest/v1/rpc/record_payment` could mark any order paid with the public key. `0041` revokes by role on `record_payment`, `cancel_order_restock`, `cancel_expired_pending_orders`, `checkout_processor`, `process_logistics_order` and trigger functions. | Harness: before 0041 `has_function_privilege(anon, record_payment) = true`; after: `permission denied for function record_payment`. **Check live:** `select has_function_privilege('anon','public.record_payment(uuid,text,text,numeric,text,text,text,jsonb)','execute');` |
| 4 | D6-12 fail-open secrets | `verifyPaymentSignature` / `verifyWebhookSignature` return false when the secret is unset (`src/lib/razorpay.ts`); cron timeouts returns 503 without `CRON_SECRET`; logistics/payment webhooks use constant-time `secretMatches` (`src/lib/secure-compare.ts`). | `tests/razorpay.test.ts` 6/6 pass (empty-key forgeries rejected). |

**Live database evidence (2026-11-22).** Pre-flight found the live DB was missing repo migrations 0026 and 0027 (`profiles.razorpay_customer_id`, `products.gst_rate`, `product_variants.weight_grams`), so they were applied first. The live migration history now reads `0026, 0027, 0039, 0040, 0041`; earlier migrations were applied by hand through `supabase/setup/` and are not recorded. Privilege checks after applying: anon/authenticated EXECUTE on `record_payment` false (service_role true); anon EXECUTE on `cancel_order_restock` false; authenticated UPDATE on `profiles.role` false (and on `full_name` true); authenticated INSERT on orders/order_items false; 0 INSERT policies; one `create_order_atomic(uuid,jsonb,jsonb,numeric,text,text)` overload, which authenticated cannot execute and service_role can; role-change trigger enabled; `is_admin` has `search_path=""`. Behavioural checks ran in a forced-rollback transaction (0 test rows remained afterwards): self-promotion → `permission denied for table profiles`, role still `retail`; editing your own name → 1 row; direct ₹1 order → `permission denied for table orders`; customer RPC → `permission denied for function create_order_atomic`; server order 2×₹250 → `subtotal=500.00 tax=25.00 ship=60.00 total=585.00`, stock 10→8; negative shipping → `INVALID_SHIPPING`; anon `record_payment` → permission denied; anon `cancel_order_restock` → permission denied; customer editing an order total → 0 rows; admin status update → 1 row.

Verification run: `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npx vitest run` 24 passed, 18 skipped (integration, no test DB), 4 failed. All 4 failures are pre-existing in `tests/password.test.ts`: the policy is 8 characters, the test expects 12. PGlite harness 45/45 checks passed. It lives outside the repo, in the session scratchpad.

Gaps that remain: GST is still computed on the pre-discount value (D7 / compliance); `auth_attempt_clear` is still callable by anon (D1-3); there is no `user_roles`/JWT hook yet; webhook dedupe table and route consolidation are still open; the hard-coded owner email is still in `handle_new_user`.

## 2. Domain-by-Domain Traceability Tables

### D1 — Identity, Auth & OTP Confirmation

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D1-1 | Sign-up creates `auth.users` UUID **and** profile via trigger, null-metadata safe | PARTIAL | `src/app/signup/page.tsx` | `src/actions/auth.ts:64-130` (`register`) | `0023_owner_admin.sql:6-25` (`handle_new_user`) | Trigger inserts profile; `raw_user_meta_data->>'full_name'` yields NULL safely. **Gap:** no human-readable ID (see D1-2), and `search_path = public` rather than `''`. Fix: `SET search_path = ''` + schema-qualify. |
| D1-2 | Immutable unique `customer_code` (`FAB-YYYY-NNNNNN`) | MISSING | — | — | none (`grep customer_code` → 0 hits) | Add `profiles.customer_code TEXT UNIQUE NOT NULL` set by the trigger from a dedicated `SEQUENCE`; block updates with a `BEFORE UPDATE` trigger or column-level `REVOKE UPDATE`. Backfill existing rows. |
| D1-3 | Login + brute-force lockout | PARTIAL | `src/app/login/page.tsx` | `src/actions/auth.ts:12-44` | `0013_auth_attempts_hardening.sql:11-93` | Per-email lockout works via `SECURITY DEFINER` RPCs. **Gaps:** (a) anyone can lock *any* account by sending 5 bad passwords for it (DoS), and that also spams the victim with alert emails (`auth.ts:36-38`); (b) no per-IP limit; (c) `auth_attempt_*` RPCs are granted to `anon`, so the counter can be cleared directly via `auth_attempt_clear` without a valid login (`0013:92-93`). Fix: revoke `auth_attempt_clear` from anon/authenticated and call it only server-side; add an IP + email composite limiter. |
| D1-4 | Password strength / breach check | PARTIAL | `src/components/PasswordInput.tsx` | `src/lib/password.ts`, `auth.ts:76-80` | Supabase Auth settings | Local policy enforced on signup. Breach (HIBP) check is a Supabase dashboard toggle and can't be verified from code. Enable "Leaked password protection" and mirror the policy on reset-password. |
| D1-5 | Forgot / reset password (single-use, expiring) | PARTIAL | `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx` | Supabase Auth (client) | — | Pages exist and use Supabase recovery tokens, which are single-use by design. Not traced in depth this pass; verify in Step 6 E2E. |
| D1-6 | Logout (`local` vs `global` scope) | PARTIAL | `src/app/admin/layout.tsx` (logout button) | `src/actions/auth.ts:132-137` | — | `signOut()` with the default scope only. Add a "sign out of all devices" (`scope:'global'`) option to the dashboard. |
| D1-7 | Safe post-login redirects | **BUG** | `src/app/login/page.tsx` | `src/actions/auth.ts:15,60`; `src/app/api/auth/callback/route.ts:7,13` | — | `redirect(nextPath)` takes the raw `next` form field. The callback builds `${origin}${next}`, so `next=@evil.com` resolves to host `evil.com`. **Open redirect (phishing).** Fix: allow only paths matching `^/(?!/)` and reject `@`, `\`, and schemes. |
| D1-8 | Owner Admin TOTP / Passkey MFA | MISSING | — | — | — | No `mfa.enroll/challenge` anywhere. Require AAL2 for `/admin/**` and every admin action. Check `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` in the DAL. |
| D1-9 | OTP workflow (signup, phone, COD, sensitive changes) | MISSING | — | — | none (`grep otp` → 0) | Build `otp_challenges` (hashed code, purpose, TTL, attempts, consumed_at) with SECURITY DEFINER verify RPC; see Step 4. |
| D1-10 | Admin role from a locked source (`user_roles` + `custom_access_token_hook`, never self-editable) | **FIXED — DB live-verified 2026-11-22; app code not yet deployed** (self-escalation closed by `0039`; `user_roles` + hook still TODO) | `src/app/admin/customers/page.tsx:61` | `src/lib/auth-guard.ts:19-27`, `src/lib/supabase/middleware.ts:84-94`, every `assertAdmin` in `src/actions/admin.ts:129-134` | `0000_initial_schema.sql:18,133-138,142` | `is_admin()` and every app check read `profiles.role`. The policy `"Users update own profile" FOR UPDATE USING (auth.uid() = id)` has **no `WITH CHECK` and no column restriction**, and Supabase grants `UPDATE` on all columns to `authenticated` by default. Any customer can run `supabase.from('profiles').update({role:'admin'}).eq('id', myId)` and become owner, with full RLS write on catalog, orders, discounts and settings. Fix (migration): `REVOKE UPDATE ON public.profiles FROM authenticated; GRANT UPDATE (full_name, phone, saved_addresses) ON public.profiles TO authenticated;` then move roles to `public.user_roles` (REVOKE ALL from anon/authenticated) read by `custom_access_token_hook`, and rewrite `is_admin()` to read the JWT claim. Prove with pgTAP in Step 3. |
| D1-11 | No hard-coded privilege grants | **BUG** | — | — | `0023_owner_admin.sql:17-22,31-33` | The trigger grants `admin` to whoever **inserts** an `auth.users` row with the owner's email, before email confirmation. If the owner account is ever deleted or recreated, a squatter who signs up first with that address gets an admin profile row. Fix: delete the email special-case and seed the owner into `user_roles` once via a service-role script. |
| D1-12 | Dev auto-login cannot reach production | PASS | — | `src/app/api/dev/login/route.ts:11-17` | — | Gated on `NODE_ENV !== 'production' && !VERCEL && DEV_AUTOLOGIN==='true'`. |

### D2 — Fabric Catalog & Precision Ordering

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D2-1 | Fractional meterage, `0.5m` steps, `NUMERIC(10,2)` | MISSING | `src/app/product/[slug]/ProductBuyBox.tsx:19` (integer state) | `src/actions/orders.ts:81` (`Number(...)`), RPC casts `::INTEGER` | `0000:70,116` (`quantity INTEGER`); `0030:52` | Change `order_items.quantity`/`cart` to `NUMERIC(10,2)` with `CHECK (quantity > 0 AND mod(quantity*2,1)=0)`; RPC must reject non-0.5 multiples; UI stepper `step=0.5`. |
| D2-2 | Roll/bolt inventory (`fabric_rolls`) | MISSING | `src/app/admin/inventory/page.tsx` | `src/actions/admin.ts:97-126` | Stock is `product_variants.stock_quantity INTEGER` (`0000:52`) | Create `fabric_rolls(id, variant_id, dye_lot, total_m, remaining_m NUMERIC(10,2) CHECK >= 0, status)`; allocate cuts from a single roll inside the order RPC with `FOR UPDATE`. |
| D2-3 | Dye-lot / shade grouping | MISSING | — | — | — | `dye_lot` column on `fabric_rolls`; snapshot onto `order_items`. |
| D2-4 | Single-bolt continuity check | MISSING | — | — | — | RPC must pick one roll with `remaining_m >= requested` (no splitting across bolts) or fail with `NO_CONTINUOUS_LENGTH`. |
| D2-5 | Remnant auto-creation & tracking | MISSING | — | — | — | When `remaining_m` < threshold after a cut, flag the roll as remnant (status) and list on remnant catalog. |
| D2-6 | Swatch ordering | MISSING | — | — | — | Swatch SKU type + flat price + per-user cap. |
| D2-7 | Swatch-recovery credit ledger | MISSING | — | — | — | Append-only `swatch_credit_ledger(user_id, delta, reason, order_id, UNIQUE(order_id, reason))` + atomic debit in order RPC. |
| D2-8 | Minimum order quantity | PASS | `ProductBuyBox.tsx:22-28`, `src/store/useCart.ts:35-46` | `src/actions/orders.ts` → RPC | `0029:10-11`; enforced in `0030_moq_enforcement.sql:56-62` | DB-enforced. |
| D2-9 | Stock never negative under concurrency | PASS | — | — | `0030:56-65` (`FOR UPDATE`), `0033_stock_quantity_constraint.sql:2-4` | Row lock + `CHECK (stock_quantity >= 0)`. To be proven by Step 5 race test. |
| D2-10 | HSN code per product | MISSING | `src/app/admin/products/new/page.tsx` | `src/actions/admin.ts:45-61` | — | Add `products.hsn_code TEXT NOT NULL CHECK (hsn_code ~ '^[0-9]{4,8}$')`; required in CMS. |
| D2-11 | GST rate per product (5% fabrics; 5/18% cliff only for stitched Ch. 61–62) | PARTIAL | — | `src/lib/shipping.ts:60-79` | `0027:6-7` (`gst_rate DEFAULT 5.00`) | Rate exists, but it's free-form and admin-editable with no HSN tie. Derive rate from an HSN master table; no cliff needed unless stitched SKUs are added. |

### D3 — Order Record Completeness & Immutability

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D3-1 | `user_id` frozen from session | PASS | — | `src/actions/orders.ts:126-133` | `0030_moq_enforcement.sql:17,100` (`auth.uid()`) | Buyer cannot be spoofed. |
| D3-2 | `customer_code` snapshot | MISSING | — | — | — | Depends on D1-2; copy into `orders.customer_code` at insert. |
| D3-3 | Billing + delivery address with state code | PARTIAL | `src/app/checkout/page.tsx:205-216` | `src/actions/orders.ts:128` (`shippingAddress ?? {}` passed raw) | `orders.shipping_address JSONB` (`0000:105`) | Delivery address stored, but as **unvalidated client JSON** (any shape or size). No billing address and no 2-digit GST state code (only free-text `state`, `checkout/page.tsx:283`). Fix: Zod schema in a server-only DAL; state picked from a fixed list mapping to a GST state code; store `billing_address` + `place_of_supply_code`. |
| D3-4 | Razorpay payment metadata on order | PARTIAL | — | `src/app/api/payment/razorpay/create-order/route.ts:51` | `payments` (`0015:10-21`) | Payments logged with `raw`, but `razorpay_order_id` is **never persisted** against our order (root cause of D6-11). Add `orders.razorpay_order_id UNIQUE`. |
| D3-5 | SKU / title / colour snapshot per line | **BUG** | `src/app/account/orders/page.tsx:95-110` | `src/app/api/invoice/[id]/route.tsx:102`, `src/utils/pdf/generateInvoice.tsx` | `order_items` = `variant_id, quantity, unit_price` only (`0000:112-119`); `variant_id ON DELETE SET NULL` | Invoices and history **re-read title and colour live** through joins, so editing a product rewrites past invoices. A hard delete (allowed when unreferenced, `admin.ts:415`) wouldn't affect orders, but variant edits do. Fix: add `sku, title, color, hsn_code, gst_rate, uqc` snapshot columns to `order_items`, written by the RPC. |
| D3-6 | Cut length with UQC `MTR` | MISSING | — | — | — | Add `uqc TEXT NOT NULL DEFAULT 'MTR'`; requires D2-1. |
| D3-7 | HSN + CGST/SGST/IGST breakup snapshot | MISSING | — | `src/lib/shipping.ts:60-79` (computed then discarded) | `orders.tax_amount` single total (`0000:100`) | Persist `cgst, sgst, igst, place_of_supply` per line and per order. |
| D3-8 | Applied coupon snapshot | PARTIAL | — | — | `orders.applied_discount_id ... ON DELETE SET NULL` (`0000:103`); `discount_applied` | Coupon **hard-deleted** from admin (`src/app/admin/promotions/page.tsx:51`) nulls the reference. Store `discount_code TEXT` on the order and soft-delete coupons. |
| D3-9 | Server-authoritative totals (client cannot set price/tax/shipping) | **FIXED — DB live-verified 2026-11-22; app code not yet deployed** (`0040`) | `src/app/checkout/page.tsx:221-222` | `src/actions/orders.ts:89-133` | `0030_moq_enforcement.sql:3-10,92-98`; `0000:166,170` | Two independent bypasses. **(a)** `create_order_atomic(p_tax_rate, p_shipping_amount, p_tax_amount_override)` takes these from the caller, and since `0028` there is no `REVOKE ... FROM PUBLIC`/`GRANT` (`0019:154` targeted the old signature). Any signed-in user can call `supabase.rpc('create_order_atomic', {..., p_tax_amount_override: -9999, p_shipping_amount: 0})` to set the total to ₹1. `record_payment` then accepts ₹1 because it only checks `p_amount >= total_amount` (`0032:27`). **(b)** RLS policies `"Users insert own orders"` and `"Users insert own order items"` let a customer `INSERT` an order and line items with any `total_amount` / `unit_price` directly. Fix: drop both INSERT policies; remove the three pricing params; compute GST in SQL from the product rate + place of supply; take shipping from a server-signed quote row (`shipping_quotes(id, user_id, amount, expires_at)`); `REVOKE ALL ... FROM PUBLIC; GRANT EXECUTE ... TO authenticated`. |
| D3-10 | Order idempotency | PARTIAL | `src/app/checkout/page.tsx` (`idemKeyRef`) | `src/actions/orders.ts:130` | `0019:3-5` unique index; `0030:43-48` | Duplicate key returns the original order. A concurrent duplicate raises `unique_violation` instead of returning the winner (the handler from `0019:62-69` was dropped in `0028`/`0030`). Restore the `EXCEPTION WHEN unique_violation` block. |

### D4 — Customer Dashboard

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D4-1 | Order history scoped to owner | PASS | `src/app/account/orders/page.tsx:15` | RLS via `src/lib/supabase/server.ts` | `0000:165` (`auth.uid() = user_id OR is_admin()`) | Isolation correct *provided D1-10 is fixed*. Otherwise any user can become admin and read all orders. |
| D4-2 | Live tracking timeline (AWB + courier webhooks) | PARTIAL | `src/app/account/orders/page.tsx:50-51,76-90` | `src/app/api/webhooks/logistics/route.ts:13-46` | `orders.tracking_status TEXT`; `order_events` (`0015:34-50`) | Only a single text field. `order_events` is populated but never shown. Webhook secret compared with `!==` (not constant-time, `:18`). Fix: `shipments(awb, courier, status)` + `shipment_events` timeline; render `order_events`; `timingSafeEqual`. |
| D4-3 | Pre-Cut self-cancel vs Post-Cut cancellation request | PARTIAL | `src/app/account/orders/page.tsx:59-66` | `src/actions/orders.ts:228-246` | `0017_order_cancellation.sql:5-42` | Request flag only, allowed while `pending`/`paid`. No "cut" state, no self-service instant cancel for pre-cut, no refund trigger. Add `fulfilment_stage ('awaiting_cut','cut','dispatched')` and branch logic. |
| D4-4 | GST invoice PDF download | PARTIAL | — (no link: `grep "api/invoice"` → 0 UI hits) | `src/app/api/invoice/[id]/route.tsx:92-148` | RLS on `orders` | Route is IDOR-safe via RLS (`:97-106`), but nothing links to it, and the PDF is **not a Rule 46 tax invoice**: no supplier GSTIN, HSN, invoice serial, place of supply, tax split or UQC (`:33-89`). Rebuild in Step 4. |
| D4-5 | Emailed invoice | PARTIAL | — | `src/lib/email.ts:139-170`, `src/actions/orders.ts:165-189` | `pending_emails` (`0020`) | Durable queue + PDF attachment. Same Rule 46 gaps as D4-4. Retry cron runs only once per day (`vercel.json:47`). |
| D4-6 | Saved addresses | PARTIAL | `src/app/account/profile/page.tsx:60+` | `src/actions/profile.ts:6-55` | `profiles.saved_addresses JSONB` | `addressData: any` stored unvalidated and unbounded; read-modify-write race. Fix: Zod + `addresses` table with RLS, or a JSONB-append RPC with max count. |
| D4-7 | Swatch credit balance | MISSING | — | — | — | Depends on D2-7. |
| D4-8 | DPDP privacy controls (consent, withdrawal, erasure request) | MISSING | — | — | — | See D10-1. |

### D5 — Owner Inventory & Catalog CMS

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D5-1 | Roll-level available / reserved / committed metres | MISSING | `src/app/admin/inventory/page.tsx` | `src/actions/admin.ts:97-126` | single `stock_quantity` | Hard-decrement at order creation acts as the "reservation"; release relies on the broken cron (D6-7). Model three quantities on `fabric_rolls`. |
| D5-2 | Low-stock alerts | PARTIAL | `src/app/admin/dashboard/page.tsx:37-44` | — | — | Lists variants `< 20` on dashboard load; no notification and no per-variant threshold. |
| D5-3 | Atomic stock adjustments | **BUG** | `src/app/admin/inventory/page.tsx` | `src/actions/admin.ts:107-120`; `src/actions/orders.ts:293-296` | — | Read-then-write in JS (`newStock = current + adj`). Concurrent adjustments or a sale in between are lost. Fix: `UPDATE ... SET stock_quantity = stock_quantity + $adj WHERE id=$id AND stock_quantity + $adj >= 0 RETURNING`. |
| D5-4 | Product creation (GSM, weave, width, HSN, colour variants, macro media) | PARTIAL | `src/app/admin/products/new/page.tsx` | `src/actions/admin.ts:28-95` | `products`, `product_variants` | No HSN, no Zod validation, stock hard-coded to `50` (`:71`), and SKU suffix `Math.random()*1000` (`:68`) collides at scale (UNIQUE violation). Fix: Zod DTO, SKU from a sequence, initial stock from the form. |
| D5-5 | Product image upload validation (MIME + magic bytes + size + name) | **BUG** | `src/app/admin/products/[id]/EditProductForm.tsx` | `src/actions/admin.ts:427-453` | `product-images` public bucket (`0022`) | Accepts any `image/*` MIME, **including `image/svg+xml`** (`:434-437`), with no magic-byte check, into a public bucket. That allows stored script content. Fix: allow-list `jpeg/png/webp/avif`, verify magic bytes, re-encode with `sharp`. |
| D5-6 | Soft-archive without breaking orders | PASS | `src/app/admin/products/page.tsx` | `src/actions/admin.ts:384-417` | `0000:148` (`status='active' OR is_admin()`) | Archives when referenced, else hard-deletes. Minor: variants of archived products stay publicly readable (`0000:151`, `USING (true)`). |
| D5-7 | Remnant management | MISSING | — | — | — | Depends on D2-5. |
| D5-8 | Every admin page/action server-authorized via a `server-only` DAL | PARTIAL | `src/app/admin/{categories,collections,inventory,products,promotions,products/new}` have no server guard | `src/lib/auth-guard.ts` used by 7 pages only | — | No `src/lib/dal/` exists. Six admin screens rely on the proxy redirect plus RLS (client components writing via the anon client). Each server action re-checks role (`admin.ts:129-134`), but against the self-editable `profiles.role` (D1-10). Build `src/lib/dal/` with `import 'server-only'`, `requireOwner()`, and Zod DTOs. |

### D6 — Owner Orders, Payments, Refunds & Revenue Analytics

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D6-1 | Order status state machine | PARTIAL | `src/app/admin/orders/[id]/page.tsx` | `src/actions/orders.ts:9-28` | `order_status` enum | `status: string` written as given; any transition allowed (e.g. `delivered → pending`, `cancelled → paid`) with no restock or refund side-effects. Enforce allowed transitions in an RPC. |
| D6-2 | Cut-sheet dispatch view | MISSING | — | — | — | Needs roll and cut data (D2). |
| D6-3 | Cancellation approve / reject queue | PARTIAL | `src/app/admin/orders/[id]/page.tsx` | `src/actions/orders.ts:248-272` | `0031_fix_cancel_restock.sql:1-36` | Approve-and-restock exists. No reject path. `SELECT ... FROM orders` has **no `FOR UPDATE`** (`0031:15`), so two concurrent approvals each restock (double inventory). Add `FOR UPDATE` and a status guard in the `UPDATE ... WHERE status <> 'cancelled'`. |
| D6-4 | Automated Razorpay refund | MISSING | — | no refund API call anywhere (`grep refund` in `src/lib`) | — | Implement `refund_requests` (UNIQUE idempotency key) + `POST /v1/payments/:id/refund` with `X-Refund-Idempotency`. |
| D6-5 | GST Section 34 Credit Note | MISSING | — | — | — | Generate on any post-invoice refund; sequential CN series. |
| D6-6 | Partial / no-restock cancellation math | **BUG** | `src/app/admin/orders/[id]/page.tsx` | `src/actions/orders.ts:264,300-336` | `order_items.unit_price`, `orders.discount_applied`, `order_events(event, note)` | References non-existent columns: `item.price` (should be `unit_price`, so refund is `NaN`, `:302`), `order.total_discount` (`:300`), and `order_events.status/description` (`:264,332-336`). Inserts fail silently, and `orders.total_amount` gets rewritten with `NaN`-derived values. Move to a tested RPC. |
| D6-7 | Unpaid-order timeout releases stock | **BUG** | — | `src/app/api/cron/timeouts/route.ts:6-25` | `0029_domain_model_updates.sql:47-82` | (a) The function inserts `order_events(status, description)`, columns that don't exist (`0029:74`), so **every run errors and nothing is released**. (b) Not scheduled (`vercel.json` only lists `process-emails`). (c) If `CRON_SECRET` is unset, the header `Bearer undefined` passes (`route.ts:9`). (d) `SECURITY DEFINER` without `search_path`, default `PUBLIC` execute. Fix all four. |
| D6-8 | Gross vs Net revenue | **BUG** | `src/app/admin/dashboard/page.tsx:15-17,73-75` | — | — | "Gross revenue" sums `total_amount` of **all** orders including unpaid and cancelled; "+12.5% this month" is a hard-coded string. Also fetches every order row (no aggregate). Fix: SQL view (`security_invoker`) for paid, refunded and net; real period comparison. |
| D6-9 | CGST / SGST / IGST liability report | MISSING | — | — | — | Requires D3-7 snapshots. |
| D6-10 | COD vs Prepaid split, RTO analytics | MISSING | — | — | — | No COD method exists. |
| D6-11 | Payment confirmation bound to the right order & amount | **FIXED — DB live-verified 2026-11-22; app code not yet deployed** (`0041` + verify route) | `src/app/checkout/page.tsx:179-190` | `src/app/api/payment/razorpay/verify/route.ts:9-35` | `0032_strict_payment_verification.sql:27` | The signature covers `razorpay_order_id|razorpay_payment_id` only. The route **never checks that `razorpay_order_id` belongs to the `orderId`** in the body, and passes `p_amount = orders.total_amount` read from our own DB (`:23-29`). **Exploit:** pay for a ₹100 order, reuse that valid triple with `orderId` = any ₹50,000 order, and it's marked `paid`. The route is also unauthenticated. Fix: persist `razorpay_order_id` on create (D3-4), look it up and require equality, fetch the payment from the Razorpay API and record the *captured* amount. |
| D6-12 | Webhook HMAC over raw body, constant time, fail closed, deduped, async | PARTIAL — fail-open part FIXED IN CODE (2026-11-22); dedupe/async/consolidation still open | — | `src/lib/razorpay.ts:53-71`; `src/app/api/payment/razorpay/webhook/route.ts`; `src/app/api/webhooks/razorpay/route.ts`; `src/app/api/webhooks/payment/route.ts` | — | Raw body + `timingSafeEqual` ✔. **But:** `process.env.RAZORPAY_WEBHOOK_SECRET \|\| ''` and `RAZORPAY_KEY_SECRET \|\| ''` (`razorpay.ts:62,69`) let anyone forge an HMAC with an empty key if the env var is missing (fail-open, **Critical**). There are two parallel Razorpay webhook routes with different semantics. No `x-razorpay-event-id` dedupe table. Processing is synchronous. `webhooks/payment` accepts any amount/status behind a `!==` shared secret (`:16`). Fix: throw at boot if secrets are missing; keep one route; `webhook_events(event_id PRIMARY KEY)`; delete `webhooks/payment`. |
| D6-13 | `record_payment` idempotency | PARTIAL | — | — | `0032:31-44` | SELECT-then-INSERT with no UNIQUE constraint, so concurrent verify + webhook can double-insert. Add `UNIQUE (provider_payment_id, status)`. |

### D7 — Discount Coupons & Offers Engine

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D7-1 | Percent / flat / free-shipping types applied correctly | **BUG** | `src/app/checkout/page.tsx` | `src/actions/orders.ts:197-225` (preview) | `0030:76-82` | The live RPC has no `free_shipping` branch: it falls into `ELSE LEAST(value, subtotal)` and becomes a flat discount equal to its `value`. The preview (`validate_discount`, `0012:89-90`) shows ₹50 off shipping, so customers see one price and pay another. |
| D7-2 | Global usage limit (`max_uses`) | **BUG** | — | — | `0030:70-73` | `current_uses < max_uses` was dropped from the `WHERE` (present in `0019:115`), so single-use codes are **unlimited**. Restore and test with the Step 5 race. |
| D7-3 | Per-user limit | **BUG** | — | — | `discounts.max_uses_per_user` (`0000:86`) never read | Add `coupon_redemptions(discount_id, user_id, order_id, UNIQUE(discount_id, user_id, order_id))` + count check under `FOR UPDATE`. |
| D7-4 | Category/product-targeted coupons | **BUG** | — | — | `0030:76-83` | When `target_type <> 'all'` the reduction is 0, yet `current_uses` is incremented and the coupon is recorded on the order. Either implement targeting or reject non-`all` codes. |
| D7-5 | Start / end timestamps | PASS | — | — | `0030:73` | `starts_at <= now() AND (ends_at IS NULL OR ends_at > now())`. |
| D7-6 | Minimum cart value | PASS | — | — | `0030:75` | Enforced (silently ignored rather than erroring; acceptable). |
| D7-7 | Atomic redemption counter | PARTIAL | — | — | `0030:73,83` (`FOR UPDATE`) | Row lock is correct, but useless without the limit check (D7-2). |
| D7-8 | No code enumeration / brute force | PARTIAL | — | `src/actions/orders.ts:197-202` | `0012:49-104` | Public SELECT removed ✔. `validate_discount` is granted to `anon` with no rate limit, so codes can be brute-forced. Add Upstash limit in the server action and revoke from `anon`. |
| D7-9 | Admin coupon management (limits, dates, min order, per-user) | PARTIAL | `src/app/admin/promotions/page.tsx:34-52` | client-side Supabase | — | UI sets only code/type/value and **hard-deletes** (breaks D3-8). Add fields and soft-delete. |
| D7-10 | Non-stacking | PASS | — | `src/actions/orders.ts:129` | `0030:9` (single `p_discount_code`) | One code per order by construction. |

### D8 — Multi-Channel Lead CRM

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D8-1 | Contact Us ingestion (rate-limit → Turnstile → store + attribution) | PARTIAL | `src/app/contact/page.tsx` | `src/app/api/contact/route.ts:11-73` | `contact_inquiries` (`0034:2-29`) | Stored ✔. **No rate limit, no Turnstile, no length limits**. User input interpolated unescaped into the admin email HTML (`:45-54`, HTML injection/phishing into the owner's inbox). No `utm_*`/`gclid`/`fbclid`/`_fbp`/`_fbc`. **No admin screen reads `contact_inquiries`** (only `wholesale_applications` on the dashboard). |
| D8-2 | Meta Lead Ads webhook (GET verify, `X-Hub-Signature-256`, async Graph fetch, `UNIQUE(leadgen_id)`) | MISSING | — | — | — | Build per Step 4 §5. |
| D8-3 | Google Ads Lead Form webhook (`google_key`, `is_test`, `UNIQUE(lead_id)`) | MISSING | — | — | — | Build per Step 4 §5. |
| D8-4 | Unified `leads` + pipeline `New→Contacted→Swatch Sent→Qualified→Won/Lost`, assignee, notes | MISSING | — | — | — | `leads`, `lead_events` tables; owner-only RLS. |
| D8-5 | Cross-channel deduplication | MISSING | — | — | — | Normalised email/E.164 phone unique keys + merge log. |
| D8-6 | Closed-loop Meta CAPI / Google Data Manager | MISSING | — | — | — | Server-side event sender with shared `event_id`. |
| D8-7 | Sanitised CSV/XLSX export (formula injection) | MISSING | — | — | — | No export exists; when built, prefix `'` to cells starting `= + - @ \t \r`. |
| D8-8 | Wholesale (B2B) applications | PARTIAL | `src/app/wholesale/page.tsx`, `src/app/admin/dashboard/page.tsx:26-34` | `src/app/api/wholesale/route.ts:11-73` | `wholesale_applications` (`0034:33-70`) | Same input issues as D8-1 (unescaped HTML `:44-56`, no rate limit). Listed on dashboard; no review workflow found. |

### D9 — Communications & Tracking

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D9-1 | Transactional order email + PDF invoice | PARTIAL | — | `src/lib/email.ts:118-262`, `src/actions/orders.ts:165-189` | `pending_emails` (`0020`) | Durable queue with inline send ✔. Daily-only retry (`vercel.json:47`); invoice non-compliant (D4-4). |
| D9-2 | Shipped / delivered notifications | PASS | — | `src/actions/orders.ts:31-61` | `pending_emails` | Queued on status change. |
| D9-3 | WhatsApp Cloud API | PARTIAL | — | `src/lib/whatsapp.ts:1-36`, `src/lib/twilio.ts` | — | Sends free-form `type:'text'` messages (Meta rejects these outside the 24-hour window; templates required) on Graph `v17.0`. Admin alerts only, with a placeholder fallback number (`contact/route.ts:9`). |
| D9-4 | OTP via WhatsApp Auth template + DLT SMS fallback | MISSING | — | — | — | See D1-9. |
| D9-5 | Courier tracking / NDR notifications | MISSING | — | — | — | Depends on D4-2 shipments model. |
| D9-6 | Signed bounce / complaint webhooks; transactional stream isolation | MISSING | — | — | — | Resend webhook (Svix-signed) → suppress list. |
| D9-7 | Security alert email on lockout | PASS | — | `src/actions/auth.ts:36-38`, `src/lib/email.ts:11` | — | Works. Can be triggered against any address (see D1-3). |

### D10 — Privacy, Platform Security & Performance

| ID | Requirement | Status | UI File | Server/DAL File | DB Table/Migration | Exact Gap & Remediation Plan |
|---|---|---|---|---|---|---|
| D10-1 | DPDP unbundled consent (unchecked by default), withdrawal, erasure | MISSING | `src/app/signup/page.tsx` (no consent controls; `grep consent` → legal copy only) | — | — | Add `consent_logs` + purpose toggles; Privacy Rights Centre. |
| D10-2 | Retention separation (GST 6–8 yrs vs erasure) | PARTIAL | — | — | `orders.user_id ON DELETE SET NULL` (`0000:96`) | Orders survive user deletion ✔, but PII remains inside `shipping_address` JSONB. Needs a pseudonymisation job. |
| D10-3 | Seller GSTIN + grievance officer disclosure | PARTIAL | `src/components/Footer.tsx:59` (GSTIN) | — | — | GSTIN shown ✔. No grievance officer name/contact (E-Commerce Rules 2020 r.4/5). |
| D10-4 | Security headers (CSP, frame-ancestors, HSTS on all routes) | **BUG** | — | `next.config.ts:29-40`, `vercel.json:49-58`, `src/proxy.ts:15-17` | — | `X-Frame-Options` is **explicitly blanked** in two places, so `/admin` and checkout can be framed (clickjacking). No CSP. HSTS/nosniff set only by the proxy, which excludes `/api` (`proxy.ts:28`). Fix: `frame-ancestors 'none'` CSP + XFO `DENY` in `next.config.ts`. |
| D10-5 | No raw HTML sinks with user/admin data | PARTIAL | `src/app/product/[slug]/page.tsx:85`, `src/components/StructuredData.tsx:31-32` | — | — | `JSON.stringify` into `<script type="application/ld+json">` without escaping `<`. A product title containing `</script>` breaks out (admin-controlled; becomes customer-exploitable via D1-10). Escape `<` as `<`. |
| D10-6 | Rate limiting keyed on trustworthy client IP | PARTIAL | — | `src/lib/supabase/middleware.ts:22`, `src/lib/ratelimit.ts:23-25` | — | Uses raw `x-forwarded-for`. Vercel overwrites it (OK on Vercel), but it's spoofable elsewhere. Limiter is inert when Upstash is unset (`ratelimit.ts:18`). Prefer `request.ip` / `x-real-ip` from the platform. |
| D10-7 | `<0.8s` mobile LCP, `0ms` TBT, `0.00` CLS | PARTIAL (unmeasured) | `src/components/GlobalParallaxBackground.tsx`, `src/components/Motion.tsx`, `src/app/layout.tsx` | — | — | Not measured in this static pass (Step 6). Risks: `framer-motion` on most client components, a global parallax background, and the admin dashboard loading every order and order_item row (`dashboard/page.tsx:15,46-48`). |
| D10-8 | `tabular-nums` on prices / meterage | MISSING | `grep tabular-nums` → 0 hits | — | — | Add `tabular-nums` to all price, total and quantity text. |
| D10-9 | No unauthenticated mail-sending server actions | **BUG** (low) | — | `src/actions/checkout.ts:6-61` | — | Legacy mock `processCheckout` trusts client prices and emails an invoice to **any** address (`:46-54`). Only referenced by `api/stress-test` today; delete both. |
| D10-10 | Supabase key migration (`sb_publishable_*` / `sb_secret_*`) | PARTIAL | — | `src/lib/supabase/{client,server,admin}.ts` | — | Still uses legacy `ANON_KEY` / `SERVICE_ROLE_KEY` JWTs. Plan cut-over before legacy key deprecation. |
| D10-11 | No stale `SECURITY DEFINER` functions exposed to `PUBLIC` | **BUG** | — | — | `0001_checkout_processor.sql:2-52`, `0021_transactional_integrity.sql:7-42`, `0029:47-82`, `0006:2-27` | `checkout_processor(p_user_id, p_cart_id, …)` is SECURITY DEFINER with **default PUBLIC EXECUTE** and trusts `p_user_id`. Any anon caller can create orders for any user and empty any cart. `process_logistics_order` (broken, no `search_path`) and `cancel_expired_pending_orders` are also PUBLIC. `is_admin()` (`0000:133`) lacks `search_path`. Fix: `DROP FUNCTION` the dead ones; `REVOKE ALL ... FROM PUBLIC` + `SET search_path = ''` on the rest. |

---

## 3. Prioritized Top-10 Engineering Fix Queue

Ordered by revenue and security risk. Every item ships with a migration plus a failing-then-passing test (pgTAP for DB, Vitest for routes).

| Rank | Fix | Closes | Severity | Effort |
|---|---|---|---|---|
| 1 | **Lock the admin role.** `REVOKE UPDATE ON profiles FROM authenticated; GRANT UPDATE (full_name, phone, saved_addresses)`; add `WITH CHECK`; introduce `public.user_roles` + `custom_access_token_hook`; rewrite `is_admin()` (with `search_path=''`); remove the owner-email special-case from the trigger. | D1-10, D1-11, D5-8 | Critical | M |
| 2 | **Make order totals server-only.** Drop `"Users insert own orders"` / `"Users insert own order items"` policies; strip `p_tax_rate`, `p_shipping_amount`, `p_tax_amount_override` from `create_order_atomic`; compute GST in SQL; take shipping from a server-written `shipping_quotes` row; `REVOKE ALL FROM PUBLIC` / `GRANT EXECUTE TO authenticated`; restore the unique-violation idempotency handler. | D3-9, D3-10 | Critical | M |
| 3 | **Bind payment verification to our order.** Persist `orders.razorpay_order_id` (UNIQUE) in `create-order`; in `/verify` require it to match, fetch `GET /v1/payments/:id`, and pass the actual captured paise to `record_payment`; add `UNIQUE(provider_payment_id, status)` to `payments`. | D6-11, D3-4, D6-13 | Critical | S |
| 4 | **Fail closed on missing secrets.** Throw if `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` or `CRON_SECRET` is empty; consolidate to one Razorpay webhook with a `webhook_events(event_id PK)` dedupe table; delete `/api/webhooks/payment`; constant-time compare for logistics secret. | D6-12, D6-7(c), D4-2 | Critical | S |
| 5 | **Repair the coupon engine.** Restore the `max_uses` check, add `coupon_redemptions` with per-user UNIQUE, implement or reject targeted coupons, add a real `free_shipping` branch matching `validate_discount`, rate-limit + revoke `validate_discount` from anon, soft-delete in admin. | D7-1..4, D7-8, D7-9, D3-8 | High | M |
| 6 | **Purge or lock legacy RPCs.** `DROP FUNCTION checkout_processor, process_logistics_order`; fix `cancel_expired_pending_orders` (correct `order_events` columns, `search_path=''`, REVOKE PUBLIC); schedule it in `vercel.json`. | D10-11, D6-7 | High | S |
| 7 | **Close open redirects.** Shared `safeNextPath()` used by `login`, `register`, `signInWithGoogle`, and `/api/auth/callback`. | D1-7 | High | S |
| 8 | **Move cancellation/refund math into tested RPCs.** `cancel_order_restock` with `FOR UPDATE` + status guard; new `cancel_order_item(p_item_id, p_restock)` using correct columns; atomic `adjust_stock(variant, delta)`; enforce a status-transition matrix. | D6-1, D6-3, D6-6, D5-3 | High | M |
| 9 | **Restore browser hardening and input hygiene.** XFO `DENY` + CSP `frame-ancestors 'none'`; block SVG and verify magic bytes on uploads; escape JSON-LD; Upstash limit + Turnstile + HTML-escape on `/api/contact` and `/api/wholesale`; delete `actions/checkout.ts` and `api/stress-test`. | D10-4, D5-5, D10-5, D8-1, D8-8, D10-9 | High | S |
| 10 | **Immutable order snapshot and identity.** Add `customer_code` (sequence-backed, immutable); snapshot `sku, title, color, hsn_code, gst_rate, uqc, cgst, sgst, igst, place_of_supply_code, billing_address, discount_code` at order time; Zod-validate addresses in a new `src/lib/dal/`. | D1-2, D3-2, D3-3, D3-5, D3-7, D4-6 | High | L |

---

## 4. Feature Build-Out Backlog (not fixes; required by the product spec)

These are missing capabilities, not defects. Sequence them after the Top-10, since they depend on the corrected order and pricing core.

1. **Fabric precision core:** `NUMERIC(10,2)` meterage in `0.5m` steps, `fabric_rolls` with dye-lot, single-bolt continuity allocation, remnant lifecycle, swatch SKUs, swatch-credit ledger (D2-1..7, D5-1, D5-7, D6-2).
2. **GST-compliant documents:** HSN master, Rule 46 tax invoice with sequential FY serial, Section 34 credit notes, tax-liability reporting (D2-10, D4-4, D6-5, D6-9).
3. **Refunds:** `refund_requests` + Razorpay refund API with idempotency; pre-cut vs post-cut cancellation stages (D4-3, D6-4).
4. **Auth hardening:** Owner MFA (AAL2), OTP challenge service (WhatsApp auth template + DLT SMS fallback) (D1-8, D1-9, D9-4).
5. **Lead CRM:** unified `leads` / `lead_events`, Meta Lead Ads + Google Ads webhooks, dedupe, pipeline UI, CAPI / Data Manager, sanitised export (D8-2..7).
6. **Logistics:** shipments + AWB timeline, NDR alerts, COD + risk scoring, RTO analytics (D4-2, D6-10, D9-5).
7. **Compliance & UX:** DPDP consent/erasure centre, grievance officer disclosure, `tabular-nums`, real revenue analytics (D10-1..3, D10-8, D6-8).

---

## 5. Test & CI Baseline (observed)

- `.github/workflows/main.yml` runs only `npm ci`, `npm run lint` and `npm run build`. No unit, integration, E2E, pgTAP or dependency audit.
- `tests/integration/rls.test.ts` and `order-rpc.test.ts` exist but `describe.skipIf(!haveTestDb)`, so they never run in CI. They also do not cover role self-escalation, client-controlled RPC pricing, or coupon limits.
- No `supabase/tests/*.sql` (pgTAP) suite exists.

## 6. Next Audit Steps

- **Step 2 (static security & supply chain):** confirm D1-7, D5-5, D6-11, D6-12 and D10-4, and check dependency CVEs (`npm audit`; Next `16.2.6` / React `19.2.4` look past the React2Shell and middleware-bypass fixes, but must be verified against current advisories).
- **Step 3 (pgTAP):** turn every DB finding here into a failing proof against a local or branch database: D1-10, D3-9, D7-2/3, D10-11, D6-3.
- **Step 5 (red-team):** exercise D3-9 (₹1 order), D6-11 (cross-order verify) and D7-2 (coupon race) end-to-end on localhost.
