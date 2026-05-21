-- ============================================================
-- Brands table + brand_id on products
-- ============================================================

-- 1. Create brands table
create table if not exists brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  active boolean default true,
  sort_order integer default 0,
  deleted_at timestamptz default null,
  created_at timestamptz default now()
);

-- 2. Add brand_id to products
alter table products
  add column if not exists brand_id uuid references brands(id) on delete set null;

-- 3. Index for fast lookups
create index if not exists idx_products_brand_id on products(brand_id);
create index if not exists idx_brands_slug on brands(slug);
create index if not exists idx_brands_active on brands(active) where active = true;

-- 4. Enable RLS
alter table brands enable row level security;

-- 5. Policies for brands
create policy "Enable read access for all users"
on brands
as permissive
for select
to public
using (true);

create policy "Enable insert for authenticated users only"
on brands
as permissive
for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users only"
on brands
as permissive
for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for authenticated users only"
on brands
as permissive
for delete
to authenticated
using (true);
