-- 0043: Unpaid orders give their stock back, and one account cannot hoard it (audit SEC-03).
--
-- create_order_atomic takes stock when an order is placed (0040). Before this
-- migration nothing ever gave it back:
--   * cancel_expired_pending_orders() aborted on every run: it inserted
--     order_events(status, description), columns that do not exist
--     (live: 42703);
--   * nothing ran it on a schedule. /api/cron/timeouts is not listed in
--     vercel.json, and pg_cron was not installed.
-- A single free account could place unpaid orders for the whole catalogue and
-- keep every product out of stock until an admin cancelled each order by hand.
--
-- Now:
--   * The cleanup writes the real order_events columns. It locks rows with
--     SKIP LOCKED so it never blocks checkout, restocks only lines that are
--     still pending, and returns the discount use the order had taken. The
--     orders trigger (log_order_event) records the status change; the cleanup
--     adds an 'order.payment_timeout' event.
--   * pg_cron runs it every 10 minutes, whatever the Vercel plan.
--   * create_order_atomic refuses a new order while the account already has 3
--     unpaid pending orders, or has let 5 orders lapse unpaid in the last 24
--     hours. A per-user advisory lock makes the count race-free. Checkout
--     retries reuse one idempotency key (src/app/checkout/page.tsx:220), so
--     they return the existing order and never count twice.

-- 1) Cleanup --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_expired_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order record;
    v_count integer := 0;
BEGIN
    FOR v_order IN
        SELECT o.id, o.applied_discount_id
          FROM public.orders o
         WHERE o.status = 'pending'
           AND COALESCE(o.is_paid, false) = false
           AND o.created_at < now() - interval '1 hour'
         ORDER BY o.created_at
         LIMIT 500
           FOR UPDATE SKIP LOCKED
    LOOP
        -- Lock the variants in id order, the same order create_order_atomic uses.
        PERFORM 1
           FROM public.product_variants pv
          WHERE pv.id IN (SELECT oi.variant_id FROM public.order_items oi
                           WHERE oi.order_id = v_order.id AND oi.status = 'pending')
          ORDER BY pv.id
            FOR UPDATE;

        UPDATE public.product_variants pv
           SET stock_quantity = pv.stock_quantity + s.qty
          FROM (SELECT oi.variant_id, sum(oi.quantity)::integer AS qty
                  FROM public.order_items oi
                 WHERE oi.order_id = v_order.id
                   AND oi.status = 'pending'
                   AND oi.variant_id IS NOT NULL
                 GROUP BY oi.variant_id) s
         WHERE pv.id = s.variant_id;

        UPDATE public.order_items
           SET status = 'cancelled'
         WHERE order_id = v_order.id AND status = 'pending';

        UPDATE public.orders SET status = 'cancelled' WHERE id = v_order.id;

        IF v_order.applied_discount_id IS NOT NULL THEN
            UPDATE public.discounts
               SET current_uses = GREATEST(COALESCE(current_uses, 0) - 1, 0)
             WHERE id = v_order.applied_discount_id;
        END IF;

        INSERT INTO public.order_events (order_id, event, from_status, to_status, note)
        VALUES (v_order.id, 'order.payment_timeout', 'pending', 'cancelled',
                'Cancelled automatically: unpaid after 1 hour. Stock released.');

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_expired_pending_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_expired_pending_orders() TO service_role;

-- 2) Schedule -------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cancel-expired-pending-orders';
SELECT cron.schedule(
    'cancel-expired-pending-orders',
    '*/10 * * * *',
    $cron$SELECT public.cancel_expired_pending_orders();$cron$
);

