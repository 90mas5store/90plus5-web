# 🔧 SQL PARA SUPABASE - Agregar Columnas de Texto

Ejecuta esto en Supabase SQL Editor:

```sql
-- Agregar columnas de texto para guardar nombres legibles
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS patch_name TEXT;
```

## ¿Por qué?

Actualmente tu carrito guarda:
- `item.version = "LaLiga"` (texto)
- `item.talla = "M"` (texto)  
- `item.parche = "UCL"` (texto)

Pero Supabase espera UUIDs en `variant_id`, `size_id`, `patch_id`.

**Solución temporal:**
- Los IDs van como `null`
- Los nombres van en las nuevas columnas `*_name`

**Solución permanente (después):**
Crear tablas de referencia y mapear correctamente:
```sql
-- Ejemplo futuro
SELECT id FROM product_variants WHERE name = 'LaLiga' AND product_id = '...';
```
