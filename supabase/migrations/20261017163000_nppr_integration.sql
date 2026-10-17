create table public.nppr_settings (
  id smallint primary key default 1 check (id = 1),
  api_key text not null default '',
  enabled boolean not null default false,
  auto_fulfill boolean not null default false,
  publish_products boolean not null default false,
  usd_brl_rate numeric(10,4) not null default 5.50 check (usd_brl_rate > 0),
  markup_percent numeric(7,2) not null default 30 check (markup_percent >= 0 and markup_percent <= 1000),
  last_tested_at timestamptz,
  last_sync_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists supplier text;
alter table public.products add column if not exists supplier_product_id text;
create unique index if not exists products_supplier_product_uidx
on public.products (supplier, supplier_product_id);

insert into public.nppr_settings (id) values (1)
on conflict (id) do nothing;

create table public.nppr_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  supplier_product_id bigint not null,
  quantity integer not null check (quantity > 0),
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  supplier_order_id text,
  delivered_items jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create index nppr_fulfillments_order_idx on public.nppr_fulfillments (order_id, created_at desc);

create trigger nppr_settings_updated_at before update on public.nppr_settings
for each row execute function public.set_updated_at();
create trigger nppr_fulfillments_updated_at before update on public.nppr_fulfillments
for each row execute function public.set_updated_at();

alter table public.nppr_settings enable row level security;
alter table public.nppr_fulfillments enable row level security;

revoke all on table public.nppr_settings, public.nppr_fulfillments from anon, authenticated;
grant all on table public.nppr_settings, public.nppr_fulfillments to service_role;
