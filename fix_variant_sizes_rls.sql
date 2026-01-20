-- POLICY: Permitir INSERT en tabla 'variant_sizes' para usuarios autenticados
create policy "Enable insert for authenticated users only"
on "public"."variant_sizes"
as permissive
for insert
to authenticated
with check (true);

-- POLICY: Permitir DELETE en tabla 'variant_sizes' para usuarios autenticados
create policy "Enable delete for authenticated users only"
on "public"."variant_sizes"
as permissive
for delete
to authenticated
using (true);

-- POLICY: Permitir SELECT en tabla 'variant_sizes' para todos (o autenticados)
create policy "Enable read access for all users"
on "public"."variant_sizes"
as permissive
for select
to public
using (true);

-- Check optional: product_variants (in case it is missing too)
-- create policy "Enable all for authenticated users" on "public"."product_variants" ...
