create table public.nowpayments_settings (
  id smallint primary key default 1 check (id = 1),
  api_key text not null default '',
  ipn_secret text not null default '',
  enabled boolean not null default false,
  sandbox boolean not null default true,
  pay_currency text not null default 'usdttrc20'
    check (pay_currency in ('usdttrc20', 'usdtbsc', 'usdterc20', 'usdtmatic')),
  updated_at timestamptz not null default now()
);

insert into public.nowpayments_settings (id) values (1)
on conflict (id) do nothing;

create table public.nowpayments_payments (
  payment_id text primary key,
  order_id text not null unique references public.orders(id) on delete cascade,
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

create index nowpayments_payments_status_idx
on public.nowpayments_payments (payment_status, updated_at desc);

create trigger nowpayments_settings_updated_at before update on public.nowpayments_settings
for each row execute function public.set_updated_at();

create trigger nowpayments_payments_updated_at before update on public.nowpayments_payments
for each row execute function public.set_updated_at();

alter table public.nowpayments_settings enable row level security;
alter table public.nowpayments_payments enable row level security;

revoke all on table public.nowpayments_settings, public.nowpayments_payments from anon, authenticated;
grant all on table public.nowpayments_settings, public.nowpayments_payments to service_role;
