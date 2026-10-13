insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets',
  'store-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads store assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'store-assets');

create policy "admins upload store assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'store-assets' and public.is_admin());

create policy "admins update store assets"
on storage.objects for update
to authenticated
using (bucket_id = 'store-assets' and public.is_admin())
with check (bucket_id = 'store-assets' and public.is_admin());

create policy "admins delete store assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'store-assets' and public.is_admin());
