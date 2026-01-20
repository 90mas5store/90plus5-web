-- POLICY: Permitir UPDATE en tabla 'product_variants' para usuarios autenticados
create policy "Enable update for authenticated users only"
on "public"."product_variants"
as permissive
for update
to authenticated
using (true)
with check (true);

-- POLICY: Permitir INSERT en tabla 'product_variants' para usuarios autenticados
create policy "Enable insert for authenticated users only"
on "public"."product_variants"
as permissive
for insert
to authenticated
with check (true);

-- POLICY: Permitir DELETE en tabla 'product_variants' para usuarios autenticados
create policy "Enable delete for authenticated users only"
on "public"."product_variants"
as permissive
for delete
to authenticated
using (true);

-- POLICY: Permitir SELECT en tabla 'product_variants' para todos (o autenticados)
create policy "Enable read access for all users"
on "public"."product_variants"
as permissive
for select
to public
using (true);
