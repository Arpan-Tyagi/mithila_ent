-- supabase/migrations/0001_checkout_processor.sql
CREATE OR REPLACE FUNCTION checkout_processor(
    p_user_id UUID,
    p_cart_id UUID,
    p_shipping_address JSONB,
    p_payment_intent_id TEXT
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_subtotal DECIMAL(10,2) := 0;
    v_total DECIMAL(10,2) := 0;
    v_item RECORD;
BEGIN
    -- 1. Create Order Draft
    INSERT INTO orders (user_id, status, subtotal, total_amount, shipping_address, payment_intent_id)
    VALUES (p_user_id, 'pending', 0, 0, p_shipping_address, p_payment_intent_id)
    RETURNING id INTO v_order_id;

    -- 2. Move items from cart to order and calculate totals
    FOR v_item IN (SELECT ci.variant_id, ci.quantity, pv.price 
                   FROM cart_items ci 
                   JOIN product_variants pv ON ci.variant_id = pv.id 
                   WHERE ci.cart_id = p_cart_id) 
    LOOP
        -- Check stock
        IF (SELECT stock_quantity FROM product_variants WHERE id = v_item.variant_id) < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for variant %', v_item.variant_id;
        END IF;

        -- Deduct stock
        UPDATE product_variants 
        SET stock_quantity = stock_quantity - v_item.quantity 
        WHERE id = v_item.variant_id;

        -- Add to order items
        INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
        VALUES (v_order_id, v_item.variant_id, v_item.quantity, v_item.price);

        v_subtotal := v_subtotal + (v_item.price * v_item.quantity);
    END LOOP;

    -- 3. Update Order Total
    UPDATE orders 
    SET subtotal = v_subtotal, total_amount = v_subtotal 
    WHERE id = v_order_id;

    -- 4. Clear Cart
    DELETE FROM cart_items WHERE cart_id = p_cart_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
