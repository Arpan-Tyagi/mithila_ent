-- Public Storage bucket for product imagery (replaces base64-in-DB).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can read product images; only admins can write/replace/delete.
-- (The app uploads via the service-role client, which bypasses RLS; these
-- policies enforce least-privilege for any anon/authenticated access too.)
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product-images admin write" on storage.objects;
create policy "product-images admin write"
  on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
