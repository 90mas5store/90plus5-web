-- 🛡️ PARCHE DE SEGURIDAD: SISTEMA DE ROLES DE ADMIN
-- ================================================
-- Este script separa "Usuarios Logueados" de "Administradores".
-- Prepara tu sistema para tener clientes en el futuro sin riesgos.

-- 1. Crear tabla de Lista Blanca de Admins
create table if not exists public.admin_whitelist (
  id uuid references auth.users not null primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hacerla segura (RLS)
alter table public.admin_whitelist enable row level security;

-- Política: Los admins pueden ver quién más es admin
create policy "Admins can view whitelist" on public.admin_whitelist
  for select to authenticated
  using (auth.uid() in (select id from public.admin_whitelist));

-- 2. Función Helper "is_admin()"
-- Esta función se usará en TODAS las políticas para verificar permisos
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.admin_whitelist
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 3. AUTO-INSERTAR TU USUARIO ACTUAL (Para no bloquearte a ti mismo)
-- ⚠️ ADVERTENCIA: Esto inserta el usuario que EJECUTA este script si lo corres desde la app,
-- pero como lo correrás en el SQL Editor de Supabase, necesitas poner tu email manualmente abajo
-- o insertar tu UID si lo conoces.
-- Para facilitar, dejaremos que insertes tu email después de crear la tabla manualmente si es necesario,
-- O mejor aún, usa este bloque para insertar tu primer admin basado en el email:

-- SUSTITUYE 'tu_email@ejemplo.com' POR TU EMAIL DE ADMIN REAL
-- insert into public.admin_whitelist (id, email)
-- select id, email from auth.users where email = 'tu_email@ejemplo.com';


-- 4. ACTUALIZAR LAS POLÍTICAS DE SEGURIDAD (RLS)
-- Reemplazamos las políticas "TO authenticated" por "USING is_admin()"

-- === PRODUCTOS ===
drop policy if exists "Admin Full Access Products" on products;
create policy "Admin Full Access Products" on products 
  for all to authenticated 
  using (is_admin()) 
  with check (is_admin());

-- === VARIANTES ===
drop policy if exists "Admin Full Access Variants" on product_variants;
create policy "Admin Full Access Variants" on product_variants 
  for all to authenticated 
  using (is_admin()) 
  with check (is_admin());

drop policy if exists "Admin Full Access Sizes" on variant_sizes;
create policy "Admin Full Access Sizes" on variant_sizes 
  for all to authenticated 
  using (is_admin()) 
  with check (is_admin());

-- === CONFIGURACIÓN (Ligas, Equipos, Categorías) ===
drop policy if exists "Admin Full Access Teams" on teams;
create policy "Admin Full Access Teams" on teams for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admin Full Access Leagues" on leagues;
create policy "Admin Full Access Leagues" on leagues for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admin Full Access Categories" on categories;
create policy "Admin Full Access Categories" on categories for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admin Full Access Players" on players;
create policy "Admin Full Access Players" on players for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admin Full Access Patches" on patches;
create policy "Admin Full Access Patches" on patches for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admin Full Access ProdPatches" on product_patches;
create policy "Admin Full Access ProdPatches" on product_patches for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admin Full Access ProdLeagues" on product_leagues;
create policy "Admin Full Access ProdLeagues" on product_leagues for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admin Full Access Shipping" on shipping_zones;
create policy "Admin Full Access Shipping" on shipping_zones for all to authenticated using (is_admin()) with check (is_admin());

-- === ÓRDENES (Datos Sensibles) ===
drop policy if exists "Admin Full Access Orders" on orders;
create policy "Admin Full Access Orders" on orders 
  for all to authenticated 
  using (is_admin()) 
  with check (is_admin());

drop policy if exists "Admin Full Access Order Items" on order_items;
create policy "Admin Full Access Order Items" on order_items 
  for all to authenticated 
  using (is_admin()) 
  with check (is_admin());

drop policy if exists "Admin Full Access Payments" on payments;
create policy "Admin Full Access Payments" on payments 
  for all to authenticated 
  using (is_admin()) 
  with check (is_admin());

-- ================================================
-- INSTRUCCIONES FINALES:
-- 1. Copia y ejecuta todo este script en el SQL Editor de Supabase.
-- 2. IMPORTANTE: Justo después, ejecuta esta línea sustituyendo tu correo:
--    insert into public.admin_whitelist (id, email)
--    select id, email from auth.users where email = 'TU_CORREO_ADMIN@AQUI.COM';
-- ================================================
