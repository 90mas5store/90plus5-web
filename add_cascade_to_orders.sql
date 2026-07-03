-- =====================================================
-- FIX: discount_code_usage + payments FK duplicada
-- Correr en el SQL Editor de Supabase
-- =====================================================

-- ── discount_code_usage: agregar CASCADE ─────────────
ALTER TABLE discount_code_usage
  DROP CONSTRAINT IF EXISTS discount_code_usage_order_id_fkey;

ALTER TABLE discount_code_usage
  ADD CONSTRAINT discount_code_usage_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- ── payments: eliminar la FK duplicada antigua ────────
-- Dejamos solo payments_order_id_fkey (la que creamos nosotros con CASCADE)
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_order_fk;

-- ── Verificar resultado final ─────────────────────────
SELECT
  conrelid::regclass AS tabla,
  conname             AS constraint_name,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete
FROM pg_constraint
WHERE confrelid = 'orders'::regclass
  AND contype = 'f'
ORDER BY conrelid::regclass::text;
