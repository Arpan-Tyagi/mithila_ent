# RLS, Grants and pgTAP Proof (Runbook Step 3)

> **Do not commit this file while the gaps below are open.** `Arpan-Tyagi/mithila_ent` is public.

| | |
|---|---|
| Date | 2026-11-22 |
| Code | `main` at `831ba8d` plus the uncommitted test suite in `supabase/tests/` |
| Test target | Local Docker stack only (Supabase CLI 3.2.0, Postgres 17.12, `127.0.0.1:54322`). No test ran against production. |
| Production access | Read-only catalog queries only (schema snapshot, function bodies, enums, Realtime publications). Nothing written. |
| Skills | `rls-pgtap-verifier` steps 1-3 (run inline), `supabase-postgres-best-practices`, `security-audit` (supabase) |

## 1. Is the local database the same as production?

Yes, for everything security-relevant. The same snapshot query was run on both sides and compared element by element (an md5 hash per element):

- Elements covered: every public table with its RLS flags; every `anon`/`authenticated` table grant; every public and storage policy, with its full `USING`/`WITH CHECK` text; every public view; every public function, with its definer flag, `search_path` and `anon`/`authenticated` EXECUTE rights; every trigger on `public` and `auth`; every storage bucket.
- Local, built from the 43 migrations: **111** elements. Production: **112**.
- All 111 local elements are identical in production.
- The one extra element in production is `rls_auto_enable()`. It is created by the Supabase platform, not by a migration.

So the local test results below hold for production, with one exception. `rls_auto_enable()` would add one entry to test 01.5 in production: it is SECURITY DEFINER with `search_path=pg_catalog`.

## 2. Test suite

The suite has 7 files and 94 assertions. Each file runs in `BEGIN … ROLLBACK`.

Every data test uses 4 personas:
- `anon`;
- `customer_a`, the row owner;
- `customer_b`, the horizontal attacker;
- `owner_admin`, whose `profiles.role` is `admin`.

The owner's own access is asserted first, so an empty table can never produce a false pass.

When an attacker tries to write, the test accepts either outcome, "0 rows" or "permission denied". It then re-reads the row as `postgres` to prove nothing changed. Because either outcome passes, the tests keep passing after the excess grants are revoked.

| File | Covers | Result |
|---|---|---|
| `01_schema_invariants_test.sql` | RLS on, no TRUNCATE, minimal grants, `security_invoker` views, definer `search_path`, no `user_metadata`, `user_roles` + hook, `(select auth.uid())`, server-only function EXECUTE | 3/11 pass |
| `02_orders_isolation_test.sql` | `orders`, `order_items`, `payments`, `order_events`; direct order insert; repricing; cancellation RPC; TRUNCATE | 21/24 pass |
| `03_profiles_rbac_test.sql` | own-profile read/update, self-promotion to admin, admin profile insert, `is_admin()` | **13/13 pass** |
| `04_catalog_discounts_test.sql` | active vs draft catalog, discount code secrecy, owner-only catalog writes | 15/16 pass |
| `05_leads_internal_test.sql` | Contact Us / wholesale inboxes, `auth_attempts`, `pending_emails`, TRUNCATE | 12/14 pass |
| `06_storage_test.sql` | `product-images` read/write by role, MIME and size limits, no other public bucket | 5/7 pass |
| `07_carts_test.sql` | user carts, guest carts by `session_id` claim, cross-cart writes | **9/9 pass** |

### Exact output (`npx supabase test db`, second run)

The first run had a test-order bug. `05` ran anon's TRUNCATE before the owner read, so the owner read also failed, as a knock-on effect. I moved the destructive check to the end and re-ran. This is the result of that second run:

```
01_schema_invariants_test.sql .. Failed 8/11 subtests   (tests 2-3, 5, 7-11)
02_orders_isolation_test.sql ... Failed 3/24 subtests   (tests 22-24)
03_profiles_rbac_test.sql ...... ok
04_catalog_discounts_test.sql .. Failed 1/16 subtests   (test 2)
05_leads_internal_test.sql ..... Failed 2/14 subtests   (tests 13-14)
06_storage_test.sql ............ Failed 2/7 subtests    (tests 2-3)
07_carts_test.sql .............. ok
Files=7, Tests=94, 4 wallclock secs
Result: FAIL
```

