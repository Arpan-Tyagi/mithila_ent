---
name: rls-pgtap-verifier
description: Audits Supabase PostgreSQL Row Level Security policies, table grants, SECURITY DEFINER views/functions, RBAC JWT hooks, and Storage bucket policies, then writes and runs automated pgTAP SQL proof tests. Use when verifying database isolation, preventing cross-user data leaks, or auditing Supabase security.
context: fork
agent: general-purpose
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(supabase *), Bash(psql *)
---

# Supabase RLS, Grants & pgTAP Automated Proof Verifier

Execute this workflow strictly against local Docker Supabase or an isolated staging branch—never production.

## Step 1: Static Schema & Migration Inventory

1. Scan `supabase/migrations/**/*.sql` to list every table, view, function, trigger, and storage bucket in exposed schemas (`public`, `storage`).
2. Flag any table missing `ENABLE ROW LEVEL SECURITY` (Splinter Lint `0013`) or missing explicit `REVOKE ALL ... FROM anon, authenticated` (specifically verifying whether `TRUNCATE` remains granted).
3. Flag any `CREATE POLICY` using `USING (true)` or `WITH CHECK (true)` on non-public tables (Lint `0024`), missing `WITH CHECK` on `INSERT`/`UPDATE`, referencing editable `user_metadata` (Lint `0015`), or un-wrapped `auth.uid()` (require `(select auth.uid())` + B-tree index on policy filter columns).
4. Flag any `CREATE VIEW` in `public` lacking `WITH (security_invoker = on)` (Lint `0010`) and any `SECURITY DEFINER` function missing `SET search_path = ''` or internal authorization checks.
5. Verify RBAC reads a locked `public.user_roles` table via `custom_access_token_hook` with `REVOKE ALL` from `anon`/`authenticated`.
6. Audit `storage.objects` policies for private buckets (`invoices`, `credit-notes`, `kyc`, `exports`).

## Step 2: Generate & Execute pgTAP Proofs

For every sensitive table (`profiles`, `orders`, `order_items`, `fabric_rolls`, `coupons`, `coupon_redemptions`, `leads`, `lead_events`, `otp_challenges`, `refund_requests`, `credit_notes`, `user_roles`, `consent_logs`), generate or update `supabase/tests/<table_name>_rls_test.sql` inside a `BEGIN; ... ROLLBACK;` transaction testing 4 distinct personas:

- `anon` (signed-out visitor)
- `customer_a` (row owner — must PASS reads/allowed writes first so empty tables never produce false passes)
- `customer_b` (horizontal attacker — must observe 0 rows on SELECT and zero-row / `42501` denial on UPDATE/DELETE/INSERT)
- `owner_admin` (verified RBAC claim — must PASS authorized CRM operations)

Include explicit assertions verifying `not has_table_privilege('anon', 'public.<table>', 'truncate')` and `not has_table_privilege('authenticated', 'public.<table>', 'truncate')`.

## Step 3: Run Live Linter & Test Suite

Run `supabase db reset && supabase test db` and `supabase db advisors` (Splinter). Report exact pass/fail counts, every Splinter ERROR/WARN, and exact SQL migration fixes.
