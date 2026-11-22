-- Carts and cart items (user carts by auth.uid(), guest carts by the
-- session_id JWT claim).
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(9);

CREATE FUNCTION pg_temp.act_as(p_role text, p_sub uuid DEFAULT NULL, p_session text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', p_sub, 'role', p_role, 'session_id', p_session)::text, true);
  PERFORM set_config('role', p_role, true);
END $$;

CREATE FUNCTION pg_temp.attempt(p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n || ' rows';
EXCEPTION WHEN insufficient_privilege THEN
  RETURN 'denied';
END $$;

INSERT INTO auth.users (instance_id, id, aud, role, email) VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'customer-a@example.test'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'customer-b@example.test');
INSERT INTO public.products (id, slug, title, status) VALUES
  ('d1000000-0000-4000-8000-000000000001', 'pgtap-cart-silk', 'pgTAP Cart Silk', 'active');
INSERT INTO public.product_variants (id, product_id, sku, color, price) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'PGTAP-CART', 'Ivory', 900);
INSERT INTO public.carts (id, user_id, session_id) VALUES
  ('c1000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', NULL),
  ('c9000000-0000-4000-8000-000000000009', NULL, 'guest-session-1');
INSERT INTO public.cart_items (cart_id, variant_id, quantity) VALUES
  ('c1000000-0000-4000-8000-00000000000a', 'e1000000-0000-4000-8000-000000000001', 1);

SELECT pg_temp.act_as('authenticated', '11111111-1111-4111-8111-111111111111');
SELECT is((SELECT count(*) FROM public.carts), 1::bigint, 'customer_a sees own cart');
SELECT is((SELECT count(*) FROM public.cart_items), 1::bigint, 'customer_a sees own cart items');
RESET ROLE;

SELECT pg_temp.act_as('authenticated', '22222222-2222-4222-8222-222222222222');
SELECT is((SELECT count(*) FROM public.carts), 0::bigint, 'customer_b cannot see other carts');
SELECT throws_ok(
  $$INSERT INTO public.cart_items (cart_id, variant_id, quantity)
    VALUES ('c1000000-0000-4000-8000-00000000000a', 'e1000000-0000-4000-8000-000000000001', 99)$$,
  '42501', NULL, 'customer_b cannot add items to customer_a''s cart');
SELECT throws_ok(
  $$INSERT INTO public.carts (user_id) VALUES ('11111111-1111-4111-8111-111111111111')$$,
  '42501', NULL, 'customer_b cannot create a cart owned by customer_a');
SELECT ok(pg_temp.attempt($$DELETE FROM public.cart_items$$) IN ('denied', '0 rows'),
          'customer_b cannot empty other carts');
RESET ROLE;

SELECT pg_temp.act_as('anon', NULL, 'guest-session-1');
SELECT is((SELECT count(*) FROM public.carts), 1::bigint, 'guest sees own session cart');
RESET ROLE;
SELECT pg_temp.act_as('anon', NULL, 'guest-session-2');
SELECT is((SELECT count(*) FROM public.carts), 0::bigint, 'another guest session sees no carts');
RESET ROLE;
SELECT is((SELECT count(*) FROM public.cart_items), 1::bigint, 'cart items intact');

SELECT * FROM finish();
ROLLBACK;
