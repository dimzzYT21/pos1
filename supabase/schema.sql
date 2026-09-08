-- Jalankan seluruh file ini di Supabase SQL Editor.
-- 1) Buat tabel profil, produk, pesanan, detail pesanan.
-- 2) RLS aktif agar customer hanya melihat pesanannya sendiri.
-- 3) Admin ditentukan dari profiles.role = 'admin'.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  price numeric(14,2) not null default 0,
  stock integer not null default 0,
  category text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('INV-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text,
  subtotal numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  payment_method text not null default 'cash',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(14,2) not null,
  qty integer not null check (qty > 0),
  line_total numeric(14,2) not null
);

-- Profil otomatis dibuat saat user register.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Kurangi stok secara atomik.
create or replace function public.decrement_stock(product_id uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set stock = stock - amount
  where id = product_id and stock >= amount;
  if not found then
    raise exception 'Stok tidak cukup';
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper policy: user dapat membaca profilnya sendiri.
drop policy if exists "profile own read" on public.profiles;
create policy "profile own read" on public.profiles
for select using (auth.uid() = id);

-- Produk boleh dilihat publik; hanya admin yang boleh mengubah.
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
for select using (is_active = true or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "products admin insert" on public.products;
create policy "products admin insert" on public.products
for insert with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists "products admin update" on public.products;
create policy "products admin update" on public.products
for update using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products
for delete using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Customer boleh membuat order untuk dirinya/guest; admin dapat melihat semua.
drop policy if exists "orders read own or admin" on public.orders;
create policy "orders read own or admin" on public.orders
for select using (
  customer_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
);

drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders
for insert with check (customer_id is null or customer_id = auth.uid());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders
for update using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Detail order: customer melihat detail miliknya; admin semua.
drop policy if exists "order items read own or admin" on public.order_items;
create policy "order items read own or admin" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.customer_id = auth.uid()
        or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
  )
);

drop policy if exists "order items insert" on public.order_items;
create policy "order items insert" on public.order_items
for insert with check (
  exists (select 1 from public.orders o where o.id=order_id and (o.customer_id = auth.uid() or o.customer_id is null))
);

-- Seed contoh produk.
insert into public.products(name, sku, price, stock, category)
values
('Kopi Susu', 'SKU-001', 18000, 100, 'Minuman'),
('Americano', 'SKU-002', 15000, 100, 'Minuman'),
('Nasi Goreng', 'SKU-003', 25000, 50, 'Makanan'),
('Mie Goreng', 'SKU-004', 22000, 50, 'Makanan'),
('Es Teh', 'SKU-005', 8000, 150, 'Minuman')
on conflict (sku) do nothing;

-- SET ADMIN:
-- 1. Register user melalui /login.
-- 2. Setelah user dibuat, jalankan:
-- update public.profiles set role='admin' where id='UUID_USER_ANDA';