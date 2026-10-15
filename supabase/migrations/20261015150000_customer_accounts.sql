alter table public.orders
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_customer_user_id_created_at_idx
  on public.orders (customer_user_id, created_at desc);

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;
revoke all on table public.customer_profiles from anon, authenticated;
grant select, update on table public.customer_profiles to authenticated;

drop policy if exists "customers read own profile" on public.customer_profiles;
create policy "customers read own profile" on public.customer_profiles
for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "customers update own profile" on public.customer_profiles;
create policy "customers update own profile" on public.customer_profiles
for update to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.set_customer_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_profiles_updated_at on public.customer_profiles;
create trigger customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_customer_profile_updated_at();

create or replace function public.handle_new_customer_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customer_profiles (user_id, email)
  values (new.id, lower(new.email))
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

revoke all on function public.handle_new_customer_user() from public;

drop trigger if exists create_customer_profile_after_signup on auth.users;
create trigger create_customer_profile_after_signup
after insert or update of email on auth.users
for each row
when (new.email is not null)
execute function public.handle_new_customer_user();

insert into public.customer_profiles (user_id, email)
select id, lower(email)
from auth.users
where email is not null
on conflict (user_id) do update set email = excluded.email;

create or replace function public.claim_customer_orders()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_profile public.customer_profiles;
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória';
  end if;

  select lower(email) into v_email from auth.users where id = v_user_id;
  if v_email is null then
    raise exception 'Conta sem e-mail verificado';
  end if;

  insert into public.customer_profiles (user_id, email)
  values (v_user_id, v_email)
  on conflict (user_id) do update set email = excluded.email
  returning * into v_profile;

  update public.orders
  set customer_user_id = v_user_id
  where customer_user_id is null
    and lower(customer_email) = v_email;

  select * into v_profile
  from public.customer_profiles
  where user_id = v_user_id;

  return jsonb_build_object(
    'id', v_profile.user_id,
    'email', v_profile.email,
    'name', v_profile.display_name,
    'document', v_profile.document
  );
end;
$$;

revoke all on function public.claim_customer_orders() from public;
grant execute on function public.claim_customer_orders() to authenticated;

create or replace function public.get_my_orders()
returns setof public.orders
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders;
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória';
  end if;

  for v_order in
    select o.*
    from public.orders o
    where o.customer_user_id = v_user_id
    order by o.created_at desc
  loop
    if v_order.status <> 'paid' then
      select coalesce(jsonb_agg(
        item - 'downloadFileName' - 'zipFileName' - 'accessLogins' - 'proxyDetails' - 'accessInstructions'
      ), '[]'::jsonb)
      into v_order.items
      from jsonb_array_elements(v_order.items) item;
    end if;
    return next v_order;
  end loop;
end;
$$;

revoke all on function public.get_my_orders() from public;
grant execute on function public.get_my_orders() to authenticated;

create or replace function public.create_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_document text,
  p_shipping_address text,
  p_payment_method text,
  p_cart jsonb,
  p_coupon_code text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_verified_email text;
  v_items jsonb;
  v_public_items jsonb;
  v_subtotal numeric(12,2);
  v_discount_percent numeric(5,2) := 0;
  v_discount numeric(12,2) := 0;
  v_order public.orders;
