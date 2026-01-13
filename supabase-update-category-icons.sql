-- ============================================
-- Script SQL para Configurar Iconos de Categorías
-- 90+5 Store
-- ============================================

-- 1️⃣ Agregar la columna icon_url (si no existe)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- 2️⃣ Actualizar categorías con sus iconos
-- Asegúrate de que los slugs coincidan con tus categorías existentes

-- Futbol
UPDATE categories 
SET icon_url = '/icons/categories/futbol.svg'
WHERE slug = 'futbol';

-- Mundial 2026
UPDATE categories 
SET icon_url = '/icons/categories/mundial-2026.svg'
WHERE slug = 'mundial-2026' OR slug = 'mundial2026' OR name ILIKE '%mundial%2026%';

-- Tenis (Running)
UPDATE categories 
SET icon_url = '/icons/categories/tenis.svg'
WHERE slug = 'tenis' OR slug = 'running' OR name ILIKE '%tenis%' OR name ILIKE '%running%';

-- Formula 1
UPDATE categories 
SET icon_url = '/icons/categories/formula1.svg'
WHERE slug = 'formula1' OR slug = 'formula-1' OR name ILIKE '%formula%1%';

-- ============================================
-- 3️⃣ Verificar que se aplicaron correctamente
-- ============================================
SELECT 
    id,
    name,
    slug,
    icon_url,
    order_index,
    active
FROM categories
WHERE active = true
ORDER BY order_index;

-- ============================================
-- NOTAS:
-- ============================================
-- - Los iconos SVG están en: public/icons/categories/
-- - Si tus slugs son diferentes, ajusta el WHERE de cada UPDATE
-- - Los iconos se cargan desde la ruta pública: /icons/categories/nombre.svg
-- - Si una categoría no tiene icon_url, se mostrará el ícono Sparkles por defecto
