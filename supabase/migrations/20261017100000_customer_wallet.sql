alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('pix', 'credit_card', 'boleto', 'crypto', 'wallet'));

create table if not exists public.customer_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 1),
  payment_method text not null default 'crypto' check (payment_method = 'crypto'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  provider_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('credit', 'debit')),
  amount numeric(12,2) not null check (amount > 0),
  balance_after numeric(12,2) not null check (balance_after >= 0),
  description text not null,
  order_id text references public.orders(id) on delete set null,
  topup_id uuid references public.wallet_topups(id) on delete set null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  check ((order_id is not null)::integer + (topup_id is not null)::integer <= 1)
);

create table if not exists public.wallet_topup_payments (
  payment_id text primary key,
  topup_id uuid not null unique references public.wallet_topups(id) on delete cascade,
  payment_status text not null,
  pay_address text,
  pay_amount numeric,
  pay_currency text,
  actually_paid numeric not null default 0,
  purchase_id text,
  raw_response jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions (user_id, created_at desc);
create index if not exists wallet_topups_user_created_idx
  on public.wallet_topups (user_id, created_at desc);
create index if not exists wallet_topup_payments_status_idx
  on public.wallet_topup_payments (payment_status, updated_at desc);

drop trigger if exists customer_wallets_updated_at on public.customer_wallets;
create trigger customer_wallets_updated_at before update on public.customer_wallets
for each row execute function public.set_updated_at();
drop trigger if exists wallet_topups_updated_at on public.wallet_topups;
create trigger wallet_topups_updated_at before update on public.wallet_topups
for each row execute function public.set_updated_at();
drop trigger if exists wallet_topup_payments_updated_at on public.wallet_topup_payments;
create trigger wallet_topup_payments_updated_at before update on public.wallet_topup_payments
for each row execute function public.set_updated_at();

alter table public.customer_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.wallet_topups enable row level security;
alter table public.wallet_topup_payments enable row level security;

revoke all on table public.customer_wallets, public.wallet_transactions, public.wallet_topups, public.wallet_topup_payments from anon, authenticated;
grant all on table public.customer_wallets, public.wallet_transactions, public.wallet_topups, public.wallet_topup_payments to service_role;

drop policy if exists "customers read own wallet" on public.customer_wallets;
create policy "customers read own wallet" on public.customer_wallets
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "customers read own wallet transactions" on public.wallet_transactions;
create policy "customers read own wallet transactions" on public.wallet_transactions
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "customers read own wallet topups" on public.wallet_topups;
create policy "customers read own wallet topups" on public.wallet_topups
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

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

  insert into public.customer_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_customer_user() from public;

insert into public.customer_wallets (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.get_my_wallet()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_balance numeric(12,2);
  v_transactions jsonb;
  v_topups jsonb;
begin
  if v_user_id is null then raise exception 'Autenticação obrigatória'; end if;

  select balance into v_balance from public.customer_wallets where user_id = v_user_id;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
    into v_transactions
    from (select id, transaction_type, amount, balance_after, description, order_id, topup_id, created_at
          from public.wallet_transactions where user_id = v_user_id order by created_at desc limit 50) t;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
    into v_topups
    from (select id, amount, payment_method, status, created_at, paid_at
          from public.wallet_topups where user_id = v_user_id order by created_at desc limit 20) t;

  return jsonb_build_object(
    'balance', coalesce(v_balance, 0),
    'currency', 'BRL',
    'transactions', v_transactions,
    'topups', v_topups
  );
end;
$$;

revoke all on function public.get_my_wallet() from public;
grant execute on function public.get_my_wallet() to authenticated;

create or replace function public.create_wallet_order(
  p_shipping_address text,
  p_cart jsonb,
  p_coupon_code text,
  p_idempotency_key uuid
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_profile public.customer_profiles;
  v_wallet public.customer_wallets;
  v_existing_order_id text;
  v_items jsonb;
  v_subtotal numeric(12,2);
  v_discount_percent numeric(5,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_order public.orders;
  v_balance_after numeric(12,2);
begin
  if v_user_id is null then raise exception 'Autenticação obrigatória'; end if;

  select order_id into v_existing_order_id
  from public.wallet_transactions
  where idempotency_key = 'order:' || p_idempotency_key::text and user_id = v_user_id;
  if v_existing_order_id is not null then
    select * into v_order from public.orders where id = v_existing_order_id;
    return v_order;
  end if;

  select * into v_profile from public.customer_profiles where user_id = v_user_id;
  if v_profile.display_name is null or trim(v_profile.display_name) = ''
    or v_profile.document is null or trim(v_profile.document) = '' then
    raise exception 'Complete seu nome e CPF/CNPJ antes de comprar';
  end if;

  if p_cart is null or jsonb_typeof(p_cart) <> 'array' or jsonb_array_length(p_cart) = 0 then
    raise exception 'Carrinho vazio';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_cart) cart_item
    left join public.products p on p.id = (cart_item->>'productId')::uuid and p.active
    where p.id is null
  ) then raise exception 'O carrinho contém um produto indisponível'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_cart) cart_item
    join public.products p on p.id = (cart_item->>'productId')::uuid and p.active
    where p.data->>'unlimitedStock' = 'false'
      and greatest(1, least(99, coalesce((cart_item->>'quantity')::integer, 1))) >
        case when coalesce(p.data->>'stockQuantity', '') ~ '^[0-9]+$'
          then (p.data->>'stockQuantity')::integer else 1 end
  ) then raise exception 'Quantidade solicitada indisponível em estoque'; end if;

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

  if nullif(trim(p_coupon_code), '') is not null then
    select discount_percent into v_discount_percent from public.coupons
    where code = upper(trim(p_coupon_code)) and active and (expires_at is null or expires_at > now());
    v_discount_percent := coalesce(v_discount_percent, 0);
  end if;
  v_discount := round(v_subtotal * v_discount_percent / 100, 2);
  v_total := v_subtotal - v_discount;

  insert into public.customer_wallets (user_id) values (v_user_id) on conflict (user_id) do nothing;
  select * into v_wallet from public.customer_wallets where user_id = v_user_id for update;
  if v_wallet.balance < v_total then raise exception 'Saldo insuficiente na carteira'; end if;
  v_balance_after := v_wallet.balance - v_total;

  insert into public.orders (
    customer_user_id, customer_name, customer_email, customer_document, shipping_address,
    items, total, discount, applied_coupon, payment_method, status
  ) values (
    v_user_id, trim(v_profile.display_name), v_profile.email, trim(v_profile.document), nullif(trim(p_shipping_address), ''),
    v_items, v_total, v_discount,
    case when v_discount_percent > 0 then upper(trim(p_coupon_code)) else null end,
    'wallet', 'pending'
  ) returning * into v_order;

  update public.customer_wallets set balance = v_balance_after where user_id = v_user_id;
  insert into public.wallet_transactions (
    user_id, transaction_type, amount, balance_after, description, order_id, idempotency_key
  ) values (
    v_user_id, 'debit', v_total, v_balance_after, 'Pagamento do pedido ' || v_order.id,
    v_order.id, 'order:' || p_idempotency_key::text
  );

  if v_discount_percent > 0 then
    update public.coupons set usage_count = usage_count + 1 where code = upper(trim(p_coupon_code));
  end if;

  update public.orders set status = 'paid' where id = v_order.id returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.create_wallet_order(text, jsonb, text, uuid) from public;
