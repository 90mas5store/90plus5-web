-- 📦 STORAGE SETUP: 90+5 STORE (CORREGIDO)
-- Copy and paste this into the Supabase SQL Editor

-- 1. Crear el Bucket "products" si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- (Omitimos el ALTER TABLE ya que suele estar activado por defecto y causa error de permisos)

-- 2. LIMPIEZA DE POLÍTICAS PREVIAS (Para evitar errores de duplicados)
DROP POLICY IF EXISTS "Public Access Products Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Images" ON storage.objects;

-- 3. POLÍTICAS DE ACCESO

-- 👁️ PÚBLICO: Ver imágenes
-- Cualquiera puede descargar/ver archivos del bucket 'products'
CREATE POLICY "Public Access Products Images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'products' );

-- 🔓 ADMIN: Subir imágenes
-- Solo usuarios autenticados pueden subir
CREATE POLICY "Admin Insert Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- ✏️ ADMIN: Actualizar imágenes
CREATE POLICY "Admin Update Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' );

-- 🗑️ ADMIN: Borrar imágenes
CREATE POLICY "Admin Delete Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );
