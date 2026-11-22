-- 0044: minimal grants and policy hardening (docs/RLS_PGTAP_PROOF.md
-- RLS-01, 02, 03, 04, 07, 08). Proven by supabase/tests/*.sql.
--
-- Not in scope here (later migrations):
--   RLS-05  SECURITY DEFINER functions without search_path = ''
--   RLS-06  public.user_roles + custom_access_token_hook

-- ---------------------------------------------------------------------------
-- RLS-01. RLS never applies to TRUNCATE, and REFERENCES/TRIGGER are not
-- needed by API roles. Remove them now and for tables created later.
-- ---------------------------------------------------------------------------
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS-02. Write grants that no policy can ever use.
--   payments / order_events: written only by SECURITY DEFINER RPCs
--     (log_payment_intent, record_payment, log_order_event) and the
--     service role (src/actions/orders.ts:276,344).
--   carts: no DELETE policy. wholesale_applications: no DELETE policy.
--   contact_inquiries: insert-only inbox (src/app/api/contact/route.ts:24).
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.payments, public.order_events FROM anon, authenticated;
REVOKE DELETE ON public.carts, public.wholesale_applications FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.contact_inquiries FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS-03. Variants of draft (unpublished) products were readable by anyone.
-- Mirror the products policy: visible when the product is visible.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read variants" ON public.product_variants;
CREATE POLICY "Public read variants" ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
       WHERE p.id = product_variants.product_id
         AND p.status = 'active'
    )
    OR (SELECT public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- RLS-04. Bound the public product-images bucket: raster images only
-- (no SVG, which can carry script), 5 MB per object.
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
       file_size_limit    = 5242880
 WHERE id = 'product-images';

-- ---------------------------------------------------------------------------
-- RLS-07. decrement_inventory_atomic is server-only (unused by the app).
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.decrement_inventory_atomic(uuid, integer) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS-08. Wrap auth.uid()/auth.jwt()/current_setting() in (select ...) so
-- Postgres evaluates them once per statement, not once per row
-- (Splinter auth_rls_initplan). Commands, roles and meaning are unchanged.
-- ---------------------------------------------------------------------------

-- profiles
ALTER POLICY "Users view own profile" ON public.profiles
  USING (((SELECT auth.uid()) = id) OR (SELECT public.is_admin()));

-- carts (user cart by uid, guest cart by session_id claim)
ALTER POLICY "Users/Guests view own cart" ON public.carts
  USING (((SELECT auth.uid()) = user_id)
      OR (session_id = ((SELECT current_setting('request.jwt.claims', true))::json ->> 'session_id')));
ALTER POLICY "Users/Guests insert own cart" ON public.carts
  WITH CHECK (((SELECT auth.uid()) = user_id)
      OR (session_id = ((SELECT current_setting('request.jwt.claims', true))::json ->> 'session_id')));
ALTER POLICY "Users/Guests update own cart" ON public.carts
  USING (((SELECT auth.uid()) = user_id)
      OR (session_id = ((SELECT current_setting('request.jwt.claims', true))::json ->> 'session_id')));

-- cart_items
ALTER POLICY "Users/Guests view own cart items" ON public.cart_items
  USING (cart_id IN (SELECT c.id FROM public.carts c
                      WHERE ((SELECT auth.uid()) = c.user_id)
                         OR (c.session_id = ((SELECT current_setting('request.jwt.claims', true))::json ->> 'session_id'))));
ALTER POLICY "Users/Guests insert own cart items" ON public.cart_items
  WITH CHECK (cart_id IN (SELECT c.id FROM public.carts c
                           WHERE ((SELECT auth.uid()) = c.user_id)
                              OR (c.session_id = ((SELECT current_setting('request.jwt.claims', true))::json ->> 'session_id'))));
ALTER POLICY "Users/Guests update own cart items" ON public.cart_items
  USING (cart_id IN (SELECT c.id FROM public.carts c
                      WHERE ((SELECT auth.uid()) = c.user_id)
                         OR (c.session_id = ((SELECT current_setting('request.jwt.claims', true))::json ->> 'session_id'))));
ALTER POLICY "Users/Guests delete own cart items" ON public.cart_items
  USING (cart_id IN (SELECT c.id FROM public.carts c
                      WHERE ((SELECT auth.uid()) = c.user_id)
                         OR (c.session_id = ((SELECT current_setting('request.jwt.claims', true))::json ->> 'session_id'))));

-- orders and their children
ALTER POLICY "Users view own orders" ON public.orders
  USING (((SELECT auth.uid()) = user_id) OR (SELECT public.is_admin()));
ALTER POLICY "Users view own order items" ON public.order_items
  USING ((order_id IN (SELECT o.id FROM public.orders o WHERE (SELECT auth.uid()) = o.user_id))
      OR (SELECT public.is_admin()));
ALTER POLICY "Users view own payments" ON public.payments
  USING ((order_id IN (SELECT o.id FROM public.orders o WHERE (SELECT auth.uid()) = o.user_id))
      OR (SELECT public.is_admin()));
ALTER POLICY "Users view own order events" ON public.order_events
  USING ((order_id IN (SELECT o.id FROM public.orders o WHERE (SELECT auth.uid()) = o.user_id))
      OR (SELECT public.is_admin()));

-- collections (admin check via profiles, as before)
ALTER POLICY "Admins can manage collections" ON public.collections
  USING (EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.id = (SELECT auth.uid()) AND pr.role = 'admin'::public.user_role));
ALTER POLICY "Admins can manage product collections" ON public.product_collections
  USING (EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.id = (SELECT auth.uid()) AND pr.role = 'admin'::public.user_role));

-- lead inboxes
ALTER POLICY "Admins can view contact inquiries" ON public.contact_inquiries
  USING ((((SELECT auth.jwt()) ->> 'role') = 'authenticated')
     AND EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.id = (SELECT auth.uid()) AND pr.role = 'admin'::public.user_role));
ALTER POLICY "Admins can view wholesale applications" ON public.wholesale_applications
  USING ((((SELECT auth.jwt()) ->> 'role') = 'authenticated')
     AND EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.id = (SELECT auth.uid()) AND pr.role = 'admin'::public.user_role));
ALTER POLICY "Admins can update wholesale applications" ON public.wholesale_applications
  USING ((((SELECT auth.jwt()) ->> 'role') = 'authenticated')
     AND EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.id = (SELECT auth.uid()) AND pr.role = 'admin'::public.user_role));
