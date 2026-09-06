-- Run this entire file in Supabase SQL Editor.
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.products add column if not exists image text;

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
  for select to anon, authenticated using (active = true);

create policy "admin can create products" on public.products
  for insert to authenticated with check (true);

create policy "admin can deactivate products" on public.products
  for update to authenticated using (true) with check (true);

create policy "admin can read orders" on public.orders
  for select to authenticated using (true);

create policy "public can create COD orders" on public.orders
  for insert to anon, authenticated with check (true);

create policy "admin can update order status" on public.orders
  for update to authenticated using (true) with check (true);
