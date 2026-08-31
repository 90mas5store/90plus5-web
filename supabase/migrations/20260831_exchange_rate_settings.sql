-- Migración para Configuración de Tienda y Tasa de Cambio Dinámica (HNL ➡️ USD)
-- 90+5 Store

CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar tasa de cambio inicial por defecto (si no existe)
INSERT INTO public.store_settings (key, value, description)
VALUES (
    'hnl_to_usd_rate',
    '{"rate": 24.80}'::jsonb,
    'Tasa de cambio de Lempiras hondureños (HNL) por cada 1 Dólar estadounidense (USD)'
)
ON CONFLICT (key) DO NOTHING;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Política de Lectura: Todos pueden leer la configuración de la tienda (incluyendo la tasa de cambio)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'store_settings' AND policyname = 'Permitir lectura publica de store_settings'
    ) THEN
        CREATE POLICY "Permitir lectura publica de store_settings"
        ON public.store_settings FOR SELECT
        USING (true);
    END IF;
END $$;

-- Política de Escritura: Solo el rol de servicio o administradores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'store_settings' AND policyname = 'Solo administradores pueden modificar store_settings'
    ) THEN
        CREATE POLICY "Solo administradores pueden modificar store_settings"
        ON public.store_settings FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Asegurar registro de PayPal en la tabla de payment_methods (si la tabla existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
        INSERT INTO public.payment_methods (id, code, name, description, type, active, is_coming_soon, sort_order, instructions)
        VALUES (
            'pm-paypal',
            'paypal',
            'PayPal / Tarjetas Internacionales',
            'Paga de forma instantánea y segura con saldo PayPal, tarjeta de crédito o débito.',
            'otro',
            true,
            false,
            3,
            'Paga en dólares (USD) de forma segura con tu cuenta de PayPal o tarjeta.'
        )
        ON CONFLICT (id) DO UPDATE SET active = true, is_coming_soon = false, sort_order = 3;
    END IF;
END $$;