-- 3) Per-account cap on unpaid orders --------------------------------------------
-- Same body as 0040, plus the cap block marked below.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id uuid,
    p_items jsonb,
    p_shipping jsonb,
    p_shipping_amount numeric,
    p_discount_code text DEFAULT NULL,
    p_idempotency_key text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order_id uuid;
    v_existing uuid;
    v_item jsonb;
    v_variant_id uuid;
    v_quantity integer;
    v_price numeric(10,2);
    v_stock integer;
    v_moq integer;
    v_gst numeric(5,2);
    v_line numeric(12,2);
    v_subtotal numeric(12,2) := 0;
    v_tax_raw numeric(14,4) := 0;
    v_tax numeric(10,2) := 0;
    v_ship numeric(10,2);
    v_reduce numeric(10,2) := 0;
    v_total numeric(10,2);
    v_code text;
    v_discount_id uuid;
    v_discount_type public.discount_type;
    v_discount_val numeric(10,2);
    v_min_order numeric(10,2);
    v_max_uses integer;
    v_current_uses integer;
    v_max_per_user integer;
    v_user_uses integer;
    v_open integer;
    v_lapsed integer;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART';
    END IF;
    IF jsonb_array_length(p_items) > 100 THEN
        RAISE EXCEPTION 'TOO_MANY_ITEMS';
    END IF;
    IF p_shipping_amount IS NULL OR p_shipping_amount < 0 OR p_shipping_amount > 100000 THEN
        RAISE EXCEPTION 'INVALID_SHIPPING';
    END IF;
    v_ship := round(p_shipping_amount, 2);

    -- One order placement per account at a time, so the cap below cannot be
    -- raced. Taken before the idempotency check so a concurrent retry with the
    -- same key sees the first order and returns it.
    PERFORM pg_advisory_xact_lock(hashtextextended('create_order_atomic:' || p_user_id::text, 0));

    -- Idempotency: an already-seen key returns the original order.
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing FROM public.orders
         WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key LIMIT 1;
        IF v_existing IS NOT NULL THEN
            RETURN v_existing;
        END IF;
    END IF;

    -- >>> 0043 cap: unpaid orders hold stock, so limit how much one account can hold.
    SELECT count(*) INTO v_open
      FROM public.orders o
     WHERE o.user_id = p_user_id
       AND o.status = 'pending'
       AND COALESCE(o.is_paid, false) = false;
    IF v_open >= 3 THEN
        RAISE EXCEPTION 'TOO_MANY_PENDING_ORDERS';
    END IF;

    SELECT count(*) INTO v_lapsed
      FROM public.order_events e
      JOIN public.orders o ON o.id = e.order_id
     WHERE o.user_id = p_user_id
       AND e.event = 'order.payment_timeout'
       AND e.created_at > now() - interval '24 hours';
    IF v_lapsed >= 5 THEN
        RAISE EXCEPTION 'TOO_MANY_UNPAID_ORDERS';
    END IF;
    -- <<< 0043 cap

    -- Insert the draft first so a concurrent duplicate trips
    -- uq_orders_idempotency (0019) before any stock is touched.
    BEGIN
        INSERT INTO public.orders (user_id, status, subtotal, tax_amount, shipping_amount,
                                   total_amount, shipping_address, idempotency_key)
        VALUES (p_user_id, 'pending', 0, 0, v_ship, 0,
                COALESCE(p_shipping, '{}'::jsonb), p_idempotency_key)
        RETURNING id INTO v_order_id;
    EXCEPTION WHEN unique_violation THEN
        SELECT id INTO v_existing FROM public.orders
         WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key LIMIT 1;
        IF v_existing IS NOT NULL THEN
            RETURN v_existing;
        END IF;
        RAISE;
    END;

    -- Validate every line before taking any lock.
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            v_variant_id := (v_item->>'variant_id')::uuid;
            v_quantity := (v_item->>'quantity')::integer;
        EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
            RAISE EXCEPTION 'INVALID_QUANTITY';
        END;
        IF v_variant_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'INVALID_QUANTITY';
        END IF;
    END LOOP;

    -- Lines: price, GST rate and stock come from the database, rows locked.
    -- Duplicate lines are merged and rows are locked in variant_id order so two
    -- concurrent checkouts ([A,B] vs [B,A]) cannot deadlock.
    FOR v_variant_id, v_quantity IN
        SELECT (e->>'variant_id')::uuid, sum((e->>'quantity')::integer)::integer
          FROM jsonb_array_elements(p_items) e
         GROUP BY 1
         ORDER BY 1
    LOOP
        v_price := NULL;
        SELECT pv.price, pv.stock_quantity, COALESCE(pv.min_order_quantity, 1), COALESCE(p.gst_rate, 5.00)
          INTO v_price, v_stock, v_moq, v_gst
          FROM public.product_variants pv
          JOIN public.products p ON p.id = pv.product_id
         WHERE pv.id = v_variant_id
           AND p.status = 'active'
           FOR UPDATE OF pv;

        IF v_price IS NULL THEN
            RAISE EXCEPTION 'VARIANT_NOT_FOUND';
        END IF;
        IF v_quantity < v_moq THEN
            RAISE EXCEPTION 'BELOW_MOQ';
        END IF;
        IF v_stock < v_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK';
        END IF;

        UPDATE public.product_variants
           SET stock_quantity = stock_quantity - v_quantity
         WHERE id = v_variant_id;

        INSERT INTO public.order_items (order_id, variant_id, quantity, unit_price)
        VALUES (v_order_id, v_variant_id, v_quantity, v_price);

        v_line := v_price * v_quantity;
        v_subtotal := v_subtotal + v_line;
        v_tax_raw := v_tax_raw + (v_line * v_gst / 100);
    END LOOP;

    -- Discount: looked up and locked here; nothing about it is trusted from the caller.
    v_code := NULLIF(upper(btrim(COALESCE(p_discount_code, ''))), '');
    IF v_code IS NOT NULL THEN
        SELECT d.id, d.type, d.value, d.min_order_value, d.max_uses,
               COALESCE(d.current_uses, 0), d.max_uses_per_user
          INTO v_discount_id, v_discount_type, v_discount_val, v_min_order, v_max_uses,
               v_current_uses, v_max_per_user
          FROM public.discounts d
         WHERE d.code = v_code
           AND d.is_active = true
           AND (d.starts_at IS NULL OR d.starts_at <= now())
           AND (d.ends_at IS NULL OR d.ends_at > now())
           AND d.target_type = 'all'
           FOR UPDATE;

        IF v_discount_id IS NULL THEN
            RAISE EXCEPTION 'INVALID_DISCOUNT';
        END IF;
        IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
            RAISE EXCEPTION 'INVALID_DISCOUNT';
        END IF;
        IF v_min_order IS NOT NULL AND v_subtotal < v_min_order THEN
            RAISE EXCEPTION 'INVALID_DISCOUNT';
        END IF;
        IF v_max_per_user IS NOT NULL THEN
            SELECT count(*) INTO v_user_uses
              FROM public.orders o
             WHERE o.user_id = p_user_id
               AND o.applied_discount_id = v_discount_id
               AND o.status <> 'cancelled'
               AND o.id <> v_order_id;
            IF v_user_uses >= v_max_per_user THEN
                RAISE EXCEPTION 'INVALID_DISCOUNT';
            END IF;
        END IF;

        IF v_discount_type = 'percentage' THEN
            v_reduce := round(v_subtotal * LEAST(GREATEST(v_discount_val, 0), 100) / 100, 2);
        ELSIF v_discount_type = 'fixed_amount' THEN
            v_reduce := LEAST(GREATEST(v_discount_val, 0), v_subtotal);
        ELSIF v_discount_type = 'free_shipping' THEN
            v_reduce := 0;
            v_ship := 0;
        END IF;

        UPDATE public.discounts
           SET current_uses = COALESCE(current_uses, 0) + 1
         WHERE id = v_discount_id;
    END IF;

    v_tax := round(v_tax_raw, 2);
    v_total := GREATEST(v_subtotal - v_reduce + v_tax + v_ship, 0);

    UPDATE public.orders
       SET subtotal = v_subtotal,
           tax_amount = v_tax,
           shipping_amount = v_ship,
           discount_applied = v_reduce,
           applied_discount_id = v_discount_id,
           total_amount = v_total
     WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, text, text)
  TO service_role;
