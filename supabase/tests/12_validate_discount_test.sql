-- Migration 0049: validate_discount is server-only (red-team RT-01).
-- Run: npx supabase test db   (local Docker stack only, never production)
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(4);

SELECT ok(NOT has_function_privilege('anon', 'public.validate_discount(text, numeric)', 'EXECUTE'),
          'anon cannot call validate_discount (no coupon enumeration)');
SELECT ok(NOT has_function_privilege('authenticated', 'public.validate_discount(text, numeric)', 'EXECUTE'),
          'signed-in customers cannot call validate_discount directly');
SELECT ok(has_function_privilege('service_role', 'public.validate_discount(text, numeric)', 'EXECUTE'),
          'the server (service_role) can call validate_discount');

INSERT INTO public.discounts (code, type, value, target_type, is_active)
VALUES ('PGTAP10', 'percentage', 10, 'all', true);
SELECT is((public.validate_discount('pgtap10', 1000) ->> 'discountAmount')::numeric, 100.00::numeric,
          'validation still works for the server: 10% of 1000');

SELECT * FROM finish();
ROLLBACK;
