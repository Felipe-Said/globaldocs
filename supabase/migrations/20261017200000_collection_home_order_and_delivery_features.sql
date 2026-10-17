with ranked_collections as (
  select
    id,
    row_number() over (order by created_at, id) - 1 as home_order
  from public.collections
)
update public.collections as collection
set data = jsonb_set(
  coalesce(collection.data, '{}'::jsonb),
  '{homeOrder}',
  to_jsonb(ranked.home_order),
  true
)
from ranked_collections as ranked
where collection.id = ranked.id
  and not coalesce(collection.data, '{}'::jsonb) ? 'homeOrder';

update public.products
set data = jsonb_set(
  coalesce(data, '{}'::jsonb),
  '{features}',
  (
    case
      when lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) ~ 'cookie'
        then jsonb_build_array('Cookies de sessão correspondentes à quantidade comprada')
      when lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) ~ 'pro(xy|xies)'
        then jsonb_build_array('Dados de conexão correspondentes à quantidade comprada')
      when lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) ~ '(account|conta|login)'
        then jsonb_build_array('Credenciais de acesso correspondentes à quantidade comprada')
      else jsonb_build_array('Item digital correspondente à quantidade comprada')
    end
    || case
      when lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) ~ '(email included|mail included|e-mail incluído)'
       and lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) !~ '(no access|sem acesso|not included|não incluído)'
        then jsonb_build_array('E-mail de acesso incluído')
      when lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) ~ '(email verified|verified email|e-mail verificado)'
       and lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) ~ '(no access|sem acesso|not included|não incluído)'
        then jsonb_build_array('E-mail verificado sem acesso à caixa, conforme anunciado')
      else '[]'::jsonb
    end
    || case
      when lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) like '%2fa%'
        then jsonb_build_array('Configuração de 2FA conforme a descrição do produto')
      else '[]'::jsonb
    end
    || case
      when lower(coalesce(data->>'title', '') || ' ' || coalesce(data->>'description', '')) like '%token%'
        then jsonb_build_array('Token de acesso quando indicado na descrição')
      else '[]'::jsonb
    end
    || jsonb_build_array('Entrega digital após a confirmação do pagamento')
  ),
  true
)
where supplier = 'nppr';
