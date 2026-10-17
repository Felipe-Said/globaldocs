insert into public.collections (supplier, supplier_collection_id, active, data)
select distinct on (p.data->>'supplierCategory')
  'nppr',
  p.data->>'supplierCategory',
  false,
  jsonb_build_object(
    'name', coalesce(nullif(p.data->'tags'->>1, ''), p.data->>'supplierCategory'),
    'slug', 'nppr-' || trim(both '-' from regexp_replace(lower(p.data->>'supplierCategory'), '[^a-z0-9]+', '-', 'g')),
    'description', 'Produtos desta coleção são sincronizados automaticamente com o fornecedor.',
    'badgeColor', 'bg-blue-50 text-blue-800 border-blue-200',
    'supplier', 'nppr',
    'supplierCollectionId', p.data->>'supplierCategory'
  )
from public.products p
where p.supplier = 'nppr'
  and nullif(p.data->>'supplierCategory', '') is not null
on conflict (supplier, supplier_collection_id) do update
set data = excluded.data;

update public.products p
set data = jsonb_set(p.data, '{collectionId}', to_jsonb(c.id::text), true)
from public.collections c
where p.supplier = 'nppr'
  and c.supplier = 'nppr'
  and c.supplier_collection_id = p.data->>'supplierCategory'
  and p.data->>'collectionId' is distinct from c.id::text;
