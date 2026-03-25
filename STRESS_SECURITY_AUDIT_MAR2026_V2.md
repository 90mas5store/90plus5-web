# Prueba de Estrés + Auditoría de Ciberseguridad — 90plus5.web
**Fecha:** Marzo 2026 · **Versión:** 2.0 (Post-fix anterior)

---

## RESUMEN EJECUTIVO

| Severidad | Cantidad |
|-----------|---------|
| 🔴 CRÍTICO | 5 |
| 🟠 ALTO | 8 |
| 🟡 MEDIO | 9 |
| 🔵 BAJO | 7 |
| ⚪ INFO | 3 |
| **TOTAL** | **32** |

---

## 🔴 CRÍTICOS

### C1 — Ruta `/admin/update-password` sin protección de middleware
**Archivo:** `src/app/admin/update-password/page.tsx` + `src/middleware.ts`
**Flujo:** Admin
**Descripción:** La ruta `/admin/update-password` NO está en el matcher del middleware. Cualquier usuario autenticado puede acceder y cambiar su contraseña via Supabase Auth sin ser validado contra `admin_whitelist`.
**Impacto:** Toma de control de cuenta: atacante recibe link de invitación → navega a `/admin/update-password` → setea su propia contraseña → accede a `/admin` (solo checa `getUser()`, no whitelist).
**Fix:** Agregar `/admin/update-password` al matcher del middleware y verificar `admin_whitelist` antes de permitir la operación.

---

### C2 — API de invitación admin no valida rol del invitador
**Archivo:** `src/app/api/admin/invite/route.ts`
**Flujo:** Admin
**Descripción:** Al invitar un nuevo admin, solo se verifica que el requester esté en la whitelist, pero NO se valida que tenga `role = 'super_admin'`. Un admin regular puede invitar a otros admins.
**Impacto:** Escalada de privilegios: admin regular invita a cómplices como admins sin aprobación de super_admin.
**Fix:** Después de validar whitelist, agregar: `if (requesterRole?.role !== 'super_admin') return 403`.

---

### C3 — Order tracking con fuzzy UUID permite enumeración de órdenes
**Archivo:** `src/app/api/orders/track/route.ts`
**Flujo:** Cliente (API pública)
**Descripción:** La lógica de `padChar` crea un rango de UUIDs que hace match con TODOS los IDs que empiecen con el prefijo ingresado. Un atacante puede enviar "a0e" y obtener todas las órdenes cuyo UUID empiece con "a0e".
**Impacto:** Enumeración de órdenes: expone nombre, dirección, teléfono, artículos de clientes desconocidos. Violación de privacidad masiva.
**Fix:** Requerir UUID completo o referencia completa de 8 chars. Rechazar inputs de longitud < 36 caracteres (UUID completo).

---

### C4 — XSS en emails vía contenido de productos sin sanitizar
**Archivo:** `src/lib/email.ts` (template HTML)
**Flujo:** Cliente (Emails de confirmación)
**Descripción:** Los templates de email usan interpolación de strings con datos de productos (`product.name`, `image_url`, etc.) directamente en HTML sin escape. Si un admin pone `<img src=x onerror="...">` en el nombre de un producto, todos los clientes que reciban ese email reciben el payload XSS.
**Impacto:** Phishing, redirección a sitios maliciosos, robo de credenciales embebido en emails legítimos de confirmación de pedido.
**Fix:** Escapar HTML en todos los valores dinámicos del template. Usar función `escapeHtml()` o librería como `he`.

---

### C5 — Middleware admin solo valida `getUser()`, no membership en whitelist
**Archivo:** `src/middleware.ts`
**Flujo:** Admin
**Descripción:** Para rutas `/admin/*`, el middleware solo verifica que el usuario esté autenticado en Supabase Auth. No verifica que esté en `admin_whitelist`. Cualquier usuario con cuenta Supabase puede acceder al panel admin.
**Impacto:** Bypass total del control de acceso admin. El rol granular (`useAdminRole`) solo es client-side y puede ser bypaseado desde consola del navegador.
**Fix:** En middleware, llamar RPC `is_admin_user()` (o consultar `admin_whitelist`) antes de permitir acceso a `/admin/*`.