Passed: **78 / 94**. Failed: **16 / 94**. Every failure maps to a gap in section 4; none is a test error.

Failure detail, verbatim:

```
# Failed test 2: "no public table grants TRUNCATE to anon or authenticated"
#   have: {carts, cart_items, discounts, products, store_settings, payments, order_events, site_content,
#          collections, product_collections, product_variants, categories, contact_inquiries,
#          wholesale_applications} x {anon, authenticated}
# Failed test 3: "anon/authenticated hold no INSERT/UPDATE/DELETE that no policy can use"
#   have: {order_events:anon+authenticated:INSERT,UPDATE,DELETE, payments:anon+authenticated:INSERT,UPDATE,DELETE,
#          carts:anon+authenticated:DELETE, contact_inquiries:anon+authenticated:UPDATE,DELETE,
#          wholesale_applications:anon+authenticated:DELETE}
# Failed test 5: "every SECURITY DEFINER function in public sets search_path = ''"
#   have: {log_order_event(), log_payment_intent(uuid), request_order_cancellation(uuid),
#          process_logistics_order(uuid,uuid,integer,numeric), handle_new_user(), record_payment(…8 args),
#          cancel_order_restock(uuid), checkout_processor(uuid,uuid,jsonb,text)}
# Failed test 7: "public.user_roles exists (RBAC source of truth)"
# Failed test 8: "public.custom_access_token_hook(jsonb) exists"
# Failed test 9: "every auth.uid()/auth.jwt() in a policy is wrapped in (select ...)"   (17 policies)
# Failed test 10/11: "anon|authenticated cannot execute server-only functions"  have: {decrement_inventory_atomic}
# 02 Failed test 22: "anon cannot TRUNCATE payments"            caught: no exception, wanted: 42501
# 02 Failed test 23: "customer_b cannot TRUNCATE order_events"  caught: no exception, wanted: 42501
# 02 Failed test 24: "payments intact after TRUNCATE attempts"  have: 0, want: 2
# 04 Failed test 2: "anon cannot read variants (price/SKU) of a draft product"  have: 1, want: 0
# 05 Failed test 13: "anon cannot TRUNCATE leads"               caught: no exception, wanted: 42501
# 05 Failed test 14: "lead survives the delete and truncate attempts"  have: 0, want: 1
# 06 Failed test 2: "product-images restricts MIME types"        have: NULL
# 06 Failed test 3: "product-images has a file size limit"       have: NULL
```

## 3. What is proven (PASS, with evidence)

| Requirement | Evidence |
|---|---|
| Horizontal isolation on orders, items, payments and events: B reads 0 of A's rows; B's UPDATE/DELETE change nothing | `02` tests 9-16 |
| Customers cannot create or reprice orders directly | `02` tests 5, 6, 8 (insert → 42501; own-order update changes nothing) |
| Cancellation RPC refuses other users' orders; anon cannot call it | `02` tests 7, 19 |
| anon reads no orders or payments; the owner reads all | `02` tests 17-18, 20-21 |
| No vertical escalation: a customer cannot set `role=admin` or insert an admin profile; sign-up gets `retail` | `03` tests 1, 5, 7, 10 |
| Profile isolation; `is_admin()` correct for both personas | `03` tests 2-3, 6, 9, 11-13 |
| Discount codes are unreadable by anon and customers; validation of a known code still works | `04` tests 3-4, 6 |
| Only the owner writes the catalog (products, variants, categories, discounts) | `04` tests 5, 7-12, 15-16 |
| Leads and wholesale applications are write-only for visitors and readable by the owner | `05` tests 1-5, 8-9, 11-12 |
| `auth_attempts` and `pending_emails` are unreadable by anon and customers (42501) | `05` tests 6-7, 10 |
| Only the owner uploads product images | `06` tests 4-6 |
| Cart isolation for users and guest sessions | `07` tests 1-9 |
| RLS is enabled on all 19 public tables (Splinter 0013 clean) | `01` test 1 |
| No views in public, so no Splinter 0010 exposure | `01` test 4; `pg_views` count = 0 |
| No policy reads `user_metadata` (Splinter 0015 clean) | `01` test 6 |
| No public table is published to Realtime (local and production) | `pg_publication_tables` for `supabase_realtime` = none |
| Invoice download cannot leak another customer's invoice: `/api/invoice/[id]` reads the order with the user's session, so RLS returns no row and the route returns 404 | `src/app/api/invoice/[id]/route.tsx:95-109` + `02` test 9 |
| `decrement_inventory_atomic` called as anon cannot change stock (SECURITY INVOKER, RLS blocks it) | Rolled-back local check: `anon_call=false`, `stock_after=10` |

