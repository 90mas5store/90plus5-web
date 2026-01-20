-- POLICY: Permitir INSERT en tabla 'product_patches' para usuarios autenticados
create policy "Enable insert for authenticated users only"
on "public"."product_patches"
as permissive
for insert
to authenticated
with check (true);

-- POLICY: Permitir DELETE en tabla 'product_patches' para usuarios autenticados
create policy "Enable delete for authenticated users only"
on "public"."product_patches"
as permissive
for delete
to authenticated
using (true);

-- POLICY: Permitir SELECT en tabla 'product_patches' para todos (o autenticados)
create policy "Enable read access for all users"
on "public"."product_patches"
as permissive
for select
to public
using (true);