---

## 🟠 ALTOS

### A1 — XSS almacenado: descripción de productos renderizada sin escape
**Archivo:** `src/app/catalogo/[id]/page.jsx` y `src/app/producto/[slug]/page.tsx`
**Flujo:** Cliente
**Descripción:** Descripciones de producto renderizadas directamente como HTML. Admin podría inyectar `<script>` en descripción.
**Fix:** Usar `dangerouslySetInnerHTML` solo con sanitización via DOMPurify, o renderizar como texto plano.

---

### A2 — Carrito almacenado en localStorage sin ningún cifrado
**Archivo:** `src/context/CartContext.tsx`
**Flujo:** Cliente
**Descripción:** Datos del carrito (incluyendo personalización: nombre, número) en localStorage en claro. Cualquier script con XSS accede a ellos.
**Fix:** Datos mínimos en localStorage (solo IDs + cantidades). Precios siempre se recalculan desde servidor.

---

### A3 — Sin rate limit en actualizaciones de estado de órdenes
**Archivo:** `src/app/admin/(dashboard)/orders/[id]/OrderStatusSelector.tsx`
**Flujo:** Admin
**Descripción:** El server action `updateOrderStatus()` no tiene rate limit. Puede bombardear al cliente con emails de cambios de estado.
**Fix:** `checkRateLimit('order-status:' + orderId, 5, 60000)` por orden por minuto.

---

### A4 — Búsqueda admin sin validación de longitud de input
**Archivo:** `src/app/admin/(dashboard)/orders/page.tsx:31`
**Flujo:** Admin
**Descripción:** El queryTerm se pasa a `.ilike.%${queryTerm}%` sin limitar longitud. Input de 10MB causa degradación de la DB.
**Fix:** Validar `queryTerm.length < 100` antes de ejecutar query.

---

### A5 — Webhook de Resend procesa peticiones si `RESEND_WEBHOOK_SECRET` no está en ENV
**Archivo:** `src/app/api/webhooks/resend/route.ts`
**Flujo:** Webhook externo
**Descripción:** Si la variable de entorno no está configurada, el endpoint lanza un error no controlado en producción, permitiendo que cualquiera pueda enviar requests sin verificación de firma.
**Fix:** Verificar que `RESEND_WEBHOOK_SECRET` esté seteado. Si no, retornar 401 inmediatamente.

---

### A6 — Inyección CSV potencial en reportes exportables
**Archivo:** `src/app/api/admin/reports/orders/route.ts`
**Flujo:** Admin
**Descripción:** Si los datos se exportan a CSV, valores como `=CMD|'...'` en `customer_name` ejecutan fórmulas en Excel/Sheets.
**Fix:** Al construir CSV, prefixar con apostrofe valores que inicien con `=+-@`.

---

### A7 — Email de admin hardcodeado en `email.ts`
**Archivo:** `src/lib/email.ts`
**Flujo:** Admin
**Descripción:** Email de admin `"contacto@90mas5.store"` hardcodeado. No configurable sin redeploy.
**Fix:** `process.env.ADMIN_NOTIFICATION_EMAIL || 'contacto@90mas5.store'`

---

### A8 — Rate limiting en memoria no funciona en entorno serverless distribuido
**Archivo:** `src/lib/rateLimit.ts` + `src/middleware.ts`
**Flujo:** Ambos
**Descripción:** `Map` en memoria es local a cada instancia de función. En Vercel con múltiples instancias, un atacante puede hacer N reqs/min × M instancias = bypass efectivo del rate limit.
**Fix:** Usar Upstash Redis para rate limiting distribuido (`@upstash/ratelimit`).

---

## 🟡 MEDIOS

