create extension if not exists pgcrypto;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_deliverables (
  product_id uuid primary key references public.products(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coupons (
  code text primary key,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  active boolean not null default true,
  usage_count integer not null default 0 check (usage_count >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id text primary key default ('ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_name text not null,
  customer_email text not null,
  customer_document text not null,
  shipping_address text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total numeric(12,2) not null check (total >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  applied_coupon text,
  payment_method text not null check (payment_method in ('pix', 'credit_card', 'boleto', 'crypto')),
  status text not null default 'pending' check (status in ('paid', 'pending', 'cancelled')),
  download_token text not null unique default ('tk_' || encode(extensions.gen_random_bytes(24), 'hex')),
  tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_email_idx on public.orders (lower(customer_email));
create index orders_created_at_idx on public.orders (created_at desc);

create table public.store_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.integration_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, data)
values (1, jsonb_build_object(
  'storeName', 'GlobalDOCS',
  'storeTagline', '',
  'contactEmail', 'saidlabsglobal@gmail.com',
  'supportWhatsapp', '',
  'pixKey', '',
  'currency', 'BRL (R$)',
  'allowGuestCheckout', true,
  'notifyOnSale', true
));

insert into public.integration_settings (id, data) values (1, '{}'::jsonb);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger collections_updated_at before update on public.collections
for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger product_deliverables_updated_at before update on public.product_deliverables
for each row execute function public.set_updated_at();
create trigger banners_updated_at before update on public.banners
for each row execute function public.set_updated_at();
create trigger coupons_updated_at before update on public.coupons
for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger store_settings_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();
create trigger integration_settings_updated_at before update on public.integration_settings
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_deliverables enable row level security;
alter table public.banners enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.store_settings enable row level security;
alter table public.integration_settings enable row level security;

revoke all on table public.admin_users, public.collections, public.products,
  public.product_deliverables, public.banners, public.coupons, public.orders,
  public.store_settings, public.integration_settings from anon, authenticated;

grant select on table public.collections, public.products, public.banners, public.store_settings to anon;
grant select on table public.collections, public.products, public.banners, public.store_settings to authenticated;
grant select, insert, update, delete on table public.admin_users, public.collections, public.products,
  public.product_deliverables, public.banners, public.coupons, public.orders,
  public.store_settings, public.integration_settings to authenticated;

create policy "public reads active collections" on public.collections
for select to anon using (active);
create policy "authenticated reads collections" on public.collections
for select to authenticated using (active or public.is_admin());
create policy "admins manage collections" on public.collections
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads active products" on public.products
for select to anon using (active);
create policy "authenticated reads products" on public.products
for select to authenticated using (active or public.is_admin());
create policy "admins manage products" on public.products
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins manage product deliverables" on public.product_deliverables
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads active banners" on public.banners
for select to anon using (active);
create policy "authenticated reads banners" on public.banners
for select to authenticated using (active or public.is_admin());
create policy "admins manage banners" on public.banners
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins manage coupons" on public.coupons
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage orders" on public.orders
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read own membership" on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));
create policy "admins manage settings" on public.store_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public reads store settings" on public.store_settings
for select to anon using (true);
create policy "authenticated reads store settings" on public.store_settings
for select to authenticated using (true);
create policy "admins manage integrations" on public.integration_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.validate_coupon(p_code text)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select jsonb_build_object(
      'code', code,
      'discountPercent', discount_percent,
      'active', active,
      'usageCount', usage_count,
      'expiresAt', expires_at
    )
    from public.coupons
    where code = upper(trim(p_code))
      and active
      and (expires_at is null or expires_at > now())),
    'null'::jsonb
  );
$$;

revoke all on function public.validate_coupon(text) from public;
grant execute on function public.validate_coupon(text) to anon, authenticated;

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
  v_items jsonb;
  v_subtotal numeric(12,2);
  v_discount_percent numeric(5,2) := 0;
  v_discount numeric(12,2) := 0;
  v_order public.orders;
begin
  if nullif(trim(p_customer_name), '') is null
    or nullif(trim(p_customer_email), '') is null
    or nullif(trim(p_customer_document), '') is null then
    raise exception 'Dados do comprador incompletos';
  end if;

  if p_payment_method not in ('pix', 'credit_card', 'boleto', 'crypto') then
    raise exception 'Método de pagamento inválido';
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

  insert into public.orders (
    customer_name, customer_email, customer_document, shipping_address,
    items, total, discount, applied_coupon, payment_method, status
  ) values (
    trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_document), nullif(trim(p_shipping_address), ''),
    v_items, v_subtotal - v_discount, v_discount,
    case when v_discount_percent > 0 then upper(trim(p_coupon_code)) else null end,
    p_payment_method, 'pending'
  ) returning * into v_order;

  if v_discount_percent > 0 then
    update public.coupons set usage_count = usage_count + 1
    where code = upper(trim(p_coupon_code));
  end if;

  return v_order;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb, text) from public;
grant execute on function public.create_order(text, text, text, text, text, jsonb, text) to anon, authenticated;

create or replace function public.get_customer_orders(p_email text, p_download_token text)
returns setof public.orders
language sql
security definer
set search_path = ''
stable
as $$
  select o.* from public.orders o
  where lower(o.customer_email) = lower(trim(p_email))
    and o.download_token = trim(p_download_token)
    and o.status = 'paid'
  order by o.created_at desc;
$$;

revoke all on function public.get_customer_orders(text, text) from public;
grant execute on function public.get_customer_orders(text, text) to anon, authenticated;
