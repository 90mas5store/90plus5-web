# 🚀 INTEGRACIÓN CHECKOUT → SUPABASE

## ✅ IMPLEMENTADO

### 1. API Route: `/api/orders/create`
**Ubicación:** `src/app/api/orders/create/route.ts`

**Responsabilidades:**
- Validar datos del cliente
- Calcular totales (subtotal, anticipo 50%)
- Crear orden en Supabase
- Crear items de la orden
- Crear registro de pago pendiente
- Generar link de WhatsApp (opcional)
- **Rollback automático** si falla algún paso

**Payload esperado:**
```json
{
  "customer_name": "Juan Pérez",
  "customer_email": "juan@example.com",
  "customer_phone": "+50412345678",
  "shipping_department": "Francisco Morazán",
  "shipping_municipality": "Tegucigalpa",
  "shipping_address": "Col. Palmira, Casa #123",
  "payment_method": "transferencia" | "whatsapp",
  "items": [
    {
      "product_id": "uuid-producto",
      "variant_id": "uuid-variante" | null,
      "size_id": "uuid-talla" | null,
      "patch_id": "uuid-parche" | null,
      "quantity": 1,
      "unit_price": 1500,
      "personalization_type": "none" | "player" | "custom",
      "player_id": "uuid-jugador" | null,
      "custom_number": "10" | null,
      "custom_name": "PÉREZ" | null
    }
  ]
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "order_id": "uuid-completo",
  "order_number": "A1B2C3D4",
  "total": 1500,
  "deposit": 750,
  "payment_id": "uuid-pago",
  "whatsapp_link": "https://wa.me/..."
}
```

### 2. Frontend Checkout
**Ubicación:** `src/app/checkout/page.js`

**Cambios:**
- Mapeo de items del carrito al formato Supabase
- Detección automática de tipo de personalización
- Llamada a `/api/orders/create` en lugar de Google Sheets
- Manejo de errores mejorado

---

## 🔧 CONFIGURACIÓN REQUERIDA

### 1. Variables de Entorno
Agregar a `.env.local`:
```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=50412345678
```

### 2. Columnas en Supabase

#### Tabla `orders`
Asegúrate de tener estas columnas:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_department TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_municipality TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
```

**Nota:** Si prefieres no guardar info del cliente en `orders`, puedes crear una tabla `order_customers` separada.

---

## 📊 FLUJO COMPLETO

```
1. Usuario llena formulario checkout
   ↓
2. Frontend mapea items del carrito
   ↓
3. POST /api/orders/create
   ↓
4. Backend crea:
   - orders (status: pending_payment_50)
   - order_items
   - payments (status: pending, type: deposit)
   ↓
5. Si falla → Rollback automático
   ↓
6. Si éxito → Redirige a /checkout/done
   ↓
7. Admin valida transferencia manualmente
   ↓
8. Admin cambia payment.status → verified
   ↓
9. Admin cambia order.status → deposit_paid
```

---

## 🎯 PRÓXIMOS PASOS

### Mejoras Recomendadas

1. **Tabla de Clientes Separada**
   ```sql
   CREATE TABLE customers (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     phone TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Luego en orders:
   ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id);
   ```

2. **IDs Reales para Variantes/Tallas/Parches**
   - Actualmente estamos enviando `item.version` como `variant_id`
   - Debes mapear correctamente desde tu base de datos
   - Ejemplo: `variant_id: await getVariantIdByName(item.version)`

3. **Player IDs**
   - Implementar tabla `players` con jugadores reales
   - Mapear desde el selector de jugador

4. **Webhook para Notificaciones**
   - Enviar email al admin cuando se crea una orden
   - Enviar email al cliente con resumen

5. **Panel de Admin**
   - Ver órdenes pendientes
   - Marcar pagos como verificados
   - Cambiar estados de orden

---

## 🐛 DEBUGGING

### Ver logs en desarrollo:
```bash
npm run dev
# Luego revisar la consola del servidor
```

### Probar el API directamente:
```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@test.com",
    "customer_phone": "+50412345678",
    "shipping_department": "Cortés",
    "shipping_municipality": "San Pedro Sula",
    "shipping_address": "Test Address",
    "payment_method": "transferencia",
    "items": [{
      "product_id": "test-uuid",
      "quantity": 1,
      "unit_price": 1000,
      "personalization_type": "none"
    }]
  }'
```

---

## ⚠️ IMPORTANTE

- **NO hay autenticación** (guest checkout)
- **NO hay validación de stock** (agregar si necesitas)
- **NO hay integración de pago automático** (manual por ahora)
- Los **rollbacks son manuales** (Supabase no tiene transacciones multi-tabla nativas en el cliente)

---

## 📞 SOPORTE

Si algo falla:
1. Revisa la consola del navegador
2. Revisa la consola del servidor Next.js
3. Revisa los logs de Supabase
4. Verifica que las tablas tengan las columnas correctas