### M1 — Teléfono: frontend formatea con espacios, backend regex es estricto
**Archivo:** `src/app/checkout/page.tsx` vs `src/app/api/orders/create/route.ts:130`
**Flujo:** Cliente
**Descripción:** Si frontend envía `+504 XXXX-XXXX` (con espacio/guión), el backend lo rechaza con error genérico.
**Fix:** Backend normaliza antes de validar: `phone.replace(/[\s\-\(\)]/g, '')`.

---

### M2 — Cantidad máxima no limitada en CartContext (solo validada en backend)
**Archivo:** `src/context/CartContext.tsx`
**Flujo:** Cliente
**Descripción:** `updateQty()` acepta cualquier número. Usuario puede enviar 999 → recibe error confuso del backend.
**Fix:** `Math.min(Math.max(1, nuevaCantidad), 99)` en `updateQty`.

---

### M3 — CSRF: solo se valida Origin, no Referer
**Archivo:** `src/app/api/orders/create/route.ts:55-79`
**Flujo:** Cliente
**Descripción:** Defensa en profundidad incompleta. Origin puede estar ausente en algunas peticiones (same-origin navigation), y en algunos contextos puede ser manipulado.
**Fix:** Agregar validación del header `Referer` como capa adicional; implementar CSRF token.

---

### M4 — PII expuesto en logs de auditoría
**Archivo:** `src/app/api/orders/create/route.ts:269-279`
**Flujo:** API
**Descripción:** El log de `ORDER_CREATED` incluye `customer_email` e `ip`. Logs visibles a personas con acceso al servidor de logs → violación GDPR.
**Fix:** Remover `customer_email` del log; mantener solo `order_id`, `total_amount`, `items_count`.

---

### M5 — Order creation no es atómica (riesgo de registros huérfanos)
**Archivo:** `src/app/api/orders/create/route.ts:246-342`
**Flujo:** Cliente
**Descripción:** 3 inserts secuenciales (orders → order_items → payments). Si el 3er falla, hay rollback manual pero es frágil.
**Fix:** Usar transacción PostgreSQL via RPC: `create_order_with_items(...)` en una sola función SQL.

---

### M6 — Sin rate limit en login admin
**Archivo:** `src/app/admin/login/page.tsx`
**Flujo:** Admin
**Descripción:** Supabase Auth tiene rate limits propios, pero sin límite adicional a nivel de aplicación.
**Fix:** `checkRateLimit('admin-login:' + email, 5, 300000)` — 5 intentos cada 5 minutos.

---

### M7 — Datos de tracking exponen nombre parcial del cliente
**Archivo:** `src/app/api/orders/track/route.ts`
**Flujo:** Cliente (API pública)
**Descripción:** La respuesta incluye `customer: order.customer_name.split(' ')[0]`. Combinado con ciudad y artículos, permite correlación de identidad.
**Fix:** Eliminar `customer_name` de la respuesta pública de tracking. Solo mostrar: ID de orden, estado, artículos.

---

### M8 — Error de quota de email sin manejo (Resend)
**Archivo:** `src/lib/email.ts`
**Flujo:** API
**Descripción:** Si Resend llega a su quota, `sendOrderConfirmationEmail` lanzará error pero no hay alerta al admin.
**Fix:** Monitorear quota de Resend; implementar fallback o alerta cuando envío falle.

---

### M9 — Idempotency key no es determinista (dos tabs = dos órdenes)
**Archivo:** `src/app/checkout/page.tsx`
**Flujo:** Cliente
**Descripción:** `useRef(crypto.randomUUID())` genera un UUID diferente por cada instancia del componente. Si el usuario abre 2 tabs de checkout con el mismo carrito, crea 2 órdenes.
**Fix:** Generar key basada en contenido del carrito: `btoa(JSON.stringify([...items].sort() + email))`.

---

## 🔵 BAJOS

### B1 — `useAdminRole` sin `.catch()` silencia errores del RPC
**Archivo:** `src/hooks/useAdminRole.ts:12`
**Fix:** Agregar `.catch(err => { console.error(err); setRole(null); setLoading(false); })`.

---

