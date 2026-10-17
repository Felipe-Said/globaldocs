update public.nppr_settings
set publish_products = true
where id = 1;

update public.products
set active = (
  coalesce(data->>'stockQuantity', '') ~ '^[0-9]+([.][0-9]+)?$'
  and (data->>'stockQuantity')::numeric >= greatest(
    1,
    case
      when coalesce(data->>'minimumOrder', '') ~ '^[0-9]+([.][0-9]+)?$'
        then (data->>'minimumOrder')::numeric
      else 1
    end
  )
)
where supplier = 'nppr';

update public.collections c
set active = exists (
  select 1
  from public.products p
  where p.supplier = 'nppr'
    and p.active
    and p.data->>'collectionId' = c.id::text
)
where c.supplier = 'nppr';
