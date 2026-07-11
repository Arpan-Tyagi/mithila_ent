DROP FUNCTION IF EXISTS create_order_atomic(JSONB, JSONB, TEXT, TEXT, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION create_order_atomic(
    p_items JSONB,
    p_shipping JSONB,
    p_discount_code TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_tax_rate NUMERIC DEFAULT 0.18,
    p_shipping_amount NUMERIC DEFAULT 50,
    p_tax_amount_override NUMERIC DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_order_id UUID;
    v_existing UUID;
    v_subtotal NUMERIC(10,2) := 0;
    v_tax NUMERIC(10,2) := 0;
    v_ship NUMERIC(10,2) := p_shipping_amount;
    v_reduce NUMERIC(10,2) := 0;
    v_total NUMERIC(10,2) := 0;
    v_item JSONB;
    v_variant_id UUID;
    v_quantity INTEGER;
    v_price NUMERIC(10,2);
    v_stock INTEGER;
    v_discount_id UUID;
    v_discount_type TEXT;
    v_discount_val NUMERIC(10,2);
    v_min_order NUMERIC(10,2);
    v_target_type TEXT;
    v_target_ids UUID[];
    v_discount_label TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing FROM orders WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
        IF v_existing IS NOT NULL THEN
            RETURN v_existing;
        END IF;
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        IF v_quantity <= 0 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
        SELECT price, stock_quantity INTO v_price, v_stock FROM product_variants WHERE id = v_variant_id FOR UPDATE;
        IF v_price IS NULL THEN RAISE EXCEPTION 'Variant % not found', v_variant_id; END IF;
        IF v_stock < v_quantity THEN RAISE EXCEPTION 'Insufficient stock for %', v_variant_id; END IF;
        UPDATE product_variants SET stock_quantity = stock_quantity - v_quantity WHERE id = v_variant_id;
        v_subtotal := v_subtotal + (v_price * v_quantity);
    END LOOP;

    IF p_discount_code IS NOT NULL THEN
        SELECT id, type, value, min_order_value, target_type, target_ids
        INTO v_discount_id, v_discount_type, v_discount_val, v_min_order, v_target_type, v_target_ids
        FROM discounts
        WHERE code = p_discount_code AND is_active = TRUE AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()) FOR UPDATE;
        
        IF v_discount_id IS NOT NULL AND (v_min_order IS NULL OR v_subtotal >= v_min_order) THEN
            IF v_target_type = 'all' THEN
                IF v_discount_type = 'percentage' THEN
                    v_reduce := (v_subtotal * (v_discount_val / 100));
                ELSE
                    v_reduce := LEAST(v_discount_val, v_subtotal);
                END IF;
            END IF;
            UPDATE discounts SET current_uses = current_uses + 1 WHERE id = v_discount_id;
            v_discount_label := p_discount_code;
        ELSE
            v_discount_id := NULL;
        END IF;
    END IF;

    v_subtotal := v_subtotal - v_reduce;
    
    IF p_tax_amount_override IS NOT NULL THEN
      v_tax := p_tax_amount_override;
    ELSE
      v_tax := v_subtotal * p_tax_rate;
    END IF;
    
    v_total := v_subtotal + v_tax + v_ship;

    INSERT INTO orders (user_id, subtotal, tax_amount, shipping_amount, total_amount, shipping_address, idempotency_key, applied_discount_id, discount_applied)
    VALUES (v_user_id, v_subtotal + v_reduce, v_tax, v_ship, v_total, p_shipping, p_idempotency_key, v_discount_id, v_reduce)
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        SELECT price INTO v_price FROM product_variants WHERE id = v_variant_id;
        INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
        VALUES (v_order_id, v_variant_id, v_quantity, v_price);
    END LOOP;

    RETURN v_order_id;
END;
$$;
