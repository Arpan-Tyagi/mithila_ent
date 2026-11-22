-- Schema-wide invariants from CLAUDE.md "PostgreSQL RLS & Minimal Grants".
-- Each test lists the offending objects, so a failure says exactly what to fix.
-- Run: npx supabase test db   (local Docker stack only, never production)
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(11);

-- 1. Every table in public has RLS enabled (Splinter 0013).
SELECT is(
  (SELECT array_agg(c.relname::text ORDER BY c.relname)
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity),
  NULL,
  'every public table has RLS enabled'
);

-- 2. RLS never governs TRUNCATE, so anon/authenticated must not hold it.
SELECT is(
  (SELECT array_agg(format('%s:%s', c.relname, r.role) ORDER BY 1)
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     CROSS JOIN (VALUES ('anon'), ('authenticated')) r(role)
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
      AND has_table_privilege(r.role, c.oid, 'TRUNCATE')),
  NULL,
  'no public table grants TRUNCATE to anon or authenticated'
);

-- 3. Minimal grants: a write privilege with no policy that could ever allow it
--    is excess (it only waits for a policy mistake).
SELECT is(
  (SELECT array_agg(format('%s:%s:%s', c.relname, r.role, p.priv) ORDER BY 1)
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     CROSS JOIN (VALUES ('anon'), ('authenticated')) r(role)
     CROSS JOIN (VALUES ('INSERT'), ('UPDATE'), ('DELETE')) p(priv)
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
      AND has_table_privilege(r.role, c.oid, p.priv)
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies pol
         WHERE pol.schemaname = 'public' AND pol.tablename = c.relname
           AND pol.cmd IN (p.priv, 'ALL')
           AND pol.roles && ARRAY['public', r.role]::name[])),
  NULL,
  'anon/authenticated hold no INSERT/UPDATE/DELETE that no policy can use'
);

-- 4. Views run with the caller's rights (Splinter 0010).
SELECT is(
  (SELECT array_agg(c.relname::text ORDER BY c.relname)
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
      AND NOT COALESCE('security_invoker=on' = ANY (c.reloptions)
                    OR 'security_invoker=true' = ANY (c.reloptions), false)),
  NULL,
  'every public view is security_invoker'
);

-- 5. SECURITY DEFINER functions pin an empty search_path.
SELECT is(
  (SELECT array_agg(format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) ORDER BY 1)
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
      AND NOT COALESCE('search_path=""' = ANY (p.proconfig), false)),
  NULL,
  'every SECURITY DEFINER function in public sets search_path = '''''
);

-- 6. No policy trusts client-editable user metadata (Splinter 0015).
SELECT is(
  (SELECT array_agg(format('%s.%s', schemaname, policyname) ORDER BY 1)
     FROM pg_policies
    WHERE COALESCE(qual, '') || COALESCE(with_check, '') ~* '(user_metadata|raw_user_meta_data)'),
  NULL,
  'no RLS policy reads user_metadata'
);

-- 7-8. Admin role comes from a locked user_roles table via the JWT hook.
SELECT has_table('public', 'user_roles', 'public.user_roles exists (RBAC source of truth)');
SELECT has_function('public', 'custom_access_token_hook', ARRAY['jsonb'],
                    'public.custom_access_token_hook(jsonb) exists');

-- 9. auth.uid()/auth.jwt() in policies is wrapped in (select ...) so it runs once.
SELECT is(
  (SELECT array_agg(format('%s.%s', tablename, policyname) ORDER BY 1)
     FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND regexp_replace(COALESCE(qual, '') || ' ' || COALESCE(with_check, ''),
                         'SELECT auth\.(uid|jwt)\(\)', '', 'g') ~ 'auth\.(uid|jwt)\(\)'),
  NULL,
  'every auth.uid()/auth.jwt() in a policy is wrapped in (select ...)'
);

-- 10-11. Server-only functions cannot be called with the anon or a user key.
SELECT is(
  (SELECT array_agg(DISTINCT p.proname::text ORDER BY p.proname::text)
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('auth_attempt_clear', 'auth_attempt_is_locked', 'auth_attempt_record_failure',
                        'cancel_expired_pending_orders', 'cancel_order_restock', 'checkout_processor',
                        'create_order_atomic', 'record_payment', 'process_logistics_order',
                        'decrement_inventory_atomic', 'handle_new_user', 'log_order_event')
      AND has_function_privilege('anon', p.oid, 'EXECUTE')),
  NULL,
  'anon cannot execute server-only functions'
);
SELECT is(
  (SELECT array_agg(DISTINCT p.proname::text ORDER BY p.proname::text)
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('auth_attempt_clear', 'auth_attempt_is_locked', 'auth_attempt_record_failure',
                        'cancel_expired_pending_orders', 'cancel_order_restock', 'checkout_processor',
                        'create_order_atomic', 'record_payment', 'process_logistics_order',
                        'decrement_inventory_atomic', 'handle_new_user', 'log_order_event')
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')),
  NULL,
  'authenticated cannot execute server-only functions'
);

SELECT * FROM finish();
ROLLBACK;
