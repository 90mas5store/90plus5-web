-- POLICY: Permitir INSERT en tabla 'patches' para usuarios autenticados
create policy "Enable insert for authenticated users only"
on "public"."patches"
as permissive
for insert
to authenticated
with check (true);

-- POLICY: Permitir UPDATE en tabla 'patches' para usuarios autenticados
create policy "Enable update for authenticated users only"
on "public"."patches"
as permissive
for update
to authenticated
using (true)
with check (true);

-- POLICY: Permitir DELETE en tabla 'patches' para usuarios autenticados
create policy "Enable delete for authenticated users only"
on "public"."patches"
as permissive
for delete
to authenticated
using (true);

-- Asegurarse de que SELECT sea público o al menos autenticado (probablemente ya existe, pero por si acaso)
create policy "Enable read access for all users"
on "public"."patches"
as permissive
for select
to public
using (true);
