alter table public.wallet_topups drop constraint if exists wallet_topups_status_check;
alter table public.wallet_topups add constraint wallet_topups_status_check
  check (status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'cancelled'));

create index if not exists orders_pending_created_idx
  on public.orders (created_at)
  where status = 'pending';

create index if not exists wallet_topups_pending_created_idx
  on public.wallet_topups (created_at)
  where status = 'pending';

update public.orders
set status = 'cancelled'
where status = 'pending'
  and created_at <= now() - interval '24 hours';

update public.wallet_topups
set status = 'expired'
where status = 'pending'
  and created_at <= now() - interval '24 hours';

create or replace function public.expire_stale_pending_records()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_orders integer := 0;
  v_topups integer := 0;
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória';
  end if;

  v_is_admin := public.is_admin();

  if v_is_admin then
    update public.orders
    set status = 'cancelled'
    where status = 'pending'
      and created_at <= now() - interval '24 hours';
  else
    update public.orders
    set status = 'cancelled'
    where status = 'pending'
      and customer_user_id = v_user_id
      and created_at <= now() - interval '24 hours';
  end if;
  get diagnostics v_orders = row_count;

  update public.wallet_topups
  set status = 'expired'
  where status = 'pending'
    and (user_id = v_user_id or v_is_admin)
    and created_at <= now() - interval '24 hours';
  get diagnostics v_topups = row_count;

  return jsonb_build_object('orders', v_orders, 'topups', v_topups);
end;
$$;

revoke all on function public.expire_stale_pending_records() from public;
grant execute on function public.expire_stale_pending_records() to authenticated;

create or replace function public.get_my_wallet()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_balance numeric(12,2);
  v_transactions jsonb;
  v_topups jsonb;
begin
  if v_user_id is null then raise exception 'Autenticação obrigatória'; end if;

  update public.wallet_topups
  set status = 'expired'
  where user_id = v_user_id
    and status = 'pending'
    and created_at <= now() - interval '24 hours';

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

create or replace function public.get_my_orders()
returns setof public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders;
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória';
  end if;

  update public.orders
  set status = 'cancelled'
  where customer_user_id = v_user_id
    and status = 'pending'
    and created_at <= now() - interval '24 hours';

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
