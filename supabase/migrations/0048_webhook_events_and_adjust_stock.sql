-- 0048: SEC-07 (webhook dedupe + async processing) and SEC-08 (atomic stock adjust).
--
-- A) public.webhook_events
--    One row per gateway event id. The Razorpay webhook route stores the
--    verified event here (a single INSERT), answers 200, then processes it
--    after the response. A repeated delivery of the same event id hits the
--    primary key and is not processed twice. Rows left unprocessed (a
--    transient failure) are retried by /api/cron/webhook-retry.
--    The payload is a reduced copy of the gateway event: ids, amount,
--    currency, status, method and our order id. No e-mail or phone number.
--
-- B) public.adjust_stock(variant, delta)
--    One conditional UPDATE, so an admin "+5" can no longer overwrite a
--    concurrent order's decrement (the old code read, added, then wrote).
--    Service role only: the server action checks the admin role first.

-- ---------------------------------------------------------------------------
-- A) webhook_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  provider     text        NOT NULL,
  event_id     text        NOT NULL,
  event_type   text        NOT NULL,
  payload      jsonb       NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts     integer     NOT NULL DEFAULT 0,
  outcome      text,
  last_error   text,
  PRIMARY KEY (provider, event_id),
  CONSTRAINT webhook_events_id_len    CHECK (char_length(event_id) BETWEEN 1 AND 200),
  CONSTRAINT webhook_events_type_len  CHECK (char_length(event_type) BETWEEN 1 AND 100),
  CONSTRAINT webhook_events_error_len CHECK (last_error IS NULL OR char_length(last_error) <= 1000)
);

CREATE INDEX IF NOT EXISTS webhook_events_pending_idx
  ON public.webhook_events (received_at)
  WHERE processed_at IS NULL;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webhook_events TO service_role;

COMMENT ON TABLE public.webhook_events IS
  'Verified payment-gateway webhook deliveries (dedupe + retry queue). Service role only.';

-- ---------------------------------------------------------------------------
-- B) adjust_stock
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_stock(p_variant_id uuid, p_delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new integer;
BEGIN
  IF p_variant_id IS NULL OR p_delta IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT' USING ERRCODE = '22023';
  END IF;
  IF p_delta = 0 OR abs(p_delta) > 100000 THEN
    RAISE EXCEPTION 'INVALID_DELTA' USING ERRCODE = '22023';
  END IF;

  UPDATE public.product_variants
     SET stock_quantity = GREATEST(0, stock_quantity + p_delta)
   WHERE id = p_variant_id
  RETURNING stock_quantity INTO v_new;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VARIANT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer) TO service_role;
