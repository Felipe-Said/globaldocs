create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;
grant all on table public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.api_rate_limits;
begin
  if p_key is null or length(p_key) < 16 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.api_rate_limits (rate_key, request_count)
  values (p_key, 0)
  on conflict (rate_key) do nothing;

  select * into v_row from public.api_rate_limits where rate_key = p_key for update;
  if v_row.window_started_at <= now() - make_interval(secs => p_window_seconds) then
    update public.api_rate_limits
    set window_started_at = now(), request_count = 1, updated_at = now()
    where rate_key = p_key;
    return true;
  end if;
  if v_row.request_count >= p_limit then return false; end if;

  update public.api_rate_limits
  set request_count = request_count + 1, updated_at = now()
  where rate_key = p_key;
  return true;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

create or replace function public.credit_wallet_topup(p_topup_id uuid, p_provider_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topup public.wallet_topups;
  v_payment public.wallet_topup_payments;
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
  if v_topup.status <> 'pending' then raise exception 'A recarga não está aberta para crédito'; end if;

  select * into v_payment from public.wallet_topup_payments
  where topup_id = v_topup.id and payment_id = p_provider_payment_id for update;
  if v_payment.payment_id is null
    or v_payment.payment_status <> 'finished'
    or v_payment.pay_amount is null
    or v_payment.actually_paid < v_payment.pay_amount then
    raise exception 'Pagamento ainda não foi integralmente confirmado';
  end if;

  v_balance_after := v_wallet.balance + v_topup.amount;
  update public.customer_wallets set balance = v_balance_after where user_id = v_topup.user_id;
  update public.wallet_topups set status = 'paid', paid_at = now() where id = v_topup.id and status = 'pending';
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
