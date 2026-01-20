-- Create product_leagues junction table
create table if not exists product_leagues (
  product_id uuid references products(id) on delete cascade,
  league_id uuid references leagues(id) on delete cascade,
  primary key (product_id, league_id)
);

-- Migrate existing data: Copy league_id from products to product_leagues
insert into product_leagues (product_id, league_id)
select id, league_id from products where league_id is not null
on conflict do nothing;

-- Enable RLS
alter table product_leagues enable row level security;

-- Policies for product_leagues
create policy "Enable read access for all users"
on "product_leagues"
as permissive
for select
to public
using (true);

create policy "Enable insert for authenticated users only"
on "public"."product_leagues"
as permissive
for insert
to authenticated
with check (true);

create policy "Enable delete for authenticated users only"
on "public"."product_leagues"
as permissive
for delete
to authenticated
using (true);
