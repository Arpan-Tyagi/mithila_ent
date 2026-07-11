-- Make record_payment strictly verify captured amounts against the order total
CREATE OR REPLACE FUNCTION record_payment(
  p_order_id UUID,
  p_provider TEXT,
  p_provider_payment_id TEXT,
  p_amount NUMERIC,
  p_status TEXT DEFAULT 'captured',
  p_method TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT 'INR',
  p_raw JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
  v_order_total NUMERIC;
BEGIN
  SELECT total_amount INTO v_order_total FROM orders WHERE id = p_order_id;
  IF v_order_total IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Security: Do not allow capturing less than the order total (avoids tampered payloads)
  IF p_status = 'captured' AND p_amount < v_order_total THEN
    RAISE EXCEPTION 'PARTIAL_PAYMENT_REJECTED: Captured % vs Expected %', p_amount, v_order_total;
  END IF;

  -- Idempotency: same gateway payment id + status already recorded.
  IF p_provider_payment_id IS NOT NULL THEN
    SELECT id INTO v_payment_id FROM payments
     WHERE provider_payment_id = p_provider_payment_id
       AND status = p_status::payment_status
     LIMIT 1;
    IF FOUND THEN
      RETURN v_payment_id;
    END IF;
  END IF;

  INSERT INTO payments (order_id, provider, provider_payment_id, amount, currency, status, method, raw)
  VALUES (p_order_id, p_provider, p_provider_payment_id, p_amount, p_currency, p_status::payment_status, p_method, p_raw)
  RETURNING id INTO v_payment_id;

  IF p_status = 'captured' THEN
    UPDATE orders
       SET is_paid = true,
           status = CASE WHEN status = 'pending' THEN 'paid'::order_status ELSE status END,
           payment_intent_id = COALESCE(p_provider_payment_id, payment_intent_id)
     WHERE id = p_order_id;
  ELSIF p_status = 'failed' THEN
    INSERT INTO order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.failed', COALESCE(p_provider, 'gateway') || ' payment failed');
  ELSIF p_status = 'refunded' THEN
    INSERT INTO order_events (order_id, event, note)
    VALUES (p_order_id, 'payment.refunded', 'Payment refunded');
  END IF;

  RETURN v_payment_id;
END;
$$;
