-- Migración para Geolocalización y Enriquecimiento de Analíticas
-- 90+5 Store

-- 1. Añadir columnas de ubicación geográfica a analytics_events si no existen
ALTER TABLE public.analytics_events
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS region TEXT;

-- 2. Índices para agrupar rápidamente por país y ciudad
CREATE INDEX IF NOT EXISTS idx_analytics_events_country ON public.analytics_events(country);
CREATE INDEX IF NOT EXISTS idx_analytics_events_city ON public.analytics_events(city);

-- 3. Comentarios explicativos
COMMENT ON COLUMN public.analytics_events.country IS 'Código ISO de país (ej. HN, US, ES, MX) o nombre detectado';
COMMENT ON COLUMN public.analytics_events.city IS 'Nombre de la ciudad detectada (ej. Tegucigalpa, San Pedro Sula)';
COMMENT ON COLUMN public.analytics_events.region IS 'Código o nombre del estado, provincia o departamento';

