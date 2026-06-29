-- supabase/migrations/0020_transactional_integrity.sql

-- Justification: We use Read Committed (Postgres default) because it provides adequate consistency 
-- for row-level operations (like decrementing stock) without the severe locking overhead of Serializable, 
-- allowing the dashboard to render quickly for concurrent users.

CREATE OR REPLACE FUNCTION process_logistics_order(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INT,
  p_total_price DECIMAL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Initialize Transaction block implicitly begins here
  
  -- 2. Verify constraints and execute first dependent operation (Inventory)
  UPDATE product_variants
  SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient inventory for product %', p_product_id;
  END IF;

  -- 3. Execute second dependent operation (Order Creation)
  INSERT INTO orders (user_id, status, total_amount)
  VALUES (p_user_id, 'processing', p_total_price);

  -- 4. Explicit Commit (Implicit at end of successful PL/pgSQL block)
  RETURN true;

EXCEPTION WHEN OTHERS THEN
  -- 5. Failure Handling: Explicit Rollback and secure logging
  -- The transaction is automatically rolled back upon raising an exception
  -- We log a sanitized error (SQLSTATE) rather than the raw payload
  RAISE NOTICE 'Transaction failed and rolled back. State: %', SQLSTATE;
  RETURN false;
END;
$$;
