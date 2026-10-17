update public.products
set data = jsonb_set(
  data,
  '{features,0}',
  to_jsonb('Credenciais de acesso correspondentes à quantidade comprada'::text),
  false
)
where supplier = 'nppr'
  and lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', ''))
    ~ '(account|conta|login|gmail|google|facebook|instagram|tiktok|twitter|reddit|discord|linkedin|telegram|pinterest|youtube|twitch|spotify|netflix|outlook|hotmail|yahoo)';
