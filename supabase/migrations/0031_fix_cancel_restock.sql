CREATE OR REPLACE FUNCTION cancel_order_restock(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o RECORD;
  it RECORD;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT id, status INTO o FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  IF o.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  FOR it IN SELECT variant_id, quantity FROM order_items WHERE order_id = p_order_id AND variant_id IS NOT NULL
  LOOP
    UPDATE product_variants SET stock_quantity = stock_quantity + it.quantity WHERE id = it.variant_id;
  END LOOP;

  UPDATE orders SET status = 'cancelled', cancellation_requested = false WHERE id = p_order_id;
  UPDATE order_items SET status = 'cancelled' WHERE order_id = p_order_id;
  
  INSERT INTO order_events (order_id, event, note)
  VALUES (p_order_id, 'order.cancelled', 'Cancelled by admin; inventory restocked');

  RETURN jsonb_build_object('ok', true);
END;
$$;