## 4. Gaps (FAIL), by priority

Severity follows the exploitability rubric (`owasp-security`). "Invariant" means CLAUDE.md requires the fix even where no remote exploit exists.

| ID | Severity | Gap | Evidence | Exact fix |
|---|---|---|---|---|
| RLS-01 | Low (no remote path) · **Invariant 2, release blocker** | `TRUNCATE` (plus `REFERENCES`, `TRIGGER`) is granted to anon and authenticated on 14 tables. RLS never applies to TRUNCATE: a session running as anon emptied `payments` and `contact_inquiries`. PostgREST and pg_graphql expose no TRUNCATE, and no anon-callable function runs dynamic SQL, so there is no remote path today. | `01` t2; `02` t22-24; `05` t13-14 | `REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;` plus `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;` so new tables do not get them. |
| RLS-02 | Low · Invariant 2 | Write grants that no policy can ever use: `payments` and `order_events` (INSERT/UPDATE/DELETE), `carts` (DELETE), `contact_inquiries` (UPDATE/DELETE), `wholesale_applications` (DELETE). RLS denies them today; one permissive policy added later would open them. | `01` t3; attacker writes in `02` t13-16 change nothing | `REVOKE INSERT, UPDATE, DELETE ON public.payments, public.order_events FROM anon, authenticated;` `REVOKE DELETE ON public.carts, public.wholesale_applications FROM anon, authenticated;` `REVOKE UPDATE, DELETE ON public.contact_inquiries FROM anon, authenticated;` Safe for the app: `order_events` is written with the service-role client (`src/actions/orders.ts:267,276,344`), and `log_payment_intent` is SECURITY DEFINER. |
| RLS-03 | Low | Unpublished product data leaks: `product_variants` policy `Public read variants` is `USING (true)`, so anon can read the SKU, price and stock of **draft** products. | `04` t2 | Replace it with `USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'active') OR (select public.is_admin()))`. |
| RLS-04 | Low (SEC-11) | `product-images` bucket: `allowed_mime_types` and `file_size_limit` are NULL (any type, up to the 50 MiB project cap). | `06` t2-3 | `UPDATE storage.buckets SET allowed_mime_types = '{image/jpeg,image/png,image/webp,image/avif}', file_size_limit = 5242880 WHERE id = 'product-images';` |
| RLS-05 | Low · Invariant 2 | 8 SECURITY DEFINER functions use `search_path=public` (7) or none (`process_logistics_order`). Not reachable for object shadowing through the API (no anon/user can create objects or temp tables via PostgREST). | `01` t5; Splinter `function_search_path_mutable` | Rewrite each body with schema-qualified names and `SET search_path = ''`. Drop `checkout_processor` and `process_logistics_order` if they are unused (no call in `src/`; the only mention is a comment at `src/app/api/logistics/route.ts:34`). |
| RLS-06 | Low · Invariant 2 (= SEC-13) | No `public.user_roles` table or `custom_access_token_hook`. The admin role lives in `profiles.role`. That column is locked since 0039 (`03` t5, t7 pass), so this is non-compliance, not an exploit. | `01` t7-8 | Create `user_roles` (REVOKE ALL from anon/authenticated) and the hook, seeded by user id; point `is_admin()` at it; remove the e-mail CASE from `handle_new_user`. Separate migration, with the hook enabled in the dashboard. |
| RLS-07 | Info | `decrement_inventory_atomic` is EXECUTE-able by anon and authenticated. It is harmless (SECURITY INVOKER, so RLS blocks it; proven above) and unused in `src/`. | `01` t10-11 | `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated;` or drop it. |
| RLS-08 | Performance | 17 policies call `auth.uid()`/`auth.jwt()` unwrapped, so the function runs once per row (Splinter `auth_rls_initplan`, 17 WARN). There are also 40 `multiple_permissive_policies` WARN on catalog/CMS tables. | `01` t9; advisors | `ALTER POLICY … USING ((select auth.uid()) = user_id)` for each of the 17 policies. Merge the public-read and admin-ALL policies per table into one SELECT policy. Add B-tree indexes on the policy filter columns if any are missing (`orders.user_id`, `order_items.order_id`, `payments.order_id`, `order_events.order_id`, `carts.user_id`, `cart_items.cart_id`). |

