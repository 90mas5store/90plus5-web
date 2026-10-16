-- Migración: Jugadores por camisa (product_players)
-- 90+5 Store
--
-- Antes: los jugadores (players) pertenecían a un equipo y aparecían en TODAS
-- las camisas de ese equipo.
-- Ahora: players sigue siendo la plantilla del equipo, y product_players define
-- qué jugadores de esa plantilla están listados en cada camisa. Se usa para el
-- personalizador de dorsales y para la búsqueda por jugador.

-- 1. Tabla intermedia
CREATE TABLE IF NOT EXISTS public.product_players (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    player_id  UUID NOT NULL REFERENCES public.players(id)  ON DELETE CASCADE,
    sort_order INT  NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (product_id, player_id)
);

-- Índices de rendimiento (la PK ya cubre búsquedas por product_id)
CREATE INDEX IF NOT EXISTS idx_product_players_player_id ON public.product_players(player_id);

-- 2. Row Level Security
ALTER TABLE public.product_players ENABLE ROW LEVEL SECURITY;

-- Lectura pública: la tienda muestra los dorsales y busca por jugador
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'product_players' AND policyname = 'Permitir lectura publica de jugadores por producto'
    ) THEN
        CREATE POLICY "Permitir lectura publica de jugadores por producto"
        ON public.product_players FOR SELECT
        USING (true);
    END IF;
END $$;

-- Gestión: usuarios autenticados (administradores)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'product_players' AND policyname = 'Permitir administracion de jugadores por producto'
    ) THEN
        CREATE POLICY "Permitir administracion de jugadores por producto"
        ON public.product_players FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 3. Backfill: conservar el comportamiento actual.
-- Toda la plantilla activa del equipo queda asignada a cada camisa personalizable
-- de ese equipo. Luego el admin puede quitar jugadores camisa por camisa.
INSERT INTO public.product_players (product_id, player_id, sort_order)
SELECT p.id, pl.id, COALESCE(pl.number, 0)
FROM public.products p
JOIN public.players pl
  ON pl.team_id = p.team_id
 AND pl.active = true
WHERE p.team_id IS NOT NULL
  AND COALESCE(p.allows_customization, true) = true
ON CONFLICT (product_id, player_id) DO NOTHING;
