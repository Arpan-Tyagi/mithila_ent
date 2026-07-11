-- Enforce database-level protection against negative inventory
ALTER TABLE public.product_variants
ADD CONSTRAINT stock_quantity_check 
CHECK (stock_quantity >= 0);