## 4a. Fix status: migration 0044 (local only, 2026-11-22)

`supabase/migrations/0044_minimal_grants_and_policy_hardening.sql` covers RLS-01, 02, 03, 04, 07 and 08 (the 17 `ALTER POLICY` wraps; the 40 `multiple_permissive_policies` merges are not in it). It was proven on the local stack first (`npx supabase db reset --local`). With the owner's approval, it was then **applied to production on 2026-11-22**, as `supabase_migrations.schema_migrations` version `20261122112249`.

**Production checks after apply (read-only):**
- 0 TRUNCATE grants to anon/authenticated.
- `payments` and `order_events` keep only SELECT for anon/authenticated.
- `Public read variants` now requires `p.status = 'active' OR is_admin()`.
- The `product-images` bucket accepts `image/jpeg,png,webp,avif` up to 5242880 bytes. Existing objects were all in the allowed types before the change (largest 121,997 bytes).
- anon cannot EXECUTE `decrement_inventory_atomic`.
- 0 policies have unwrapped `auth.uid()`/`auth.jwt()`.
- In a read-only transaction as anon: 46 categories readable, 0 leads readable, and INSERT on `contact_inquiries`/`wholesale_applications` still granted. The live catalog currently has 0 products, so product and variant reads were not exercised there.

Production security advisors after apply:
- `function_search_path_mutable`: `process_logistics_order` (RLS-05).
- SECURITY DEFINER callable lints for `is_admin`, `validate_discount` (the coupon check), `log_payment_intent` and `request_order_cancellation`. These are intended, and covered by the pgTAP suite.
- `rls_auto_enable`: a dashboard event-trigger function (returns `event_trigger`; it cannot be called through RPC).
- `rls_enabled_no_policy` INFO on `auth_attempts`/`pending_emails`. These are server-only by design.
- Leaked-password protection disabled, which is a dashboard setting.

**pgTAP after 0044** (`npx supabase test db`, third run): `Files=7, Tests=94`, **91 pass, 3 fail**. 02-07 all `ok`. The only failures are the deferred items:

```
01_schema_invariants_test.sql  Failed tests: 5, 7-8
# Failed test 5: "every SECURITY DEFINER function in public sets search_path = ''"   -> RLS-05 (same 8 functions)
# Failed test 7: "public.user_roles exists (RBAC source of truth)"                    -> RLS-06
# Failed test 8: "public.custom_access_token_hook(jsonb) exists"                      -> RLS-06
```

| ID | Status | Evidence |
|---|---|---|
| RLS-01 TRUNCATE/REFERENCES/TRIGGER | FIXED (local) | `01` t2; `02` t22-24 (payments intact, 2 rows); `05` t13-14 |
| RLS-02 excess write grants | FIXED (local) | `01` t3. Only SELECT is left on `payments` and `order_events` for anon/authenticated. |
| RLS-03 draft variant read | FIXED (local) | `04` t2 (anon sees 0 draft variants). The owner still sees a draft variant; a customer sees it once the product is active (rolled-back check). |
| RLS-04 bucket limits | FIXED (local) | `06` t2-3. Local Storage API: SVG → HTTP 400 `invalid_mime_type` (415); 6 MB PNG → HTTP 400 `Payload too large` (413); small PNG → 200 (test object deleted). |
| RLS-07 decrement_inventory_atomic | FIXED (local) | `01` t10-11 |
| RLS-08 unwrapped auth calls | FIXED (local) | `01` t9; Splinter `auth_rls_initplan` 17 → 0 |
| RLS-05, RLS-06 | OPEN (deferred) | `01` t5, t7-8 |

