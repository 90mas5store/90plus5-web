-- =====================================================
-- SETUP TABLA bank_accounts
-- =====================================================

-- 1. Agregar columnas necesarias (si no existen)
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS banco TEXT,
  ADD COLUMN IF NOT EXISTS titular TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS tipo TEXT,
  ADD COLUMN IF NOT EXISTS logo TEXT,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;

-- 2. Habilitar RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Política de lectura pública (cualquiera puede leer cuentas activas)
DROP POLICY IF EXISTS "Lectura pública de cuentas bancarias" ON bank_accounts;
CREATE POLICY "Lectura pública de cuentas bancarias"
  ON bank_accounts FOR SELECT
  TO anon, authenticated
  USING (activo = true);

-- 4. Insertar cuentas actuales con UUIDs generados automáticamente
INSERT INTO bank_accounts (id, slug, banco, titular, numero, tipo, logo, activo, orden)
VALUES
  (gen_random_uuid(), 'bac', 'BAC Credomatic', 'Daniel Alejandro Urbizo', '759045731', 'Cuenta de Ahorros', '/banks/bac.svg?v=2', true, 1),
  (gen_random_uuid(), 'atlantida', 'Banco Atlántida', 'Daniel Alejandro Urbizo', '00002020850354', 'Cuenta de Ahorros', '/banks/atlantida.svg?v=2', true, 2)
ON CONFLICT (slug) DO UPDATE SET
  banco    = EXCLUDED.banco,
  titular  = EXCLUDED.titular,
  numero   = EXCLUDED.numero,
  tipo     = EXCLUDED.tipo,
  logo     = EXCLUDED.logo,
  activo   = EXCLUDED.activo,
  orden    = EXCLUDED.orden;

-- 5. Verificar resultado
SELECT id, slug, banco, numero, activo, orden FROM bank_accounts ORDER BY orden;
