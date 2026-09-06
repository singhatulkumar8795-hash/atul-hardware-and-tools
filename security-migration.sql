-- Run this entire file in Supabase SQL Editor.
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.products add column if not exists image text;
alter table public.products add column if not exists quantity integer not null default 0;
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists specification text not null default '';
grant usage on schema public to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update on table public.products to authenticated;

drop policy if exists "public can read active products" on public.products;
drop policy if exists "public can create products" on public.products;
drop policy if exists "public can deactivate products" on public.products;
drop policy if exists "public can create COD orders" on public.orders;
drop policy if exists "public can read orders" on public.orders;
drop policy if exists "admin can create products" on public.products;
drop policy if exists "admin can deactivate products" on public.products;
drop policy if exists "admin can read orders" on public.orders;
drop policy if exists "admin can update order status" on public.orders;

create policy "public can read active products" on public.products
  for select to public using (active = true);

create policy "admin can create products" on public.products
  for insert to authenticated with check (true);

create policy "admin can deactivate products" on public.products
  for update to authenticated using (true) with check (true);

create policy "admin can read orders" on public.orders
  for select to authenticated using (true);

create policy "public can create COD orders" on public.orders
  for insert to public with check (true);

create policy "admin can update order status" on public.orders
  for update to authenticated using (true) with check (true);

create or replace function public.create_cod_order(
  order_number text,
  customer_name text,
  customer_phone text,
  customer_address text,
  items jsonb,
  total integer,
  status text default 'Order received'
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_order public.orders;
begin
  if length(trim(order_number)) = 0
    or length(trim(customer_name)) = 0
    or length(trim(customer_phone)) = 0
    or length(trim(customer_address)) = 0
    or total <= 0
    or jsonb_typeof(items) <> 'array'
  then
    raise exception 'Invalid order details';
  end if;

  insert into public.orders (order_number, customer_name, customer_phone, customer_address, items, total, status)
  values (order_number, customer_name, customer_phone, customer_address, items, total, coalesce(nullif(trim(status), ''), 'Order received'))
  returning * into saved_order;
  return saved_order;
end;
$$;

revoke all on function public.create_cod_order(text, text, text, text, jsonb, integer, text) from public;
grant execute on function public.create_cod_order(text, text, text, text, jsonb, integer, text) to anon, authenticated;
