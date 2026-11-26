-- 0046: RLS-05. Every SECURITY DEFINER function in public pins search_path = ''
-- and schema-qualifies every object it touches (CLAUDE.md invariant 2).
--
--   * DROP checkout_processor(...)      - unused, bypassed pricing (no caller in src/)
--   * DROP process_logistics_order(...) - unused, no search_path, used a column
--                                          that does not exist (stock)
--   * handle_new_user()             - no hard-coded owner e-mail, always 'retail',
--                                     never touches an existing row (SEC-13)
--   * log_order_event()             - search_path only
--   * log_payment_intent(uuid)      - search_path; locks the order row
--   * request_order_cancellation()  - search_path; locks the order row
--   * record_payment(...)           - search_path; locks the order row and uses a
--                                     DB-level UNIQUE key for idempotency (SEC-07)
--   * cancel_order_restock(...)     - was unusable: it called is_admin(), which is
--                                     always false for the service-role caller, so
--                                     every restocking cancel returned FORBIDDEN.
--                                     It also re-stocked lines already cancelled by
--                                     partial_cancel_order_item (0045). Now
--                                     service_role only, row-locked, idempotent,
--                                     restocks only active lines, and also handles
--                                     the no-restock (shrinkage) path atomically.
--
-- Plus the database side of two input fixes:
--   * SEC-05: orders.shipping_address->>'pinCode' must be a 6-digit Indian PIN.
--   * SEC-06: length caps on the public lead tables.

