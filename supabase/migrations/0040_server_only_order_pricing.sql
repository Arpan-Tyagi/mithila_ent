-- 0040: Orders are priced only by the database, and only the server can create them.
--
-- Before this migration a signed-in customer could set their own order total in
-- two ways:
--   a) Call create_order_atomic (granted to `authenticated`) directly and pass
--      p_tax_amount_override = -9999 / p_shipping_amount = -9999 (0030:3).
--   b) INSERT straight into orders / order_items through the
--      "Users insert own orders" / "Users insert own order items" policies
--      (0000:166,170) with any subtotal, total_amount or unit_price.
-- Either way the Razorpay order was then created for the forged total.
--
-- Now:
--   * Customers have no INSERT/DELETE on orders or order_items.
--   * create_order_atomic is EXECUTE-able by service_role only. The Next.js
--     server action (src/actions/orders.ts createOrder) authenticates the user,
--     then calls it with the service-role client and passes p_user_id itself.
--   * The function computes every money figure: unit prices from
--     product_variants, GST from products.gst_rate (default 5%), discounts from
--     the discounts row (locked FOR UPDATE, max_uses and per-user limits
--     enforced). The only caller-supplied money input is the courier shipping
--     quote, which is bounds-checked.
--
-- GST is computed on the pre-discount line value, matching the checkout preview
-- (/api/shipping/calculate -> totalGst). Moving GST onto the post-discount
-- taxable value is tracked separately as a compliance item.

-- 1) Remove direct customer writes ---------------------------------------------
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;

REVOKE INSERT, DELETE, TRUNCATE ON public.orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.order_items FROM anon, authenticated;
-- orders UPDATE stays granted: the "Admin update orders" policy (is_admin())
-- still gates it, and the admin order list updates status through it.
REVOKE UPDATE ON public.orders FROM anon;

-- 2) Drop every previous overload ------------------------------------------------
DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb, numeric, numeric);
DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb, text, numeric, numeric);
DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb, text, text, numeric, numeric);
DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb, text, text, numeric, numeric, numeric);

-- 3) Server-only, server-priced order creation -----------------------------------
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

    -- Idempotency: an already-seen key returns the original order.
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing FROM public.orders
         WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key LIMIT 1;
        IF v_existing IS NOT NULL THEN
            RETURN v_existing;
        END IF;
    END IF;

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
            -- The discount row lock above serialises concurrent checkouts with the
            -- same code, so this count sees every committed earlier redemption.
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

-- 4) Keep the preview validator in step with what the order RPC accepts ----------
CREATE OR REPLACE FUNCTION public.validate_discount(p_code text, p_subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code text := NULLIF(upper(btrim(COALESCE(p_code, ''))), '');
  d record;
  v_amount numeric(10,2) := 0;
BEGIN
  IF v_code IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Enter a discount code.');
  END IF;

  SELECT * INTO d FROM public.discounts
   WHERE code = v_code
     AND is_active = true
     AND target_type = 'all'
     AND (starts_at IS NULL OR starts_at <= now())
     AND (ends_at IS NULL OR ends_at > now())
     AND (max_uses IS NULL OR COALESCE(current_uses, 0) < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive code.');
  END IF;

  IF d.min_order_value IS NOT NULL AND p_subtotal < d.min_order_value THEN
    RETURN jsonb_build_object('valid', false, 'error',
      'Requires a minimum order of ₹' || floor(d.min_order_value)::text || '.');
  END IF;

  IF d.type = 'percentage' THEN
    v_amount := round(GREATEST(p_subtotal, 0) * LEAST(GREATEST(d.value, 0), 100) / 100, 2);
  ELSIF d.type = 'fixed_amount' THEN
    v_amount := LEAST(GREATEST(d.value, 0), GREATEST(p_subtotal, 0));
  ELSIF d.type = 'free_shipping' THEN
    v_amount := 0;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_code,
    'type', d.type,
    'value', d.value,
    'discountAmount', v_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_discount(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_discount(text, numeric) TO anon, authenticated, service_role;
