-- Migración para Colecciones Especiales asociadas a Banners Especiales
-- 90+5 Store

-- 1. Agregar columna slug y posiciones de encuadre a special_banners si no existen
ALTER TABLE public.special_banners 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS image_position_desktop TEXT DEFAULT '50% 50%',
ADD COLUMN IF NOT EXISTS image_position_mobile TEXT DEFAULT '50% 50%';

-- Crear índice único parcial para slugs no nulos
CREATE UNIQUE INDEX IF NOT EXISTS idx_special_banners_slug 
ON public.special_banners(slug) 
WHERE slug IS NOT NULL AND slug != '';

-- Poblar slugs por defecto a partir del título para los registros existentes que no tengan slug
UPDATE public.special_banners
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- 2. Crear tabla intermedia de productos para colecciones especiales
CREATE TABLE IF NOT EXISTS public.special_banner_products (
    banner_id UUID NOT NULL REFERENCES public.special_banners(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (banner_id, product_id)
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_sbp_banner_order ON public.special_banner_products(banner_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_sbp_product_id ON public.special_banner_products(product_id);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.special_banner_products ENABLE ROW LEVEL SECURITY;

-- Política de Lectura: Acceso público para que la tienda muestre la colección
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'special_banner_products' AND policyname = 'Permitir lectura publica de productos en colecciones'
    ) THEN
        CREATE POLICY "Permitir lectura publica de productos en colecciones"
        ON public.special_banner_products FOR SELECT
        USING (true);
    END IF;
END $$;

-- Política de Gestión: Permitir a usuarios autenticados (administradores) insertar/modificar/borrar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'special_banner_products' AND policyname = 'Permitir administracion de productos en colecciones'
    ) THEN
        CREATE POLICY "Permitir administracion de productos en colecciones"
        ON public.special_banner_products FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