-- ---------------------------------------------------------------------------
-- A) Unused functions
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.checkout_processor(uuid, uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.process_logistics_order(uuid, uuid, integer, numeric);

-- Platform-created event-trigger function (Supabase "auto-enable RLS", event
-- trigger ensure_rls). It exists on the hosted project only, not in local
-- migrations. pg_catalog is always searched implicitly, so pinning '' does not
-- change its behaviour. It returns event_trigger, so it cannot be called as RPC.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = '';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- B) handle_new_user (trigger on auth.users)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Every new account is a retail customer. Admin is granted only through
  -- public.user_roles by the service role, never from sign-up data.
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, left(NEW.raw_user_meta_data ->> 'full_name', 200), 'retail'::public.user_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- C) log_order_event (trigger on public.orders)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_events (order_id, event, to_status, note)
    VALUES (NEW.id, 'order.created', NEW.status::text, 'Order placed');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.order_events (order_id, event, from_status, to_status)
      VALUES (NEW.id, 'order.status_changed', OLD.status::text, NEW.status::text);
    END IF;
    IF NEW.is_paid IS DISTINCT FROM OLD.is_paid AND NEW.is_paid THEN
      INSERT INTO public.order_events (order_id, event, to_status, note)
      VALUES (NEW.id, 'order.paid', NEW.status::text, 'Payment captured');
    END IF;
    IF NEW.tracking_status IS DISTINCT FROM OLD.tracking_status AND NEW.tracking_status IS NOT NULL THEN
      INSERT INTO public.order_events (order_id, event, note)
      VALUES (NEW.id, 'order.tracking_updated', 'Tracking: ' || NEW.tracking_status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.log_order_event() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- D) log_payment_intent (called by the signed-in buyer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_payment_intent(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id    uuid := (SELECT auth.uid());
  v_total      numeric(10,2);
  v_owner      uuid;
  v_payment_id uuid;
BEGIN
  SELECT o.total_amount, o.user_id INTO v_total, v_owner
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_user_id IS NULL OR v_owner IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT p.id INTO v_payment_id
    FROM public.payments p
   WHERE p.order_id = p_order_id AND p.status = 'created'::public.payment_status
   LIMIT 1;
  IF FOUND THEN
    RETURN v_payment_id;
  END IF;

  INSERT INTO public.payments (order_id, provider, amount, currency, status)
  VALUES (p_order_id, 'pending', v_total, 'INR', 'created'::public.payment_status)
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;
REVOKE ALL ON FUNCTION public.log_payment_intent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_payment_intent(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- E) request_order_cancellation (called by the signed-in buyer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_order_cancellation(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  o     record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH_REQUIRED');
  END IF;

  SELECT ord.id, ord.user_id, ord.status, ord.cancellation_requested
    INTO o
    FROM public.orders ord
   WHERE ord.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  IF o.user_id IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;
  IF o.status NOT IN ('pending'::public.order_status, 'paid'::public.order_status) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_CANCELLABLE');
  END IF;
  IF o.cancellation_requested THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  UPDATE public.orders SET cancellation_requested = true WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, event, note)
  VALUES (p_order_id, 'cancellation.requested', 'Customer requested cancellation');

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.request_order_cancellation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_order_cancellation(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F) record_payment (service role: payment verify + webhooks)
-- ---------------------------------------------------------------------------
-- DB-level idempotency key: one row per gateway payment id and status.
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_status_key
  ON public.payments (provider_payment_id, status)
  WHERE provider_payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_payment(
  p_order_id            uuid,
  p_provider            text,
  p_provider_payment_id text,
  p_amount              numeric,
  p_status              text  DEFAULT 'captured',
  p_method              text  DEFAULT NULL,
  p_currency            text  DEFAULT 'INR',
  p_raw                 jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment_id  uuid;
  v_order_total numeric;
  v_order_state public.order_status;
  v_status      public.payment_status := p_status::public.payment_status;
BEGIN
  -- Lock the order: concurrent verify + webhook calls for the same order now
  -- run one after the other.
  SELECT o.total_amount, o.status INTO v_order_total, v_order_state
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND OR v_order_total IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Do not accept a capture for less than the order total (tampered payloads).
  IF v_status = 'captured'::public.payment_status AND p_amount < v_order_total THEN
    RAISE EXCEPTION 'PARTIAL_PAYMENT_REJECTED: Captured % vs Expected %', p_amount, v_order_total;
  END IF;

  -- Idempotency: same gateway payment id + status already recorded.
  IF p_provider_payment_id IS NOT NULL THEN
    INSERT INTO public.payments (order_id, provider, provider_payment_id, amount, currency, status, method, raw)
    VALUES (p_order_id, p_provider, p_provider_payment_id, p_amount, p_currency, v_status, p_method, p_raw)
    ON CONFLICT (provider_payment_id, status) WHERE provider_payment_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_payment_id;

    IF v_payment_id IS NULL THEN
      SELECT p.id INTO v_payment_id
        FROM public.payments p
       WHERE p.provider_payment_id = p_provider_payment_id
         AND p.status = v_status;
      RETURN v_payment_id;   -- already recorded: no second side effect
    END IF;
  ELSE
    INSERT INTO public.payments (order_id, provider, provider_payment_id, amount, currency, status, method, raw)
    VALUES (p_order_id, p_provider, NULL, p_amount, p_currency, v_status, p_method, p_raw)
    RETURNING id INTO v_payment_id;
  END IF;

  IF v_status = 'captured'::public.payment_status THEN
    UPDATE public.orders
       SET is_paid = true,
           status = CASE WHEN status = 'pending'::public.order_status
                         THEN 'paid'::public.order_status ELSE status END,
           payment_intent_id = COALESCE(p_provider_payment_id, payment_intent_id)
     WHERE id = p_order_id;
    IF v_order_state = 'cancelled'::public.order_status THEN
      INSERT INTO public.order_events (order_id, event, note)
      VALUES (p_order_id, 'payment.captured_after_cancel',
              'Payment captured on a cancelled order: refund required');
    END IF;
  ELSIF v_status = 'failed'::public.payment_status THEN
    INSERT INTO public.order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.failed', COALESCE(p_provider, 'gateway') || ' payment failed');
  ELSIF v_status = 'refunded'::public.payment_status THEN
    INSERT INTO public.order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.refunded', 'Payment refunded');
  END IF;

  RETURN v_payment_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_payment(uuid, text, text, numeric, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment(uuid, text, text, numeric, text, text, text, jsonb)
  TO service_role;

-- ---------------------------------------------------------------------------
-- G) cancel_order_restock (service role, after the app's admin check)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.cancel_order_restock(uuid);

CREATE OR REPLACE FUNCTION public.cancel_order_restock(
  p_order_id uuid,
  p_restock  boolean DEFAULT true,
  p_actor    uuid    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order     record;
  v_lines     integer := 0;
  v_units     integer := 0;
BEGIN
  IF p_order_id IS NULL OR p_restock IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_ARGUMENT');
  END IF;

  SELECT o.id, o.status, o.applied_discount_id
    INTO v_order
    FROM public.orders o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;

  -- Idempotent: a second call (double click, retry) changes nothing.
  IF v_order.status = 'cancelled'::public.order_status THEN
    RETURN jsonb_build_object('ok', true, 'already_cancelled', true);
  END IF;

  -- Lock the active lines, then their variants in id order (same order as
  -- create_order_atomic and cancel_expired_pending_orders).
  PERFORM 1
     FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.status NOT IN ('cancelled', 'refunded')
      FOR UPDATE;

  IF p_restock THEN
    PERFORM 1
       FROM public.product_variants pv
      WHERE pv.id IN (SELECT oi.variant_id FROM public.order_items oi
                       WHERE oi.order_id = p_order_id
                         AND oi.status NOT IN ('cancelled', 'refunded'))
      ORDER BY pv.id
        FOR UPDATE;

    -- Restock only lines that are still active: a line already cancelled by
    -- partial_cancel_order_item was restocked (or written off) there.
    UPDATE public.product_variants pv
       SET stock_quantity = pv.stock_quantity + s.qty
      FROM (SELECT oi.variant_id, sum(oi.quantity)::integer AS qty
              FROM public.order_items oi
             WHERE oi.order_id = p_order_id
               AND oi.status NOT IN ('cancelled', 'refunded')
               AND oi.variant_id IS NOT NULL
             GROUP BY oi.variant_id) s
     WHERE pv.id = s.variant_id;

    SELECT COALESCE(sum(oi.quantity), 0)::integer INTO v_units
      FROM public.order_items oi
     WHERE oi.order_id = p_order_id
       AND oi.status NOT IN ('cancelled', 'refunded')
       AND oi.variant_id IS NOT NULL;
  END IF;

  UPDATE public.order_items
     SET status = 'cancelled'
   WHERE order_id = p_order_id
     AND status NOT IN ('cancelled', 'refunded');
  GET DIAGNOSTICS v_lines = ROW_COUNT;

  UPDATE public.orders
     SET status = 'cancelled'::public.order_status,
         cancellation_requested = false
   WHERE id = p_order_id;

  IF v_order.applied_discount_id IS NOT NULL THEN
    UPDATE public.discounts
       SET current_uses = GREATEST(COALESCE(current_uses, 0) - 1, 0)
     WHERE id = v_order.applied_discount_id;
  END IF;

  INSERT INTO public.order_events (order_id, event, to_status, note)
  VALUES (
    p_order_id,
    'order.cancelled',
    'cancelled',
    CASE WHEN p_restock
         THEN format('Cancelled by admin; %s line(s) cancelled, %s unit(s) restocked', v_lines, v_units)
         ELSE format('Cancelled by admin; %s line(s) cancelled, no restock (shrinkage)', v_lines)
    END
    || CASE WHEN p_actor IS NOT NULL THEN format(' (by %s)', p_actor) ELSE '' END
  );

  RETURN jsonb_build_object('ok', true, 'lines_cancelled', v_lines, 'units_restocked', v_units);
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_order_restock(uuid, boolean, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_restock(uuid, boolean, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- H) SEC-05: PIN code shape on new and changed orders.
--    NOT VALID: enforced for every new INSERT/UPDATE; existing rows untouched.
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shipping_pincode_format;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_pincode_format
  CHECK (shipping_address ->> 'pinCode' IS NULL
         OR shipping_address ->> 'pinCode' ~ '^[1-9][0-9]{5}$') NOT VALID;

-- ---------------------------------------------------------------------------
-- I) SEC-06: length caps on the public lead tables (same limits as
--    src/lib/form-input.ts). NOT VALID: new rows only.
-- ---------------------------------------------------------------------------
ALTER TABLE public.contact_inquiries DROP CONSTRAINT IF EXISTS contact_inquiries_length_caps;
ALTER TABLE public.contact_inquiries
  ADD CONSTRAINT contact_inquiries_length_caps CHECK (
        char_length(first_name) <= 100
    AND char_length(last_name)  <= 100
    AND char_length(email)      <= 254
    AND (location IS NULL OR char_length(location) <= 200)
    AND char_length(message)    <= 5000
  ) NOT VALID;

ALTER TABLE public.wholesale_applications DROP CONSTRAINT IF EXISTS wholesale_applications_length_caps;
ALTER TABLE public.wholesale_applications
  ADD CONSTRAINT wholesale_applications_length_caps CHECK (
        char_length(business_name) <= 200
    AND (tax_id IS NULL OR char_length(tax_id) <= 20)
    AND char_length(email)         <= 254
    AND char_length(requirements)  <= 5000
  ) NOT VALID;
