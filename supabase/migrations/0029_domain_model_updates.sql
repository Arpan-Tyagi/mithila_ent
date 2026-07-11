-- 1. Order Items Status
-- Allow tracking partial cancellations and item-level fulfillment
ALTER TABLE public.order_items 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'refunded'));

-- 2. MOQ (Minimum Order Quantity)
-- Ensure profitable lengths for textile continuous cuts
ALTER TABLE public.product_variants 
ADD COLUMN min_order_quantity integer NOT NULL DEFAULT 1
CHECK (min_order_quantity >= 1);

-- 3. Collections (Many-to-Many Taxonomy)
-- For thematic marketing groups separate from structural Categories
CREATE TABLE public.collections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.product_collections (
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (product_id, collection_id)
);

-- RLS for Collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections are viewable by everyone" ON public.collections FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage collections" ON public.collections USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product collections are viewable by everyone" ON public.product_collections FOR SELECT USING (true);
CREATE POLICY "Admins can manage product collections" ON public.product_collections USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Payment Timeouts (Auto-Cancel Expired Orders)
-- Releases hard-allocated inventory from unpaid orders older than 1 hour.
CREATE OR REPLACE FUNCTION public.cancel_expired_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order record;
    v_item record;
    v_cancelled_count integer := 0;
BEGIN
    FOR v_order IN 
        SELECT id FROM public.orders 
        WHERE status = 'pending' 
        AND created_at < (now() - interval '1 hour')
    LOOP
        -- Restock items
        FOR v_item IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = v_order.id LOOP
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_item.variant_id;
        END LOOP;
        
        -- Mark as cancelled
        UPDATE public.orders SET status = 'cancelled' WHERE id = v_order.id;
        UPDATE public.order_items SET status = 'cancelled' WHERE order_id = v_order.id;
        
        -- Log event
        INSERT INTO public.order_events (order_id, status, description)
        VALUES (v_order.id, 'cancelled', 'Order automatically cancelled due to payment timeout (1 hour)');
        
        v_cancelled_count := v_cancelled_count + 1;
    END LOOP;
    
    RETURN v_cancelled_count;
END;
$$;
