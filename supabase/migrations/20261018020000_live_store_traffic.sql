alter table public.store_visits
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists ended_at timestamptz;

update public.store_visits
set last_seen_at = created_at
where last_seen_at is null;

create index if not exists store_visits_last_seen_idx
  on public.store_visits (last_seen_at desc);

create index if not exists store_visits_type_last_seen_idx
  on public.store_visits (visitor_type, last_seen_at desc);

create or replace function public.get_store_traffic_metrics(p_days integer default 30)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with period_visits as (
    select *
    from public.store_visits
    where created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  ), today_visits as (
    select *
    from public.store_visits
    where timezone('America/Sao_Paulo', created_at) >= date_trunc('day', timezone('America/Sao_Paulo', now()))
  ), live_visits as (
    select *
    from public.store_visits
    where last_seen_at >= now() - interval '2 minutes'
      and ended_at is null
  ), source_counts as (
    select source, count(*)::integer as accesses
    from today_visits
    group by source
    order by accesses desc, source
    limit 5
  ), country_counts as (
    select country, count(*)::integer as accesses
    from today_visits
    where country is not null and country <> ''
    group by country
    order by accesses desc, country
    limit 5
  )
  select jsonb_build_object(
    'periodDays', greatest(1, least(coalesce(p_days, 30), 365)),
    'totalAccesses', (select count(*)::integer from period_visits),
    'humanAccesses', (select count(*)::integer from period_visits where visitor_type = 'human'),
    'botAccesses', (select count(*)::integer from period_visits where visitor_type = 'bot'),
    'uniqueHumans', (select count(distinct visitor_hash)::integer from period_visits where visitor_type = 'human'),
    'onlineHumans', (select count(distinct session_id)::integer from live_visits where visitor_type = 'human'),
    'onlineBots', (select count(distinct session_id)::integer from live_visits where visitor_type = 'bot'),
    'todayAccesses', (select count(*)::integer from today_visits),
    'todayHumans', (select count(distinct session_id)::integer from today_visits where visitor_type = 'human'),
    'todayBots', (select count(distinct session_id)::integer from today_visits where visitor_type = 'bot'),
    'topSources', coalesce((select jsonb_agg(to_jsonb(source_counts) order by accesses desc, source) from source_counts), '[]'::jsonb),
    'topCountries', coalesce((select jsonb_agg(to_jsonb(country_counts) order by accesses desc, country) from country_counts), '[]'::jsonb),
    'liveWindowSeconds', 120,
    'updatedAt', now()
  );
$$;

revoke all on function public.get_store_traffic_metrics(integer) from public;
grant execute on function public.get_store_traffic_metrics(integer) to service_role;
