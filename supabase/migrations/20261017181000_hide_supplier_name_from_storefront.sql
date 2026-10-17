update public.products
set data = jsonb_set(
  data,
  '{tags}',
  coalesce(
    (
      select jsonb_agg(tag)
      from jsonb_array_elements_text(coalesce(data->'tags', '[]'::jsonb)) as item(tag)
      where position('nppr' in lower(tag)) = 0
    ),
    '[]'::jsonb
  ),
  true
)
where supplier = 'nppr';

update public.collections
set data = jsonb_set(
  data,
  '{slug}',
  to_jsonb(regexp_replace(data->>'slug', '^nppr-', 'catalogo-', 'i')),
  true
)
where supplier = 'nppr'
  and data->>'slug' ~* '^nppr-';

update public.products
set data = jsonb_set(
  data,
  '{title}',
  to_jsonb(trim(regexp_replace(regexp_replace(data->>'title', 'NPPR([[:space:]]+Team)?', '', 'gi'), '[[:space:]]+', ' ', 'g'))),
  true
)
where supplier = 'nppr' and data->>'title' ~* 'nppr';

update public.products
set data = jsonb_set(
  data,
  '{tagline}',
  to_jsonb(trim(regexp_replace(regexp_replace(data->>'tagline', 'NPPR([[:space:]]+Team)?', '', 'gi'), '[[:space:]]+', ' ', 'g'))),
  true
)
where supplier = 'nppr' and data->>'tagline' ~* 'nppr';

update public.products
set data = jsonb_set(
  data,
  '{description}',
  to_jsonb(trim(regexp_replace(regexp_replace(data->>'description', 'NPPR([[:space:]]+Team)?', '', 'gi'), '[[:space:]]+', ' ', 'g'))),
  true
)
where supplier = 'nppr' and data->>'description' ~* 'nppr';

update public.collections
set data = jsonb_set(
  data,
  '{name}',
  to_jsonb(trim(regexp_replace(regexp_replace(data->>'name', 'NPPR([[:space:]]+Team)?', '', 'gi'), '[[:space:]]+', ' ', 'g'))),
  true
)
where supplier = 'nppr' and data->>'name' ~* 'nppr';

update public.collections
set data = jsonb_set(
  data,
  '{description}',
  to_jsonb(trim(regexp_replace(regexp_replace(data->>'description', 'NPPR([[:space:]]+Team)?', '', 'gi'), '[[:space:]]+', ' ', 'g'))),
  true
)
where supplier = 'nppr' and data->>'description' ~* 'nppr';
