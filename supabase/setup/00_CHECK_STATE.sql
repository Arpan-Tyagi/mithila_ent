-- READ-ONLY. Run this first to see what's already applied to your database.
-- Each column returns true/false. Use the result to pick the right bundle below.
select
  to_regclass('public.profiles')       is not null                          as has_profiles,        -- 0000 base schema
  to_regclass('public.products')       is not null                          as has_products,        -- 0000 base schema
  to_regclass('public.payments')       is not null                          as has_payments,        -- 0015
  to_regclass('public.site_content')   is not null                          as has_site_content,    -- 0016
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='orders'
            and column_name='idempotency_key')                              as has_order_idempotency, -- 0019
  to_regclass('public.pending_emails') is not null                          as has_pending_emails,  -- 0020
  exists (select 1 from storage.buckets where id='product-images')          as has_image_bucket;    -- 0022

-- HOW TO READ IT:
--   • All columns false                          -> FRESH database. Run 01_FULL_SETUP_fresh_db.sql
--   • has_profiles/products true but
--     has_pending_emails / has_image_bucket false -> app already installed, missing the new work.
--                                                  Run 02_NEW_MIGRATIONS_only.sql
--   • All columns true                            -> already fully set up. Nothing to apply;
--                                                  just create your owner account (see README).
