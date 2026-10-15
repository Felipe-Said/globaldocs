create table if not exists public.order_inventory_deductions (
  order_id text primary key references public.orders(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.order_inventory_deductions enable row level security;
revoke all on table public.order_inventory_deductions from anon, authenticated;

create or replace function public.deduct_paid_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registered boolean;
begin
  if new.status <> 'paid' or old.status = 'paid' then
    return new;
  end if;

  insert into public.order_inventory_deductions (order_id)
  values (new.id)
  on conflict (order_id) do nothing
  returning true into v_registered;

  if not coalesce(v_registered, false) then
    return new;
  end if;

  with sold_items as (
    select
      (item->>'productId')::uuid as product_id,
      sum(greatest(1, coalesce((item->>'quantity')::integer, 1)))::integer as sold_quantity
    from jsonb_array_elements(new.items) item
    where item ? 'productId'
      and (item->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    group by (item->>'productId')::uuid
  ), inventory as (
    select
      p.id,
      case
        when coalesce(p.data->>'stockQuantity', '') ~ '^[0-9]+$'
          then (p.data->>'stockQuantity')::integer
        else 1
      end as current_stock,
      sold_items.sold_quantity
    from public.products p
    join sold_items on sold_items.product_id = p.id
    where p.data->>'unlimitedStock' = 'false'
  )
  update public.products p
  set
    data = jsonb_set(
      p.data,
      '{stockQuantity}',
      to_jsonb(greatest(0, inventory.current_stock - inventory.sold_quantity)),
      true
    ),
    active = (inventory.current_stock - inventory.sold_quantity) > 0
  from inventory
  where p.id = inventory.id;

  return new;
end;
$$;

revoke all on function public.deduct_paid_order_inventory() from public;

drop trigger if exists deduct_inventory_after_payment on public.orders;
create trigger deduct_inventory_after_payment
after update of status on public.orders
for each row
when (new.status = 'paid' and old.status is distinct from 'paid')
execute function public.deduct_paid_order_inventory();

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
  v_public_items jsonb;
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
grant execute on function public.create_order(text, text, text, text, text, jsonb, text) to anon, authenticated;