grant execute on function public.create_wallet_order(text, jsonb, text, uuid) to authenticated;

create or replace function public.credit_wallet_topup(p_topup_id uuid, p_provider_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topup public.wallet_topups;
  v_wallet public.customer_wallets;
  v_balance_after numeric(12,2);
begin
  select * into v_topup from public.wallet_topups where id = p_topup_id for update;
  if v_topup.id is null then raise exception 'Recarga não encontrada'; end if;
  if v_topup.provider_payment_id is distinct from p_provider_payment_id then raise exception 'Pagamento não corresponde à recarga'; end if;

  insert into public.customer_wallets (user_id) values (v_topup.user_id) on conflict (user_id) do nothing;
  select * into v_wallet from public.customer_wallets where user_id = v_topup.user_id for update;

  if v_topup.status = 'paid' then
    return jsonb_build_object('balance', v_wallet.balance, 'alreadyCredited', true);
  end if;

  v_balance_after := v_wallet.balance + v_topup.amount;
  update public.customer_wallets set balance = v_balance_after where user_id = v_topup.user_id;
  update public.wallet_topups set status = 'paid', paid_at = now() where id = v_topup.id;
  insert into public.wallet_transactions (
    user_id, transaction_type, amount, balance_after, description, topup_id, idempotency_key
  ) values (
    v_topup.user_id, 'credit', v_topup.amount, v_balance_after, 'Recarga de saldo',
    v_topup.id, 'topup:' || v_topup.id::text
  ) on conflict (idempotency_key) do nothing;

  return jsonb_build_object('balance', v_balance_after, 'alreadyCredited', false);
end;
$$;

revoke all on function public.credit_wallet_topup(uuid, text) from public;
grant execute on function public.credit_wallet_topup(uuid, text) to service_role;