**App flows re-checked locally** (rolled-back SQL as each role):
- anon Contact Us and wholesale inserts work (`05` t1-2).
- The owner can insert and update draft products and variants, and read leads.
- A customer calls `log_payment_intent` (SECURITY DEFINER) and reads their own order and payment.
- The service role still inserts `order_events` and `payments`.

**Side effects to know:**
- The admin image upload (`src/actions/admin.ts:437-454`, inputs `accept="image/*"`) now rejects SVG, GIF and files over 5 MB.
- Invoices join the live catalog (`src/app/api/invoice/[id]/route.tsx:101`). For a product that is no longer active, the colour is now hidden as well as the title, which `products` RLS already hid. The line prints "Fabric".

**Found while checking (not caused by 0044):** `src/actions/orders.ts:276` and `:344` insert `order_events` with `status` and `description` columns that do not exist; the table has `event, from_status, to_status, note`. The errors are not checked, so admin cancellation and refund events are never recorded.

## 5. Splinter advisors (`npx supabase db advisors`, local)

**After 0044:** 0 ERROR, 43 WARN. These are 40 `multiple_permissive_policies`, 1 `function_search_path_mutable` (RLS-05) and 2 `rls_policy_always_true` (intended). `auth_rls_initplan` is gone.

Before 0044 there were **0 ERROR** and 60 WARN:

| Count | Level | Lint | Tables / functions | Covered by |
|---|---|---|---|---|
| 17 | WARN (performance) | `auth_rls_initplan` | carts, cart_items, profiles, orders, order_items, payments, order_events, collections, product_collections, contact_inquiries, wholesale_applications | RLS-08 |
| 40 | WARN (performance) | `multiple_permissive_policies` | categories, collections, product_collections, product_variants, products, profiles, site_content, store_settings | RLS-08 |
| 1 | WARN (security) | `function_search_path_mutable` | `process_logistics_order` | RLS-05 |
| 2 | WARN (security) | `rls_policy_always_true` | contact_inquiries, wholesale_applications (anon INSERT for the public forms) | Intended today; SEC-06 (rate limit, length checks, or a server-side insert) |

Splinter does not check TRUNCATE grants or `search_path=public` (only a missing one). Those come from the pgTAP tests (RLS-01, RLS-05).

## 6. Other Step 3 items

| Item | Status | Evidence |
|---|---|---|
| Sensitive routes use `getUser()`, not bare `getClaims()` | PASS | No `getClaims` anywhere in `src/`. `getSession()` is used only for client-side UI state (`src/app/checkout/page.tsx:41`, `src/components/AuthCallbackCatcher.tsx:24`). Server code calls `getUser()`: 11 calls in `src/actions/` (admin 3, checkout 1, orders 5, profile 2) and 8 files under `src/app/`. |
| Legacy JWT keys → `sb_publishable_*` / `sb_secret_*` | NOT READY | Code reads `NEXT_PUBLIC_SUPABASE_ANON_KEY` (4 places) and `SUPABASE_SERVICE_ROLE_KEY` (5 places). The switch is an env-var swap plus the new keys from the dashboard; no code change is needed beyond the variable names. |
| Private Storage buckets (invoices, credit notes, exports) | N/A today | No private bucket exists; invoices are rendered on request from RLS-protected rows (section 3). Add tests to `06_storage_test.sql` if one is created. |
| Spec tables from the report not in the schema | MISSING (product scope) | `fabric_rolls`, `coupon_redemptions`, `leads`/`lead_events`, `otp_challenges`, `refund_requests`, `credit_notes`, `user_roles`, `consent_logs`. Their RLS tests should be added when each table is built (Step 1 backlog). |

## 7. How to reproduce

```
npx supabase start          # Docker Desktop running; applies all 44 migrations
npx supabase test db        # pgTAP suite in supabase/tests/
npx supabase db advisors    # Splinter lints (local is the default)
```