begin
  if v_user_id is null then
    raise exception 'Crie ou acesse sua conta antes de finalizar a compra';
  end if;

  select lower(email) into v_verified_email from auth.users where id = v_user_id;
  if v_verified_email is null or v_verified_email <> lower(trim(p_customer_email)) then
    raise exception 'O e-mail da compra deve ser o mesmo da conta autenticada';
  end if;

  if nullif(trim(p_customer_name), '') is null
    or nullif(trim(p_customer_document), '') is null then
    raise exception 'Dados do comprador incompletos';
  end if;

  if p_payment_method not in ('pix', 'credit_card', 'boleto', 'crypto') then
    raise exception 'Método de pagamento inválido';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_cart) cart_item
    left join public.products p on p.id = (cart_item->>'productId')::uuid and p.active
    where p.id is null
  ) then
    raise exception 'O carrinho contém um produto indisponível';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_cart) cart_item
    join public.products p on p.id = (cart_item->>'productId')::uuid and p.active
    where p.data->>'unlimitedStock' = 'false'
      and greatest(1, least(99, coalesce((cart_item->>'quantity')::integer, 1))) >
        case
          when coalesce(p.data->>'stockQuantity', '') ~ '^[0-9]+$'
            then (p.data->>'stockQuantity')::integer
          else 1
        end
  ) then
    raise exception 'Quantidade solicitada indisponível em estoque';
  end if;

  select
    coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'productId', p.id::text,
      'productTitle', p.data->>'title',
      'productType', p.data->>'productType',
      'format', p.data->>'format',
      'price', (p.data->>'price')::numeric,
      'quantity', greatest(1, least(99, coalesce((cart_item->>'quantity')::integer, 1))),
      'downloadFileName', d.data->>'downloadFileName',
      'zipFileName', d.data->>'zipFileName',
      'accessLogins', d.data->>'accessLogins',
      'proxyDetails', d.data->>'proxyDetails',
      'accessInstructions', d.data->>'accessInstructions'
    ))), '[]'::jsonb),
    coalesce(sum((p.data->>'price')::numeric * greatest(1, least(99, coalesce((cart_item->>'quantity')::integer, 1)))), 0)
  into v_items, v_subtotal
  from jsonb_array_elements(p_cart) cart_item
  join public.products p on p.id = (cart_item->>'productId')::uuid and p.active
  left join public.product_deliverables d on d.product_id = p.id;

  if jsonb_array_length(v_items) = 0 then
    raise exception 'Carrinho vazio ou contém produtos indisponíveis';
  end if;

  if nullif(trim(p_coupon_code), '') is not null then
    select discount_percent into v_discount_percent
    from public.coupons
    where code = upper(trim(p_coupon_code)) and active
      and (expires_at is null or expires_at > now());
    v_discount_percent := coalesce(v_discount_percent, 0);
  end if;

  v_discount := round(v_subtotal * v_discount_percent / 100, 2);

  insert into public.customer_profiles (user_id, email, display_name, document)
  values (v_user_id, v_verified_email, trim(p_customer_name), trim(p_customer_document))
  on conflict (user_id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    document = excluded.document;

  update public.orders
  set customer_user_id = v_user_id
  where customer_user_id is null
    and lower(customer_email) = v_verified_email;

  insert into public.orders (
    customer_user_id, customer_name, customer_email, customer_document, shipping_address,
    items, total, discount, applied_coupon, payment_method, status
  ) values (
    v_user_id, trim(p_customer_name), v_verified_email, trim(p_customer_document), nullif(trim(p_shipping_address), ''),
    v_items, v_subtotal - v_discount, v_discount,
    case when v_discount_percent > 0 then upper(trim(p_coupon_code)) else null end,
    p_payment_method, 'pending'
  ) returning * into v_order;

  if v_discount_percent > 0 then
    update public.coupons set usage_count = usage_count + 1
    where code = upper(trim(p_coupon_code));
  end if;

  select coalesce(jsonb_agg(
    item - 'downloadFileName' - 'zipFileName' - 'accessLogins' - 'proxyDetails' - 'accessInstructions'
  ), '[]'::jsonb)
  into v_public_items
  from jsonb_array_elements(v_order.items) item;

  v_order.items := v_public_items;
  return v_order;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb, text) from public;
grant execute on function public.create_order(text, text, text, text, text, jsonb, text) to authenticated;

update public.store_settings
set data = jsonb_set(data, '{allowGuestCheckout}', 'false'::jsonb, true)
where id = 1;
