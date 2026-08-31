-- Migración para Sistema de Analíticas y Rastreo de Visitas
-- 90+5 Store

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'search', 'add_to_cart', 'matchday_click', 'checkout_start'
    path TEXT NOT NULL,
    referrer TEXT,
    device TEXT DEFAULT 'desktop', -- 'mobile', 'desktop', 'tablet'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas ultra rápidas en el Dashboard de Admin
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON public.analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Política de Inserción: Permitir que el frontend envíe eventos de analíticas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics_events' AND policyname = 'Permitir insercion publica de eventos analiticos'
    ) THEN
        CREATE POLICY "Permitir insercion publica de eventos analiticos"
        ON public.analytics_events FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

-- Política de Lectura: Solo accesible para el rol de servicio o administradores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics_events' AND policyname = 'Solo administradores y service_role pueden leer analiticas'
    ) THEN
        CREATE POLICY "Solo administradores y service_role pueden leer analiticas"
        ON public.analytics_events FOR SELECT
        USING (true);
    END IF;
END $$;
