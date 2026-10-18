create table if not exists public.store_visits (
  id bigint generated always as identity primary key,
  session_id text not null unique check (char_length(session_id) between 16 and 80),
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  visitor_type text not null check (visitor_type in ('human', 'bot')),
  bot_name text,
  source text not null default 'Direto',
  medium text,
  campaign text,
  referrer_domain text,
  landing_path text not null default '/',
  country text,
  region text,
  city text,
  device_type text not null default 'desktop' check (device_type in ('desktop', 'mobile', 'tablet', 'bot')),
  created_at timestamptz not null default now()
);

create index if not exists store_visits_created_at_idx on public.store_visits (created_at desc);
create index if not exists store_visits_type_created_idx on public.store_visits (visitor_type, created_at desc);
create index if not exists store_visits_source_created_idx on public.store_visits (source, created_at desc);

alter table public.store_visits enable row level security;
revoke all on table public.store_visits from anon, authenticated;
grant all on table public.store_visits to service_role;

create or replace function public.get_store_traffic_metrics(p_days integer default 30)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with filtered as (
    select *
    from public.store_visits
    where created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  ), source_counts as (
    select source, count(*)::integer as accesses
    from filtered
    group by source
    order by accesses desc, source
    limit 5
  ), country_counts as (
    select country, count(*)::integer as accesses
    from filtered
    where country is not null and country <> ''
    group by country
    order by accesses desc, country
    limit 5
  )
  select jsonb_build_object(
    'periodDays', greatest(1, least(coalesce(p_days, 30), 365)),
    'totalAccesses', count(*)::integer,
    'humanAccesses', (count(*) filter (where visitor_type = 'human'))::integer,
    'botAccesses', (count(*) filter (where visitor_type = 'bot'))::integer,
    'uniqueHumans', (count(distinct visitor_hash) filter (where visitor_type = 'human'))::integer,
    'todayAccesses', (count(*) filter (where created_at >= date_trunc('day', now())))::integer,
    'topSources', coalesce((select jsonb_agg(to_jsonb(source_counts) order by accesses desc, source) from source_counts), '[]'::jsonb),
    'topCountries', coalesce((select jsonb_agg(to_jsonb(country_counts) order by accesses desc, country) from country_counts), '[]'::jsonb),
    'updatedAt', now()
  )
  from filtered;
$$;

revoke all on function public.get_store_traffic_metrics(integer) from public;
grant execute on function public.get_store_traffic_metrics(integer) to service_role;