### B2 — CSP usa `'unsafe-eval'` y `'unsafe-inline'`
**Archivo:** `next.config.mjs`
**Descripción:** Necesario para algunas herramientas pero debilita XSS protection.
**Fix:** Migrar a nonces per-request para scripts críticos.

---

### B3 — Botones de acción en tabla de órdenes sin `aria-label`
**Archivo:** `src/app/admin/(dashboard)/orders/page.tsx`
**Fix:** Agregar `aria-label="Ver detalles del pedido"` al botón de ojo.

---

### B4 — Logs de error con payloads completos en producción
**Archivo:** Múltiples archivos
**Fix:** Nunca loguear el body completo del request. Solo loguear: error code, order_id, timestamp.

---

### B5 — Scripts de analytics sin Subresource Integrity
**Archivo:** `next.config.mjs` (Partytown rewrites)
**Fix:** Agregar `integrity="sha384-..."` a scripts de CDN.

---

### B6 — `MediaUpload.tsx` carga sin validación MIME server-side
**Archivo:** `src/components/admin/MediaUpload.tsx`
**Descripción:** Solo validación de extensión en cliente. Backend de Supabase Storage debe validar MIME type real.
**Fix:** Verificar `content-type` en upload; usar bucket policies que solo acepten `image/*` y `video/*`.

---

### B7 — Sin timeout en fetches del servidor (Server Components)
**Archivo:** `src/lib/api-server.ts`
**Descripción:** Fetches sin AbortController. Si Supabase no responde, la página cuelga indefinidamente.
**Fix:** Agregar timeout con `AbortSignal.timeout(5000)`.

---

## ⚪ INFO

- **I1:** Sentry instalado pero sin `<ErrorBoundary>` en el layout raíz → errores de React no siempre se reportan.
- **I2:** `next.config.mjs` X-Frame-Options: DENY ✅ ya configurado correctamente.
- **I3:** `Strict-Transport-Security` y `Permissions-Policy` headers presentes ✅.

---

## ESCENARIOS DE ATAQUE CRÍTICOS

### Ataque 1: Toma de control admin (C1 + C2 + C5 encadenados)
```
1. Atacante extrae endpoint /api/admin/invite (visible en código)
2. Admin regular invita a atacante (C2: no valida super_admin)
3. Atacante recibe link de invite → navega a /admin/update-password (C1: sin middleware)
4. Atacante setea su propia contraseña
5. Atacante accede a /admin (C5: middleware solo checa getUser())
6. Atacante tiene acceso TOTAL al panel admin
```

### Ataque 2: Enumeración masiva de clientes (C3)
```
1. Atacante llama a /api/orders/track con "0", "1", "2", ... "f"
2. Por cada prefijo hex, recibe TODAS las órdenes con ese prefijo
3. En pocas horas extrae: nombres, teléfonos, direcciones, artículos de todos los pedidos
4. Sin autenticación, sin rate limit efectivo (A8)
```

### Ataque 3: Phishing via XSS en email (C4)
```
1. Atacante crea producto con nombre: <img src=x onerror="document.location='https://phishing.com'">
2. Cliente ordena ese producto
3. Email de confirmación ejecuta redirect en el cliente de email
4. Cliente pierde credenciales
```

---

## PRIORIDADES DE REMEDIACIÓN

| Prioridad | Issue | Esfuerzo |
|-----------|-------|---------|
| P0 🔴 | C1: Agregar whitelist check en middleware + update-password | 2h |
| P0 🔴 | C2: Validar super_admin en invite API | 30min |
| P0 🔴 | C3: Requerir UUID completo en tracking | 30min |
| P0 🔴 | C4: Escapar HTML en templates de email | 1h |
| P0 🔴 | C5: Whitelist check en middleware para /admin/* | 2h |
| P1 🟠 | A8: Migrar a Upstash Redis para rate limiting | 3h |
| P1 🟠 | A3: Rate limit en status updates | 30min |
| P2 🟡 | M5: Hacer order creation atómica (RPC SQL) | 4h |
| P2 🟡 | M4: Remover PII de logs | 30min |
| P2 🟡 | M6: Rate limit en login admin | 30min |
