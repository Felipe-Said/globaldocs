alter table public.nppr_fulfillments
add column if not exists failure_code text;

update public.nppr_fulfillments
set failure_code = 'insufficient_balance'
where status = 'failed'
  and lower(coalesce(error_message, '')) like '%not enough balance%'
  and failure_code is null;

create or replace function public.enrich_order_delivery_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  enriched_items jsonb := '[]'::jsonb;
  product_supplier text;
  delivered boolean;
begin
  for item in select value from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) loop
    select supplier into product_supplier
    from public.products
    where id = (item->>'productId')::uuid;

    if product_supplier = 'nppr' then
      select exists (
        select 1
        from public.nppr_fulfillments fulfillment
        where fulfillment.order_id = new.id
          and fulfillment.product_id = (item->>'productId')::uuid
          and fulfillment.status = 'completed'
      ) into delivered;

      item := item || jsonb_build_object(
        'requiresFulfillment', true,
        'deliveryStatus', case
          when delivered or nullif(item->>'accessLogins', '') is not null then 'delivered'
          else coalesce(nullif(item->>'deliveryStatus', ''), 'processing')
        end
      );
    end if;

    enriched_items := enriched_items || jsonb_build_array(item);
  end loop;

  new.items := enriched_items;
  return new;
end;
$$;

drop trigger if exists enrich_order_delivery_state_trigger on public.orders;
create trigger enrich_order_delivery_state_trigger
before insert or update of items on public.orders
for each row execute function public.enrich_order_delivery_state();

revoke all on function public.enrich_order_delivery_state() from public, anon, authenticated;

update public.orders set items = items;
