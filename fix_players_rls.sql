-- POLICY: Permitir INSERT en tabla 'players' para usuarios autenticados
create policy "Enable insert for authenticated users only"
on "public"."players"
as permissive
for insert
to authenticated
with check (true);

-- POLICY: Permitir UPDATE en tabla 'players' para usuarios autenticados
create policy "Enable update for authenticated users only"
on "public"."players"
as permissive
for update
to authenticated
using (true)
with check (true);

-- POLICY: Permitir DELETE en tabla 'players' para usuarios autenticados
create policy "Enable delete for authenticated users only"
on "public"."players"
as permissive
for delete
to authenticated
using (true);

-- POLICY: Permitir SELECT en tabla 'players' para todos
create policy "Enable read access for all users"
on "public"."players"
as permissive
for select
to public
using (true);
