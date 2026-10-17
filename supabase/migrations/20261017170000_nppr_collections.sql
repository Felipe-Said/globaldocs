alter table public.collections add column if not exists supplier text;
alter table public.collections add column if not exists supplier_collection_id text;

create unique index if not exists collections_supplier_collection_uidx
on public.collections (supplier, supplier_collection_id);
